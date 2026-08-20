"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe/client";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/plans";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { user, supabase };

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return { user: session.user, supabase };

    return { user: null, supabase };
}

/**
 * Ensure Stripe Coupon exists for 50% discount for 1 month
 */
async function getOrCreateLaunchCoupon() {
    const couponId = "LAUNCH_PROMO_50_1M";
    try {
        const existing = await stripe.coupons.retrieve(couponId);
        return existing.id;
    } catch {
        const created = await stripe.coupons.create({
            id: couponId,
            name: "โปรโมชั่นเปิดตัว (-50%)",
            percent_off: 50,
            duration: "repeating",
            duration_in_months: 1,
        });
        return created.id;
    }
}

export async function getUserSubscription(sessionId?: string) {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return null;

    // 1. Fetch current record from subscriptions table
    let { data: subscription } = await supabase
        .from("subscriptions")
        .select("id, user_id, tier, status, current_period_end, stripe_customer_id, stripe_subscription_id")
        .eq("user_id", user.id)
        .maybeSingle();

    // 2. Sync from Stripe Checkout Session if returning with session_id
    if (sessionId && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session) {
                const tier = (session.metadata?.tier as "pro" | "scale") || "pro";
                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;
                const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                await supabase
                    .from("subscriptions")
                    .upsert({
                        user_id: user.id,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        tier: tier,
                        status: "active",
                        current_period_end: periodEnd,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "user_id" });

                await supabase.from("subscription_logs").upsert(
                    {
                        user_id: user.id,
                        stripe_event_id: session.id,
                        event_type: "checkout.session.completed",
                        amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                        currency: session.currency || "thb",
                    },
                    { onConflict: "stripe_event_id" }
                );

                if (!subscription) {
                    subscription = {
                        id: "",
                        user_id: user.id,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        tier: tier,
                        status: "active",
                        current_period_end: periodEnd,
                    };
                } else {
                    subscription.tier = tier;
                    subscription.status = "active";
                    subscription.stripe_customer_id = customerId;
                    subscription.stripe_subscription_id = subscriptionId;
                    subscription.current_period_end = periodEnd;
                }

                revalidatePath("/dashboard/billing");
                revalidatePath("/dashboard/settings");
            }
        } catch (err) {
            console.error("Error retrieving checkout session:", err);
        }
    }

    // 3. Search Stripe by User Email or Customer ID to sync any active subscriptions
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
        try {
            if (user.email) {
                const customers = await stripe.customers.list({
                    email: user.email,
                    limit: 10,
                });

                let foundActiveSub: any = null;
                let matchedCustomerId = subscription?.stripe_customer_id;

                for (const cust of customers.data) {
                    const subs = await stripe.subscriptions.list({
                        customer: cust.id,
                        status: "active",
                        limit: 1,
                    });
                    if (subs.data.length > 0) {
                        foundActiveSub = subs.data[0];
                        matchedCustomerId = cust.id;
                        break;
                    }
                }

                if (foundActiveSub && matchedCustomerId) {
                    let tier = (foundActiveSub.metadata?.tier as "pro" | "scale");
                    if (!tier) {
                        const priceAmount = (foundActiveSub.items.data[0]?.price?.unit_amount || 0) / 100;
                        if (priceAmount >= 1800 || priceAmount >= 50) {
                            tier = "scale";
                        } else {
                            tier = "pro";
                        }
                    }

                    const periodEnd = new Date((foundActiveSub as any).current_period_end * 1000).toISOString();

                    await supabase
                        .from("subscriptions")
                        .upsert({
                            user_id: user.id,
                            stripe_customer_id: matchedCustomerId,
                            stripe_subscription_id: foundActiveSub.id,
                            tier: tier,
                            status: "active",
                            current_period_end: periodEnd,
                            updated_at: new Date().toISOString(),
                        }, { onConflict: "user_id" });

                    if (!subscription) {
                        subscription = {
                            id: "",
                            user_id: user.id,
                            stripe_customer_id: matchedCustomerId,
                            stripe_subscription_id: foundActiveSub.id,
                            tier: tier,
                            status: "active",
                            current_period_end: periodEnd,
                        };
                    } else {
                        subscription.tier = tier;
                        subscription.status = "active";
                        subscription.stripe_customer_id = matchedCustomerId;
                        subscription.stripe_subscription_id = foundActiveSub.id;
                        subscription.current_period_end = periodEnd;
                    }
                }
            }
        } catch (err) {
            console.error("Error syncing customer subscription from Stripe:", err);
        }
    }

    // 4. Create a default free record if still none exists
    if (!subscription) {
        const { data: createdSub } = await supabase
            .from("subscriptions")
            .insert({
                user_id: user.id,
                tier: "free",
                status: "active",
            })
            .select()
            .single();

        subscription = createdSub;
    }

    const tier = subscription?.tier || "free";
    const plan = SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.free;

    return {
        userId: user.id,
        email: user.email,
        tier,
        status: subscription?.status || "active",
        currentPeriodEnd: subscription?.current_period_end || null,
        plan,
        stripeCustomerId: subscription?.stripe_customer_id || null,
    };
}

export async function createCheckoutSession(
    tier: "pro" | "scale", 
    currency: "thb" | "usd" = "thb",
    billingCycle: "monthly" | "yearly" = "monthly"
) {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
        return { error: "Session expired. Please log in again.", isAuthError: true };
    }

    const plan = SUBSCRIPTION_PLANS[tier];
    if (!plan) return { error: "Invalid subscription plan selected" };

    // Get user's subscription record
    const { data: subRecord } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id, stripe_subscription_id")
        .eq("user_id", user.id)
        .maybeSingle();

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const isRealStripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_"));

    const daysToAdd = billingCycle === "yearly" ? 365 : 30;

    try {
        if (!isRealStripeConfigured) {
            // Instant upgrade for Sandbox / Demo mode
            await supabase
                .from("subscriptions")
                .upsert({
                    user_id: user.id,
                    tier: tier,
                    status: "active",
                    current_period_end: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" });

            revalidatePath("/dashboard/billing");
            revalidatePath("/dashboard/settings");
            return { success: true, simulated: true, url: "/dashboard/billing?status=success" };
        }

        let customerId = subRecord?.stripe_customer_id;

        // If no stripe customer id yet, check by email first or create
        if (!customerId) {
            const existingCustomers = await stripe.customers.list({
                email: user.email,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                customerId = existingCustomers.data[0].id;
            } else {
                const customer = await stripe.customers.create({
                    email: user.email,
                    metadata: { supabase_uid: user.id },
                });
                customerId = customer.id;
            }

            await supabase
                .from("subscriptions")
                .upsert({
                    user_id: user.id,
                    stripe_customer_id: customerId,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" });
        }

        // Full regular price for base unit_amount (e.g. 590 THB / 18 USD)
        let basePriceAmount = 0;
        if (billingCycle === "yearly") {
            basePriceAmount = currency === "thb" ? plan.originalYearlyPriceTHB * 100 : plan.originalYearlyPriceUSD * 100;
        } else {
            basePriceAmount = currency === "thb" ? plan.originalPriceTHB * 100 : plan.originalPriceUSD * 100;
        }

        const isPromo = tier === "pro";
        const discounts: { coupon?: string }[] = [];

        if (isPromo) {
            const couponId = await getOrCreateLaunchCoupon();
            discounts.push({ coupon: couponId });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: `Mateflow ${plan.name} (${billingCycle === "yearly" ? "Annual" : "Monthly"})`,
                            description: plan.description,
                        },
                        unit_amount: basePriceAmount,
                        recurring: { interval: billingCycle === "yearly" ? "year" : "month" },
                    },
                    quantity: 1,
                },
            ],
            discounts: discounts.length > 0 ? discounts : undefined,
            subscription_data: {
                metadata: {
                    userId: user.id,
                    tier: tier,
                    billingCycle: billingCycle,
                    isPromo: isPromo ? "true" : "false",
                },
            },
            success_url: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
            cancel_url: `${origin}/dashboard/billing?status=cancelled`,
            metadata: {
                userId: user.id,
                tier: tier,
                billingCycle: billingCycle,
            },
        });

        return { success: true, url: session.url };
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        return { error: error.message || "Failed to create checkout session" };
    }
}

export async function createBillingPortalSession() {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return { error: "Session expired. Please log in again." };

    const { data: subRecord } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    let customerId = subRecord?.stripe_customer_id;

    try {
        if (user.email) {
            const customers = await stripe.customers.list({
                email: user.email,
                limit: 10,
            });
            for (const cust of customers.data) {
                const subs = await stripe.subscriptions.list({
                    customer: cust.id,
                    limit: 1,
                });
                if (subs.data.length > 0) {
                    customerId = cust.id;
                    await supabase
                        .from("subscriptions")
                        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
                        .eq("user_id", user.id);
                    break;
                }
            }
        }

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_uid: user.id },
            });
            customerId = customer.id;

            await supabase
                .from("subscriptions")
                .upsert({
                    user_id: user.id,
                    stripe_customer_id: customerId,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" });
        }

        const portal = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/dashboard/billing`,
        });

        return { success: true, url: portal.url };
    } catch (error: any) {
        console.error("Billing Portal Error:", error);
        return { 
            error: error.message?.includes("No configuration provided") 
                ? "Customer Portal is not activated in your Stripe Dashboard. Please visit Stripe Dashboard > Settings > Customer Portal to activate it."
                : (error.message || "Failed to open billing portal") 
        };
    }
}

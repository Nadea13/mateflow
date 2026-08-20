import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin with Service Role Key for Webhook handling
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4Mzg3NTIwMH0.ZXhwZXJ0X3NlcnZpY2Vfcm9sZV9rZXlfc2VjcmV0"
);

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: any;

    try {
        if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } else {
            event = JSON.parse(body);
        }
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                const tier = session.metadata?.tier || "pro";

                if (userId) {
                    await supabaseAdmin
                        .from("subscriptions")
                        .upsert({
                            user_id: userId,
                            stripe_customer_id: session.customer,
                            stripe_subscription_id: session.subscription,
                            tier: tier,
                            status: "active",
                            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            updated_at: new Date().toISOString(),
                        }, { onConflict: "user_id" });

                    await supabaseAdmin.from("subscription_logs").upsert({
                        user_id: userId,
                        stripe_event_id: event.id,
                        event_type: event.type,
                        amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                        currency: session.currency || "thb",
                    }, { onConflict: "stripe_event_id" });
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                const status = subscription.status === "active" ? "active" : "past_due";
                const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

                await supabaseAdmin
                    .from("subscriptions")
                    .update({
                        status: status,
                        current_period_end: periodEnd,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                await supabaseAdmin
                    .from("subscriptions")
                    .update({
                        tier: "free",
                        status: "canceled",
                        stripe_subscription_id: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);
                break;
            }

            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Error processing Stripe webhook:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}

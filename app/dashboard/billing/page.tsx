import { Metadata } from "next";
import { getUserSubscription } from "@/lib/actions/subscription";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Billing & Plans | MateFlow",
    description: "Manage your subscription, feature entitlements, and billing.",
};

export const dynamic = "force-dynamic";

interface BillingPageProps {
    searchParams: Promise<{ session_id?: string; status?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
    const params = await searchParams;
    const subscription = await getUserSubscription(params.session_id);

    if (!subscription) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <PricingPlans
                currentTier={subscription.tier}
                subscriptionStatus={subscription.status}
                hasStripeCustomer={!!subscription.stripeCustomerId}
                currentPeriodEnd={subscription.currentPeriodEnd}
            />
        </div>
    );
}

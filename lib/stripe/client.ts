import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock_stripe_key", {
    apiVersion: "2025-02-24.acacia" as any,
    typescript: true,
});

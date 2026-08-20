export interface SubscriptionPlan {
    id: "free" | "pro" | "scale";
    name: string;
    description: string;
    originalPriceTHB: number;
    originalPriceUSD: number;
    priceTHB: number;
    priceUSD: number;
    originalYearlyPriceTHB: number;
    originalYearlyPriceUSD: number;
    yearlyPriceTHB: number;
    yearlyPriceUSD: number;
    stripePriceIdTHB?: string;
    stripePriceIdUSD?: string;
    stripeYearlyPriceIdTHB?: string;
    stripeYearlyPriceIdUSD?: string;
    badge?: string;
    discountBadge?: string;
    features: string[];
    limits: {
        maxBillsPerMonth: number; // -1 for unlimited
        maxProducts: number;      // -1 for unlimited
        maxLocations: number;     // -1 for unlimited
        maxTeamMembers: number;   // -1 for unlimited
        maxChannels: number;      // -1 for unlimited
        etaxSupported: boolean;
        apiAccess: boolean;
    };
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
    free: {
        id: "free",
        name: "Starter",
        description: "Essential ERP & Backoffice tools for solo entrepreneurs & small shops.",
        originalPriceTHB: 0,
        originalPriceUSD: 0,
        priceTHB: 0,
        priceUSD: 0,
        originalYearlyPriceTHB: 0,
        originalYearlyPriceUSD: 0,
        yearlyPriceTHB: 0,
        yearlyPriceUSD: 0,
        features: [
            "Up to 50 Commercial Invoices / month",
            "Up to 100 Products Catalog",
            "1 Primary Warehouse Location",
            "1 User Account (Owner)",
            "1 Marketplace Channel Integration",
            "Standard Inventory Tracking",
            "Community Support"
        ],
        limits: {
            maxBillsPerMonth: 50,
            maxProducts: 100,
            maxLocations: 1,
            maxTeamMembers: 1,
            maxChannels: 1,
            etaxSupported: false,
            apiAccess: false,
        }
    },
    pro: {
        id: "pro",
        name: "Business Pro",
        description: "Advanced automation, unlimited invoices, e-Tax compliance, and multi-team collaboration.",
        originalPriceTHB: 590,
        originalPriceUSD: 18,
        priceTHB: 295, // 50% Launch Promo Discount
        priceUSD: 9,   // 50% Launch Promo Discount
        originalYearlyPriceTHB: 5900,
        originalYearlyPriceUSD: 180,
        yearlyPriceTHB: 2950, // 50% Launch Promo Discount
        yearlyPriceUSD: 90,   // 50% Launch Promo Discount
        stripePriceIdTHB: process.env.STRIPE_PRICE_PRO_THB || "price_pro_thb_test",
        stripePriceIdUSD: process.env.STRIPE_PRICE_PRO_USD || "price_pro_usd_test",
        badge: "Most Popular",
        discountBadge: "ลดพิเศษ 50% (Launch Promo)",
        features: [
            "Unlimited Commercial Invoices & Receipts",
            "Unlimited Catalog Products & Barcodes",
            "Up to 5 Warehouse / 3PL Locations",
            "Up to 5 Team Member Seats (Role Permissions)",
            "Up to 5 Omni-Channel Marketplace Syncs",
            "e-Tax Invoice & VAT Report Generator",
            "Self-Service Stripe Billing Portal",
            "Priority Support"
        ],
        limits: {
            maxBillsPerMonth: -1,
            maxProducts: -1,
            maxLocations: 5,
            maxTeamMembers: 5,
            maxChannels: 5,
            etaxSupported: true,
            apiAccess: false,
        }
    },
    scale: {
        id: "scale",
        name: "Enterprise Scale",
        description: "Full-scale commerce engine with multi-hub logistics, custom APIs, and unlimited capacity.",
        originalPriceTHB: 1890,
        originalPriceUSD: 55,
        priceTHB: 1890, // Regular Price
        priceUSD: 55,   // Regular Price
        originalYearlyPriceTHB: 18900,
        originalYearlyPriceUSD: 550,
        yearlyPriceTHB: 18900, // Regular Price
        yearlyPriceUSD: 550,   // Regular Price
        stripePriceIdTHB: process.env.STRIPE_PRICE_SCALE_THB || "price_scale_thb_test",
        stripePriceIdUSD: process.env.STRIPE_PRICE_SCALE_USD || "price_scale_usd_test",
        badge: "Enterprise",
        features: [
            "Everything in Business Pro",
            "Unlimited Team Member Seats & Custom Roles",
            "Unlimited Multi-Warehouse & 3PL Centers",
            "Unlimited Omni-Channel Connections",
            "Developer API Access & Webhooks",
            "Dedicated Account Manager & SLA",
            "Custom Integration Setup"
        ],
        limits: {
            maxBillsPerMonth: -1,
            maxProducts: -1,
            maxLocations: -1,
            maxTeamMembers: -1,
            maxChannels: -1,
            etaxSupported: true,
            apiAccess: true,
        }
    }
};

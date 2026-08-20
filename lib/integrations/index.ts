export interface ChannelIntegration {
    id: string;
    platform: "shopify" | "amazon" | "tiktok" | "woocommerce" | "custom_webhook";
    name: string;
    description: string;
    icon: string;
    status: "connected" | "disconnected" | "syncing" | "error";
    lastSyncAt?: string;
    ordersCount?: number;
    syncInventory: boolean;
    syncOrders: boolean;
    storeUrl?: string;
    apiKey?: string;
}

export const AVAILABLE_CHANNELS: Omit<ChannelIntegration, "id" | "status" | "syncInventory" | "syncOrders">[] = [
    {
        platform: "shopify",
        name: "Shopify Global Store",
        description: "Auto-sync products, multi-currency orders, and 2-way real-time stock levels.",
        icon: "🛍️",
    },
    {
        platform: "amazon",
        name: "Amazon Seller Central (FBA / FBM)",
        description: "Connect Amazon US/EU/JP marketplaces, auto-pull orders, and manage inventory.",
        icon: "📦",
    },
    {
        platform: "tiktok",
        name: "TikTok Shop Global",
        description: "Live commerce & video order sync with automated tracking number fulfillment.",
        icon: "🎵",
    },
    {
        platform: "woocommerce",
        name: "WooCommerce (WordPress)",
        description: "Direct REST API integration for custom e-commerce storefronts.",
        icon: "🛒",
    },
];

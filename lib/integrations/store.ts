import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChannelIntegration } from "./index";

interface IntegrationsState {
    integrations: ChannelIntegration[];
    toggleIntegration: (platform: string, enabled: boolean, config?: Partial<ChannelIntegration>) => void;
    syncChannel: (platform: string) => Promise<void>;
    updateConfig: (platform: string, config: Partial<ChannelIntegration>) => void;
}

const DEFAULT_INTEGRATIONS: ChannelIntegration[] = [
    {
        id: "shopify-1",
        platform: "shopify",
        name: "Shopify Global Store",
        description: "Auto-sync products, multi-currency orders, and 2-way real-time stock levels.",
        icon: "🛍️",
        status: "disconnected",
        syncInventory: true,
        syncOrders: true,
        ordersCount: 0,
    },
    {
        id: "amazon-1",
        platform: "amazon",
        name: "Amazon Seller Central",
        description: "Connect Amazon US/EU/JP marketplaces, auto-pull orders, and manage inventory.",
        icon: "📦",
        status: "disconnected",
        syncInventory: true,
        syncOrders: true,
        ordersCount: 0,
    },
    {
        id: "tiktok-1",
        platform: "tiktok",
        name: "TikTok Shop Global",
        description: "Live commerce & video order sync with automated tracking number fulfillment.",
        icon: "🎵",
        status: "disconnected",
        syncInventory: true,
        syncOrders: true,
        ordersCount: 0,
    },
    {
        id: "woo-1",
        platform: "woocommerce",
        name: "WooCommerce Storefront",
        description: "Direct REST API integration for custom e-commerce storefronts.",
        icon: "🛒",
        status: "disconnected",
        syncInventory: true,
        syncOrders: true,
        ordersCount: 0,
    },
];

export const useIntegrationsStore = create<IntegrationsState>()(
    persist(
        (set, get) => ({
            integrations: DEFAULT_INTEGRATIONS,
            toggleIntegration: (platform, enabled, config) => {
                set((state) => ({
                    integrations: state.integrations.map((item) =>
                        item.platform === platform
                            ? {
                                  ...item,
                                  status: enabled ? "connected" : "disconnected",
                                  lastSyncAt: enabled ? new Date().toISOString() : item.lastSyncAt,
                                  ...config,
                              }
                            : item
                    ),
                }));
            },
            syncChannel: async (platform) => {
                // Set syncing state
                set((state) => ({
                    integrations: state.integrations.map((item) =>
                        item.platform === platform ? { ...item, status: "syncing" } : item
                    ),
                }));

                // Simulate cloud sync delay
                await new Promise((resolve) => setTimeout(resolve, 1500));

                set((state) => ({
                    integrations: state.integrations.map((item) =>
                        item.platform === platform
                            ? {
                                  ...item,
                                  status: "connected",
                                  lastSyncAt: new Date().toISOString(),
                                  ordersCount: (item.ordersCount || 0) + Math.floor(Math.random() * 5 + 1),
                              }
                            : item
                    ),
                }));
            },
            updateConfig: (platform, config) => {
                set((state) => ({
                    integrations: state.integrations.map((item) =>
                        item.platform === platform ? { ...item, ...config } : item
                    ),
                }));
            },
        }),
        {
            name: "mateflow-integrations",
        }
    )
);

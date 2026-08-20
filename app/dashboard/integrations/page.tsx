"use client";

import { useIntegrationsStore } from "@/lib/integrations/store";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { Globe, ArrowLeftRight, ShieldCheck, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/provider";

export default function IntegrationsPage() {
    const { t } = useTranslation();
    const { integrations, syncChannel } = useIntegrationsStore();

    const handleSyncAll = async () => {
        const connected = integrations.filter((i) => i.status === "connected");
        if (connected.length === 0) {
            toast.error("No active channels connected to sync.");
            return;
        }
        for (const ch of connected) {
            await syncChannel(ch.platform);
        }
        toast.success("All connected marketplace channels synced successfully!");
    };

    const totalSyncedOrders = integrations.reduce((sum, i) => sum + (i.ordersCount || 0), 0);
    const activeChannels = integrations.filter((i) => i.status === "connected").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        {t("integrations.title")}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {t("integrations.subtitle")}
                    </p>
                </div>
                <Button onClick={handleSyncAll} size="sm" className="h-8 text-xs gap-1.5 font-medium">
                    <RefreshCw className="h-3.5 w-3.5" /> {t("integrations.syncAll")}
                </Button>
            </div>

            {/* Metrics Overview */}
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="p-4 rounded-lg border border-border bg-card shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <ArrowLeftRight className="h-3.5 w-3.5" /> Active Channels
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-semibold font-mono text-foreground">{activeChannels}</span>
                        <span className="text-xs text-muted-foreground">/ {integrations.length} available</span>
                    </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Zap className="h-3.5 w-3.5 text-primary" /> Synced Orders
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-semibold font-mono text-foreground">{totalSyncedOrders}</span>
                        <span className="text-xs text-muted-foreground">orders processed</span>
                    </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Inventory Health
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-base font-semibold text-foreground">100% In-Sync</span>
                        <span className="text-xs text-muted-foreground">Locks active</span>
                    </div>
                </div>
            </div>

            {/* Channels Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} />
                ))}
            </div>
        </div>
    );
}

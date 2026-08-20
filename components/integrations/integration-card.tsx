"use client";

import { useState } from "react";
import { ChannelIntegration } from "@/lib/integrations";
import { useIntegrationsStore } from "@/lib/integrations/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    RefreshCw,
    CheckCircle2,
    Settings2,
    Zap,
    ShoppingBag,
    Package,
    Video,
    ShoppingCart,
    Webhook,
} from "lucide-react";
import { toast } from "sonner";

interface IntegrationCardProps {
    integration: ChannelIntegration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
    const { toggleIntegration, syncChannel, updateConfig } = useIntegrationsStore();
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [storeUrl, setStoreUrl] = useState(integration.storeUrl || "");
    const [apiKey, setApiKey] = useState(integration.apiKey || "");

    const isConnected = integration.status === "connected";
    const isSyncing = integration.status === "syncing";

    const handleToggle = (checked: boolean) => {
        if (checked && !integration.storeUrl && !storeUrl) {
            setIsConfigOpen(true);
            return;
        }
        toggleIntegration(integration.platform, checked, {
            storeUrl,
            apiKey,
        });
        toast.success(checked ? `Connected to ${integration.name}` : `Disconnected ${integration.name}`);
    };

    const handleSaveConfig = () => {
        updateConfig(integration.platform, {
            storeUrl,
            apiKey,
            status: "connected",
            lastSyncAt: new Date().toISOString(),
        });
        setIsConfigOpen(false);
        toast.success(`${integration.name} configuration saved!`);
    };

    const handleSync = async () => {
        await syncChannel(integration.platform);
        toast.success(`Synced from ${integration.name}`);
    };

    const formatSyncTime = (dateStr?: string) => {
        if (!dateStr) return "Never";
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const renderPlatformIcon = (platform: string) => {
        switch (platform) {
            case "shopify":
                return <ShoppingBag className="h-4 w-4 text-primary" />;
            case "amazon":
                return <Package className="h-4 w-4 text-primary" />;
            case "tiktok":
                return <Video className="h-4 w-4 text-primary" />;
            case "woocommerce":
                return <ShoppingCart className="h-4 w-4 text-primary" />;
            default:
                return <Webhook className="h-4 w-4 text-primary" />;
        }
    };

    return (
        <Card className="flex flex-col justify-between rounded-lg border border-border bg-card shadow-2xs">
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-lg bg-muted/60 border border-border/80 flex items-center justify-center shrink-0">
                            {renderPlatformIcon(integration.platform)}
                        </span>
                        <div>
                            <CardTitle className="text-sm font-semibold text-foreground">{integration.name}</CardTitle>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                {isConnected ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="h-3 w-3" /> Connected
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-muted-foreground">
                                        Disconnected
                                    </span>
                                )}
                                {integration.lastSyncAt && isConnected && (
                                    <span className="text-[11px] text-muted-foreground">
                                        • Sync: {formatSyncTime(integration.lastSyncAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <Switch checked={isConnected} onCheckedChange={handleToggle} />
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-2 leading-normal">
                    {integration.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="px-4 py-1">
                {isConnected && (
                    <div className="rounded-md bg-muted/50 px-2.5 py-1.5 border border-border flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Zap className="h-3 w-3 text-amber-500" />
                            <span>Orders:</span>
                            <span className="font-semibold text-foreground font-mono">{integration.ordersCount || 0}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[120px]">
                            {integration.storeUrl || "Webhook Active"}
                        </span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-3 px-4 border-t border-border flex items-center justify-between gap-2 bg-muted/20">
                <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground px-2">
                            <Settings2 className="h-3.5 w-3.5" /> Configure
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[420px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base">
                                <span className="p-1 rounded bg-muted flex items-center justify-center">
                                    {renderPlatformIcon(integration.platform)}
                                </span>
                                <span>Connect {integration.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Enter marketplace credentials to activate automated sync.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 py-3 text-sm">
                            <div className="grid gap-1">
                                <Label htmlFor="store_url" className="text-xs">Store URL / Merchant ID</Label>
                                <Input
                                    id="store_url"
                                    className="h-8 text-xs"
                                    placeholder="e.g. your-store.myshopify.com"
                                    value={storeUrl}
                                    onChange={(e) => setStoreUrl(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="api_key" className="text-xs">Admin Access Token / Secret</Label>
                                <Input
                                    id="api_key"
                                    type="password"
                                    className="h-8 text-xs"
                                    placeholder="API Token or Secret Key"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsConfigOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" size="sm" onClick={handleSaveConfig}>
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {isConnected && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="h-7 text-xs gap-1 px-2.5"
                    >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-primary" : ""}`} />
                        {isSyncing ? "Syncing..." : "Sync"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

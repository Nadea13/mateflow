"use client";

import { useState } from "react";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/plans";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/actions/subscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Zap, CreditCard, ArrowRight, Loader2, AlertTriangle, RefreshCw, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/provider";

interface PricingPlansProps {
    currentTier: string;
    subscriptionStatus: string;
    hasStripeCustomer: boolean;
    currentPeriodEnd?: string | null;
}

export function PricingPlans({
    currentTier,
    subscriptionStatus,
    hasStripeCustomer,
    currentPeriodEnd,
}: PricingPlansProps) {
    const { t } = useTranslation();
    const [currency, setCurrency] = useState<"thb" | "usd">("thb");
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [loadingPortal, setLoadingPortal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleUpgrade = async (tier: "pro" | "scale") => {
        setLoadingTier(tier);
        try {
            const res = await createCheckoutSession(tier, currency, billingCycle);
            if (res.error) {
                toast({ title: t("common.error"), description: res.error, variant: "destructive" });
                if ((res as any).isAuthError) {
                    router.push("/login");
                }
            } else if (res.url) {
                if (res.simulated) {
                    const planTitle = tier === "pro" ? t("billing.proName") : t("billing.scaleName");
                    toast({
                        title: t("common.success"),
                        description: `${t("billing.upgradeTo")} ${planTitle} (${billingCycle === "yearly" ? t("billing.yearlyTab") : t("billing.monthlyTab")})`,
                    });
                    router.refresh();
                } else {
                    window.location.href = res.url;
                }
            }
        } catch {
            toast({ title: t("common.error"), description: "Failed to initiate payment", variant: "destructive" });
        } finally {
            setLoadingTier(null);
        }
    };

    const handleOpenPortal = async () => {
        setLoadingPortal(true);
        try {
            const res = await createBillingPortalSession();
            if (res.error) {
                toast({ title: t("common.error"), description: res.error, variant: "destructive" });
            } else if (res.url) {
                window.location.href = res.url;
            }
        } catch {
            toast({ title: t("common.error"), description: "Failed to open billing portal", variant: "destructive" });
        } finally {
            setLoadingPortal(false);
        }
    };

    const handleManualSync = () => {
        setIsSyncing(true);
        router.refresh();
        setTimeout(() => {
            setIsSyncing(false);
            toast({ title: t("common.success"), description: "ซิงค์ข้อมูลแพ็กเกจล่าสุดเรียบร้อยแล้ว" });
        }, 1200);
    };

    const plans = [
        {
            ...SUBSCRIPTION_PLANS.free,
            name: t("billing.starterName"),
            description: t("billing.starterDesc"),
            features: t("billing.freeFeatures") as unknown as string[],
        },
        {
            ...SUBSCRIPTION_PLANS.pro,
            name: t("billing.proName"),
            description: t("billing.proDesc"),
            badge: t("billing.mostPopular"),
            discountBadge: SUBSCRIPTION_PLANS.pro.discountBadge,
            features: t("billing.proFeatures") as unknown as string[],
        },
        {
            ...SUBSCRIPTION_PLANS.scale,
            name: t("billing.scaleName"),
            description: t("billing.scaleDesc"),
            badge: t("billing.enterprise"),
            features: t("billing.scaleFeatures") as unknown as string[],
        },
    ];

    const getCurrentTierName = (tier: string) => {
        if (tier === "pro") return t("billing.proName");
        if (tier === "scale") return t("billing.scaleName");
        return t("billing.starterName");
    };

    // Calculate days remaining
    const daysRemaining = currentPeriodEnd 
        ? Math.max(0, Math.ceil((new Date(currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const isExpiringSoon = currentTier !== "free" && daysRemaining !== null && daysRemaining <= 7;
    const isExpired = currentTier === "free" && subscriptionStatus === "expired";

    return (
        <div className="space-y-6">
            {/* Launch Promo Banner - Focused on Business Pro */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400">
                        <Flame className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">🎉 โปรโมชันเปิดตัวระบบใหม่ (Launch Special)</span>
                            <Badge className="bg-rose-500 text-white font-extrabold text-[10px] tracking-wider uppercase">
                                ลด 50% สำหรับ Business Pro
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            สิทธิพิเศษช่วงเปิดตัว! อัปเกรดเป็น <strong>Business Pro</strong> วันนี้รับส่วนลด 50% ทันที (เริ่มต้นเพียง ฿295 / เดือน)
                        </p>
                    </div>
                </div>
            </div>

            {/* Header, Billing Cycle Tabs & Currency Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">{t("billing.title")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {t("billing.subtitle")}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Monthly / Yearly Billing Cycle Switcher Tabs */}
                    <div className="inline-flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                billingCycle === "monthly" ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t("billing.monthlyTab")}
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                                billingCycle === "yearly" ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span>{t("billing.yearlyTab")}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                                {t("billing.saveDiscount")}
                            </span>
                        </button>
                    </div>

                    {/* Currency toggle */}
                    <div className="inline-flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
                        <button
                            onClick={() => setCurrency("thb")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                currency === "thb" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            THB (฿)
                        </button>
                        <button
                            onClick={() => setCurrency("usd")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                currency === "usd" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            USD ($)
                        </button>
                    </div>

                    {/* Manage Billing Portal Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenPortal}
                        disabled={loadingPortal}
                        className="h-8 text-xs gap-1.5"
                    >
                        {loadingPortal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5 text-primary" />}
                        {t("billing.manageBilling")}
                    </Button>
                </div>
            </div>

            {/* Expiring Soon Alert */}
            {isExpiringSoon && (
                <div className="flex items-center gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="text-xs">
                        <span className="font-semibold">แจ้งเตือนรอบบิลใกล้หมดอายุ:</span> แพ็กเกจของคุณจะหมดอายุในอีก <strong>{daysRemaining} วัน</strong> (หากไม่ได้ต่ออายุ ระบบจะปรับลดกลับเป็น Starter Free อัตโนมัติ)
                    </div>
                </div>
            )}

            {/* Expired Notification */}
            {isExpired && (
                <div className="flex items-center gap-3 p-3.5 rounded-lg border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200">
                    <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="text-xs">
                        <span className="font-semibold">รอบบิลหมดอายุแล้ว:</span> ระบบได้ปรับลดแพ็กเกจของคุณกลับมาเป็น <strong>Starter (Free)</strong> ตามนโยบายการใช้งาน คุณสามารถเลือกอัปเกรดเพื่อรับสิทธิ์ไม่จำกัดได้ทุกเมื่อ
                    </div>
                </div>
            )}

            {/* Current Plan Status Alert */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-card/60 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <Zap className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{t("billing.currentPlan")}:</span>
                            <Badge variant="outline" className="text-[11px] uppercase font-bold tracking-wider bg-primary/10 text-primary border-primary/20">
                                {getCurrentTierName(currentTier)}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">({subscriptionStatus})</span>
                        </div>
                        {currentPeriodEnd && currentTier !== "free" && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {t("billing.cycleEnds")} {new Date(currentPeriodEnd).toLocaleDateString()} {daysRemaining !== null ? `(เหลือ ${daysRemaining} วัน)` : ""}
                            </p>
                        )}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
                    <span>ซิงค์ข้อมูล</span>
                </Button>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isCurrent = currentTier === plan.id;

                    const displayPrice = billingCycle === "yearly"
                        ? (currency === "thb" ? `฿${plan.yearlyPriceTHB.toLocaleString()}` : `$${plan.yearlyPriceUSD}`)
                        : (currency === "thb" ? `฿${plan.priceTHB.toLocaleString()}` : `$${plan.priceUSD}`);

                    const originalPrice = billingCycle === "yearly"
                        ? (currency === "thb" ? `฿${plan.originalYearlyPriceTHB.toLocaleString()}` : `$${plan.originalYearlyPriceUSD}`)
                        : (currency === "thb" ? `฿${plan.originalPriceTHB.toLocaleString()}` : `$${plan.originalPriceUSD}`);

                    const hasDiscount = plan.id === "pro" && plan.originalPriceTHB > plan.priceTHB;
                    const cycleLabel = billingCycle === "yearly" ? t("billing.yearly") : t("billing.monthly");

                    return (
                        <Card
                            key={plan.id}
                            className={`flex flex-col relative transition-all duration-200 ${
                                isCurrent
                                    ? "border-primary shadow-sm ring-1 ring-primary/20 bg-primary/[0.02]"
                                    : "border-border hover:border-border/80"
                            }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider shadow-2xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        {plan.badge}
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
                                <CardDescription className="text-xs min-h-[32px]">{plan.description}</CardDescription>
                                
                                <div className="mt-4 flex flex-col gap-0.5">
                                    {hasDiscount && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground line-through font-mono">
                                                {originalPrice}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-500/20">
                                                SAVE 50%
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold font-mono text-foreground">
                                            {displayPrice}
                                        </span>
                                        <span className="text-xs text-muted-foreground">/ {cycleLabel}</span>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-5 pt-3 flex-1 space-y-3">
                                <div className="text-xs font-semibold text-foreground uppercase tracking-wider text-[10px]">
                                    {t("billing.includedEntitlements")}
                                </div>
                                <ul className="space-y-2 text-xs">
                                    {plan.features?.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter className="p-5 pt-0">
                                {isCurrent ? (
                                    <Button variant="outline" size="sm" disabled className="w-full h-8 text-xs font-medium">
                                        {t("billing.currentActivePlan")}
                                    </Button>
                                ) : plan.id === "free" ? (
                                    <Button variant="outline" size="sm" disabled className="w-full h-8 text-xs font-medium">
                                        {t("billing.defaultTier")}
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => handleUpgrade(plan.id as "pro" | "scale")}
                                        disabled={loadingTier !== null}
                                        className="w-full h-8 text-xs font-medium gap-1.5"
                                    >
                                        {loadingTier === plan.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                {t("billing.upgradeTo")} {plan.name} <ArrowRight className="h-3.5 w-3.5" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

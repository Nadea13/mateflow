"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ShieldCheck, ExternalLink, Key, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/provider";

export function StripeSettingsCard() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [publishableKey, setPublishableKey] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Stripe Settings Noted",
            description: "Please ensure keys are placed in .env.local (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)",
        });
    };

    return (
        <Card className="max-w-2xl border-border">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base font-semibold">Stripe Payment Gateway</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        Payment & Checkout
                    </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                    Connect your Stripe Account to accept Credit/Debit Cards, PromptPay QR, and automated subscription billing.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
                {/* Status Callout */}
                <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-2">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Stripe Individual Account Ready</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Stripe allows both Individual (บุคคลธรรมดา) and Registered Company accounts. You can find your API Keys in the Stripe Dashboard under <strong>Developers &gt; API keys</strong>.
                    </p>
                    <a
                        href="https://dashboard.stripe.com/apikeys"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[11px] pt-1"
                    >
                        Open Stripe Dashboard <ExternalLink className="h-3 w-3" />
                    </a>
                </div>

                <form onSubmit={handleSave} className="space-y-3.5 pt-1">
                    <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5">
                            <Key className="h-3.5 w-3.5 text-muted-foreground" />
                            Next.js Environment Key Guide
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                            Add these variables to your <code>.env.local</code> file for live checkout redirection:
                        </p>
                    </div>

                    <div className="p-3 rounded-md bg-zinc-950 text-zinc-100 font-mono text-[11px] space-y-1 overflow-x-auto">
                        <div className="text-emerald-400"># Stripe API Credentials</div>
                        <div>STRIPE_SECRET_KEY=sk_test_...</div>
                        <div>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</div>
                        <div>STRIPE_WEBHOOK_SECRET=whsec_...</div>
                        <div>NEXT_PUBLIC_APP_URL=http://localhost:3001</div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>When keys are added, clicking <strong>Upgrade</strong> in the Billing page will immediately redirect customers to the official Stripe Checkout page.</span>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

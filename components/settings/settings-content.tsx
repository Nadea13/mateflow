"use client";

import { useTranslation } from "@/lib/i18n/provider";
import { AuthProfileCard } from "@/components/settings/auth-profile-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { DeleteAccountSection } from "@/components/settings/delete-account";
import { LogoutButton } from "@/components/settings/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { StripeSettingsCard } from "@/components/settings/stripe-settings-card";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ChevronRight, Store, ArrowRight } from "lucide-react";
import { TeamManagement } from "@/components/settings/team-management";
import { Button } from "@/components/ui/button";
import { Branch } from "@/types";

interface SettingsContentProps {
    authProfile: {
        email: string;
        display_name: string;
        avatar_url: string;
        provider: string;
        created_at: string;
    };
    storeProfile: any;
    teamMembers: any[];
    branches?: Branch[];
}

export function SettingsContent({ authProfile, storeProfile, teamMembers, branches = [] }: SettingsContentProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="pb-3 border-b border-border">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("settings.title")}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{t("settings.subtitle")}</p>
            </div>

            <AuthProfileCard profile={authProfile} />

            <LogoutButton />

            {/* Quick Link to Store & Branches Management */}
            <Card className="max-w-2xl border border-primary/20 bg-primary/[0.03] overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Store className="h-4 w-4 text-primary" />
                        ข้อมูลร้านค้าและสาขา (Store & Branches)
                    </CardTitle>
                    <CardDescription className="text-xs">
                        จัดการข้อมูลร้านค้า โลโก้ ที่อยู่ เลขผู้เสียภาษี และเพิ่มสาขา / คลังสินค้าได้ที่เมนูร้านค้า
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <Link href="/dashboard/store">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 border-primary/30 hover:bg-primary/10 text-primary cursor-pointer">
                            ไปยังหน้าจัดการร้านค้าและสาขา
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Stripe Payment Gateway Settings */}
            <StripeSettingsCard />

            {/* Team Management Section (Only visible to Owners) */}
            {storeProfile?.role === 'owner' && (
                <Card className="max-w-2xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {t("settings.teamTitle")}
                        </CardTitle>
                        <CardDescription>{t("settings.teamDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TeamManagement members={teamMembers} branches={branches} />
                    </CardContent>
                </Card>
            )}

            {/* Currency & Regional Section */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {t("settings.currencyTitle")}
                    </CardTitle>
                    <CardDescription>{t("settings.currencyDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <CurrencySwitcher />
                </CardContent>
            </Card>

            {/* Transaction History (Mobile Optimized) */}
            <Card className="max-w-2xl overflow-hidden md:hidden">
                <CardHeader>
                    <CardTitle>{t("settings.transactionHistory")}</CardTitle>
                    <CardDescription>{t("settings.transactionHistoryDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Link
                        href="/dashboard/history"
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-t"
                    >
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{t("settings.transactionHistory")}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>

            {/* Language Section */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {t("settings.language")}
                    </CardTitle>
                    <CardDescription>{t("settings.languageDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <LanguageSwitcher />
                </CardContent>
            </Card>

            {/* Theme Section */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {t("settings.theme")}
                    </CardTitle>
                    <CardDescription>{t("settings.themeDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeToggle />
                </CardContent>
            </Card>

            <DeleteAccountSection />
        </div>
    );
}

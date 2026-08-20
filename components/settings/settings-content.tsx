"use client";

import { useTranslation } from "@/lib/i18n/provider";
import { AuthProfileCard } from "@/components/settings/auth-profile-card";
import { StoreForm } from "@/components/profile/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { DeleteAccountSection } from "@/components/settings/delete-account";
import { LogoutButton } from "@/components/settings/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { StripeSettingsCard } from "@/components/settings/stripe-settings-card";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ChevronRight } from "lucide-react";
import { TeamManagement } from "@/components/settings/team-management";

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
}

export function SettingsContent({ authProfile, storeProfile, teamMembers }: SettingsContentProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="pb-3 border-b border-border">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("settings.title")}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{t("settings.subtitle")}</p>
            </div>

            <AuthProfileCard profile={authProfile} />

            <LogoutButton />

            <StoreForm store={storeProfile} />

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
                        <TeamManagement members={teamMembers} />
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

            {/* Appearance Section */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{t("settings.appearance")}</CardTitle>
                    <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeToggle />
                </CardContent>
            </Card>

            <DeleteAccountSection />
        </div>
    );
}

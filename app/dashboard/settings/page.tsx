import { getAuthProfile, getStoreProfile } from "@/lib/actions/profile";
import { AuthProfileCard } from "@/components/settings/auth-profile-card";
import { StoreForm } from "@/components/profile/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { DeleteAccountSection } from "@/components/settings/delete-account";
import { LogoutButton } from "@/components/settings/logout-button";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
    const [authProfile, storeProfile] = await Promise.all([
        getAuthProfile(),
        getStoreProfile(),
    ]);

    if (!authProfile || !storeProfile) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
                <p className="text-muted-foreground">Manage store and system settings.</p>
            </div>

            {/* Auth Profile (read-only, from Supabase Auth) */}
            <AuthProfileCard profile={authProfile} />

            {/* Mobile Logout Button */}
            <LogoutButton />

            {/* Store Info (editable, from profiles table) */}
            <StoreForm store={storeProfile} />

            {/* Appearance Section */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Choose light or dark theme.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeToggle />
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <DeleteAccountSection />
        </div>
    );
}

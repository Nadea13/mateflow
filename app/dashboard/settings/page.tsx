import { getAuthProfile, getStoreProfile, getTeamMembers } from "@/lib/actions/profile";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/settings/settings-content";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const [authProfile, storeProfile, teamMembers] = await Promise.all([
        getAuthProfile(),
        getStoreProfile(),
        getTeamMembers(),
    ]);

    if (!authProfile || !storeProfile) {
        redirect("/login");
    }

    return (
        <SettingsContent
            authProfile={authProfile}
            storeProfile={storeProfile}
            teamMembers={teamMembers}
        />
    );
}

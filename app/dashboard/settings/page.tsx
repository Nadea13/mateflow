import { getAuthProfile, getStoreProfile, getTeamMembers } from "@/lib/actions/profile";
import { getLocations } from "@/lib/actions/inventory";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/settings/settings-content";
import { Branch } from "@/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const [authProfile, storeProfile, teamMembers, branches] = await Promise.all([
        getAuthProfile(),
        getStoreProfile(),
        getTeamMembers(),
        getLocations(),
    ]);

    if (!authProfile || !storeProfile) {
        redirect("/login");
    }

    return (
        <SettingsContent
            authProfile={authProfile}
            storeProfile={storeProfile}
            teamMembers={teamMembers}
            branches={branches as Branch[]}
        />
    );
}

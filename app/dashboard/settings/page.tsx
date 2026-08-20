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

    if (!authProfile) {
        redirect("/login");
    }

    return (
        <SettingsContent
            authProfile={authProfile}
            storeProfile={storeProfile || {
                id: authProfile.id,
                owner_id: authProfile.id,
                store_name: "",
                avatar_url: "",
                store_address: "",
                tax_id: "",
                signature_url: "",
                store_phone: "",
                role: "owner",
                etax_enabled: false,
                etax_api_key: "",
                etax_company_id: "",
            }}
            teamMembers={teamMembers}
        />
    );
}

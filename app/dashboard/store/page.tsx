import { getProfile } from "@/lib/actions/profile";
import { getLocations } from "@/lib/actions/inventory";
import { StoreBranchesView } from "@/components/store/store-branches-view";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function StorePage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const storeProfile = await getProfile();
    const locations = await getLocations();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <StoreBranchesView
                storeProfile={storeProfile || {
                    id: user.id,
                    owner_id: user.id,
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
                locations={locations}
            />
        </div>
    );
}

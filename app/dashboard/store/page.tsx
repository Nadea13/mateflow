import { getProfile } from "@/lib/actions/profile";
import { getLocations } from "@/lib/actions/inventory";
import { StoreBranchesView } from "@/components/store/store-branches-view";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function StorePage() {
    const storeProfile = await getProfile();
    if (!storeProfile) {
        redirect("/login");
    }

    const locations = await getLocations();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <StoreBranchesView
                storeProfile={storeProfile}
                locations={locations}
            />
        </div>
    );
}

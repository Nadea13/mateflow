"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Profile, Store } from "@/types";

export async function getUserProfile() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch user profile from public.users table
    let { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    const validStores = await getStores();
    const store = validStores[0] || null;

    // Default to 'owner' so owners never lose settings/store/billing menus
    let resolvedRole = "owner";
    if (store) {
        if (store.user_role) {
            resolvedRole = store.user_role;
        } else if (store.owner_id === user.id) {
            resolvedRole = "owner";
        }
    }

    return {
        id: user.id,
        email: user.email || dbUser?.email || "",
        store_name: store?.store_name || "",
        avatar_url: store?.avatar_url || dbUser?.avatar_url || "",
        owner_id: store?.owner_id || user.id,
        role: resolvedRole,
        default_currency: store?.default_currency || "THB",
        country: store?.country || "TH",
        tax_rate: store?.tax_rate || 7,
        updated_at: store?.updated_at || new Date().toISOString(),
    } as Profile;
}

export async function getAuthProfile() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    let { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    return {
        id: user.id,
        email: user.email || dbUser?.email || "",
        display_name: dbUser?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "",
        avatar_url: dbUser?.avatar_url || user.user_metadata?.avatar_url || "",
        provider: user.app_metadata?.provider || "email",
        created_at: user.created_at || "",
    };
}

export async function getStoreProfile(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const validStores = await getStores();
    if (validStores.length === 0) return null;

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    const targetStoreId = storeId || (activeCookieStoreId && validStores.some(s => s.id === activeCookieStoreId) ? activeCookieStoreId : validStores[0].id);

    const store = validStores.find(s => s.id === targetStoreId) || validStores[0];

    return {
        id: store.id,
        owner_id: store.owner_id || user.id,
        store_name: store.store_name || "",
        avatar_url: store.avatar_url || "",
        store_address: store.store_address || "",
        tax_id: store.tax_id || "",
        signature_url: store.signature_url || "",
        store_phone: store.store_phone || "",
        role: store.user_role || (store.owner_id === user.id ? "owner" : "sales"),
        etax_enabled: store.etax_enabled || false,
        etax_api_key: store.etax_api_key || "",
        etax_company_id: store.etax_company_id || "",
    };
}

// Backward compatibility
export async function getProfile(storeId?: string) {
    return getStoreProfile(storeId);
}

export async function switchActiveStore(storeId: string) {
    const cookieStore = await cookies();
    cookieStore.set("active_store_id", storeId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/store");
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function getStores() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // 1. Fetch stores owned by this user
    const { data: ownedStores, error: ownedErr } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

    let allStores: any[] = (ownedStores || []).map(s => ({ ...s, user_role: "owner" }));

    // 2. Fetch stores where this user is an invited team member
    try {
        const { data: teamMemberships } = await supabase
            .from("store_team_members")
            .select("store_id, role, store:stores(*)")
            .eq("user_id", user.id);

        if (teamMemberships && teamMemberships.length > 0) {
            teamMemberships.forEach((tm: any) => {
                if (tm.store && !allStores.some(s => s.id === tm.store.id)) {
                    allStores.push({ ...tm.store, user_role: tm.role || "sales" });
                }
            });
        }
    } catch (e) {
        // Ignored if table not created yet
    }

    return allStores;
}

export async function createNewStore(data: {
    store_name: string;
    store_phone?: string;
    tax_id?: string;
    store_address?: string;
    avatar_url?: string;
    signature_url?: string;
    branch_name?: string;
    branch_code?: string;
    branch_type?: "warehouse" | "storefront" | "3pl" | "other";
    branch_address?: string;
}) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "User session expired. Please sign in again." };
    }

    // 1. Always insert a BRAND NEW store row
    const storePayload: any = {
        owner_id: user.id,
        store_name: data.store_name,
        store_phone: data.store_phone || null,
        tax_id: data.tax_id || null,
        store_address: data.store_address || null,
        avatar_url: data.avatar_url || null,
        signature_url: data.signature_url || null,
        role: "owner",
        default_currency: "THB",
        country: "TH",
        tax_rate: 7,
        updated_at: new Date().toISOString(),
    };

    const { data: newStore, error } = await supabase
        .from("stores")
        .insert(storePayload)
        .select("id")
        .single();

    if (error) {
        console.error("Create new store error:", error);
        return { error: error.message || "Failed to create new store" };
    }

    // 2. Create the initial branch for this brand new store
    const finalBranchName = data.branch_name?.trim() || `${data.store_name} (สาขาหลัก)`;
    const finalBranchCode = data.branch_code?.trim() || "HQ-01";
    const finalBranchType = data.branch_type || "warehouse";
    const finalBranchAddress = data.branch_address?.trim() || data.store_address || "สำนักงานใหญ่ / คลังสินค้าหลัก";

    const branchPayload: any = {
        store_id: newStore.id,
        name: finalBranchName,
        code: finalBranchCode,
        type: finalBranchType,
        country: "TH",
        address: finalBranchAddress,
    };

    let branchRes = await supabase.from("branchs").insert(branchPayload);
    if (branchRes.error) {
        console.warn("Branch insertion warning:", branchRes.error);
    }

    // 3. Automatically set this newly created store as active in cookie
    cookieStore.set("active_store_id", newStore.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/store");
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/inventory");
    return { success: true, store_id: newStore.id };
}

export async function updateProfile(data: { 
    store_id?: string;
    store_name?: string; 
    store_address?: string; 
    tax_id?: string; 
    store_phone?: string;
    avatar_url?: string;
    signature_url?: string;
}) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "User session expired. Please sign in again." };
    }

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    let targetStoreId = data.store_id || cookieStore.get("active_store_id")?.value || validStoreIds[0];

    if (!targetStoreId || !validStoreIds.includes(targetStoreId)) {
        return createNewStore({
            store_name: data.store_name || "My Store",
            store_phone: data.store_phone,
            tax_id: data.tax_id,
            store_address: data.store_address,
            avatar_url: data.avatar_url,
            signature_url: data.signature_url,
        });
    }

    // Update existing store
    const updatePayload: any = {
        updated_at: new Date().toISOString(),
    };

    if (data.store_name !== undefined) updatePayload.store_name = data.store_name;
    if (data.store_address !== undefined) updatePayload.store_address = data.store_address;
    if (data.tax_id !== undefined) updatePayload.tax_id = data.tax_id;
    if (data.store_phone !== undefined) updatePayload.store_phone = data.store_phone;
    if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;
    if (data.signature_url !== undefined) updatePayload.signature_url = data.signature_url;

    const { error } = await supabase
        .from("stores")
        .update(updatePayload)
        .eq("id", targetStoreId);

    if (error) {
        console.error("Supabase updateStore error:", error);
        return { error: error.message || "Failed to update store profile" };
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/store");
    revalidatePath("/dashboard/catalog");
    return { success: true, store_id: targetStoreId };
}

export async function getTeamMembers() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching team members:", error);
        return [];
    }

    return data || [];
}

export async function signOutUser() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    redirect("/login");
}

export async function softDeleteAccount() {
    return deleteAccount();
}

export async function updateETaxSettings(data: { etax_enabled: boolean; etax_api_key: string; etax_company_id: string }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const activeStoreId = cookieStore.get("active_store_id")?.value;

    let query = supabase.from("stores").update({
        etax_enabled: data.etax_enabled,
        etax_api_key: data.etax_api_key,
        etax_company_id: data.etax_company_id,
        updated_at: new Date().toISOString(),
    });

    if (activeStoreId) {
        query = query.eq("id", activeStoreId);
    } else {
        query = query.eq("owner_id", user.id);
    }

    const { error } = await query;

    if (error) {
        console.error("Error updating E-Tax settings:", error);
        return { error: "Failed to update E-Tax settings" };
    }

    revalidatePath("/dashboard/tax");
    return { success: true };
}

export async function updateStripeKeys(data: { stripe_publishable_key?: string; stripe_secret_key?: string }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const activeStoreId = cookieStore.get("active_store_id")?.value;

    let query = supabase.from("stores").update({
        stripe_publishable_key: data.stripe_publishable_key,
        stripe_secret_key: data.stripe_secret_key,
        updated_at: new Date().toISOString(),
    });

    if (activeStoreId) {
        query = query.eq("id", activeStoreId);
    } else {
        query = query.eq("owner_id", user.id);
    }

    const { error } = await query;

    if (error) {
        console.error("Error updating Stripe keys:", error);
        return { error: "Failed to update Stripe keys" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function deleteAccount() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // 1. Delete associated data
    await supabase.from("bills").delete().eq("store_id", user.id);
    await supabase.from("expenses").delete().eq("store_id", user.id);
    await supabase.from("products").delete().eq("store_id", user.id);
    await supabase.from("customers").delete().eq("store_id", user.id);
    await supabase.from("suppliers").delete().eq("store_id", user.id);
    await supabase.from("purchase_orders").delete().eq("store_id", user.id);
    await supabase.from("branchs").delete().eq("store_id", user.id);

    // 2. Delete Store and User record
    await supabase.from("stores").delete().eq("owner_id", user.id);
    await supabase.from("users").delete().eq("id", user.id);

    // 3. Sign out session
    await supabase.auth.signOut();
    redirect("/login");
}

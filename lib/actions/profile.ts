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

    // 1. Fetch user profile from public.users table
    let { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    // 2. Fetch all valid stores this user has legitimate access to (owned or member)
    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const activeStoreIdCookie = cookieStore.get("active_store_id")?.value;
    let activeStore: any = null;

    if (activeStoreIdCookie && validStoreIds.includes(activeStoreIdCookie)) {
        activeStore = validStores.find(s => s.id === activeStoreIdCookie);
    } else {
        // Default to the first store the user owns or belongs to
        activeStore = validStores[0] || null;
    }

    if (!activeStore) {
        return {
            id: user.id,
            email: user.email || dbUser?.email || "",
            store_name: "ร้านค้าของคุณ",
            avatar_url: dbUser?.avatar_url || "",
            owner_id: user.id,
            role: "owner",
            default_currency: "THB",
            country: "TH",
            tax_rate: 7,
            updated_at: new Date().toISOString(),
        } as Profile;
    }

    return {
        id: user.id,
        email: user.email || dbUser?.email || "",
        store_name: activeStore.store_name || "",
        avatar_url: activeStore.avatar_url || dbUser?.avatar_url || "",
        owner_id: activeStore.owner_id || user.id,
        role: activeStore.user_role || (activeStore.owner_id === user.id ? "owner" : "sales"),
        default_currency: activeStore.default_currency || "THB",
        country: activeStore.country || "TH",
        tax_rate: activeStore.tax_rate || 7,
        updated_at: activeStore.updated_at || new Date().toISOString(),
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
    const validStoreIds = validStores.map(s => s.id);

    const targetStoreId = storeId || cookieStore.get("active_store_id")?.value;
    let store: any = null;

    if (targetStoreId && validStoreIds.includes(targetStoreId)) {
        store = validStores.find(s => s.id === targetStoreId);
    } else {
        store = validStores[0] || null;
    }

    if (!store) return null;

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

export async function getProfile(storeId?: string) {
    return getStoreProfile(storeId);
}

export async function switchActiveStore(storeId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // Verify user owns or is member of this store
    const validStores = await getStores();
    if (!validStores.some(s => s.id === storeId)) {
        return { error: "Access denied to target store" };
    }

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

    // 1. Stores owned by user (with branches)
    const { data: ownedStores } = await supabase
        .from("stores")
        .select(`
            *,
            branchs:branchs ( id, name, code, type, address )
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

    // 2. Stores where user is a team member
    const { data: memberRows } = await supabase
        .from("store_team_members")
        .select("role, store_id")
        .eq("user_id", user.id);

    const allStores: any[] = (ownedStores || []).map(s => ({
        ...s,
        user_role: "owner",
        branches: s.branchs || [],
    }));

    if (memberRows && memberRows.length > 0) {
        for (const mr of memberRows) {
            if (!allStores.some(s => s.id === mr.store_id)) {
                // Fetch store details with branches
                const { data: storeDetails } = await supabase
                    .from("stores")
                    .select(`
                        *,
                        branchs:branchs ( id, name, code, type, address )
                    `)
                    .eq("id", mr.store_id)
                    .maybeSingle();

                if (storeDetails) {
                    allStores.push({
                        ...storeDetails,
                        user_role: mr.role,
                        branches: storeDetails.branchs || [],
                    });
                }
            }
        }
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
        console.warn("Retrying branch insertion into branchs with fallback:", branchRes.error);
        await supabase.from("branchs").insert({
            ...branchPayload,
            user_id: user.id,
        });
    }

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

    let targetStoreId = data.store_id || cookieStore.get("active_store_id")?.value;
    if (!targetStoreId) {
        const { data: existingStore } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true })
            .maybeSingle();

        if (existingStore) {
            targetStoreId = existingStore.id;
        }
    }

    if (!targetStoreId) {
        return createNewStore({
            store_name: data.store_name || "My Store",
            store_phone: data.store_phone,
            tax_id: data.tax_id,
            store_address: data.store_address,
            avatar_url: data.avatar_url,
            signature_url: data.signature_url,
        });
    }

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
        .eq("id", targetStoreId)
        .eq("owner_id", user.id);

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

export async function getTeamMembers(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const targetStoreId = storeId || cookieStore.get("active_store_id")?.value;

    let query = supabase
        .from("store_team_members")
        .select(`
            id,
            role,
            created_at,
            user:users ( id, email, full_name, avatar_url )
        `)
        .order("created_at", { ascending: false });

    if (targetStoreId) {
        query = query.eq("store_id", targetStoreId);
    }

    const { data, error } = await query;

    if (error || !data) {
        const fallback = await supabase.from("team_members").select("*");
        return fallback.data || [];
    }

    return data.map((tm: any) => ({
        id: tm.id,
        role: tm.role,
        email: tm.user?.email || "",
        name: tm.user?.full_name || "",
        avatar_url: tm.user?.avatar_url || "",
        created_at: tm.created_at,
    }));
}

export async function signOutUser() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    // Clear active store cookie on logout
    cookieStore.delete("active_store_id");
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

    await supabase.from("bills").delete().eq("store_id", user.id);
    await supabase.from("expenses").delete().eq("store_id", user.id);
    await supabase.from("products").delete().eq("store_id", user.id);
    await supabase.from("customers").delete().eq("store_id", user.id);
    await supabase.from("suppliers").delete().eq("store_id", user.id);
    await supabase.from("purchase_orders").delete().eq("store_id", user.id);
    await supabase.from("branchs").delete().eq("store_id", user.id);

    await supabase.from("stores").delete().eq("owner_id", user.id);
    await supabase.from("users").delete().eq("id", user.id);

    await supabase.auth.signOut();
    redirect("/login");
}

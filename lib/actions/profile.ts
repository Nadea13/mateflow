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

    // 1. Fetch user profile from public.users table (or stores/profiles fallback)
    let { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    // 2. Fetch associated store
    let { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

    if (!store) {
        // Fallback query by id
        const storeFallback = await supabase
            .from("stores")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
        store = storeFallback.data;
    }

    return {
        id: user.id,
        email: user.email || dbUser?.email || "",
        store_name: store?.store_name || "",
        avatar_url: store?.avatar_url || dbUser?.avatar_url || "",
        owner_id: store?.owner_id || user.id,
        role: store?.role || "owner",
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

export async function getStoreProfile() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    let { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

    if (!store) {
        // Fallback by id
        const fallback = await supabase
            .from("stores")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
        store = fallback.data;
    }

    return {
        id: store?.id || user.id,
        owner_id: store?.owner_id || user.id,
        store_name: store?.store_name || "",
        avatar_url: store?.avatar_url || "",
        store_address: store?.store_address || "",
        tax_id: store?.tax_id || "",
        signature_url: store?.signature_url || "",
        store_phone: store?.store_phone || "",
        role: store?.role || "owner",
        etax_enabled: store?.etax_enabled || false,
        etax_api_key: store?.etax_api_key || "",
        etax_company_id: store?.etax_company_id || "",
    };
}

// Backward compatibility
export async function getProfile() {
    return getStoreProfile();
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

    // 1. Check existing store for this owner
    let existingStoreId = data.store_id;
    if (!existingStoreId) {
        const { data: existingStore } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

        if (existingStore) {
            existingStoreId = existingStore.id;
        }
    }

    // 2. Prepare Store Payload (with independent UUID and owner_id)
    const storePayload: any = {
        owner_id: user.id,
        updated_at: new Date().toISOString(),
    };

    if (existingStoreId) {
        storePayload.id = existingStoreId;
    }

    if (data.store_name !== undefined) storePayload.store_name = data.store_name;
    if (data.store_address !== undefined) storePayload.store_address = data.store_address;
    if (data.tax_id !== undefined) storePayload.tax_id = data.tax_id;
    if (data.store_phone !== undefined) storePayload.store_phone = data.store_phone;
    if (data.avatar_url !== undefined) storePayload.avatar_url = data.avatar_url;
    if (data.signature_url !== undefined) storePayload.signature_url = data.signature_url;

    // 3. Upsert to stores table
    let { data: savedStore, error } = await supabase
        .from("stores")
        .upsert(storePayload)
        .select("id")
        .single();

    // Fallback: If stores table schema has backward-compatible id=user.id
    if (error) {
        console.warn("Retrying store upsert with direct ID fallback:", error.message);
        storePayload.id = user.id;
        const retryResult = await supabase
            .from("stores")
            .upsert(storePayload, { onConflict: "id" })
            .select("id")
            .single();
        error = retryResult.error;
        savedStore = retryResult.data;
    }

    if (error) {
        console.error("Supabase updateStore error:", error);
        return { error: error.message || "Failed to update store profile" };
    }

    const currentStoreId = savedStore?.id || existingStoreId || user.id;

    // 4. Auto-create / ensure primary headquarters branch for this store
    try {
        let { data: existingBranches } = await supabase
            .from("branchs")
            .select("id")
            .eq("store_id", currentStoreId);

        if (!existingBranches || existingBranches.length === 0) {
            const branchName = data.store_name ? `${data.store_name} (สาขาหลัก)` : "สาขาหลัก (Headquarters)";
            
            await supabase.from("branchs").insert({
                store_id: currentStoreId,
                name: branchName,
                code: "HQ-01",
                type: "warehouse",
                country: "TH",
                address: data.store_address || "สำนักงานใหญ่ / คลังสินค้าหลัก",
            });
        }
    } catch (locErr) {
        console.warn("Auto-branch creation warning:", locErr);
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/store");
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard");
    return { success: true, store_id: currentStoreId };
}

export async function updateETaxSettings(data: { etax_enabled: boolean; etax_api_key: string; etax_company_id: string }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("stores")
        .update({
            etax_enabled: data.etax_enabled,
            etax_api_key: data.etax_api_key,
            etax_company_id: data.etax_company_id,
            updated_at: new Date().toISOString(),
        })
        .eq("owner_id", user.id);

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

    const { error } = await supabase
        .from("stores")
        .update({
            stripe_publishable_key: data.stripe_publishable_key,
            stripe_secret_key: data.stripe_secret_key,
            updated_at: new Date().toISOString(),
        })
        .eq("owner_id", user.id);

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
    await supabase.from("bills").delete().eq("user_id", user.id);
    await supabase.from("expenses").delete().eq("user_id", user.id);
    await supabase.from("products").delete().eq("user_id", user.id);
    await supabase.from("customers").delete().eq("user_id", user.id);
    await supabase.from("suppliers").delete().eq("user_id", user.id);
    await supabase.from("purchase_orders").delete().eq("user_id", user.id);
    await supabase.from("branchs").delete().eq("store_id", user.id);

    // 2. Delete Store and User record
    await supabase.from("stores").delete().eq("owner_id", user.id);
    await supabase.from("users").delete().eq("id", user.id);

    // 3. Sign out session
    await supabase.auth.signOut();
    redirect("/login");
}

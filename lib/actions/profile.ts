"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Profile } from "@/types";

export async function getUserProfile() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Try stores table first, fallback to profiles
    let { data: profile } = await supabase
        .from("stores")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile) {
        const fallback = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
        profile = fallback.data;
    }

    return profile as Profile | null;
}

export async function getAuthProfile() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return {
        id: user.id,
        email: user.email || "",
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        avatar_url: user.user_metadata?.avatar_url || "",
        provider: user.app_metadata?.provider || "email",
        created_at: user.created_at || "",
    };
}

export async function getStoreProfile() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    let { data: profile } = await supabase
        .from("stores")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile) {
        const fallback = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
        profile = fallback.data;
    }

    return {
        id: user.id,
        store_name: profile?.store_name || "",
        avatar_url: profile?.avatar_url || "",
        store_address: profile?.store_address || "",
        tax_id: profile?.tax_id || "",
        signature_url: profile?.signature_url || "",
        store_phone: profile?.store_phone || "",
        role: profile?.role || "owner",
        etax_enabled: profile?.etax_enabled || false,
        etax_api_key: profile?.etax_api_key || "",
        etax_company_id: profile?.etax_company_id || "",
    };
}

// Backward compatibility
export async function getProfile() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    let { data: profile } = await supabase
        .from("stores")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile) {
        const fallback = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
        profile = fallback.data;
    }

    return {
        id: user.id,
        email: user.email || "",
        store_name: profile?.store_name || "",
        avatar_url: profile?.avatar_url || "",
        store_address: profile?.store_address || "",
        tax_id: profile?.tax_id || "",
        signature_url: profile?.signature_url || "",
        store_phone: profile?.store_phone || "",
    };
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

    // Try primary payload with full fields
    const fullPayload: any = {
        id: user.id,
        updated_at: new Date().toISOString(),
    };

    if (data.store_name !== undefined) fullPayload.store_name = data.store_name;
    if (data.store_address !== undefined) fullPayload.store_address = data.store_address;
    if (data.tax_id !== undefined) fullPayload.tax_id = data.tax_id;
    if (data.store_phone !== undefined) fullPayload.store_phone = data.store_phone;
    if (data.avatar_url !== undefined) fullPayload.avatar_url = data.avatar_url;
    if (data.signature_url !== undefined) fullPayload.signature_url = data.signature_url;

    // 1. Try upserting to stores table first
    let { error } = await supabase
        .from("stores")
        .upsert(fullPayload, { onConflict: "id" });

    // Fallback: If stores table doesn't exist yet, upsert to profiles
    if (error) {
        let profileUpsert = await supabase
            .from("profiles")
            .upsert(fullPayload, { onConflict: "id" });
        error = profileUpsert.error;

        if (error && (error.code === "PGRST204" || error.message?.includes("column"))) {
            const corePayload: any = {
                id: user.id,
                updated_at: new Date().toISOString(),
            };
            if (data.store_name !== undefined) corePayload.store_name = data.store_name;
            if (data.avatar_url !== undefined) corePayload.avatar_url = data.avatar_url;
            
            const retryResult = await supabase
                .from("profiles")
                .upsert(corePayload, { onConflict: "id" });

            error = retryResult.error;
        }
    }

    if (error) {
        console.error("Supabase updateStore error:", error);
        return { error: error.message || "Failed to update store profile" };
    }

    // AUTO-CREATE / ENSURE PRIMARY HEADQUARTERS BRANCH for the new store
    try {
        let { data: existingBranches } = await supabase
            .from("branchs")
            .select("id")
            .eq("store_id", user.id);

        if (!existingBranches || existingBranches.length === 0) {
            const branchName = data.store_name ? `${data.store_name} (สาขาหลัก)` : "สาขาหลัก (Headquarters)";
            
            // Try inserting into branchs with store_id
            const branchInsert = await supabase.from("branchs").insert({
                store_id: user.id,
                name: branchName,
                code: "HQ-01",
                type: "warehouse",
                country: "TH",
                address: data.store_address || "สำนักงานใหญ่ / คลังสินค้าหลัก",
            });

            if (branchInsert.error) {
                // Fallback to locations table with user_id
                await supabase.from("locations").insert({
                    user_id: user.id,
                    name: branchName,
                    code: "HQ-01",
                    type: "warehouse",
                    country: "TH",
                    address: data.store_address || "สำนักงานใหญ่ / คลังสินค้าหลัก",
                });
            }
        }
    } catch (locErr) {
        console.warn("Auto-branch creation warning:", locErr);
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/store");
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateETaxSettings(data: { etax_enabled: boolean; etax_api_key: string; etax_company_id: string }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    let { error } = await supabase
        .from("stores")
        .upsert({
            id: user.id,
            etax_enabled: data.etax_enabled,
            etax_api_key: data.etax_api_key,
            etax_company_id: data.etax_company_id,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                etax_enabled: data.etax_enabled,
                etax_api_key: data.etax_api_key,
                etax_company_id: data.etax_company_id,
                updated_at: new Date().toISOString(),
            });
    }

    revalidatePath("/dashboard/tax");
    return { success: true };
}

export async function updateStripeKeys(data: { stripe_publishable_key?: string; stripe_secret_key?: string }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    let { error } = await supabase
        .from("stores")
        .upsert({
            id: user.id,
            stripe_publishable_key: data.stripe_publishable_key,
            stripe_secret_key: data.stripe_secret_key,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                stripe_publishable_key: data.stripe_publishable_key,
                stripe_secret_key: data.stripe_secret_key,
                updated_at: new Date().toISOString(),
            });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function uploadAvatar(formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const file = formData.get("avatar") as File;
    if (!file) return { error: "No file provided" };

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

    if (uploadError) {
        console.error("Upload error:", uploadError);
        return { error: "Failed to upload avatar" };
    }

    const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

    let { error: updateError } = await supabase
        .from("stores")
        .upsert({
            id: user.id,
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
        });

    if (updateError) {
        await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                avatar_url: publicUrl,
                updated_at: new Date().toISOString(),
            });
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/store");
    return { success: true, avatar_url: publicUrl };
}

export async function uploadSignature(formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const file = formData.get("signature") as File;
    if (!file) return { error: "No file provided" };

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-sig-${Math.random()}.${fileExt}`;
    const filePath = `signatures/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

    if (uploadError) {
        console.error("Upload error:", uploadError);
        return { error: "Failed to upload signature" };
    }

    const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

    let { error: updateError } = await supabase
        .from("stores")
        .upsert({
            id: user.id,
            signature_url: publicUrl,
            updated_at: new Date().toISOString(),
        });

    if (updateError) {
        await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                signature_url: publicUrl,
                updated_at: new Date().toISOString(),
            });
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/store");
    return { success: true, signature_url: publicUrl };
}

export async function deleteAccount() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // 1. Delete transactions/bills/expenses/products
    await supabase.from("bills").delete().eq("user_id", user.id);
    await supabase.from("expenses").delete().eq("user_id", user.id);
    await supabase.from("products").delete().eq("user_id", user.id);
    await supabase.from("customers").delete().eq("user_id", user.id);
    await supabase.from("suppliers").delete().eq("user_id", user.id);
    await supabase.from("purchase_orders").delete().eq("user_id", user.id);
    await supabase.from("branchs").delete().eq("store_id", user.id);
    await supabase.from("locations").delete().eq("user_id", user.id);

    // 2. Delete Store / Profile
    await supabase.from("stores").delete().eq("id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    // 3. Sign out session
    await supabase.auth.signOut();
    redirect("/login");
}

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

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

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

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

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

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

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

    let { error } = await supabase
        .from("profiles")
        .upsert(fullPayload, { onConflict: "id" });

    // Fallback: If local/remote Postgres schema doesn't have tax_id / signature_url / store_phone columns yet
    if (error && (error.code === "PGRST204" || error.message?.includes("column"))) {
        console.warn("Retrying profile upsert with core schema fields due to missing columns:", error.message);
        
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

    if (error) {
        console.error("Supabase updateProfile error:", error);
        return { error: error.message || "Failed to update profile" };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/store");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateETaxSettings(data: { etax_enabled: boolean; etax_api_key: string; etax_company_id: string }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            etax_enabled: data.etax_enabled,
            etax_api_key: data.etax_api_key,
            etax_company_id: data.etax_company_id,
            updated_at: new Date().toISOString(),
        });

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
        .from("profiles")
        .upsert({
            id: user.id,
            stripe_publishable_key: data.stripe_publishable_key,
            stripe_secret_key: data.stripe_secret_key,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error("Error updating Stripe keys:", error);
        return { error: "Failed to update Stripe keys" };
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

    const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
        });

    if (updateError) {
        return { error: "Failed to update profile with avatar" };
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

    const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            signature_url: publicUrl,
            updated_at: new Date().toISOString(),
        });

    if (updateError) {
        return { error: "Failed to update profile with signature" };
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

    // 2. Delete Profile
    const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

    if (error) {
        console.error("Error deleting profile:", error);
        return { error: "Failed to delete profile data" };
    }

    // 3. Sign out session
    await supabase.auth.signOut();
    redirect("/login");
}

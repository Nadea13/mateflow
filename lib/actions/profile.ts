"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getAuthProfile() {
    const cookieStore = cookies();
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
    const cookieStore = cookies();
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
    };
}

// Backward compatibility
export async function getProfile() {
    const cookieStore = cookies();
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
    };
}

export async function updateProfile(data: { store_name?: string; store_address?: string; tax_id?: string; store_phone?: string }) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            store_name: data.store_name,
            store_address: data.store_address,
            tax_id: data.tax_id,
            store_phone: data.store_phone,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error("Error updating profile:", error);
        return { error: "Failed to update profile" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function uploadSignature(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const file = formData.get("signature") as File;
    if (!file) return { error: "No file provided" };

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/signature.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error("Error uploading signature:", uploadError);
        return { error: "Failed to upload image" };
    }

    const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            signature_url: publicUrl,
            updated_at: new Date().toISOString(),
        });

    if (profileError) {
        console.error("Error updating signature URL:", profileError);
        return { error: "Failed to save signature" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true, signature_url: publicUrl };
}

export async function uploadAvatar(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const file = formData.get("avatar") as File;
    if (!file) return { error: "No file provided" };

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        return { error: "Failed to upload image" };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

    // Update profile with avatar URL
    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
        });

    if (profileError) {
        console.error("Error updating avatar URL:", profileError);
        return { error: "Failed to save avatar" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true, avatar_url: publicUrl };
}

export async function softDeleteAccount() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", user.id);

    if (error) {
        console.error("Error soft deleting account:", error);
        return { error: "Failed to delete account" };
    }

    // Sign out the user
    await supabase.auth.signOut();

    return { success: true };
}

export async function signOutUser() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    redirect("/login");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Location, InventoryLevel } from "@/types";
import { getStores } from "@/lib/actions/profile";

export async function getLocations(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    if (validStoreIds.length === 0) return [];

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = storeId || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    if (!targetStoreId || !validStoreIds.includes(targetStoreId)) {
        return [];
    }

    // Fetch branches belonging strictly to this active store
    const { data: branchs, error } = await supabase
        .from("branchs")
        .select("*")
        .eq("store_id", targetStoreId)
        .order("created_at", { ascending: true });

    if (error || !branchs) {
        return [];
    }

    return branchs.map((b: any) => ({
        ...b,
        user_id: b.store_id || user.id,
        store_id: b.store_id,
    })) as Location[];
}

export async function createLocation(data: Partial<Location>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = data.store_id || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    if (!targetStoreId || !validStoreIds.includes(targetStoreId)) {
        return { error: "Store not found or access denied" };
    }

    const { data: location, error } = await supabase
        .from("branchs")
        .insert({
            store_id: targetStoreId,
            name: data.name,
            code: data.code,
            type: data.type || "warehouse",
            country: data.country || "TH",
            address: data.address,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating branch:", error);
        return { error: "Failed to create branch" };
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/store");
    return { success: true, location };
}

export async function updateLocation(id: string, data: Partial<Location>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: existing } = await supabase.from("branchs").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    const { error } = await supabase
        .from("branchs")
        .update({
            name: data.name,
            code: data.code,
            type: data.type,
            country: data.country,
            address: data.address,
        })
        .eq("id", id);

    if (error) {
        console.error("Error updating branch:", error);
        return { error: "Failed to update branch" };
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/store");
    return { success: true };
}

export async function deleteLocation(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: existing } = await supabase.from("branchs").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    const { error } = await supabase
        .from("branchs")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting branch:", error);
        return { error: "Failed to delete branch" };
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/store");
    return { success: true };
}

export async function getInventoryLevels(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    if (validStoreIds.length === 0) return [];

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = storeId || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    if (!targetStoreId || !validStoreIds.includes(targetStoreId)) {
        return [];
    }

    let query = supabase.from("inventory_levels").select(`
        *,
        branch:branchs ( name, code )
    `).eq("store_id", targetStoreId);

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching inventory levels:", error);
        return [];
    }

    return (data || []).map((item: any) => ({
        ...item,
        location_name: item.branch?.name,
        location_code: item.branch?.code,
    }));
}

export async function updateStockLevel(productId: string, locationId: string, quantity: number, variantId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const activeStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = activeStoreId && validStoreIds.includes(activeStoreId) ? activeStoreId : validStoreIds[0];

    if (!targetStoreId) return { error: "Store not found" };

    let query = supabase
        .from("inventory_levels")
        .select("id, quantity")
        .eq("product_id", productId)
        .eq("location_id", locationId);

    if (variantId) {
        query = query.eq("variant_id", variantId);
    } else {
        query = query.is("variant_id", null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
        const { error } = await supabase
            .from("inventory_levels")
            .update({
                quantity,
                updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

        if (error) return { error: "Failed to update stock level" };
    } else {
        const { error } = await supabase
            .from("inventory_levels")
            .insert({
                store_id: targetStoreId,
                product_id: productId,
                location_id: locationId,
                variant_id: variantId || null,
                quantity,
            });

        if (error) return { error: "Failed to insert stock level" };
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/catalog");
    return { success: true };
}

export async function adjustInventory(productId: string, locationId: string, amount: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: existing } = await supabase
        .from("inventory_levels")
        .select("id, quantity")
        .eq("product_id", productId)
        .eq("location_id", locationId)
        .maybeSingle();

    const currentQty = existing?.quantity || 0;
    const newQty = Math.max(0, currentQty + amount);

    return updateStockLevel(productId, locationId, newQty);
}

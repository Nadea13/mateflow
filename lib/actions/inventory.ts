"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Location, InventoryLevel } from "@/types";

export async function getLocations(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // 1. Determine target active store
    let targetStoreId = storeId || cookieStore.get("active_store_id")?.value;

    if (!targetStoreId) {
        // Check owned store
        const { data: defaultStore } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true })
            .maybeSingle();

        if (defaultStore) {
            targetStoreId = defaultStore.id;
        } else {
            // Check member store (employee)
            const { data: memberStore } = await supabase
                .from("store_team_members")
                .select("store_id")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true })
                .maybeSingle();
            if (memberStore) {
                targetStoreId = memberStore.store_id;
            }
        }
    }

    if (!targetStoreId) return [];

    // 2. Fetch branches belonging to this active store
    const { data: branchs, error } = await supabase
        .from("branchs")
        .select("*")
        .eq("store_id", targetStoreId)
        .order("created_at", { ascending: true });

    if (error || !branchs) {
        console.error("Error fetching branches for store:", error);
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

    let targetStoreId = data.store_id || cookieStore.get("active_store_id")?.value;
    if (!targetStoreId) {
        const { data: defaultStore } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true })
            .maybeSingle();
        if (defaultStore) targetStoreId = defaultStore.id;
    }

    if (!targetStoreId) {
        return { error: "Store not found" };
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

    let targetStoreId = storeId || cookieStore.get("active_store_id")?.value;

    let query = supabase.from("inventory_levels").select(`
        *,
        branch:branchs ( name, code )
    `);

    if (targetStoreId) {
        query = query.eq("store_id", targetStoreId);
    }

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
        const activeStoreId = cookieStore.get("active_store_id")?.value;
        const { error } = await supabase
            .from("inventory_levels")
            .insert({
                store_id: activeStoreId,
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

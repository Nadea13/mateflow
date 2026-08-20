"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Location, InventoryLevel } from "@/types";

export async function getLocations() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Query branchs table first, fallback to locations if schema not yet migrated
    let { data: branchs, error } = await supabase
        .from("branchs")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        // Fallback for backward compatibility
        const fallback = await supabase
            .from("locations")
            .select("*")
            .order("created_at", { ascending: true });
        branchs = fallback.data;
    }

    if (!branchs) {
        return [];
    }

    return branchs.map((b: any) => ({
        ...b,
        user_id: b.store_id || b.user_id,
        store_id: b.store_id || b.user_id,
    })) as Location[];
}

export async function createLocation(data: Partial<Location>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const payload: any = {
        ...data,
        store_id: user.id,
    };

    // Try inserting into branchs table with store_id
    let { error } = await supabase.from("branchs").insert(payload);

    if (error) {
        // Fallback to locations table with user_id
        const fallback = await supabase.from("locations").insert({
            ...data,
            user_id: user.id,
        });
        error = fallback.error;
    }

    if (error) {
        console.error("Error creating branch:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard/inventory", "page");
    revalidatePath("/dashboard/catalog", "page");
    revalidatePath("/dashboard/store", "page");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateLocation(id: string, data: Partial<Location>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let { error } = await supabase.from("branchs").update({
        ...data,
        updated_at: new Date().toISOString()
    }).eq("id", id);

    if (error) {
        // Fallback to locations table
        const fallback = await supabase.from("locations").update({
            ...data,
            updated_at: new Date().toISOString()
        }).eq("id", id);
        error = fallback.error;
    }

    if (error) {
        console.error("Error updating branch:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard/inventory", "page");
    revalidatePath("/dashboard/catalog", "page");
    revalidatePath("/dashboard/store", "page");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function getInventoryLevels(locationId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let query = supabase.from("inventory_levels").select(`
        *,
        location:branchs(name),
        product:products(name)
    `);

    if (locationId) {
        query = query.eq("location_id", locationId);
    }

    let { data, error } = await query;

    if (error) {
        // Fallback to locations relation
        const fallbackQuery = supabase.from("inventory_levels").select(`
            *,
            location:locations(name),
            product:products(name)
        `);
        const fallbackRes = locationId ? await fallbackQuery.eq("location_id", locationId) : await fallbackQuery;
        data = fallbackRes.data;
    }

    if (!data) {
        return [];
    }

    return data.map((item: any) => ({
        ...item,
        location_name: item.location?.name,
        product_name: item.product?.name
    }));
}

export async function adjustInventory(productId: string, locationId: string, quantityChange: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get current inventory level
    const { data: currentLevel, error: fetchError } = await supabase
        .from("inventory_levels")
        .select("quantity")
        .eq("product_id", productId)
        .eq("location_id", locationId)
        .single();

    let newQuantity = quantityChange;
    if (currentLevel) {
        newQuantity += Number(currentLevel.quantity);
    }

    // Upsert the new level
    const { error: upsertError } = await supabase
        .from("inventory_levels")
        .upsert({
            product_id: productId,
            location_id: locationId,
            quantity: newQuantity,
            updated_at: new Date().toISOString()
        }, { onConflict: 'product_id, location_id' });

    if (upsertError) {
        console.error("Error adjusting inventory:", upsertError);
        return { error: upsertError.message };
    }

    // We also need to update the total stock in the `products` table
    const { data: allLevels } = await supabase
        .from("inventory_levels")
        .select("quantity")
        .eq("product_id", productId);

    const totalStock = allLevels?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

    await supabase.from("products").update({
        stock: totalStock,
        updated_at: new Date().toISOString()
    }).eq("id", productId);

    revalidatePath("/dashboard/catalog", "page");
    revalidatePath("/dashboard/inventory", "page");
    revalidatePath("/dashboard/catalog");
    return { success: true, newQuantity, totalStock };
}

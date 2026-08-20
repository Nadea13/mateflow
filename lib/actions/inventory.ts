"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Location, InventoryLevel } from "@/types";

export async function getLocations() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: locations, error } = await supabase
        .from("locations")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching locations:", error);
        return [];
    }

    return locations as Location[];
}

export async function createLocation(data: Partial<Location>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { error } = await supabase.from("locations").insert({
        ...data,
        user_id: user.id,
    });

    if (error) {
        console.error("Error creating location:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard/inventory", "page");
    return { success: true };
}

export async function updateLocation(id: string, data: Partial<Location>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.from("locations").update({
        ...data,
        updated_at: new Date().toISOString()
    }).eq("id", id);

    if (error) {
        console.error("Error updating location:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard/inventory", "page");
    return { success: true };
}

export async function getInventoryLevels(locationId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let query = supabase.from("inventory_levels").select(`
        *,
        location:locations(name),
        product:products(name)
    `);

    if (locationId) {
        query = query.eq("location_id", locationId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching inventory levels:", error);
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

    revalidatePath("/dashboard/catalog", "page"); revalidatePath("/dashboard/inventory", "page");
    revalidatePath("/dashboard/catalog");
    return { success: true, newQuantity, totalStock };
}

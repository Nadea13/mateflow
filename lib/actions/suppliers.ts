"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Supplier } from "@/types";
import { getStores } from "@/lib/actions/profile";

export async function getSuppliers(storeId?: string) {
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

    let query = supabase.from("suppliers").select("*").eq("store_id", targetStoreId).order("name", { ascending: true });

    let { data: suppliers, error } = await query;

    if (error || !suppliers) {
        return [];
    }

    return suppliers as Supplier[];
}

export async function createSupplier(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    store_id?: string;
}) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    if (validStoreIds.length === 0) {
        return { error: "No active store found" };
    }

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = data.store_id || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    if (!targetStoreId || !validStoreIds.includes(targetStoreId)) {
        return { error: "Invalid store access" };
    }

    const payload: any = {
        store_id: targetStoreId,
        ...data,
    };

    let { data: supplier, error } = await supabase
        .from("suppliers")
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error("Error creating supplier:", error);
        return { error: error.message || "Failed to create supplier" };
    }

    revalidatePath("/dashboard/catalog", "page");
    revalidatePath("/dashboard/expenses", "page");
    return { success: true, supplier: supplier as Supplier };
}

export async function updateSupplier(id: string, data: Partial<Supplier>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: existing } = await supabase.from("suppliers").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    const { error } = await supabase
        .from("suppliers")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        console.error("Error updating supplier:", error);
        return { error: "Failed to update supplier" };
    }

    revalidatePath("/dashboard/catalog", "page");
    revalidatePath("/dashboard/expenses", "page");
    return { success: true };
}

export async function deleteSupplier(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: existing } = await supabase.from("suppliers").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting supplier:", error);
        return { error: "Failed to delete supplier" };
    }

    revalidatePath("/dashboard/catalog", "page");
    revalidatePath("/dashboard/expenses", "page");
    return { success: true };
}

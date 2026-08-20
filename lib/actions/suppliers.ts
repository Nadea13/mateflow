"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Supplier } from "@/types";

export async function getSuppliers(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const targetStoreId = storeId || cookieStore.get("active_store_id")?.value;

    let query = supabase.from("suppliers").select("*").order("name", { ascending: true });

    if (targetStoreId) {
        query = query.eq("store_id", targetStoreId);
    }

    let { data: suppliers, error } = await query;

    if (error || !suppliers) {
        const fallback = await supabase
            .from("suppliers")
            .select("*")
            .order("name", { ascending: true });
        suppliers = fallback.data || [];
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

    const payload: any = {
        store_id: targetStoreId || user.id,
        ...data,
    };

    let { data: supplier, error } = await supabase
        .from("suppliers")
        .insert(payload)
        .select()
        .single();

    if (error && (error.code === "PGRST204" || error.message?.includes("store_id"))) {
        delete payload.store_id;
        payload.user_id = user.id;
        const fallbackRes = await supabase.from("suppliers").insert(payload).select().single();
        supplier = fallbackRes.data;
        error = fallbackRes.error;
    }

    if (error) {
        console.error("Error creating supplier:", error);
        return { error: "Failed to create supplier" };
    }

    revalidatePath("/dashboard/expenses");
    return { success: true, supplier: supplier as Supplier };
}

export async function updateSupplier(id: string, data: Partial<Supplier>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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

    revalidatePath("/dashboard/expenses");
    return { success: true };
}

export async function deleteSupplier(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting supplier:", error);
        return { error: "Failed to delete supplier" };
    }

    revalidatePath("/dashboard/expenses");
    return { success: true };
}

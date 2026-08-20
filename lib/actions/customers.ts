"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Customer } from "@/types";

export async function getCustomers(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const targetStoreId = storeId || cookieStore.get("active_store_id")?.value;

    let query = supabase.from("customers").select("*").order("created_at", { ascending: false });

    if (targetStoreId) {
        query = query.eq("store_id", targetStoreId);
    }

    let { data: customers, error } = await query;

    if (error || !customers) {
        const fallback = await supabase
            .from("customers")
            .select("*")
            .order("created_at", { ascending: false });
        customers = fallback.data || [];
    }

    return customers;
}

export async function createCustomer(data: Partial<Customer>) {
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
        ...data,
        store_id: targetStoreId || user.id,
        updated_at: new Date().toISOString(),
    };

    let { error } = await supabase.from("customers").insert(payload);

    if (error && (error.code === "PGRST204" || error.message?.includes("store_id"))) {
        delete payload.store_id;
        payload.user_id = user.id;
        const fallbackRes = await supabase.from("customers").insert(payload);
        error = fallbackRes.error;
    }

    if (error) {
        console.error("Error creating customer:", error);
        return { error: "Failed to create customer" };
    }

    revalidatePath("/dashboard/catalog", "page"); 
    revalidatePath("/dashboard/customers", "page");
    return { success: true };
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("customers")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        console.error("Error updating customer:", error);
        return { error: "Failed to update customer" };
    }

    revalidatePath("/dashboard/catalog", "page"); revalidatePath("/dashboard/customers", "page");
    return { success: true };
}

export async function deleteCustomer(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting customer:", error);
        return { error: "Failed to delete customer" };
    }

    revalidatePath("/dashboard/catalog", "page"); revalidatePath("/dashboard/customers", "page");
    return { success: true };
}

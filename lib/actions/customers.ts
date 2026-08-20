"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Customer } from "@/types";
import { getStores } from "@/lib/actions/profile";

export async function getCustomers(storeId?: string) {
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

    let query = supabase
        .from("customers")
        .select("*")
        .eq("store_id", targetStoreId)
        .order("created_at", { ascending: false });

    let { data: customers, error } = await query;

    if (error || !customers) {
        return [];
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

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = data.store_id || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    if (!targetStoreId || !validStoreIds.includes(targetStoreId)) {
        return { error: "Store not found or access denied" };
    }

    const { data: customer, error } = await supabase
        .from("customers")
        .insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            tax_id: data.tax_id,
            store_id: targetStoreId,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating customer:", error);
        return { error: "Failed to create customer" };
    }

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/bills");
    return { success: true, customer };
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: existing } = await supabase.from("customers").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    const { data: customer, error } = await supabase
        .from("customers")
        .update({
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            tax_id: data.tax_id,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating customer:", error);
        return { error: "Failed to update customer" };
    }

    revalidatePath("/dashboard/customers");
    return { success: true, customer };
}

export async function deleteCustomer(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: existing } = await supabase.from("customers").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting customer:", error);
        return { error: "Failed to delete customer" };
    }

    revalidatePath("/dashboard/customers");
    return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Customer } from "@/types";

export async function getCustomers() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: customers, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching customers:", error);
        return [];
    }

    return customers;
}

export async function createCustomer(data: Partial<Customer>) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { error } = await supabase.from("customers").insert({
        ...data,
        user_id: user.id,
        updated_at: new Date().toISOString(),
    });

    if (error) {
        console.error("Error creating customer:", error);
        return { error: "Failed to create customer" };
    }

    revalidatePath("/dashboard/customers");
    return { success: true };
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
    const cookieStore = cookies();
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

    revalidatePath("/dashboard/customers");
    return { success: true };
}

export async function deleteCustomer(id: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

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

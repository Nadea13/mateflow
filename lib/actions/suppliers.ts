"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Supplier } from "@/types";

export async function getSuppliers() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: suppliers, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching suppliers:", error);
        return [];
    }

    return suppliers as Supplier[];
}

export async function createSupplier(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data: supplier, error } = await supabase
        .from("suppliers")
        .insert({
            user_id: user.id,
            ...data,
        })
        .select()
        .single();

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
        .update(data)
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

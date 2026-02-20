"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Expense } from "@/types";

export async function getExpenses() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: expenses, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

    if (error) {
        console.error("Error fetching expenses:", error);
        return [];
    }

    return expenses;
}

export async function createExpense(data: {
    title: string;
    amount: number;
    category: string;
    description?: string;
    date: string;
    receipt_url?: string;
}) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("expenses")
        .insert({
            user_id: user.id,
            ...data,
        });

    if (error) {
        console.error("Error creating expense:", error);
        return { error: "Failed to create expense" };
    }

    revalidatePath("/dashboard/expenses");
    return { success: true };
}

export async function deleteExpense(id: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting expense:", error);
        return { error: "Failed to delete expense" };
    }

    revalidatePath("/dashboard/expenses");
    return { success: true };
}

export async function uploadReceipt(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const file = formData.get("receipt") as File;
    if (!file) return { error: "No file provided" };

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file);

    if (uploadError) {
        console.error("Error uploading receipt:", uploadError);
        return { error: "Failed to upload receipt" };
    }

    const { data: { publicUrl } } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);

    return { success: true, receipt_url: publicUrl };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Bill, BillItem } from "@/types";

export async function getBills() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: bills, error } = await supabase
        .from("bills")
        .select(`
            *,
            customers ( name )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching bills:", error);
        return [];
    }

    return bills.map((bill: any) => ({
        ...bill,
        customer_name: bill.customers?.name || "Unknown",
    }));
}

export async function getBill(id: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Fetch bill
    const { data: bill, error: billError } = await supabase
        .from("bills")
        .select("*")
        .eq("id", id)
        .single();

    if (billError || !bill) {
        console.error("Error fetching bill:", JSON.stringify(billError));
        return null;
    }

    // Fetch customer name
    let customer_name = "Unknown";
    if (bill.customer_id) {
        const { data: customer } = await supabase
            .from("customers")
            .select("name")
            .eq("id", bill.customer_id)
            .single();
        if (customer) customer_name = customer.name;
    }

    // Fetch bill items
    const { data: items } = await supabase
        .from("bill_items")
        .select("*")
        .eq("bill_id", id);

    return {
        ...bill,
        customer_name,
        items: items || [],
    };
}

interface CreateBillInput {
    customer_id: string;
    note?: string;
    items: {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
    }[];
    adjustments?: {
        label: string;
        type: 'percent' | 'fixed';
        value: number;
    }[];
    payment_terms?: number;
    validity_days?: number;
}

export async function createBill(data: CreateBillInput) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Calculate subtotal
    const subtotal = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price, 0
    );

    // Apply adjustments (discounts/taxes)
    let total_amount = subtotal;
    if (data.adjustments && data.adjustments.length > 0) {
        for (const adj of data.adjustments) {
            if (adj.type === 'percent') {
                total_amount += (subtotal * adj.value) / 100;
            } else {
                total_amount += adj.value;
            }
        }
    }
    total_amount = Math.max(0, Math.round(total_amount * 100) / 100);

    // 1. Create bill
    const { data: bill, error: billError } = await supabase
        .from("bills")
        .insert({
            user_id: user.id,
            customer_id: data.customer_id,
            total_amount,
            note: data.note || null,
            status: "draft",
            adjustments: data.adjustments || [],
            payment_terms: data.payment_terms || 0,
            validity_days: data.validity_days || 7,
        })
        .select()
        .single();

    if (billError) {
        console.error("Error creating bill:", billError);
        return { error: "Failed to create bill" };
    }

    // 2. Create bill items
    const billItems = data.items.map(item => ({
        bill_id: bill.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
        .from("bill_items")
        .insert(billItems);

    if (itemsError) {
        console.error("Error creating bill items:", itemsError);
        // Rollback bill
        await supabase.from("bills").delete().eq("id", bill.id);
        return { error: "Failed to create bill items" };
    }

    // 3. Deduct stock for each item
    for (const item of data.items) {
        const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();

        if (product) {
            const newStock = Math.max(0, (product.stock || 0) - item.quantity);
            await supabase
                .from("products")
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq("id", item.product_id);
        }
    }

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard/products");
    return { success: true, bill };
}

export async function updateBillStatus(id: string, status: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("bills")
        .update({ status })
        .eq("id", id);

    if (error) {
        console.error("Error updating bill status:", error);
        return { error: "Failed to update bill status" };
    }

    revalidatePath("/dashboard/bills");
    return { success: true };
}

export async function deleteBill(id: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("bills")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting bill:", error);
        return { error: "Failed to delete bill" };
    }

    revalidatePath("/dashboard/bills");
    return { success: true };
}

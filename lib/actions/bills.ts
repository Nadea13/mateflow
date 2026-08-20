"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Bill, BillItem } from "@/types";

export async function getBills(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const targetStoreId = storeId || cookieStore.get("active_store_id")?.value;

    let query = supabase.from("bills").select(`
        *,
        customers ( name ),
        items:bill_items ( * )
    `).order("created_at", { ascending: false });

    if (targetStoreId) {
        query = query.eq("store_id", targetStoreId);
    }

    let { data: bills, error } = await query;

    if (error || !bills) {
        const fallback = await supabase
            .from("bills")
            .select(`*, customers ( name ), items:bill_items ( * )`)
            .order("created_at", { ascending: false });
        bills = fallback.data || [];
    }

    return (bills || []).map((bill: any) => ({
        ...bill,
        customer_name: bill.customers?.name || "Unknown",
        items: bill.items || [],
    }));
}

export async function getBill(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch bill with bill items
    const { data: bill, error: billError } = await supabase
        .from("bills")
        .select(`
            *,
            items:bill_items ( * )
        `)
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

    return {
        ...bill,
        customer_name,
        items: bill.items || [],
    };
}

export async function createBill(data: {
    customer_id?: string;
    items: {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
    }[];
    note?: string;
    adjustments?: { label: string; type: "percent" | "fixed"; value: number }[];
    payment_terms?: number;
    validity_days?: number;
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

    if (!data.items || data.items.length === 0) {
        return { error: "At least one item is required" };
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

    // 1. Create bill with store_id (or fallback user_id)
    const billPayload: any = {
        store_id: targetStoreId || user.id,
        customer_id: data.customer_id,
        total_amount,
        note: data.note || null,
        status: "draft",
        adjustments: data.adjustments || [],
        payment_terms: data.payment_terms || 0,
        validity_days: data.validity_days || 7,
    };

    let { data: bill, error: billError } = await supabase
        .from("bills")
        .insert(billPayload)
        .select()
        .single();

    if (billError && (billError.code === "PGRST204" || billError.message?.includes("store_id"))) {
        delete billPayload.store_id;
        billPayload.user_id = user.id;
        const retryRes = await supabase.from("bills").insert(billPayload).select().single();
        bill = retryRes.data;
        billError = retryRes.error;
    }

    if (billError || !bill) {
        console.error("Error creating bill:", billError);
        return { error: "Failed to create bill" };
    }

    // 2. Create bill items with exact product names
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
        return { error: "Failed to create bill items" };
    }

    // 3. Deduct stock for each product
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
    revalidatePath("/dashboard/catalog");
    return { success: true, billId: bill.id };
}

export async function updateBillStatus(id: string, status: "draft" | "paid" | "cancelled") {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("bills")
        .update({ status })
        .eq("id", id);

    if (error) {
        console.error("Error updating bill status:", error);
        return { error: "Failed to update status" };
    }

    revalidatePath("/dashboard/bills");
    return { success: true };
}

export async function deleteBill(id: string) {
    const cookieStore = await cookies();
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

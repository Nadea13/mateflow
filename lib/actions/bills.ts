"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Bill } from "@/types";
import { getStores } from "@/lib/actions/profile";

export async function getBills(storeId?: string) {
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
        .from("bills")
        .select(`
            *,
            customer:customers(name),
            items:bill_items (*)
        `)
        .eq("store_id", targetStoreId)
        .order("created_at", { ascending: false });

    let { data: bills, error } = await query;

    if (error || !bills) {
        return [];
    }

    return bills.map((b: any) => ({
        ...b,
        customer_name: b.customer?.name || "Guest",
        items: b.items || [],
    })) as Bill[];
}

export async function getBill(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: bill, error } = await supabase
        .from("bills")
        .select(`
            *,
            items:bill_items (*)
        `)
        .eq("id", id)
        .single();

    if (error || !bill || !validStoreIds.includes(bill.store_id)) {
        return null;
    }

    let customer_name = "Guest";
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
    status?: "quotation" | "draft" | "paid";
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

    // 1. Create bill strictly for targetStoreId
    const billPayload: any = {
        store_id: targetStoreId,
        customer_id: data.customer_id,
        total_amount,
        note: data.note || null,
        status: data.status || "quotation",
        adjustments: data.adjustments || [],
        payment_terms: data.payment_terms || 0,
        validity_days: data.validity_days || 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    let { data: bill, error: billError } = await supabase
        .from("bills")
        .insert(billPayload)
        .select()
        .single();

    if (billError || !bill) {
        console.error("Error creating bill:", billError);
        return { error: billError?.message || "Failed to create bill" };
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

    // 3. Deduct stock only if not purely quotation or when created directly as paid/draft
    for (const item of data.items) {
        const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .eq("store_id", targetStoreId)
            .single();

        if (product) {
            const newStock = Math.max(0, (product.stock || 0) - item.quantity);
            await supabase
                .from("products")
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq("id", item.product_id)
                .eq("store_id", targetStoreId);
        }
    }

    revalidatePath("/dashboard/bills");
    revalidatePath("/dashboard/catalog");
    revalidatePath("/dashboard/inventory");
    return { success: true, billId: bill.id };
}

export async function updateBillStatus(id: string, status: "quotation" | "draft" | "paid" | "cancelled") {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: existing } = await supabase.from("bills").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    const updatePayload: any = {
        status,
        updated_at: new Date().toISOString(),
    };

    // When transitioning to draft (ใบแจ้งหนี้), update created_at to the moment invoice was officially issued
    if (status === "draft") {
        updatePayload.created_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from("bills")
        .update(updatePayload)
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: existing } = await supabase.from("bills").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    // 1. Delete items first
    await supabase.from("bill_items").delete().eq("bill_id", id);

    // 2. Delete the bill
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

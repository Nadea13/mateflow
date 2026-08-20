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

    return bills.map((b: any) => {
        let displayStatus = b.status;
        if (b.status === "draft") {
            const hasQuoteTag = b.adjustments?.some((a: any) => a.label === "__is_quotation__");
            if (hasQuoteTag) {
                displayStatus = "quotation";
            }
        }
        return {
            ...b,
            status: displayStatus,
            customer_name: b.customer?.name || "Guest",
            items: b.items || [],
        };
    }) as Bill[];
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

    let displayStatus = bill.status;
    if (bill.status === "draft") {
        const hasQuoteTag = bill.adjustments?.some((a: any) => a.label === "__is_quotation__");
        if (hasQuoteTag) {
            displayStatus = "quotation";
        }
    }

    return {
        ...bill,
        status: displayStatus,
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
            if (adj.label === "__is_quotation__") continue;
            if (adj.type === 'percent') {
                total_amount += (subtotal * adj.value) / 100;
            } else {
                total_amount += adj.value;
            }
        }
    }
    total_amount = Math.max(0, Math.round(total_amount * 100) / 100);

    const isQuotation = data.status === "quotation";
    const finalAdjustments = [...(data.adjustments || [])];
    if (isQuotation) {
        finalAdjustments.push({ label: "__is_quotation__", type: "fixed", value: 0 });
    }

    // 1. Try inserting directly with status "quotation" or "draft"
    let dbStatus = isQuotation ? "quotation" : (data.status || "draft");
    let billPayload: any = {
        store_id: targetStoreId,
        customer_id: data.customer_id,
        total_amount,
        note: data.note || null,
        status: dbStatus,
        adjustments: finalAdjustments,
        payment_terms: data.payment_terms || 0,
        validity_days: data.validity_days || 7,
    };

    let { data: bill, error: billError } = await supabase
        .from("bills")
        .insert(billPayload)
        .select()
        .single();

    // Fallback: If DB check constraint only accepts ('draft', 'paid', 'cancelled')
    if (billError && (billError.message?.includes("bills_status_check") || billError.code === "23514")) {
        billPayload.status = "draft";
        const retryRes = await supabase.from("bills").insert(billPayload).select().single();
        bill = retryRes.data;
        billError = retryRes.error;
    }

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

    // 3. Deduct stock for each product belonging to this store
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
                .update({ stock: newStock })
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

    const { data: existing } = await supabase.from("bills").select("store_id, adjustments").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    let nextAdjustments = (existing.adjustments || []).filter((a: any) => a.label !== "__is_quotation__");
    let dbStatus = status;

    if (status === "quotation") {
        nextAdjustments.push({ label: "__is_quotation__", type: "fixed", value: 0 });
        dbStatus = "draft";
    }

    const updatePayload: any = {
        status: dbStatus === "quotation" ? "draft" : dbStatus,
        adjustments: nextAdjustments,
    };

    // When transitioning to draft (ใบแจ้งหนี้), update created_at to current timestamp
    if (status === "draft") {
        updatePayload.created_at = new Date().toISOString();
    }

    let { error } = await supabase
        .from("bills")
        .update(updatePayload)
        .eq("id", id);

    // If direct status failed constraint, fallback to draft with tag
    if (error && (error.message?.includes("bills_status_check") || error.code === "23514")) {
        updatePayload.status = status === "paid" ? "paid" : status === "cancelled" ? "cancelled" : "draft";
        const retryRes = await supabase.from("bills").update(updatePayload).eq("id", id);
        error = retryRes.error;
    }

    if (error) {
        console.error("Error updating bill status:", error);
        return { error: error.message || "Failed to update status" };
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

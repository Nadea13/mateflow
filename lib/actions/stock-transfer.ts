"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface StockTransferItemInput {
    product_id: string;
    quantity: number;
}

export interface CreateStockTransferInput {
    from_branch_id: string;
    to_branch_id: string;
    notes?: string;
    items: StockTransferItemInput[];
    store_id?: string;
}

export async function getStockTransfers(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const targetStoreId = storeId || cookieStore.get("active_store_id")?.value;

    let query = supabase.from("stock_transfers").select(`
        *,
        from_branch:branchs!stock_transfers_from_branch_id_fkey ( name, code ),
        to_branch:branchs!stock_transfers_to_branch_id_fkey ( name, code ),
        items:stock_transfer_items (
            *,
            product:products ( name, sku )
        )
    `).order("created_at", { ascending: false });

    if (targetStoreId) {
        query = query.eq("store_id", targetStoreId);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching stock transfers:", error);
        return [];
    }

    return data || [];
}

export async function createStockTransfer(data: CreateStockTransferInput) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    if (data.from_branch_id === data.to_branch_id) {
        return { error: "สาขาต้นทางและสาขาปลายทางต้องไม่เป็นสาขาเดียวกัน" };
    }

    if (!data.items || data.items.length === 0) {
        return { error: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการเพื่อโอนย้าย" };
    }

    let targetStoreId = data.store_id || cookieStore.get("active_store_id")?.value;
    if (!targetStoreId) {
        const { data: store } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true })
            .maybeSingle();
        targetStoreId = store?.id;
    }

    if (!targetStoreId) return { error: "ไม่พบร้านค้าที่กำลังใช้งาน" };

    const transferNumber = `TR-${Date.now().toString().slice(-6)}`;

    // 1. Create Transfer Record
    const { data: transfer, error: transferErr } = await supabase
        .from("stock_transfers")
        .insert({
            store_id: targetStoreId,
            transfer_number: transferNumber,
            from_branch_id: data.from_branch_id,
            to_branch_id: data.to_branch_id,
            status: "completed",
            notes: data.notes || null,
            created_by: user.id,
        })
        .select()
        .single();

    if (transferErr || !transfer) {
        console.error("Error creating stock transfer:", transferErr);
        return { error: transferErr?.message || "Failed to create transfer record" };
    }

    // 2. Create Transfer Items
    const itemsPayload = data.items.map(item => ({
        transfer_id: transfer.id,
        product_id: item.product_id,
        quantity: item.quantity,
    }));

    const { error: itemsErr } = await supabase
        .from("stock_transfer_items")
        .insert(itemsPayload);

    if (itemsErr) {
        console.error("Error creating transfer items:", itemsErr);
        return { error: "Failed to record transfer items" };
    }

    // 3. Update inventory levels between branches
    for (const item of data.items) {
        // Decrease quantity at source branch
        const { data: sourceLvl } = await supabase
            .from("inventory_levels")
            .select("quantity")
            .eq("location_id", data.from_branch_id)
            .eq("product_id", item.product_id)
            .maybeSingle();

        if (sourceLvl) {
            await supabase
                .from("inventory_levels")
                .update({
                    quantity: Math.max(0, sourceLvl.quantity - item.quantity),
                    updated_at: new Date().toISOString(),
                })
                .eq("location_id", data.from_branch_id)
                .eq("product_id", item.product_id);
        }

        // Increase quantity at destination branch
        const { data: destLvl } = await supabase
            .from("inventory_levels")
            .select("quantity")
            .eq("location_id", data.to_branch_id)
            .eq("product_id", item.product_id)
            .maybeSingle();

        if (destLvl) {
            await supabase
                .from("inventory_levels")
                .update({
                    quantity: destLvl.quantity + item.quantity,
                    updated_at: new Date().toISOString(),
                })
                .eq("location_id", data.to_branch_id)
                .eq("product_id", item.product_id);
        } else {
            await supabase
                .from("inventory_levels")
                .insert({
                    store_id: targetStoreId,
                    location_id: data.to_branch_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                });
        }
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/catalog");
    return { success: true, transfer_number: transferNumber };
}

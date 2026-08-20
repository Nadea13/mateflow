"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PurchaseOrder, POItem } from "@/types";

export async function getPurchaseOrders() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: pos, error } = await supabase
        .from("purchase_orders")
        .select(`
            *,
            suppliers ( name )
        `)
        .order("date", { ascending: false });

    if (error) {
        console.error("Error fetching purchase orders:", error);
        return [];
    }

    return pos.map((po: any) => ({
        ...po,
        supplier_name: po.suppliers?.name || "Unknown",
    })) as PurchaseOrder[];
}

export async function getPurchaseOrder(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: po, error } = await supabase
        .from("purchase_orders")
        .select(`
            *,
            suppliers ( name ),
            po_items ( * )
        `)
        .eq("id", id)
        .single();

    if (error || !po) {
        console.error("Error fetching purchase order:", error);
        return null;
    }

    return {
        ...po,
        supplier_name: po.suppliers?.name || "Unknown",
        items: po.po_items || [],
    } as PurchaseOrder;
}

interface CreatePOInput {
    supplier_id: string;
    po_number: string;
    date: string;
    note?: string;
    items: {
        name: string;
        quantity: number;
        unit_price: number;
        save_as_product?: boolean;
    }[];
}

export async function createPurchaseOrder(data: CreatePOInput) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const total_amount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price, 0
    );

    // 1. Create PO
    const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
            user_id: user.id,
            supplier_id: data.supplier_id,
            po_number: data.po_number,
            date: data.date,
            total_amount,
            note: data.note || null,
            status: "draft",
        })
        .select()
        .single();

    if (poError) {
        console.error("Error creating purchase order:", poError);
        return { error: "Failed to create purchase order" };
    }

    // 2. Create PO items
    const poItems = data.items.map(item => ({
        po_id: po.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
        .from("po_items")
        .insert(poItems);

    if (itemsError) {
        console.error("Error creating PO items:", itemsError);
        // Rollback PO
        await supabase.from("purchase_orders").delete().eq("id", po.id);
        return { error: "Failed to create items" };
    }

    // 3. Create products if requested
    const productsToCreate = data.items.filter(item => item.save_as_product).map(item => ({
        user_id: user.id,
        name: item.name,
        price: item.unit_price,
        stock: item.quantity,
    }));

    if (productsToCreate.length > 0) {
        const { error: productsError } = await supabase
            .from("products")
            .insert(productsToCreate);
        if (productsError) {
            console.error("Error creating products from PO:", productsError);
        }
    }

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/catalog");
    return { success: true, po: po as PurchaseOrder };
}

export async function updatePOStatus(id: string, status: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("purchase_orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        console.error("Error updating PO status:", error);
        return { error: "Failed to update PO status" };
    }

    if (status === 'received') {
        const po = await getPurchaseOrder(id);
        if (po) {
            const expenseData = {
                title: `PO: ${po.po_number} - ${po.supplier_name}`,
                amount: po.total_amount,
                category: "Purchase Orders",
                description: `Payment for Purchase Order ${po.po_number}`,
                date: new Date().toISOString(),
            };

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error: expenseError } = await supabase
                    .from("expenses")
                    .insert({
                        user_id: user.id,
                        ...expenseData,
                    });
                if (expenseError) {
                    console.error("Error creating expense from PO:", expenseError);
                }
            }
        }
    }

    revalidatePath("/dashboard/expenses");
    return { success: true };
}

export async function deletePurchaseOrder(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting purchase order:", error);
        return { error: "Failed to delete purchase order" };
    }

    revalidatePath("/dashboard/expenses");
    return { success: true };
}

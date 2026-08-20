"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Product } from "@/types";
import { getStores } from "@/lib/actions/profile";

export async function getProducts(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = storeId || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    let query = supabase
        .from("products")
        .select(`
            *,
            variants:product_variants(*),
            supplier:suppliers(name)
        `);

    if (targetStoreId) {
        query = query.eq("store_id", targetStoreId);
    } else if (validStoreIds.length > 0) {
        query = query.in("store_id", validStoreIds);
    }

    let { data: products, error } = await query.order("name", { ascending: true });

    if (error || !products || products.length === 0) {
        // Fallback: If no products found under specific store, fetch from all user stores
        if (validStoreIds.length > 0) {
            const { data: storeProds } = await supabase
                .from("products")
                .select(`
                    *,
                    variants:product_variants(*),
                    supplier:suppliers(name)
                `)
                .in("store_id", validStoreIds)
                .order("name", { ascending: true });

            if (storeProds && storeProds.length > 0) {
                products = storeProds;
            }
        }
    }

    return (products || []).map((p: any) => ({
        ...p,
        supplier_name: p.supplier?.name || undefined,
    })) as Product[];
}

export async function createProduct(data: Partial<Product>) {
    console.log("Creating product with data:", data);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("Unauthorized create attempt");
        return { error: "Unauthorized" };
    }

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    if (validStoreIds.length === 0) {
        return { error: "No active store found. Please create a store first." };
    }

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = data.store_id || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    if (!targetStoreId || !validStoreIds.includes(targetStoreId)) {
        return { error: "Invalid store access" };
    }

    const costPrice = Number(data.cost_price) || 0;
    const initialStock = Number(data.stock) || 0;

    const payload: any = {
        name: data.name,
        sku: data.sku || null,
        barcode: data.barcode || null,
        price: Number(data.price) || 0,
        cost_price: costPrice,
        stock: initialStock,
        image_url: data.image_url || null,
        min_stock_level: Number(data.min_stock_level) || 0,
        supplier_id: data.supplier_id || null,
        store_id: targetStoreId,
        updated_at: new Date().toISOString(),
    };

    let { data: createdProduct, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error("Error creating product:", error);
        return { error: error.message || "Failed to create product" };
    }

    // 💰 Auto-record Expense (ต้นทุนสินค้า x จำนวน Stock ลงในรายการค่าใช้จ่าย COGS)
    if (costPrice > 0 && initialStock > 0) {
        const totalCostAmount = costPrice * initialStock;

        // Fetch supplier name if available
        let supplierName = "";
        if (data.supplier_id) {
            const { data: sup } = await supabase
                .from("suppliers")
                .select("name")
                .eq("id", data.supplier_id)
                .single();
            if (sup) supplierName = sup.name;
        }

        const expensePayload: any = {
            store_id: targetStoreId,
            title: `ต้นทุนสินค้า: ${data.name || "สินค้าใหม่"} (จำนวน ${initialStock.toLocaleString()} ชิ้น @ ฿${costPrice.toLocaleString()})`,
            category: "cogs", // Cost of Goods Sold
            amount: totalCostAmount,
            date: new Date().toISOString().split("T")[0],
            notes: `บันทึกต้นทุนอัตโนมัติจากการเพิ่มสินค้าเข้าคลัง (SKU: ${data.sku || "-"})`,
            supplier_id: data.supplier_id || null,
            supplier_name: supplierName || null,
        };

        const { error: expenseErr } = await supabase
            .from("expenses")
            .insert(expensePayload);

        if (expenseErr) {
            console.warn("Auto expense insertion notice:", expenseErr.message);
        }
    }

    revalidatePath("/dashboard/catalog", "page"); 
    revalidatePath("/dashboard/products", "page");
    revalidatePath("/dashboard/inventory", "page");
    revalidatePath("/dashboard/expenses", "page");
    return { success: true, isUpdate: false, product: createdProduct as Product, message: "Product created successfully" };
}

export async function createOrUpdateProduct(data: Partial<Product>) {
    return createProduct(data);
}

export async function updateProduct(id: string, data: Partial<Product>) {
    console.log(`Updating product ${id} with data:`, data);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    // Verify ownership of the product
    const { data: existing } = await supabase.from("products").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    const payload = {
        ...data,
        updated_at: new Date().toISOString(),
        price: data.price !== undefined ? Number(data.price) : undefined,
        cost_price: data.cost_price !== undefined ? Number(data.cost_price) : undefined,
        stock: data.stock !== undefined ? Number(data.stock) : undefined,
    };

    const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id);

    if (error) {
        console.error("Error updating product:", error);
        return { error: "Failed to update product" };
    }

    revalidatePath("/dashboard/catalog", "page");
    revalidatePath("/dashboard/products", "page");
    revalidatePath("/dashboard/inventory", "page");
    return { success: true, isUpdate: true, message: "Product updated successfully" };
}

export async function deleteProduct(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { data: existing } = await supabase.from("products").select("store_id").eq("id", id).single();
    if (!existing || !validStoreIds.includes(existing.store_id)) {
        return { error: "Access denied" };
    }

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
        console.error("Error deleting product:", error);
        return { error: "Failed to delete product" };
    }

    revalidatePath("/dashboard/catalog", "page");
    revalidatePath("/dashboard/products", "page");
    revalidatePath("/dashboard/inventory", "page");
    return { success: true };
}

export async function deleteProductByName(name: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { error } = await supabase
        .from("products")
        .delete()
        .in("store_id", validStoreIds)
        .ilike("name", `%${name}%`);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/catalog");
    return { success: true };
}

export async function updateProductByName(name: string, data: Partial<Product>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const { error } = await supabase
        .from("products")
        .update(data)
        .in("store_id", validStoreIds)
        .ilike("name", `%${name}%`);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/catalog");
    return { success: true };
}

export async function importProducts(formData: FormData | string) {
    try {
        let content = "";
        if (typeof formData === "string") {
            content = formData;
        } else {
            const file = formData.get("file") as File;
            if (!file) {
                return { success: false, error: "No file provided", count: 0 };
            }
            content = await file.text();
        }

        const lines = content.trim().split("\n");
        if (lines.length < 2) return { success: false, error: "File is empty or invalid format", count: 0 };

        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const [name, sku, price, cost_price, stock] = line.split(",");
            if (name && price) {
                await createProduct({
                    name: name.trim(),
                    sku: sku?.trim() || undefined,
                    price: parseFloat(price.trim()) || 0,
                    cost_price: cost_price ? parseFloat(cost_price.trim()) : undefined,
                    stock: stock ? parseInt(stock.trim()) : 0,
                });
                count++;
            }
        }

        return { success: true, message: `Successfully imported ${count} products`, count };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to import products", count: 0 };
    }
}

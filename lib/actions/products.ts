"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Product } from "@/types";
import { getStores } from "@/lib/actions/profile";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function getProducts(storeId?: string) {
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

    // Strictly fetch products belonging to this active store
    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", targetStoreId)
        .order("created_at", { ascending: false });

    if (error || !products) {
        return [];
    }

    return products;
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
        return { error: "No active store found" };
    }

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = data.store_id || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    if (!targetStoreId || !validStoreIds.includes(targetStoreId)) {
        return { error: "Invalid store access" };
    }

    const payload: any = {
        ...data,
        updated_at: new Date().toISOString(),
        price: Number(data.price),
        stock: Number(data.stock),
        store_id: targetStoreId,
    };

    let { error } = await supabase.from("products").insert(payload);

    if (error) {
        console.error("Error creating product:", error);
        return { error: error.message || "Failed to create product" };
    }

    console.log("Product created successfully, revalidating path");
    revalidatePath("/dashboard/catalog", "page"); 
    revalidatePath("/dashboard/products", "page");
    revalidatePath("/dashboard/inventory", "page");
    return { success: true, isUpdate: false, product: data as Product, message: "Product created successfully" };
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

    const updates = {
        ...data,
        updated_at: new Date().toISOString(),
        ...(data.price !== undefined && { price: Number(data.price) }),
        ...(data.stock !== undefined && { stock: Number(data.stock) }),
    };

    const { error } = await supabase
        .from("products")
        .update(updates)
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

export async function updateProductByName(name: string, data: Partial<Product>) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.from("products").update(data).ilike("name", `%${name}%`);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/catalog", "page");
    return { success: true };
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

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

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
    const { error } = await supabase.from("products").delete().ilike("name", `%${name}%`);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/catalog", "page");
    return { success: true };
}

export async function importProducts(formData: FormData) {
    const { importProducts: importHandler } = await import("./import");
    return importHandler(formData);
}

export async function extractProductFromImage(formData: FormData) {
    try {
        const file = formData.get("image") as File;
        if (!file) {
            return { error: "No image provided" };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING, description: "Product name" },
                        price: { type: SchemaType.NUMBER, description: "Selling price" },
                        cost_price: { type: SchemaType.NUMBER, description: "Cost price if available" },
                        stock: { type: SchemaType.INTEGER, description: "Estimated stock quantity" },
                        barcode: { type: SchemaType.STRING, description: "Barcode / UPC / EAN if visible" },
                        sku: { type: SchemaType.STRING, description: "Suggested SKU code" },
                    },
                    required: ["name"],
                },
            },
        });

        const prompt = "Extract product details from this image. Look for product name, price tags, barcodes, SKU, and approximate stock count if applicable.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type,
                },
            },
        ]);

        const responseText = result.response.text();
        const extractedData = JSON.parse(responseText);

        return { success: true, data: extractedData };
    } catch (error: any) {
        console.error("Gemini Vision Product Extraction Error:", error);
        return { error: error.message || "Failed to extract product details" };
    }
}

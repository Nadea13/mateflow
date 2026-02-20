"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Product } from "@/types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function getProducts() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching products:", error);
        return [];
    }

    return products;
}

export async function createProduct(data: Partial<Product>) {
    console.log("Creating product with data:", data);
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("Unauthorized create attempt");
        return { error: "Unauthorized" };
    }

    const { error } = await supabase.from("products").insert({
        ...data,
        updated_at: new Date().toISOString(),
        price: Number(data.price),
        stock: Number(data.stock),
        user_id: user.id
    });

    if (error) {
        console.error("Error creating product:", error);
        return { error: "Failed to create product" };
    }

    console.log("Product created successfully, revalidating path");
    revalidatePath("/dashboard/products", "page");
    return { success: true, isUpdate: false, product: data as Product, message: "Product created successfully" };
}

export async function updateProduct(id: string, data: Partial<Product>) {
    console.log(`Updating product ${id} with data:`, data);
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const updates = {
        ...data,
        updated_at: new Date().toISOString(),
        ...(data.price !== undefined && { price: Number(data.price) }),
        ...(data.stock !== undefined && { stock: Number(data.stock) }),
    };

    console.log("Computed updates:", updates);

    const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);

    if (error) {
        console.error("Error updating product:", error);
        return { error: "Failed to update product" };
    }

    console.log("Product updated successfully, revalidating path");
    revalidatePath("/dashboard/products", "page");
    return { success: true };
}

export async function deleteProduct(id: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting product:", error);
        return { error: "Failed to delete product" };
    }

    revalidatePath("/dashboard/products");
    return { success: true };
}


export async function createOrUpdateProduct(data: Partial<Product>) {
    console.log("Creating or updating product with data:", data);
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("Unauthorized create attempt");
        return { error: "Unauthorized" };
    }

    if (!data.name) {
        return { error: "Product name is required" };
    }

    // 1. Check for existing product (case-insensitive) - manual filtering to be safe
    const { data: existingProducts, error: searchError } = await supabase
        .from("products")
        .select("*")
        .ilike("name", data.name);

    if (searchError) {
        console.error("Error searching for product:", searchError);
        return { error: "Failed to search for product" };
    }

    // specific check to confirm exact name match
    const existingProduct = existingProducts?.find(
        (p) => p.name.toLowerCase() === data.name?.toLowerCase()
    );

    if (existingProduct) {
        // 2. Update existing product
        console.log(`Found existing product: ${existingProduct.name} (ID: ${existingProduct.id})`);

        const currentStock = Number(existingProduct.stock) || 0;
        const additionalStock = Number(data.stock) || 0;
        const newStock = currentStock + additionalStock;

        const updates: any = {
            stock: newStock,
            updated_at: new Date().toISOString(),
        };

        // Update price if provided
        if (data.price !== undefined) {
            updates.price = Number(data.price);
        }

        const { error: updateError } = await supabase
            .from("products")
            .update(updates)
            .eq("id", existingProduct.id);

        if (updateError) {
            console.error("Error updating existing product:", updateError);
            return { error: "Failed to update existing product" };
        }

        revalidatePath("/dashboard/products", "page");
        return {
            success: true,
            message: `Updated existing product "${existingProduct.name}". Stock increased from ${currentStock} to ${newStock}.`,
            isUpdate: true,
            product: { ...existingProduct, ...updates }
        };

    } else {
        // 3. Create new product
        console.log("Product not found, creating new one");
        return await createProduct(data);
    }
}

export async function deleteProductByName(name: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .ilike("name", name);

    const product = products?.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (!product) {
        return { error: `Product "${name}" not found.` };
    }

    return await deleteProduct(product.id);
}

export async function updateProductByName(name: string, updates: { name?: string, price?: number, stock?: number }) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .ilike("name", name);

    const product = products?.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (!product) {
        return { error: `Product "${name}" not found.` };
    }

    // Convert string inputs to numbers if necessary (though type suggests numbers, AI might pass strings)
    const sanitizedUpdates: any = { ...updates };
    if (updates.price !== undefined) sanitizedUpdates.price = Number(updates.price);
    if (updates.stock !== undefined) sanitizedUpdates.stock = Number(updates.stock);

    return await updateProduct(product.id, sanitizedUpdates);
}

export async function importProducts(formData: FormData) {
    const file = formData.get("file") as File;

    if (!file) {
        return { success: false, error: "No file uploaded" };
    }

    let successCount = 0;
    let errorCount = 0;

    // Handle Image Import
    if (file.type.startsWith("image/")) {
        console.log("Processing image import...");
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const model = genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: { type: SchemaType.STRING },
                                stock: { type: SchemaType.NUMBER },
                                price: { type: SchemaType.NUMBER },
                            },
                            required: ["name", "stock", "price"],
                        },
                    },
                },
            });

            const prompt = "Extract product data (Name, Stock, Price) from this image. Return a JSON array of objects.";
            const imagePart = {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type,
                },
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            console.log("Gemini extraction result:", text);
            const products = JSON.parse(text) as Array<{ name: string; stock: number; price: number }>;

            for (const p of products) {
                const productData: Partial<Product> = {
                    name: p.name,
                    stock: p.stock,
                    price: p.price,
                };

                const updateResult = await createOrUpdateProduct(productData);
                if (!updateResult.success) {
                    console.error(`Failed to import extracted item "${p.name}":`, (updateResult as any).error);
                    errorCount++;
                } else {
                    successCount++;
                }
            }

        } catch (error: any) {
            console.error("Image import failed:", error);
            return {
                success: false,
                error: `Image processing failed: ${error.message || "Unknown error"}`
            };
        }

    } else {
        // Handle CSV Import (Existing logic)
        console.log("Processing CSV import...");
        const text = await file.text();
        const lines = text.split("\n");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || (i === 0 && line.toLowerCase().startsWith("name"))) continue;

            const [name, stock, price] = line.split(",").map(s => s.trim());

            if (!name) continue;

            const productData: Partial<Product> = {
                name,
                stock: stock ? Number(stock) : 0,
                price: price ? Number(price) : 0,
            };

            const result = await createOrUpdateProduct(productData);
            if (!result.success) {
                console.error(`Failed to import line "${line}":`, (result as any).error);
                errorCount++;
            } else {
                successCount++;
            }
        }
    }

    revalidatePath("/dashboard/products");
    return {
        success: true,
        message: `Imported ${successCount} products successfully. ${errorCount > 0 ? `Failed to import ${errorCount} items.` : ""}`
    };
}


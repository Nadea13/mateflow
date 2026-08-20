"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',').map(item => item.trim());
        if (currentLine.length === headers.length) {
            const obj: Record<string, string> = {};
            headers.forEach((header, index) => {
                obj[header] = currentLine[index];
            });
            result.push(obj);
        }
    }
    return result;
}

export async function importCustomers(formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const file = formData.get("file") as File;

    if (!file) return { success: false, message: "No file provided", error: "No file provided" };

    try {
        const text = await file.text();
        const data = parseCSV(text);

        if (data.length === 0) return { success: false, message: "No data found in CSV", error: "No data found in CSV" };

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized", error: "Unauthorized" };

        const targetStoreId = cookieStore.get("active_store_id")?.value;

        const customers = data.map(row => ({
            store_id: targetStoreId || user.id,
            user_id: user.id,
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            address: row.address || null,
            line_id: row.line_id || null
        })).filter(c => c.name);

        let { error } = await supabase.from("customers").insert(customers);
        if (error) throw error;

        revalidatePath("/dashboard/customers");
        return { success: true, message: `Imported ${customers.length} customers successfully` };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to import customers", error: error.message || "Failed to import customers" };
    }
}

export async function importProducts(formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const file = formData.get("file") as File;

    if (!file) return { success: false, message: "No file provided", error: "No file provided" };

    try {
        const text = await file.text();
        const data = parseCSV(text);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized", error: "Unauthorized" };

        const targetStoreId = cookieStore.get("active_store_id")?.value;

        const products = data.map(row => ({
            store_id: targetStoreId || user.id,
            user_id: user.id,
            name: row.name,
            price: parseFloat(row.price) || 0,
            stock: parseInt(row.stock) || 0,
            description: row.description || null,
        })).filter(p => p.name);

        let { error } = await supabase.from("products").insert(products);
        if (error) throw error;

        revalidatePath("/dashboard/products");
        revalidatePath("/dashboard/catalog");
        return { success: true, message: `Imported ${products.length} products successfully` };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to import products", error: error.message || "Failed to import products" };
    }
}

export async function importExpenses(formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const file = formData.get("file") as File;

    if (!file) return { success: false, message: "No file provided", error: "No file provided" };

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized", error: "Unauthorized" };

        const targetStoreId = cookieStore.get("active_store_id")?.value;
        let data: any[] = [];

        if (file.type.startsWith("image/")) {
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
                                title: { type: SchemaType.STRING },
                                amount: { type: SchemaType.NUMBER },
                                category: { type: SchemaType.STRING },
                                date: { type: SchemaType.STRING },
                                description: { type: SchemaType.STRING },
                            },
                            required: ["title", "amount", "category"],
                        },
                    },
                },
            });

            const prompt = "Extract all line items or expense receipts found in this image. Format each item with a title, amount, category (e.g. Food, Transport, Supplies), and date if visible.";
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: buffer.toString("base64"), mimeType: file.type } },
            ]);
            data = JSON.parse(result.response.text());
        } else {
            const text = await file.text();
            data = parseCSV(text);
        }

        const expenses = data.map(row => ({
            store_id: targetStoreId || user.id,
            user_id: user.id,
            title: row.title || "Untitled Expense",
            amount: parseFloat(row.amount) || 0,
            category: row.category || "Uncategorized",
            date: row.date || new Date().toISOString(),
            description: row.description || null
        })).filter(e => e.amount > 0);

        let { error } = await supabase.from("expenses").insert(expenses);
        if (error) throw error;

        revalidatePath("/dashboard/expenses");
        return { success: true, message: `Imported ${expenses.length} expenses successfully` };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to import expenses", error: error.message || "Failed to import expenses" };
    }
}

export async function importBills(formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const file = formData.get("file") as File;

    if (!file) return { success: false, message: "No file provided", error: "No file provided" };

    try {
        const text = await file.text();
        const data = parseCSV(text);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized", error: "Unauthorized" };

        const targetStoreId = cookieStore.get("active_store_id")?.value;

        // Group rows into simple bills
        for (const row of data) {
            const billPayload: any = {
                store_id: targetStoreId || user.id,
                user_id: user.id,
                total_amount: parseFloat(row.total || row.amount) || 0,
                status: "draft",
                note: row.note || "Imported bill",
            };
            await supabase.from("bills").insert(billPayload);
        }

        revalidatePath("/dashboard/bills");
        return { success: true, message: `Imported ${data.length} bills successfully` };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to import bills", error: error.message || "Failed to import bills" };
    }
}

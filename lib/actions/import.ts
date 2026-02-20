"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

// Helper to parse CSV string
function parseCSV(csvText: string) {
    const lines = csvText.split(/\r\n|\n/);
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const obj: any = {};
        const currentline = lines[i].split(',');

        if (currentline.length <= 1 && currentline[0] === "") continue; // Skip empty lines

        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j]?.trim();
        }
        result.push(obj);
    }
    return result;
}

export async function importCustomers(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const file = formData.get("file") as File;

    if (!file) return { success: false, message: "No file provided" };

    try {
        const text = await file.text();
        const data = parseCSV(text);

        if (data.length === 0) return { success: false, message: "No data found in CSV" };

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized" };

        const customers = data.map(row => ({
            user_id: user.id,
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            address: row.address || null,
            line_id: row.line_id || null
        })).filter(c => c.name); // Ensure name exists

        const { error } = await supabase.from("customers").insert(customers);
        if (error) throw error;

        revalidatePath("/dashboard/customers");
        return { success: true, message: `Imported ${customers.length} customers successfully` };
    } catch (error: any) {
        console.error("Import Error:", error);
        return { success: false, message: error.message || "Failed to import customers" };
    }
}

export async function importProducts(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const file = formData.get("file") as File;

    if (!file) return { success: false, message: "No file provided" };

    try {
        const text = await file.text();
        const data = parseCSV(text);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized" };

        const products = data.map(row => ({
            user_id: user.id,
            name: row.name,
            price: parseFloat(row.price) || 0,
            stock: parseInt(row.stock) || 0,
            description: row.description || null,
            // category: row.category || null // Assuming category field exists or ignoring if not in schema yet
        })).filter(p => p.name);

        const { error } = await supabase.from("products").insert(products);

        if (error) throw error;

        revalidatePath("/dashboard/products");
        return { success: true, message: `Imported ${products.length} products successfully` };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to import products" };
    }
}

export async function importExpenses(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const file = formData.get("file") as File;

    if (!file) return { success: false, message: "No file provided" };

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized" };

        let data: any[] = [];

        if (file.type.startsWith("image/")) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
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
                            required: ["title", "amount"],
                        },
                    },
                },
            });

            const prompt = "Extract expense data (Title, Amount, Category, Date usually in YYYY-MM-DD, Description) from this image. Return a JSON array.";
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
            user_id: user.id,
            title: row.title || "Untitled Expense",
            amount: parseFloat(row.amount) || 0,
            category: row.category || "Uncategorized",
            date: row.date || new Date().toISOString(),
            description: row.description || null
        })).filter(e => e.amount > 0);

        const { error } = await supabase.from("expenses").insert(expenses);
        if (error) throw error;

        revalidatePath("/dashboard/expenses");
        return { success: true, message: `Imported ${expenses.length} expenses successfully` };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to import expenses" };
    }
}

export async function importBills(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const file = formData.get("file") as File;

    if (!file) return { success: false, message: "No file provided" };

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized" };

        let data: any[] = [];

        if (file.type.startsWith("image/")) {
            // For Bills, it's complex to extract everything from one image cleanly into this structure without more robust prompting, 
            // but let's try basic extraction of Total and Customer Name if visible.
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                customer_name: { type: SchemaType.STRING },
                                total_amount: { type: SchemaType.NUMBER },
                                date: { type: SchemaType.STRING },
                                status: { type: SchemaType.STRING },
                            },
                            required: ["total_amount"],
                        },
                    },
                },
            });

            const prompt = "Extract bill data (Customer Name, Total Amount, Date, Status) from this image. Return a JSON array.";
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: buffer.toString("base64"), mimeType: file.type } },
            ]);
            data = JSON.parse(result.response.text());
        } else {
            const text = await file.text();
            data = parseCSV(text);
        }

        let importedCount = 0;
        const errors: string[] = [];

        // Pre-fetch all customers to minimize queries
        const { data: existingCustomers } = await supabase
            .from("customers")
            .select("id, name");

        const customerMap = new Map(existingCustomers?.map(c => [c.name.toLowerCase(), c.id]));

        for (const row of data) {
            const customerName = row.customer_name?.trim();
            // If no customer name from image, we might default to "Unknown" or skip. 
            // For now, if missing, we'll try to create a placeholder or skip. 
            // Let's create a "Walk-in Customer" if name is missing but amount is there?
            // Or just skip.
            if (!customerName) {
                // Try to create a generic "Walk-in" if not present? No, might clutter.
                // errors.push(`Row skipped: Missing customer name`);
                // continue;
                // Actually, let's allow "Guest" for AI import if not found.
            }

            const effectiveName = customerName || "Guest Customer";
            let customerId = customerMap.get(effectiveName.toLowerCase());

            // Create customer if not exists
            if (!customerId) {
                const { data: newCustomer, error: createError } = await supabase
                    .from("customers")
                    .insert({ user_id: user.id, name: effectiveName })
                    .select("id")
                    .single();

                if (createError || !newCustomer) {
                    errors.push(`Row skipped: Failed to create customer '${effectiveName}'`);
                    continue;
                }
                customerId = newCustomer.id;
                customerMap.set(effectiveName.toLowerCase(), customerId);
            }

            // Insert Bill
            const { error: billError } = await supabase
                .from("bills")
                .insert({
                    user_id: user.id,
                    customer_id: customerId,
                    total_amount: parseFloat(row.total_amount) || 0,
                    status: (row.status || 'paid').toLowerCase(),
                    created_at: row.date ? new Date(row.date).toISOString() : new Date().toISOString()
                });

            if (billError) {
                errors.push(`Failed to import bill for ${effectiveName}: ${billError.message}`);
            } else {
                importedCount++;
            }
        }

        revalidatePath("/dashboard/bills");

        let message = `Imported ${importedCount} bills successfully.`;
        if (errors.length > 0) message += ` ${errors.length} errors occurred.`;

        return { success: true, message };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to import bills" };
    }
}

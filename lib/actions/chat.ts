"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getDashboardStats, getInventorySummary } from "./dashboard";
import { importProducts } from "./products";
import { createExpense, deleteExpense, getExpenses } from "./expenses";
import { getCustomers, updateCustomer, deleteCustomer } from "./customers";
import { getBills, updateBillStatus } from "./bills";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function getMessages() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching messages:", error);
        return [];
    }

    return messages;
}

export async function sendMessage(formData: FormData) {
    const content = formData.get("content") as string;
    const file = formData.get("file") as File | null;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Process File Upload (if any)
    let systemLog = "";
    let imagePart: any = null;

    if (file && file.size > 0) {
        if (file.type.startsWith("image/")) {
            // Handle Image
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            imagePart = {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type,
                },
            };
            systemLog = "\n\n[System Log]: User uploaded an image. Please analyze it for product data.";
        } else {
            // Handle CSV (Existing logic)
            try {
                const importResult = await importProducts(formData);
                if (importResult.success) {
                    systemLog = `\n\n[System Log]: User uploaded a file. ${importResult.message}`;
                } else {
                    systemLog = `\n\n[System Log]: User uploaded a file but it failed: ${importResult.error}`;
                }
            } catch (error: any) {
                systemLog = `\n\n[System Log]: User uploaded a file but an error occurred: ${error.message}`;
            }
        }
    }

    // 1. Save User Message
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error: userMsgError } = await supabase.from("messages").insert({
        user_id: user.id,
        role: "user",
        content,
    });

    if (userMsgError) {
        console.error("Error saving message:", userMsgError);
        return { error: "Failed to send message" };
    }

    // 2. Generate AI Response (Gemini)
    let aiContent = "";
    try {
        // Fetch business context
        const stats = await getDashboardStats();
        const inventory = await getInventorySummary();

        const inventoryList = inventory.length > 0
            ? inventory.map((p: any) => `- ${p.name}: ${p.stock} units`).join("\n")
            : "No inventory data available.";

        // Define tools
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "createProduct",
                        description: "Create or update a product in the inventory. Use this when the user explicitly asks to add, create, or restock a product.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: {
                                    type: SchemaType.STRING,
                                    description: "The name of the product.",
                                },
                                price: {
                                    type: SchemaType.NUMBER,
                                    description: "The price of the product.",
                                },
                                stock: {
                                    type: SchemaType.NUMBER,
                                    description: "The initial stock quantity or amount to add.",
                                },
                                description: {
                                    type: SchemaType.STRING,
                                    description: "Optional description of the product.",
                                }
                            },
                            required: ["name"],
                        },
                    },
                    {
                        name: "deleteProduct",
                        description: "Delete a product from the inventory by name. Use this when the user explicitly asks to remove or delete a product.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: {
                                    type: SchemaType.STRING,
                                    description: "The name of the product to delete.",
                                },
                            },
                            required: ["name"],
                        },
                    },
                    {
                        name: "updateProduct",
                        description: "Update details of a product (price, absolute stock level, or name). Use this for editing/changing specific fields, NOT for adding stock.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: {
                                    type: SchemaType.STRING,
                                    description: "The name of the product to update.",
                                },
                                updates: {
                                    type: SchemaType.OBJECT,
                                    description: "The fields to update.",
                                    properties: {
                                        name: { type: SchemaType.STRING, description: "New name (optional)" },
                                        price: { type: SchemaType.NUMBER, description: "New price (optional)" },
                                        stock: { type: SchemaType.NUMBER, description: "New absolute stock level (optional)" },
                                    }
                                }
                            },
                            required: ["name", "updates"],
                        },
                    },
                    {
                        name: "createCustomer",
                        description: "Add a new customer to the CRM. Use this when the user wants to add or save a customer's contact information.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: {
                                    type: SchemaType.STRING,
                                    description: "The name of the customer.",
                                },
                                phone: {
                                    type: SchemaType.STRING,
                                    description: "The customer's phone number.",
                                },
                                email: {
                                    type: SchemaType.STRING,
                                    description: "The customer's email address.",
                                },
                                line_id: {
                                    type: SchemaType.STRING,
                                    description: "The customer's Line ID.",
                                },
                                address: {
                                    type: SchemaType.STRING,
                                    description: "The customer's address.",
                                },
                            },
                            required: ["name"],
                        },
                    },
                    {
                        name: "createBill",
                        description: "Create a bill/invoice for a customer with product items. Use this when the user asks to create a bill, invoice, or charge a customer for products.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                customer_name: {
                                    type: SchemaType.STRING,
                                    description: "The name of the customer to bill.",
                                },
                                items: {
                                    type: SchemaType.ARRAY,
                                    description: "List of products and quantities.",
                                    items: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            product_name: {
                                                type: SchemaType.STRING,
                                                description: "Name of the product.",
                                            },
                                            quantity: {
                                                type: SchemaType.NUMBER,
                                                description: "Quantity of the product.",
                                            },
                                        },
                                        required: ["product_name", "quantity"],
                                    },
                                },
                                payment_terms: {
                                    type: SchemaType.NUMBER,
                                    description: "Payment terms in days (e.g., 30 for 30 days credit). Default uses customer preference if any, or 0.",
                                },
                                validity_days: {
                                    type: SchemaType.NUMBER,
                                    description: "Validity of the bill/quotation in days. Default is 7.",
                                },
                                adjustments: {
                                    type: SchemaType.ARRAY,
                                    description: "List of adjustments like discounts or taxes. IMPORTANT: Discounts MUST be negative numbers (e.g., -10 for 10% off or -500 for 500 baht off). Taxes should be positive.",
                                    items: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            label: { type: SchemaType.STRING, description: "Name of adjustment (e.g. 'Discount 10%', 'VAT 7%')" },
                                            type: { type: SchemaType.STRING, enum: ["percent", "fixed"], description: "Type of adjustment" },
                                            value: { type: SchemaType.NUMBER, description: "Value of adjustment. Negative for discounts, positive for taxes." }
                                        },
                                        required: ["label", "type", "value"]
                                    }
                                },
                                note: {
                                    type: SchemaType.STRING,
                                    description: "Optional note for the bill.",
                                },
                            },
                            required: ["customer_name", "items"],
                        },
                    },
                    {
                        name: "createExpense",
                        description: "Create a new expense record.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                title: { type: SchemaType.STRING, description: "Title of the expense." },
                                amount: { type: SchemaType.NUMBER, description: "Amount of the expense." },
                                category: {
                                    type: SchemaType.STRING,
                                    description: "Category of the expense. MUST be one of: 'Supplies', 'Transport', 'Food', 'Utilities', 'Wages', 'Rent', 'Other'.",
                                    enum: ["Supplies", "Transport", "Food", "Utilities", "Wages", "Rent", "Other"]
                                },
                                description: { type: SchemaType.STRING, description: "Optional description." },
                            },
                            required: ["title", "amount", "category"],
                        },
                    },
                    {
                        name: "deleteExpense",
                        description: "Delete an expense. Try to identify by title if ID is unknown.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                title: { type: SchemaType.STRING, description: "Title of the expense to delete to help find it." },
                                id: { type: SchemaType.STRING, description: "ID of the expense if known." },
                            },
                            required: [],
                        },
                    },
                    {
                        name: "listExpenses",
                        description: "List the most recent expenses to see what has been spent.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {},
                        },
                    },
                    {
                        name: "updateCustomer",
                        description: "Update a customer's information.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: { type: SchemaType.STRING, description: "Name of the customer to update (used to find them)." },
                                updates: {
                                    type: SchemaType.OBJECT,
                                    description: "Fields to update.",
                                    properties: {
                                        phone: { type: SchemaType.STRING },
                                        email: { type: SchemaType.STRING },
                                        line_id: { type: SchemaType.STRING },
                                        address: { type: SchemaType.STRING },
                                    }
                                }
                            },
                            required: ["name", "updates"],
                        },
                    },
                    {
                        name: "deleteCustomer",
                        description: "Delete a customer from the system.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: { type: SchemaType.STRING, description: "Name of the customer to delete." },
                            },
                            required: ["name"],
                        },
                    },
                    {
                        name: "getBillStatus",
                        description: "Get the status of a bill for a customer.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                customer_name: { type: SchemaType.STRING, description: "Name of the customer." },
                            },
                            required: ["customer_name"],
                        },
                    },
                ],
            },
        ] as any;

        // Construct system prompt with context
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            tools: tools,
        });

        const prompt = `
      You are MateFlow, a helpful business assistant for a user named Nathan.
      
      Here is the current business status (Real-time data):
      - Total Revenue: ฿${stats?.totalRevenue.toLocaleString() || "0"}
      - Total Orders: ${stats?.totalOrders || "0"}
      - Low Stock Items: ${stats?.lowStockItems || "0"} (Needs attention!)
      - Active Users Now: ${stats?.activeNow || "0"}

      Current Inventory (Top items / Low stock first):
      ${inventoryList}
      
      User's message: "${content}"
      ${systemLog}
      
      Answer the user's question based on this data. Be friendly, professional, and concise. 
      If the user uploaded an image, analyze it to extract product details (Name, Stock, Price) and use the 'createProduct' or 'updateProduct' tools to update the inventory.
      If the user wants to perform an action (products, customers, bills, expenses), call the appropriate function.
      If the user wants to create a bill or invoice, use the 'createBill' function with the customer name and product items.
      If the user asks to see, find, or print an existing bill or quotation, use 'getBillStatus' to find it.
      When asked about expenses, use listExpenses to see recent ones if needed.
       IMPORTANT: When creating an expense, you MUST categorize it into one of these: 'Supplies', 'Transport', 'Food', 'Utilities', 'Wages', 'Rent', 'Other'. Choose the best fit.
    `;

        const result = await model.generateContent(imagePart ? [prompt, imagePart] : prompt);
        const response = await result.response;
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
            const results: string[] = [];

            for (const call of functionCalls) {
                const args = call.args as any;
                let callResult = "";

                if (call.name === "createProduct") {
                    console.log("AI calling createProduct with:", args);
                    const { createOrUpdateProduct } = await import("./products");
                    const result = await createOrUpdateProduct(args);

                    if (result.success) {
                        if (result.isUpdate) {
                            callResult = result.message || `Updated stock for "${args.name}".`;
                        } else {
                            callResult = `Created product "${args.name}" (฿${args.price}, ${args.stock}).`;
                        }
                    } else {
                        callResult = `Failed to process "${args.name}": ${(result as any).error}`;
                    }
                } else if (call.name === "deleteProduct") {
                    console.log("AI calling deleteProduct with:", args);
                    const { deleteProductByName } = await import("./products");
                    const result = await deleteProductByName(args.name) as any;

                    if (result.success) {
                        callResult = `Deleted product "${args.name}".`;
                    } else {
                        callResult = `Failed to delete "${args.name}": ${(result as any).error}`;
                    }
                } else if (call.name === "updateProduct") {
                    console.log("AI calling updateProduct with:", args);
                    const { updateProductByName } = await import("./products");
                    const result = await updateProductByName(args.name, args.updates) as any;

                    if (result.success) {
                        callResult = `Updated details for "${args.name}".`;
                    } else {
                        callResult = `Failed to update "${args.name}": ${(result as any).error}`;
                    }
                } else if (call.name === "createCustomer") {
                    console.log("AI calling createCustomer with:", args);
                    const { createCustomer } = await import("./customers");
                    const result = await createCustomer(args) as any;

                    if (result.success) {
                        callResult = `Added customer "${args.name}"${args.phone ? ` (Phone: ${args.phone})` : ""}${args.email ? ` (Email: ${args.email})` : ""}.`;
                    } else {
                        callResult = `Failed to add customer "${args.name}": ${result.error}`;
                    }
                } else if (call.name === "createBill") {
                    console.log("AI calling createBill with:", args);
                    const { getCustomers } = await import("./customers");
                    const { getProducts } = await import("./products");
                    const { createBill } = await import("./bills");

                    // Resolve customer name to ID
                    const customers = await getCustomers();
                    const customer = customers.find((c: any) =>
                        c.name.toLowerCase().includes(args.customer_name.toLowerCase())
                    );
                    if (!customer) {
                        callResult = `Customer "${args.customer_name}" not found. Please add them first.`;
                    } else {
                        // Resolve product names to IDs
                        const products = await getProducts();
                        const resolvedItems: any[] = [];
                        const notFound: string[] = [];

                        for (const item of args.items) {
                            const product = products.find((p: any) =>
                                p.name.toLowerCase().includes(item.product_name.toLowerCase())
                            );
                            if (product) {
                                resolvedItems.push({
                                    product_id: product.id,
                                    product_name: product.name,
                                    quantity: item.quantity,
                                    unit_price: product.price,
                                });
                            } else {
                                notFound.push(item.product_name);
                            }
                        }

                        if (notFound.length > 0) {
                            callResult = `Products not found: ${notFound.join(", ")}. Bill not created.`;
                        } else if (resolvedItems.length === 0) {
                            callResult = `No valid products to bill.`;
                        } else {
                            const result = await createBill({
                                customer_id: customer.id,
                                note: args.note || undefined,
                                items: resolvedItems,
                                payment_terms: args.payment_terms,
                                validity_days: args.validity_days,
                                adjustments: args.adjustments,
                            }) as any;

                            if (result.success) {
                                const total = resolvedItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0);
                                const itemsList = resolvedItems.map((i: any) => `${i.product_name} x${i.quantity}`).join(", ");
                                callResult = `Bill created for "${customer.name}": ${itemsList}. Terms: ${args.payment_terms || 0} days. Adjustments: ${args.adjustments ? args.adjustments.map((a: any) => `${a.label} (${a.value}${a.type === 'percent' ? '%' : ''})`).join(", ") : "None"}. Total: ฿${(result.bill.total_amount || total).toLocaleString("th-TH", { minimumFractionDigits: 2 })}. [VIEW_BILL:${result.bill.id}]`;
                            } else {
                                callResult = `Failed to create bill: ${result.error}`;
                            }
                        }
                    }

                } else if (call.name === "createExpense") {
                    console.log("AI calling createExpense with:", args);
                    const { createExpense } = await import("./expenses");
                    const result = await createExpense({
                        ...args,
                        date: new Date().toISOString(),
                    });
                    if (result.success) {
                        callResult = `Created expense "${args.title}" (฿${args.amount}).`;
                    } else {
                        callResult = `Failed to create expense: ${(result as any).error}`;
                    }
                } else if (call.name === "deleteExpense") {
                    console.log("AI calling deleteExpense with:", args);
                    const { getExpenses, deleteExpense } = await import("./expenses");

                    let expenseId = args.id;
                    if (!expenseId && args.title) {
                        const expenses = await getExpenses();
                        const expense = expenses.find((e: any) => e.title.toLowerCase().includes(args.title.toLowerCase()));
                        if (expense) expenseId = expense.id;
                    }

                    if (expenseId) {
                        const result = await deleteExpense(expenseId);
                        if (result.success) {
                            callResult = `Deleted expense.`;
                        } else {
                            callResult = `Failed to delete expense: ${(result as any).error}`;
                        }
                    } else {
                        callResult = `Expense not found.`;
                    }
                } else if (call.name === "listExpenses") {
                    console.log("AI calling listExpenses");
                    const { getExpenses } = await import("./expenses");
                    const expenses = await getExpenses();
                    if (expenses.length === 0) {
                        callResult = "No expenses recorded.";
                    } else {
                        callResult = "Recent Expenses:\n" + expenses.slice(0, 5).map((e: any) => `- ${e.title}: ฿${e.amount} (${new Date(e.date).toLocaleDateString()})`).join("\n");
                    }
                } else if (call.name === "updateCustomer") {
                    console.log("AI calling updateCustomer with:", args);
                    const { getCustomers, updateCustomer } = await import("./customers");
                    const customers = await getCustomers();
                    const customer = customers.find((c: any) => c.name.toLowerCase().includes(args.name.toLowerCase()));

                    if (customer) {
                        const result = await updateCustomer(customer.id, args.updates);
                        if (result.success) {
                            callResult = `Updated customer "${customer.name}".`;
                        } else {
                            callResult = `Failed to update customer: ${(result as any).error}`;
                        }
                    } else {
                        callResult = `Customer "${args.name}" not found.`;
                    }
                } else if (call.name === "deleteCustomer") {
                    console.log("AI calling deleteCustomer with:", args);
                    const { getCustomers, deleteCustomer } = await import("./customers");
                    const customers = await getCustomers();
                    const customer = customers.find((c: any) => c.name.toLowerCase().includes(args.name.toLowerCase()));

                    if (customer) {
                        const result = await deleteCustomer(customer.id);
                        if (result.success) {
                            callResult = `Deleted customer "${customer.name}".`;
                        } else {
                            callResult = `Failed to delete customer: ${(result as any).error}`;
                        }
                    } else {
                        callResult = `Customer "${args.name}" not found.`;
                    }
                } else if (call.name === "getBillStatus") {
                    console.log("AI calling getBillStatus with:", args);
                    const { getBills } = await import("./bills");
                    const bills = await getBills();
                    const customerBills = bills.filter((b: any) => b.customer_name.toLowerCase().includes(args.customer_name.toLowerCase()));

                    if (customerBills.length === 0) {
                        callResult = `No bills found for "${args.customer_name}".`;
                    } else {
                        // Get latest bill
                        const latest = customerBills[0];
                        callResult = `Latest bill for "${args.customer_name}" is ${latest.status} (Amount: ฿${latest.total_amount}). Created on ${new Date(latest.created_at).toLocaleDateString()}.`;
                    }
                }
                results.push(callResult);
            }
            aiContent = results.join("\n");
        } else {
            aiContent = response.text();
        }

    } catch (error: any) {
        console.error("--------------- GEMINI ERROR ---------------");
        console.error("Error details:", error);
        if (error.response) {
            console.error("Error response:", JSON.stringify(error.response, null, 2));
        }
        console.error("---------------------------------------------");

        const errorMsg = error.message || "";
        if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Too Many Requests")) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const retryDate = tomorrow.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            const retryTime = tomorrow.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            aiContent = `😅 Apologies, I've exceeded my quota for now. I'll be back on ${retryDate} at ${retryTime}.`;
        } else {
            aiContent = "😔 Sorry, I'm having trouble connecting right now. Please try again later.";
        }
    }

    // 3. Save AI Response
    const { error: aiMsgError } = await supabase.from("messages").insert({
        user_id: user.id,
        role: "assistant",
        content: aiContent,
    });

    if (aiMsgError) {
        console.error("Error saving AI response:", aiMsgError);
        return { error: "Failed to generate response" };
    }

    revalidatePath("/dashboard");
    return { success: true };
}

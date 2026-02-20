
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Using anon key for client-side like check, or service role if needed.
// Ideally use service role for admin tasks but anon should work for reading if RLS allows.
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(1);

    if (error) {
        console.error("Error fetching products:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Product keys:", Object.keys(data[0]));
            if ('updated_at' in data[0]) {
                console.log("✅ 'updated_at' column exists.");
            } else {
                console.log("❌ 'updated_at' column MISSING.");
            }
        } else {
            console.log("No products found to check schema.");
        }
    }
}

checkSchema();

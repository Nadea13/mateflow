
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const { data: { user } } = await supabase.auth.getUser(); // need auth usually or RLS bypass
    // But scripts run outside of browser context might fail auth if not using service role key.
    // Let's try with service role if available or just raw insert if anon allows.

    // Actually, I can't easily authenticate as a user here without credentials.
    // If I have a service role key in .env.local, use it.

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.log("No service role key found. Cannot bypass RLS easily.");
        return;
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await adminSupabase
        .from("products")
        .insert({
            name: "Test Update Time Product",
            price: 100,
            stock: 10,
            user_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID, might fail foreign key constraint
            updated_at: new Date().toISOString()
        })
        .select();

    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Insert success!", data);
        // Clean up
        await adminSupabase.from("products").delete().eq("id", data[0].id);
    }
}

testInsert();

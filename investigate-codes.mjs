import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvopixdprqexkcadinke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2b3BpeGRwcnFleGtjYWRpbmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzAxMzIsImV4cCI6MjA4Njg0NjEzMn0.Bo1hhtMuw_1K6kOp7bqPTHAfUQkbH05huNhCzvklR5M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log("Checking raw information_schema...")
    // Using an RPC call if available, or just fallback to querying if RLS allows...
    // Wait, anon key cannot read information_schema trivially via Supabase client.
    // We can try calling generate_store_code with a fake role.
    const { data, error } = await supabase.rpc('generate_store_code', { p_role: 'sales' })
    console.log("RPC generate_store_code:", data, error)
}

main()

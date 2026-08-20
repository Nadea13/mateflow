import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvopixdprqexkcadinke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2b3BpeGRwcnFleGtjYWRpbmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzAxMzIsImV4cCI6MjA4Njg0NjEzMn0.Bo1hhtMuw_1K6kOp7bqPTHAfUQkbH05huNhCzvklR5M'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testJoinCode() {
    console.log("Testing join code with anonymous key (might fail on auth.uid() check, but will reveal schema errors)...")
    const { data, error } = await supabase.rpc('join_store_by_code', { p_code: 'TEST01' })
    console.log("Result:", data)
    console.log("Error:", error)
}

testJoinCode()

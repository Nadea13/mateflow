import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvopixdprqexkcadinke.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2b3BpeGRwcnFleGtjYWRpbmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzAxMzIsImV4cCI6MjA4Njg0NjEzMn0.Bo1hhtMuw_1K6kOp7bqPTHAfUQkbH05huNhCzvklR5M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log("Fetching invitations...")
    const { data: invites, error: inviteErr } = await supabase.from('invitations').select('*')
    console.log("INVITATIONS:", invites, inviteErr)

    console.log("Fetching profiles...")
    const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, email, role, owner_id')
    console.log("PROFILES:", profiles, profErr)
}

main()

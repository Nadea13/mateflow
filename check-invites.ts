import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
// or use service role key for bypass
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    const { data: invites, error: inviteErr } = await supabase.from('invitations').select('*')
    console.log("INVITATIONS:", invites, inviteErr)

    const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, email, role, owner_id').limit(5)
    console.log("PROFILES:", profiles, profErr)
}

main()

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvopixdprqexkcadinke.supabase.co'
// Using the anon key to just public query, wait, profiles might be protected by RLS
// Let's use the DB directly or use the service role key.
// I don't have the service role key. So I will just use the anon key but RPC might fail.
// Wait, getActiveStoreCodes requires auth.
// Let's just create a quick test script to see the last 5 profiles created/updated using the admin API if we can,
// actually I'll just write a script for the user to run directly in the Next.js server context using standard SQL if I can't.

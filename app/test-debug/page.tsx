import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function TestDebugPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()

    // Fetch as the logged in user
    const { data: invites, error: inviteErr } = await supabase.from('invitations').select('*')
    const { data: profiles, error: profErr } = await supabase.from('profiles').select('*')

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-2xl mb-4 font-bold">Diagnostics</h1>
            <p className="mb-4 text-red-600">Please take a screenshot of this page or copy its contents and send it to me!</p>

            <h2 className="text-xl font-bold mt-4">Current Authenticated User:</h2>
            <pre className="bg-gray-100 p-4 rounded mt-2">{JSON.stringify(user ? { id: user.id, email: user.email } : null, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-4">Your Profiles (RLS visibility):</h2>
            {profErr && <p className="text-red-500">{profErr.message}</p>}
            <pre className="bg-gray-100 p-4 rounded mt-2">{JSON.stringify(profiles, null, 2)}</pre>

            <h2 className="text-xl font-bold mt-4">Invitations in DB (RLS visibility):</h2>
            {inviteErr && <p className="text-red-500">{inviteErr.message}</p>}
            <pre className="bg-gray-100 p-4 rounded mt-2">{JSON.stringify(invites, null, 2)}</pre>
        </div>
    )
}

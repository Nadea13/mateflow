import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    console.log("API ROUTE /api/join HIT")
    try {
        const body = await request.json()
        const storeCode = body.storeCode

        if (!storeCode || storeCode.trim().length === 0) {
            return NextResponse.json({ error: "Store code is required" }, { status: 400 })
        }

        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        console.log("AUTH DEBUG:", {
            userID: user?.id,
            authError
        })

        if (authError || !user) {
            console.log("User not authenticated. Setting pending_join_code cookie.");
            const response = NextResponse.json({ success: true, requiresLogin: true });

            // Generate standard cookie string manually to bypass Next.js internal cookie cache
            // dropping them on some third-party OAuth redirect hops.
            const cookieString = `pending_join_code=${storeCode}; Path=/; HttpOnly; Max-Age=3600${process.env.NODE_ENV === 'production' ? '; Secure; SameSite=Lax' : ''}`;
            response.headers.append('Set-Cookie', cookieString);

            return response;
        }

        console.log(`Attempting to join store with code: ${storeCode} for user: ${user.id}`);

        const { error: joinError } = await supabase
            .rpc("join_store_by_code", { p_code: storeCode })

        if (joinError) {
            console.error("Error joining store (Supabase Error):", JSON.stringify(joinError, null, 2))
            const errorMsg = typeof joinError === 'string' ? joinError : (joinError.message || JSON.stringify(joinError) || "")
            return NextResponse.json({ error: errorMsg || "Failed to join store. Invalid code." }, { status: 400 })
        }

        console.log("Join successful in API Route");
        return NextResponse.json({ success: true })

    } catch (e: any) {
        console.error("Uncaught exception in /api/join:", e);
        return NextResponse.json({ error: e.message || "An unexpected error occurred." }, { status: 500 })
    }
}

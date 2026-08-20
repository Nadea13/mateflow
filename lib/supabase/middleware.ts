import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refreshing the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // --- Role-Based Access Control (RBAC) ---
    if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
        // Fetch the user's role from the profiles table
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        const role = profile?.role || "owner" // Default to owner if not set
        const path = request.nextUrl.pathname

        // 1. Sales Role Restrictions
        if (role === "sales") {
            if (
                path.startsWith("/dashboard/settings") ||
                path.startsWith("/dashboard/expenses") ||
                path.startsWith("/dashboard/inventory")
            ) {
                return NextResponse.redirect(new URL("/dashboard", request.url))
            }
        }

        // 2. Admin Role Restrictions
        if (role === "admin") {
            if (path.startsWith("/dashboard/expenses")) {
                return NextResponse.redirect(new URL("/dashboard", request.url))
            }
        }
    }

    return supabaseResponse
}

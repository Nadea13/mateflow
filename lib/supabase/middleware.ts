import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
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
        // Fetch the user's role from stores or profiles table
        let { data: profile } = await supabase
            .from("stores")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        if (!profile) {
            const fallback = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle()
            profile = fallback.data
        }

        const role = profile?.role || "owner" // Default to owner if not set
        const path = request.nextUrl.pathname

        // 1. Sales Role Restrictions
        if (role === "sales") {
            if (
                path.startsWith("/dashboard/settings") ||
                path.startsWith("/dashboard/expenses") ||
                path.startsWith("/dashboard/inventory") ||
                path.startsWith("/dashboard/store")
            ) {
                return NextResponse.redirect(new URL("/dashboard", request.url))
            }
        }

        // 2. Admin Role Restrictions
        if (role === "admin") {
            // Admins can do everything except maybe delete store/workspace
        }
    }

    return response
}

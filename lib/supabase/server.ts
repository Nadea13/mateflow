import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies> | Promise<ReturnType<typeof cookies>>) => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                async getAll() {
                    const resolvedStore = await cookieStore;
                    return resolvedStore.getAll();
                },
                async setAll(cookiesToSet) {
                    const resolvedStore = await cookieStore;
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            resolvedStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
};

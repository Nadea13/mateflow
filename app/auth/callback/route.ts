import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/dashboard";

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Auto-Join Store on Login via Pending Cookie
            const pendingCode = cookieStore.get("pending_join_code")?.value;
            if (pendingCode) {
                console.log(`AuthCallback: Processing pending join code ${pendingCode}`);
                const { error: joinError } = await supabase.rpc("join_store_by_code", { p_code: pendingCode });
                if (joinError) console.error("AuthCallback: Auto-join failed:", joinError);
                cookieStore.delete("pending_join_code");
            }
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
        });
        if (!error) {
            // Auto-Join Store on Login via Pending Cookie
            const pendingCode = cookieStore.get("pending_join_code")?.value;
            if (pendingCode) {
                console.log(`AuthCallback (OTP): Processing pending join code ${pendingCode}`);
                const { error: joinError } = await supabase.rpc("join_store_by_code", { p_code: pendingCode });
                if (joinError) console.error("AuthCallback: Auto-join failed:", joinError);
                cookieStore.delete("pending_join_code");
            }

            // For magic link signups, redirect to set-password page
            if (type === "magiclink" || type === "email") {
                return NextResponse.redirect(`${origin}/signup/set-password`);
            }
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}


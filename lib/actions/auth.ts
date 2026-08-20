"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyTurnstileToken } from "@/lib/cloudflare/turnstile";

/**
 * 1. Send 6-digit OTP to Email (Protected by Cloudflare Turnstile CAPTCHA)
 */
export async function sendOtp(formData: FormData) {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const fullName = (formData.get("fullName") as string)?.trim();
    const turnstileToken = (formData.get("turnstileToken") as string)?.trim();

    if (!email) {
        return { success: false, error: "Please enter your email address" };
    }

    // Verify Cloudflare Turnstile Token
    const turnstileResult = await verifyTurnstileToken(turnstileToken);
    if (!turnstileResult.success) {
        return { success: false, error: turnstileResult.error || "Turnstile CAPTCHA verification failed" };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            data: {
                full_name: fullName || email.split("@")[0],
            },
            shouldCreateUser: true,
        },
    });

    if (error) {
        console.error("sendOtp error:", error);
        return { success: false, error: error.message };
    }

    return { success: true, email };
}

/**
 * 2. Verify 6-digit OTP Code & Complete Auth Session
 */
export async function verifyOtp(email: string, token: string) {
    if (!email || !token) {
        return { success: false, error: "Email and 6-digit code are required" };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: "email",
    });

    if (error) {
        console.error("verifyOtp error:", error);
        return { success: false, error: error.message };
    }

    // Ensure user has a profile and free subscription record
    if (data.user) {
        await supabase.from("profiles").upsert(
            {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || email.split("@")[0],
                updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
        );

        await supabase.from("subscriptions").upsert(
            {
                user_id: data.user.id,
                tier: "free",
                status: "active",
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );
    }

    return { success: true };
}

/**
 * 3. Set Account Password after OTP verification
 */
export async function setAccountPassword(password: string) {
    if (!password || password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long" };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        console.error("setAccountPassword error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Form action wrapper for setPassword
 */
export async function setPassword(formData: FormData) {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
        redirect("/signup/set-password?error=Passwords do not match");
    }

    const res = await setAccountPassword(password);
    if (!res.success) {
        redirect(`/signup/set-password?error=${encodeURIComponent(res.error || "Failed to set password")}`);
    }

    redirect("/dashboard");
}

/**
 * 4. Email + Password Sign In (Protected by Cloudflare Turnstile CAPTCHA)
 */
export async function signIn(formData: FormData) {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = (formData.get("password") as string);
    const turnstileToken = (formData.get("turnstileToken") as string)?.trim();

    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // Verify Cloudflare Turnstile Token
    const turnstileResult = await verifyTurnstileToken(turnstileToken);
    if (!turnstileResult.success) {
        throw new Error(turnstileResult.error || "Turnstile CAPTCHA verification failed");
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    redirect("/dashboard");
}

export const signInWithPassword = signIn;

/**
 * 5. Sign Out
 */
export async function signOutAction() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    redirect("/login");
}

/**
 * Cloudflare Turnstile Server-side verification helper
 */
export async function verifyTurnstileToken(token?: string | null, ip?: string): Promise<{ success: boolean; error?: string }> {
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

    // If Turnstile Secret Key is not configured (Local Dev / Sandbox) or dummy test key, allow pass
    if (!secretKey || secretKey.startsWith("1x0000000000000000000000000000000AA") || !token || token.startsWith("XXXX.")) {
        return { success: true };
    }

    try {
        const formData = new FormData();
        formData.append("secret", secretKey);
        formData.append("response", token);
        if (ip) {
            formData.append("remoteip", ip);
        }

        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData,
        });

        const outcome = await res.json();
        if (outcome.success) {
            return { success: true };
        } else {
            console.error("Turnstile verification error codes:", outcome["error-codes"]);
            return { success: false, error: "Cloudflare Turnstile verification failed." };
        }
    } catch (err: any) {
        console.error("Turnstile fetch error:", err);
        return { success: false, error: "Turnstile verification service unavailable." };
    }
}

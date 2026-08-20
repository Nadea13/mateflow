"use client";

import { useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
    onSuccess: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

export function TurnstileWidget({ onSuccess, onError, onExpire }: TurnstileWidgetProps) {
    const [mounted, setMounted] = useState(false);
    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="w-full my-3 [&>div]:w-full [&_iframe]:w-full! [&_iframe]:min-w-full!">
            <Turnstile
                siteKey={siteKey}
                onSuccess={onSuccess}
                onError={onError}
                onExpire={onExpire}
                options={{
                    theme: "dark",
                    size: "flexible",
                }}
            />
        </div>
    );
}

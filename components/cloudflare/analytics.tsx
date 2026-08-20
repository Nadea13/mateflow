import Script from "next/script";

export function CloudflareAnalytics() {
    const token = process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN || "afa78bd510f54e3391f07239ecd3de61";

    return (
        <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${token}"}`}
            strategy="afterInteractive"
        />
    );
}

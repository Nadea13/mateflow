import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const folder = (formData.get("folder") as string) || "products";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate image mime types
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Only images (JPEG, PNG, WebP, GIF, SVG) are allowed." }, { status: 400 });
        }

        // Limit file size to 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File size exceeds 10MB limit." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await uploadToR2(buffer, file.name, file.type, folder);

        if (!result.success) {
            return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            url: result.url,
            key: result.key,
        });
    } catch (err: any) {
        console.error("API Upload Error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

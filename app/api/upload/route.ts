import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import sharp from "sharp";

export const dynamic = "force-dynamic";

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
        const folder = (formData.get("folder") as string) || "general";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type is an image
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
        }

        // Convert file stream to Buffer for Sharp processing
        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // Convert ANY input image of ANY size to highly optimized AVIF format
        const avifBuffer = await sharp(inputBuffer)
            .avif({
                quality: 80,
                lossless: false,
                effort: 4, // Balanced CPU effort & compression ratio
                chromaSubsampling: '4:4:4', // Preserve pristine color sharpness
            })
            .toBuffer();

        // Generate clean unique filename with .avif extension
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `${folder}/${user.id}-${timestamp}-${randomString}.avif`;

        // Upload optimized AVIF buffer to Cloudflare R2
        const uploadResult = await uploadToR2(avifBuffer, fileName, "image/avif", folder);

        if (!uploadResult.success || !uploadResult.url) {
            return NextResponse.json(
                { error: uploadResult.error || "Failed to upload image to Cloudflare R2" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: uploadResult.url,
            key: uploadResult.key,
            format: "avif",
            originalSize: inputBuffer.length,
            optimizedSize: avifBuffer.length,
        });
    } catch (error: any) {
        console.error("Cloudflare R2 Upload API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process and upload image" },
            { status: 500 }
        );
    }
}

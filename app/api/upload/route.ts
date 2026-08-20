import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import sharp from "sharp";

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

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
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml",
            "image/avif",
            "image/heic",
            "image/heif",
            "image/tiff",
            "image/bmp",
        ];
        
        if (!allowedTypes.includes(file.type) && !file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
        }

        const rawBytes = await file.arrayBuffer();
        let rawBuffer = Buffer.from(rawBytes);

        let finalBuffer: Buffer;
        let finalContentType: string;
        let finalExtension: string;

        // If SVG, keep vector format as SVG
        if (file.type === "image/svg+xml") {
            finalBuffer = rawBuffer;
            finalContentType = "image/svg+xml";
            finalExtension = "svg";
        } else {
            // Convert any high-res image (PNG, JPG, WebP, HEIC, TIFF, large photos) to high-efficiency AVIF
            try {
                finalBuffer = await sharp(rawBuffer)
                    .rotate() // Auto-orient based on EXIF
                    .avif({
                        quality: 80, // High visual fidelity
                        effort: 4,   // Fast CPU encoding
                        chromaSubsampling: '4:4:4', // Preserve fine text/logos
                    })
                    .toBuffer();

                finalContentType = "image/avif";
                finalExtension = "avif";
            } catch (sharpError) {
                console.warn("Sharp AVIF conversion fallback:", sharpError);
                finalBuffer = rawBuffer;
                finalContentType = file.type || "image/jpeg";
                finalExtension = file.name.split(".").pop() || "jpg";
            }
        }

        const baseFileName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        const finalFileName = `${baseFileName}.${finalExtension}`;

        const result = await uploadToR2(finalBuffer, finalFileName, finalContentType, folder);

        if (!result.success) {
            return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            url: result.url,
            key: result.key,
            format: finalExtension,
            sizeOriginal: file.size,
            sizeOptimized: finalBuffer.length,
        });
    } catch (err: any) {
        console.error("API Upload Error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}

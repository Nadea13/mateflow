import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "mateflow-uploads";
const publicUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || "";

// Initialize R2 S3 Client
export const r2Client = new S3Client({
    region: "auto",
    endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "https://dummy-account-id.r2.cloudflarestorage.com",
    credentials: {
        accessKeyId: accessKeyId || "dummy-access-key",
        secretAccessKey: secretAccessKey || "dummy-secret-key",
    },
});

export interface UploadResult {
    success: boolean;
    url?: string;
    key?: string;
    error?: string;
}

/**
 * Upload a file Buffer directly to Cloudflare R2
 */
export async function uploadToR2(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder = "products"
): Promise<UploadResult> {
    const isConfigured = !!(accountId && accessKeyId && secretAccessKey);

    const ext = fileName.split(".").pop() || "png";
    const fileKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    if (!isConfigured) {
        // Fallback for Local Dev / Sandbox without R2 credentials
        const base64 = fileBuffer.toString("base64");
        const dataUrl = `data:${contentType};base64,${base64}`;
        return {
            success: true,
            url: dataUrl,
            key: fileKey,
        };
    }

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: contentType,
        });

        await r2Client.send(command);

        const fileUrl = publicUrl
            ? `${publicUrl.replace(/\/$/, "")}/${fileKey}`
            : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`;

        return {
            success: true,
            url: fileUrl,
            key: fileKey,
        };
    } catch (err: any) {
        console.error("Cloudflare R2 Upload Error:", err);
        return {
            success: false,
            error: err.message || "Failed to upload image to Cloudflare R2",
        };
    }
}

/**
 * Generate a pre-signed URL for direct browser uploads to R2
 */
export async function getPresignedUploadUrl(fileName: string, contentType: string, folder = "uploads") {
    const isConfigured = !!(accountId && accessKeyId && secretAccessKey);
    const ext = fileName.split(".").pop() || "png";
    const fileKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    if (!isConfigured) {
        return { error: "Cloudflare R2 is not configured" };
    }

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
        const finalUrl = publicUrl ? `${publicUrl.replace(/\/$/, "")}/${fileKey}` : fileKey;

        return { success: true, uploadUrl, fileKey, finalUrl };
    } catch (err: any) {
        console.error("Presigned URL Error:", err);
        return { error: err.message || "Failed to generate presigned upload URL" };
    }
}

/**
 * Delete an object from Cloudflare R2
 */
export async function deleteFromR2(fileKey: string): Promise<boolean> {
    const isConfigured = !!(accountId && accessKeyId && secretAccessKey);
    if (!isConfigured) return true;

    try {
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
        });
        await r2Client.send(command);
        return true;
    } catch (err) {
        console.error("Error deleting from R2:", err);
        return false;
    }
}

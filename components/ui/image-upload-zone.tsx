"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploadZoneProps {
    value?: string;
    onChange: (url: string) => void;
    folder?: string;
    label?: string;
    className?: string;
}

export function ImageUploadZone({
    value,
    onChange,
    folder = "products",
    label = "Upload Image",
    className = "",
}: ImageUploadZoneProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(value);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview locally immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Upload failed");
            }

            onChange(data.url);
            setPreview(data.url);
            toast.success("Image uploaded to Cloudflare R2 successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to upload image");
            setPreview(value);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(undefined);
        onChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && <label className="text-xs font-semibold text-foreground">{label}</label>}
            
            <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                    preview
                        ? "border-primary/40 bg-primary/5 hover:border-primary"
                        : "border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                />

                {preview ? (
                    <div className="relative group w-full flex items-center justify-center">
                        <img
                            src={preview}
                            alt="Uploaded preview"
                            className="max-h-36 max-w-full rounded-lg object-contain border border-border shadow-2xs"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground rounded-full shadow-xs transition-colors backdrop-blur-xs"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        {isUploading && (
                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg backdrop-blur-2xs">
                                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-center">
                        {isUploading ? (
                            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                        ) : (
                            <div className="p-2.5 rounded-full bg-primary/10 text-primary mb-2">
                                <Upload className="h-5 w-5" />
                            </div>
                        )}
                        <p className="text-xs font-medium text-foreground">
                            {isUploading ? "Uploading to Cloudflare R2..." : "Click or drag image to upload"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            PNG, JPG, WebP, SVG up to 10MB
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

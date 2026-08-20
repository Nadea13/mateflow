"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/lib/actions/profile";
import { ImageUploadZone } from "@/components/ui/image-upload-zone";
import { toast } from "sonner";
import { Camera, Save, Store, Upload, Phone, FileCheck2, PenTool, Loader2, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/provider";

interface StoreFormProps {
    store: {
        id: string;
        store_name: string;
        avatar_url: string;
        store_address: string;
        tax_id: string;
        signature_url: string;
        store_phone: string;
    };
}

export function StoreForm({ store }: StoreFormProps) {
    const { t } = useTranslation();
    const [storeName, setStoreName] = useState(store?.store_name || "");
    const [storeAddress, setStoreAddress] = useState(store?.store_address || "");
    const [taxId, setTaxId] = useState(store?.tax_id || "");
    const [avatarUrl, setAvatarUrl] = useState(store?.avatar_url || "");
    const [signatureUrl, setSignatureUrl] = useState(store?.signature_url || "");
    const [storePhone, setStorePhone] = useState(store?.store_phone || "");
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (store) {
            setStoreName(store.store_name || "");
            setStoreAddress(store.store_address || "");
            setTaxId(store.tax_id || "");
            setAvatarUrl(store.avatar_url || "");
            setSignatureUrl(store.signature_url || "");
            setStorePhone(store.store_phone || "");
        }
    }, [store]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setAvatarUrl(objectUrl);
        setUploadingLogo(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "avatars");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Upload failed");
            }

            setAvatarUrl(data.url);
            
            // Auto save avatar to profile
            await updateProfile({
                avatar_url: data.url,
            });

            toast.success("อัปโหลดและแปลงโลโก้เป็น AVIF บน Cloudflare เรียบร้อย!");
            startTransition(() => {
                router.refresh();
            });
        } catch (err: any) {
            console.error("Logo upload error:", err);
            toast.error(err.message || "Failed to upload logo");
            setAvatarUrl(store?.avatar_url || "");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleRemoveLogo = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setAvatarUrl("");
        if (logoInputRef.current) logoInputRef.current.value = "";
        await updateProfile({
            avatar_url: "",
        });
        router.refresh();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateProfile({
                store_name: storeName,
                store_address: storeAddress,
                tax_id: taxId,
                store_phone: storePhone,
                avatar_url: avatarUrl || undefined,
                signature_url: signatureUrl || undefined,
            }) as any;

            if (result.success) {
                toast.success("บันทึกข้อมูลร้านค้าเรียบร้อยแล้ว");
                startTransition(() => {
                    router.refresh();
                });
            } else {
                toast.error(result.error || "Failed to save");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="max-w-2xl border border-border bg-card shadow-xs">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    ข้อมูลร้านค้าและหัวบิล
                </CardTitle>
                <CardDescription className="text-xs">
                    ข้อมูลนี้จะนำไปแสดงบนหัวใบเสร็จรับเงิน ใบกำกับภาษี และระบบพิมพ์เอกสารทั้งหมด
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* 1:1 Aspect Ratio Logo Dropzone */}
                <div className="flex flex-col items-center justify-center space-y-1.5 pb-2">
                    <div
                        onClick={() => logoInputRef.current?.click()}
                        className={`relative w-28 h-28 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center overflow-hidden ${
                            avatarUrl
                                ? "border-primary/40 bg-primary/5 hover:border-primary"
                                : "border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40"
                        }`}
                    >
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={uploadingLogo}
                        />

                        {avatarUrl ? (
                            <div className="relative w-full h-full flex items-center justify-center group">
                                <img
                                    src={avatarUrl}
                                    alt="Store Logo"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveLogo}
                                    className="absolute top-1.5 right-1.5 p-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground rounded-full shadow-xs transition-colors backdrop-blur-xs cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                                {uploadingLogo && (
                                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-2xs">
                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                                {uploadingLogo ? (
                                    <Loader2 className="h-6 w-6 text-primary animate-spin mb-1" />
                                ) : (
                                    <div className="p-2 rounded-full bg-primary/10 text-primary mb-1">
                                        <Upload className="h-4 w-4" />
                                    </div>
                                )}
                                <p className="text-[11px] font-semibold text-foreground leading-tight">
                                    {uploadingLogo ? "กำลังอัปโหลด..." : "โลโก้ร้านค้า"}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">
                                    1:1 Auto AVIF
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-3.5">
                    {/* Store Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-store-name" className="text-xs font-semibold">ชื่อร้านค้า / บริษัท *</Label>
                        <Input
                            id="edit-store-name"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="เช่น Mateflow Official Store"
                            className="h-9 text-xs"
                        />
                    </div>

                    {/* Phone & Tax ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-store-phone" className="text-xs font-semibold">เบอร์โทรศัพท์</Label>
                            <Input
                                id="edit-store-phone"
                                value={storePhone}
                                onChange={(e) => setStorePhone(e.target.value)}
                                placeholder="08X-XXX-XXXX"
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-tax-id" className="text-xs font-semibold">เลขประจำตัวผู้เสียภาษี (Tax ID)</Label>
                            <Input
                                id="edit-tax-id"
                                value={taxId}
                                onChange={(e) => setTaxId(e.target.value)}
                                placeholder="เลข 13 หลัก"
                                maxLength={13}
                                className="h-9 text-xs font-mono"
                            />
                        </div>
                    </div>

                    {/* Store Address */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-store-address" className="text-xs font-semibold">ที่อยู่ร้านค้า / สำนักงานใหญ่</Label>
                        <Textarea
                            id="edit-store-address"
                            value={storeAddress}
                            onChange={(e) => setStoreAddress(e.target.value)}
                            placeholder="ที่อยู่สำหรับแสดงบนหัวบิลและใบกำกับภาษี"
                            className="text-xs min-h-[60px]"
                        />
                    </div>

                    {/* Authorized Signature Upload */}
                    <div className="space-y-1.5 border-t border-border/60 pt-3">
                        <Label className="text-xs font-semibold block mb-1">ลายเซ็นต์ผู้มีอำนาจ</Label>
                        <ImageUploadZone
                            value={signatureUrl}
                            onChange={(url) => setSignatureUrl(url)}
                            folder="signatures"
                            label=""
                            className="w-full"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            แปลงและจัดเก็บเป็นไฟล์ AVIF คุณภาพสูงโดยอัตโนมัติ
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-2 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
                    >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        บันทึกข้อมูลร้านค้า
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

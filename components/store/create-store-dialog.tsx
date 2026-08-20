"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNewStore } from "@/lib/actions/profile";
import { ImageUploadZone } from "@/components/ui/image-upload-zone";
import { toast } from "sonner";
import { Store, Loader2, Upload, X } from "lucide-react";

interface CreateStoreDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function CreateStoreDialog({ open, setOpen }: CreateStoreDialogProps) {
    const [storeName, setStoreName] = useState("");
    const [storePhone, setStorePhone] = useState("");
    const [taxId, setTaxId] = useState("");
    const [storeAddress, setStoreAddress] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [signatureUrl, setSignatureUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

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
            toast.success("อัปโหลดโลโก้สำเร็จ (AVIF Format)");
        } catch (err: any) {
            console.error("Logo upload error:", err);
            toast.error(err.message || "Failed to upload logo");
            setAvatarUrl("");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleRemoveLogo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setAvatarUrl("");
        if (logoInputRef.current) {
            logoInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeName.trim()) {
            toast.error("กรุณากรอกชื่อร้านค้า");
            return;
        }

        setLoading(true);
        try {
            // Always call createNewStore to ensure a brand-new distinct store row is inserted
            const res = await createNewStore({
                store_name: storeName.trim(),
                store_phone: storePhone.trim(),
                tax_id: taxId.trim(),
                store_address: storeAddress.trim(),
                avatar_url: avatarUrl || undefined,
                signature_url: signatureUrl || undefined,
            }) as any;

            if (res?.success) {
                toast.success("สร้างร้านค้าใหม่เรียบร้อยแล้ว!");
                setOpen(false);
                // Reset form fields
                setStoreName("");
                setStorePhone("");
                setTaxId("");
                setStoreAddress("");
                setAvatarUrl("");
                setSignatureUrl("");
                window.location.reload();
            } else {
                toast.error(res?.error || "Failed to create store");
            }
        } catch (err: any) {
            console.error("Create store error:", err);
            toast.error(err?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    {/* Header without underline border */}
                    <DialogHeader className="pb-1">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Store className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    สร้างร้านค้าใหม่
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    ตั้งค่าข้อมูลร้านค้าของคุณสำหรับออกบิลและจัดการสต็อกสินค้า
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* 1:1 Aspect Ratio Logo Dropzone */}
                        <div className="flex flex-col items-center justify-center space-y-1.5 pb-1">
                            <div
                                onClick={() => logoInputRef.current?.click()}
                                className={`relative w-24 h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center overflow-hidden ${
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
                                            className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground rounded-full shadow-xs transition-colors backdrop-blur-xs cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        {uploadingLogo && (
                                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-2xs">
                                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-2 text-center">
                                        {uploadingLogo ? (
                                            <Loader2 className="h-5 w-5 text-primary animate-spin mb-1" />
                                        ) : (
                                            <div className="p-1.5 rounded-full bg-primary/10 text-primary mb-1">
                                                <Upload className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                        <p className="text-[10px] font-semibold text-foreground leading-tight">
                                            {uploadingLogo ? "กำลังอัปโหลด..." : "โลโก้ร้านค้า"}
                                        </p>
                                        <p className="text-[8px] text-muted-foreground mt-0.5">
                                            1:1 Auto AVIF
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Store Name & Phone */}
                        <div className="space-y-1.5">
                            <Label htmlFor="store-name" className="text-xs font-semibold">
                                ชื่อร้านค้า *
                            </Label>
                            <Input
                                id="store-name"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                placeholder="เช่น Mateflow Flagship Store"
                                required
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="store-phone" className="text-xs font-semibold">
                                    เบอร์โทรศัพท์ร้าน
                                </Label>
                                <Input
                                    id="store-phone"
                                    value={storePhone}
                                    onChange={(e) => setStorePhone(e.target.value)}
                                    placeholder="08X-XXX-XXXX"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="tax-id" className="text-xs font-semibold">
                                    เลขประจำตัวผู้เสียภาษี
                                </Label>
                                <Input
                                    id="tax-id"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    placeholder="เลข 13 หลัก"
                                    maxLength={13}
                                    className="h-9 text-xs font-mono"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5">
                            <Label htmlFor="store-address" className="text-xs font-semibold">
                                ที่อยู่ร้านค้า
                            </Label>
                            <Textarea
                                id="store-address"
                                value={storeAddress}
                                onChange={(e) => setStoreAddress(e.target.value)}
                                placeholder="ที่อยู่สำหรับแสดงบนหัวใบเสร็จรับเงิน..."
                                className="text-xs min-h-[60px]"
                            />
                        </div>

                        {/* Authorized Signature Upload Dropzone */}
                        <div className="space-y-1.5 border-t border-border/60 pt-3">
                            <Label className="text-xs font-semibold block mb-1">
                                ลายเซ็นต์ผู้มีอำนาจ
                            </Label>
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

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="h-8 text-xs cursor-pointer"
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={loading || uploadingLogo}
                            className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground cursor-pointer"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            สร้างร้านค้า
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

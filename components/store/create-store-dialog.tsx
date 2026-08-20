"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadZone } from "@/components/ui/image-upload-zone";
import { updateProfile } from "@/lib/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Store, Loader2, FileCheck2, PenTool, Camera, X } from "lucide-react";

interface CreateStoreDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function CreateStoreDialog({ open, setOpen }: CreateStoreDialogProps) {
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [storeName, setStoreName] = useState("");
    const [storePhone, setStorePhone] = useState("");
    const [taxId, setTaxId] = useState("");
    const [storeAddress, setStoreAddress] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [signatureUrl, setSignatureUrl] = useState("");
    const logoInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

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
            toast.success("อัปโหลดโลโก้ร้านค้าเรียบร้อยแล้ว");
        } catch (err: any) {
            toast.error(err.message || "Failed to upload logo");
        } finally {
            setUploadingLogo(false);
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
            const res = await updateProfile({
                store_name: storeName.trim(),
                store_phone: storePhone.trim(),
                tax_id: taxId.trim(),
                store_address: storeAddress.trim(),
                avatar_url: avatarUrl || undefined,
                signature_url: signatureUrl || undefined,
            }) as any;

            if (res.success) {
                toast.success("สร้างร้านค้าเรียบร้อยแล้ว!");
                setOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to create store");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Store className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold">สร้างร้านค้าใหม่</DialogTitle>
                                <DialogDescription className="text-xs">
                                    กรอกข้อมูลร้านค้า โลโก้ร้าน เลขประจำตัวผู้เสียภาษี และรูปลายเซ็นต์
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* 1:1 Aspect Ratio Logo Upload at the Top */}
                        <div className="flex flex-col items-center justify-center space-y-2 pb-2">
                            <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    disabled={uploadingLogo}
                                />

                                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border group-hover:border-primary bg-muted/30 overflow-hidden flex flex-col items-center justify-center transition-all duration-200 shadow-2xs">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Store Logo"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-2 text-center">
                                            {uploadingLogo ? (
                                                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                            ) : (
                                                <>
                                                    <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    <span className="text-[10px] text-muted-foreground font-semibold mt-1">
                                                        โลโก้ 1:1
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {uploadingLogo && (
                                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-2xl backdrop-blur-2xs">
                                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {avatarUrl && !uploadingLogo && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAvatarUrl("");
                                            if (logoInputRef.current) logoInputRef.current.value = "";
                                        }}
                                        className="absolute -top-1.5 -right-1.5 p-1 bg-destructive text-destructive-foreground rounded-full shadow-xs hover:opacity-90"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium">
                                คลิกเพื่ออัปโหลดโลโก้ร้านค้า (สี่เหลี่ยมจัตุรัส 1:1)
                            </span>
                        </div>

                        {/* Store Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="store-name" className="text-xs font-semibold">ชื่อร้านค้า / บริษัท *</Label>
                            <Input
                                id="store-name"
                                placeholder="เช่น Mateflow Official Store"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                        </div>

                        {/* Phone & Tax ID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="store-phone" className="text-xs font-semibold">เบอร์โทรศัพท์</Label>
                                <Input
                                    id="store-phone"
                                    placeholder="08X-XXX-XXXX"
                                    value={storePhone}
                                    onChange={(e) => setStorePhone(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="tax-id" className="text-xs font-semibold flex items-center gap-1">
                                    <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                                    เลขประจำตัวผู้เสียภาษี (Tax ID)
                                </Label>
                                <Input
                                    id="tax-id"
                                    placeholder="เลข 13 หลัก"
                                    maxLength={13}
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    className="h-9 text-xs font-mono"
                                />
                            </div>
                        </div>

                        {/* Store Address */}
                        <div className="space-y-1.5">
                            <Label htmlFor="store-address" className="text-xs font-semibold">ที่อยู่ร้านค้า / สำนักงานใหญ่</Label>
                            <Textarea
                                id="store-address"
                                placeholder="ที่อยู่สำหรับแสดงบนหัวบิลและใบกำกับภาษี"
                                value={storeAddress}
                                onChange={(e) => setStoreAddress(e.target.value)}
                                className="text-xs min-h-[60px]"
                            />
                        </div>

                        {/* Authorized Signature Upload (Cloudflare R2) */}
                        <div className="space-y-1.5 border-t border-border/60 pt-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <PenTool className="h-3.5 w-3.5 text-primary" />
                                <Label className="text-xs font-semibold">ลายเซ็นต์ผู้มีอำนาจ (Authorized Signature)</Label>
                            </div>
                            <ImageUploadZone
                                value={signatureUrl}
                                onChange={(url) => setSignatureUrl(url)}
                                folder="signatures"
                                label=""
                                className="w-full"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                แนะนำภาพลายเซ็นต์พื้นหลังโปร่งใส (PNG) สำหรับประทับลงในใบเสร็จและใบแจ้งหนี้อัตโนมัติ
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="pt-2 border-t border-border/60">
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" size="sm" disabled={loading} className="gap-1.5 bg-primary text-primary-foreground font-bold">
                            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            สร้างร้านค้า
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

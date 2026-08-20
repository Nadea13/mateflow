"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadZone } from "@/components/ui/image-upload-zone";
import { updateProfile } from "@/lib/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Store, Loader2, FileCheck2, PenTool, Image as ImageIcon } from "lucide-react";

interface CreateStoreDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function CreateStoreDialog({ open, setOpen }: CreateStoreDialogProps) {
    const [loading, setLoading] = useState(false);
    const [storeName, setStoreName] = useState("");
    const [storePhone, setStorePhone] = useState("");
    const [taxId, setTaxId] = useState("");
    const [storeAddress, setStoreAddress] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [signatureUrl, setSignatureUrl] = useState("");
    const router = useRouter();

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
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
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

                    <div className="grid gap-3.5 py-4">
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

                        {/* Store Logo Upload (Cloudflare R2) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                                <Label className="text-xs font-semibold">โลโก้ร้านค้า (Store Logo / Avatar)</Label>
                            </div>
                            <ImageUploadZone
                                value={avatarUrl}
                                onChange={(url) => setAvatarUrl(url)}
                                folder="avatars"
                                label=""
                                className="w-full"
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

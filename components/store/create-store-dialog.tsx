"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Store, Loader2 } from "lucide-react";

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
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Store className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold">สร้างร้านค้าใหม่</DialogTitle>
                                <DialogDescription className="text-xs">
                                    กรอกข้อมูลร้านค้าเพื่อเริ่มออกบิลและบริหารสต็อกสินค้า
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-3.5 py-4">
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

                        <div className="grid grid-cols-2 gap-3">
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
                                <Label htmlFor="tax-id" className="text-xs font-semibold">เลขผู้เสียภาษี (Tax ID)</Label>
                                <Input
                                    id="tax-id"
                                    placeholder="13 หลัก (ถ้ามี)"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="store-address" className="text-xs font-semibold">ที่อยู่ร้านค้า / สำนักงานใหญ่</Label>
                            <Textarea
                                id="store-address"
                                placeholder="ที่อยู่สำหรับแสดงบนหัวบิลและใบเสร็จรับเงิน"
                                value={storeAddress}
                                onChange={(e) => setStoreAddress(e.target.value)}
                                className="text-xs min-h-[70px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
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

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Branch, Product } from "@/types";
import { createStockTransfer } from "@/lib/actions/stock-transfer";
import { ArrowRightLeft, Plus, Trash2, Loader2, Building2, PackageCheck } from "lucide-react";
import { toast } from "sonner";

interface StockTransferDialogProps {
    branches: Branch[];
    products: Product[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showTrigger?: boolean;
}

export function StockTransferDialog({
    branches,
    products,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    showTrigger = true,
}: StockTransferDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

    const [fromBranchId, setFromBranchId] = useState(branches[0]?.id || "");
    const [toBranchId, setToBranchId] = useState(branches[1]?.id || "");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([
        { product_id: products[0]?.id || "", quantity: 1 },
    ]);

    const handleAddItem = () => {
        setItems([...items, { product_id: products[0]?.id || "", quantity: 1 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, idx) => idx !== index));
    };

    const handleItemChange = (index: number, field: "product_id" | "quantity", value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromBranchId || !toBranchId) {
            toast.error("กรุณาเลือกสาขาต้นทางและปลายทาง");
            return;
        }

        if (fromBranchId === toBranchId) {
            toast.error("สาขาต้นทางและปลายทางต้องไม่เป็นสาขาเดียวกัน");
            return;
        }

        if (items.some(it => !it.product_id || it.quantity <= 0)) {
            toast.error("กรุณาระบุสินค้าและจำนวนให้ถูกต้อง");
            return;
        }

        setLoading(true);
        try {
            const res = await createStockTransfer({
                from_branch_id: fromBranchId,
                to_branch_id: toBranchId,
                notes,
                items,
            });

            if (res.success) {
                toast.success(`โอนย้ายสต็อกสำเร็จ! (รหัส ${res.transfer_number})`);
                setOpen(false);
                setNotes("");
            } else {
                toast.error(res.error || "เกิดข้อผิดพลาดในการโอนสต็อก");
            }
        } catch (err: any) {
            toast.error(err?.message || "โอนย้ายสต็อกไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-semibold cursor-pointer">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                        โอนย้ายสต็อกข้ามสาขา
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[540px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <ArrowRightLeft className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    โอนย้ายสต็อกสินค้าข้ามสาขา
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    กระจายหรือย้ายสินค้าจากคลัง/สาขาหนึ่งไปยังอีกสาขาหนึ่งแบบ Real-time
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Branch Selectors: From & To */}
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/80">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5 text-amber-500" />
                                    สาขาต้นทาง (ตัดสต็อก)
                                </Label>
                                <Select value={fromBranchId} onValueChange={setFromBranchId}>
                                    <SelectTrigger className="h-8 text-xs bg-background">
                                        <SelectValue placeholder="เลือกสาขาต้นทาง" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.name} ({b.code || "Branch"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                                    สาขาปลายทาง (รับสต็อก)
                                </Label>
                                <Select value={toBranchId} onValueChange={setToBranchId}>
                                    <SelectTrigger className="h-8 text-xs bg-background">
                                        <SelectValue placeholder="เลือกสาขาปลายทาง" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.filter(b => b.id !== fromBranchId).map(b => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.name} ({b.code || "Branch"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Transfer Line Items */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">รายการสินค้าที่ต้องการโอน</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAddItem}
                                    className="h-7 text-xs text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                                >
                                    <Plus className="h-3 w-3" />
                                    เพิ่มรายการ
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Select
                                            value={item.product_id}
                                            onValueChange={(val) => handleItemChange(idx, "product_id", val)}
                                        >
                                            <SelectTrigger className="h-8 text-xs flex-1 bg-background">
                                                <SelectValue placeholder="เลือกสินค้า" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} {p.sku ? `(${p.sku})` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                                            className="h-8 w-20 text-xs text-right font-mono"
                                            placeholder="จำนวน"
                                        />

                                        {items.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveItem(idx)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1">
                            <Label htmlFor="notes" className="text-xs font-semibold">หมายเหตุ / เหตุผลการโอน</Label>
                            <Input
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="เช่น เติมสต็อกหน้าร้านรายสัปดาห์, สินค้าขาด..."
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter>
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
                            disabled={loading}
                            className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground cursor-pointer"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />}
                            ยืนยันการโอนย้ายสต็อก
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

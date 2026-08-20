"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createExpense, uploadReceipt } from "@/lib/actions/expenses";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRESET_CATEGORIES = [
    "Supplies",
    "Transport",
    "Food",
    "Utilities",
    "Wages",
    "Rent",
    "Other"
];

interface CreateExpenseDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showTrigger?: boolean;
}

export function CreateExpenseDialog({
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    showTrigger = true
}: CreateExpenseDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
    const [customCategory, setCustomCategory] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [receiptUrl, setReceiptUrl] = useState("");

    // Tax fields
    const [vendorName, setVendorName] = useState("");
    const [vendorTaxId, setVendorTaxId] = useState("");
    const [whtRate, setWhtRate] = useState("0");
    const [inputVat, setInputVat] = useState("");

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("receipt", file);
            const result = await uploadReceipt(formData) as any;
            if (result.success) {
                setReceiptUrl(result.receipt_url);
                toast({ title: "Uploaded", description: "Receipt attached successfully." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to upload receipt", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const removeReceipt = () => {
        setReceiptUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async () => {
        if (!title || !amount) {
            toast({ title: "Error", description: "Please fill in title and amount", variant: "destructive" });
            return;
        }

        const finalCategory = category === "Other" ? customCategory || "Other" : category;

        setLoading(true);
        try {
            const parsedAmount = parseFloat(amount);
            const parsedWhtRate = parseFloat(whtRate);
            const whtAmount = parsedWhtRate > 0 ? (parsedAmount * parsedWhtRate) / 100 : 0;
            const parsedInputVat = inputVat ? parseFloat(inputVat) : 0;

            const result = await createExpense({
                title,
                amount: parsedAmount,
                category: finalCategory,
                description,
                date,
                receipt_url: receiptUrl,
                vendor_name: vendorName || undefined,
                vendor_tax_id: vendorTaxId || undefined,
                wht_rate: parsedWhtRate || undefined,
                wht_amount: whtAmount || undefined,
                input_vat: parsedInputVat || undefined,
            }) as any;

            if (result.success) {
                toast({ title: "Success", description: "Expense saved successfully." });
                setOpen(false); startTransition(() => { router.refresh(); });
                // Reset form
                setTitle("");
                setAmount("");
                setCategory(PRESET_CATEGORIES[0]);
                setCustomCategory("");
                setDescription("");
                setDate(new Date().toISOString().split("T")[0]);
                setReceiptUrl("");
                setVendorName("");
                setVendorTaxId("");
                setWhtRate("0");
                setInputVat("");
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Unexpected error", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs gap-1.5 font-medium">
                        <Plus className="h-3.5 w-3.5" /> Add Expense
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record New Expense</DialogTitle>
                    <DialogDescription>
                        Log operating costs, VAT receipts, and withholding tax records.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Coffee, Taxi"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="amount">Amount (THB)</Label>
                            <Input
                                id="amount"
                                type="number"
                                min={0}
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {PRESET_CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        {category === "Other" && (
                            <Input
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Specify category..."
                                className="mt-2"
                            />
                        )}
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h4 className="text-sm font-medium mb-3">Tax Information (Optional)</h4>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="vendorName">Vendor Name</Label>
                                <Input
                                    id="vendorName"
                                    value={vendorName}
                                    onChange={(e) => setVendorName(e.target.value)}
                                    placeholder="Company Ltd."
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="vendorTaxId">Tax ID</Label>
                                <Input
                                    id="vendorTaxId"
                                    value={vendorTaxId}
                                    onChange={(e) => setVendorTaxId(e.target.value)}
                                    placeholder="13-digit ID"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="whtRate">WHT (50 Tawi)</Label>
                                <select
                                    id="whtRate"
                                    value={whtRate}
                                    onChange={(e) => setWhtRate(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="0">None (0%)</option>
                                    <option value="1">1% (Transportation)</option>
                                    <option value="2">2% (Advertising)</option>
                                    <option value="3">3% (Service/Contractor)</option>
                                    <option value="5">5% (Rent/Prizes)</option>
                                </select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="inputVat">Input VAT (PP.30)</Label>
                                <div className="relative">
                                    <Input
                                        id="inputVat"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={inputVat}
                                        onChange={(e) => setInputVat(e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {amount && !inputVat && (
                                        <button
                                            type="button"
                                            className="absolute right-2 top-2 text-xs text-blue-500 hover:text-blue-700 font-medium"
                                            onClick={() => setInputVat((parseFloat(amount) * 0.07).toFixed(2))}
                                        >
                                            Calc 7%
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Receipt (Optional)</Label>
                        {receiptUrl ? (
                            <div className="relative group w-full h-40 border rounded-lg overflow-hidden bg-muted/50">
                                <img src={receiptUrl} alt="Receipt" className="w-full h-full object-contain" />
                                <button
                                    onClick={removeReceipt}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-red-500 text-white transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                className={cn(
                                    "flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                    uploading ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 hover:border-primary/50"
                                )}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                                        <span className="text-xs text-muted-foreground">Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                        <span className="text-xs text-muted-foreground">Click to upload</span>
                                    </>
                                )}
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleReceiptUpload}
                            className="hidden"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="description">Note</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Additional details..."
                            className="h-20"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSubmit} disabled={loading || uploading}>
                        {loading ? "Saving..." : "Save Expense"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

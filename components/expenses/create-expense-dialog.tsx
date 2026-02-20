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
import { useState, useRef } from "react";
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

export function CreateExpenseDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
    const [customCategory, setCustomCategory] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [receiptUrl, setReceiptUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

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
            const result = await createExpense({
                title,
                amount: parseFloat(amount),
                category: finalCategory,
                description,
                date,
                receipt_url: receiptUrl,
            }) as any;

            if (result.success) {
                toast({ title: "Success", description: "Expense saved successfully." });
                setOpen(false);
                // Reset form
                setTitle("");
                setAmount("");
                setCategory(PRESET_CATEGORIES[0]);
                setCustomCategory("");
                setDescription("");
                setDate(new Date().toISOString().split("T")[0]);
                setReceiptUrl("");
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
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Expense</DialogTitle>
                    <DialogDescription>Record your expenses.</DialogDescription>
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
                    <Button onClick={handleSubmit} disabled={loading || uploading}>
                        {loading ? "Saving..." : "Save Expense"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

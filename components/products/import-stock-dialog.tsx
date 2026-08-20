
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
import { importProducts } from "@/lib/actions/products";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function ImportStockDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        try {
            const result = await importProducts(formData);
            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: result.message,
                });
                setOpen(false);
            } else {
                toast({
                    title: "Import Failed",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-medium">
                    <Upload className="h-3.5 w-3.5 text-muted-foreground" /> Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Import Stock</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to update stock levels. Format: <code>Name, Stock, Price</code>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-3 py-3 text-xs">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="file" className="text-xs">CSV File</Label>
                            <Input id="file" name="file" type="file" accept=".csv,image/*" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Importing..." : "Import Stock"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

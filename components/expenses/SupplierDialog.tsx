"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { Supplier } from "@/types";
import { toast } from "sonner";

interface SupplierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier?: Supplier;
    onSuccess?: (supplier?: Supplier) => void;
}

export function SupplierDialog({ open, onOpenChange, supplier, onSuccess }: SupplierDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: supplier?.name || "",
        email: supplier?.email || "",
        phone: supplier?.phone || "",
        address: supplier?.address || "",
    });

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name || "",
                email: supplier.email || "",
                phone: supplier.phone || "",
                address: supplier.address || "",
            });
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                address: "",
            });
        }
    }, [supplier, open]);

    const isEditing = !!supplier;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing) {
                const res = await updateSupplier(supplier.id, formData);
                if ('error' in res) {
                    toast.error(res.error);
                } else {
                    toast.success("Supplier updated successfully");
                    onSuccess?.();
                    onOpenChange(false);
                }
            } else {
                const res = await createSupplier(formData);
                if ('error' in res) {
                    toast.error(res.error);
                } else {
                    toast.success("Supplier created successfully");
                    onSuccess?.(res.supplier);
                    onOpenChange(false);
                }
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Supplier Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter supplier name"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="supplier@example.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="08x-xxx-xxxx"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Enter supplier address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Supplier"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

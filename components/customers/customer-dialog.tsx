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
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this, otherwise use Input
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import { Customer } from "@/types";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface CustomerDialogProps {
    customerToEdit?: Customer;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CustomerDialog({ customerToEdit, open: controlledOpen, onOpenChange }: CustomerDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const isEditMode = !!customerToEdit;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            line_id: formData.get("line_id") as string,
            address: formData.get("address") as string,
        };

        try {
            let result;
            if (isEditMode && customerToEdit) {
                result = await updateCustomer(customerToEdit.id, data);
            } else {
                result = await createCustomer(data);
            }

            if (result.success) {
                toast({
                    title: isEditMode ? "Customer Updated" : "Customer Created",
                    description: `Successfully ${isEditMode ? "updated" : "added"} ${data.name}.`,
                });
                setOpen(false);
            } else {
                toast({
                    title: "Error",
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
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Customer
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Customer" : "Add Customer"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? "Update customer details." : "Add a new customer to your CRM."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" defaultValue={customerToEdit?.name} required />
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" defaultValue={customerToEdit?.phone} />
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={customerToEdit?.email} />
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="line_id">Line ID</Label>
                            <Input id="line_id" name="line_id" defaultValue={customerToEdit?.line_id} />
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" name="address" defaultValue={customerToEdit?.address} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

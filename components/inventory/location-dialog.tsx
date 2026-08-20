"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Location } from "@/types";
import { createLocation, updateLocation } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface LocationDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    location?: Location;
}

export function LocationDialog({ open, setOpen, location }: LocationDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: location?.name || "",
        code: location?.code || "",
        type: location?.type || "warehouse",
        country: location?.country || "US",
        address: location?.address || "",
    });

    useEffect(() => {
        if (location) {
            setFormData({
                name: location.name || "",
                code: location.code || "",
                type: location.type || "warehouse",
                country: location.country || "US",
                address: location.address || "",
            });
        } else {
            setFormData({
                name: "",
                code: "",
                type: "warehouse",
                country: "US",
                address: "",
            });
        }
    }, [location, open]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const data = {
            name: formData.name,
            code: formData.code || undefined,
            type: formData.type as any,
            country: formData.country,
            address: formData.address,
        };

        const result = location
            ? await updateLocation(location.id, data)
            : await createLocation(data);

        if (result.success) {
            toast.success(location ? "Location updated" : "Location created");
            setOpen(false);
        } else {
            toast.error(result.error);
        }

        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{location ? "Edit Warehouse / Location" : "Add Global Location"}</DialogTitle>
                        <DialogDescription>
                            Create a warehouse, fulfillment center (3PL/FBA), storefront, or transit hub.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Location Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. US West Hub"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="code">Location Code</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g. WH-US-01"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Facility Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="warehouse">Primary Warehouse</SelectItem>
                                        <SelectItem value="3pl">3PL / Fulfillment Center</SelectItem>
                                        <SelectItem value="storefront">Physical Storefront</SelectItem>
                                        <SelectItem value="other">Transit / Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="country">Country Code</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    placeholder="e.g. US, DE, JP, TH"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Address & Port Info</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Warehouse address or fulfillment logistics address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Saving..." : "Save Location"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

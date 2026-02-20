"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, uploadAvatar, uploadSignature } from "@/lib/actions/profile";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, Store, Upload, Phone } from "lucide-react";

interface StoreFormProps {
    store: {
        id: string;
        store_name: string;
        avatar_url: string;
        store_address: string;
        tax_id: string;
        signature_url: string;
        store_phone: string;
    };
}

export function StoreForm({ store }: StoreFormProps) {
    const [storeName, setStoreName] = useState(store.store_name);
    const [storeAddress, setStoreAddress] = useState(store.store_address);
    const [taxId, setTaxId] = useState(store.tax_id);
    const [avatarUrl, setAvatarUrl] = useState(store.avatar_url);
    const [signatureUrl, setSignatureUrl] = useState(store.signature_url);
    const [storePhone, setStorePhone] = useState(store.store_phone);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingSig, setUploadingSig] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sigInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateProfile({
                store_name: storeName,
                store_address: storeAddress,
                tax_id: taxId,
                store_phone: storePhone,
            }) as any;
            if (result.success) {
                toast({ title: "Saved", description: "Store profile updated." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setAvatarUrl(previewUrl);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const result = await uploadAvatar(formData) as any;
            if (result.success) {
                setAvatarUrl(result.avatar_url);
                toast({ title: "Uploaded", description: "Store logo updated." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
                setAvatarUrl(store.avatar_url);
            }
        } catch {
            toast({ title: "Error", description: "This failed to upload.", variant: "destructive" });
            setAvatarUrl(store.avatar_url);
        } finally {
            setUploading(false);
        }
    };

    const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setSignatureUrl(previewUrl);

        setUploadingSig(true);
        try {
            const formData = new FormData();
            formData.append("signature", file);
            const result = await uploadSignature(formData) as any;
            if (result.success) {
                setSignatureUrl(result.signature_url);
                toast({ title: "Uploaded", description: "Signature uploaded." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
                setSignatureUrl(store.signature_url);
            }
        } catch {
            toast({ title: "Error", description: "Failed to upload.", variant: "destructive" });
            setSignatureUrl(store.signature_url);
        } finally {
            setUploadingSig(false);
        }
    };

    const initials = storeName ? storeName.charAt(0).toUpperCase() : "S";

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Store Profile
                </CardTitle>
                <CardDescription>Store information will appear on quotations and receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Store Logo */}
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <Avatar className="h-20 w-20 border-2 border-border">
                            <AvatarImage src={avatarUrl} alt="Store Logo" />
                            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                            <Camera className="h-5 w-5 text-white" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {uploading ? "Uploading..." : "Store Logo"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Click to change · JPG, PNG max 2MB</p>
                    </div>
                </div>

                {/* Store Name */}
                <div className="grid gap-1.5">
                    <Label htmlFor="store_name">Store Name</Label>
                    <Input
                        id="store_name"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g. MateFlow Coffee"
                    />
                </div>

                {/* Store Phone */}
                <div className="grid gap-1.5">
                    <Label htmlFor="store_phone">Phone Number</Label>
                    <Input
                        id="store_phone"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        placeholder="e.g. 02-123-4567 or 081-234-5678"
                    />
                </div>

                {/* Store Address */}
                <div className="grid gap-1.5">
                    <Label htmlFor="store_address">Address</Label>
                    <Textarea
                        id="store_address"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        placeholder="e.g. 123/45 Sukhumvit Rd., Klongtoey, Bangkok 10110"
                        rows={3}
                    />
                </div>

                {/* Tax ID */}
                <div className="grid gap-1.5">
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input
                        id="tax_id"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="e.g. 0-1234-56789-01-2"
                        maxLength={20}
                    />
                </div>

                {/* Signature / Stamp Upload */}
                <div className="grid gap-1.5">
                    <Label>Signature / Stamp</Label>
                    <p className="text-xs text-muted-foreground">Appears on documents (Transparent PNG recommended)</p>
                    {signatureUrl ? (
                        <div className="relative group w-fit">
                            <div className="border rounded-lg p-3 bg-muted/50 inline-block">
                                <img
                                    src={signatureUrl}
                                    alt="Signature"
                                    className="h-20 max-w-[200px] object-contain"
                                />
                            </div>
                            <button
                                onClick={() => sigInputRef.current?.click()}
                                disabled={uploadingSig}
                                className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            >
                                <Camera className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => sigInputRef.current?.click()}
                            disabled={uploadingSig}
                            className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {uploadingSig ? "Uploading..." : "Upload Signature / Stamp"}
                            </span>
                        </button>
                    )}
                    <input
                        ref={sigInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureChange}
                        className="hidden"
                    />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save"}
                </Button>
            </CardContent>
        </Card>
    );
}

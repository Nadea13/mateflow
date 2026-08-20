"use client";

import { useState } from "react";
import { StoreForm } from "@/components/profile/profile-form";
import { LocationTable } from "@/components/inventory/location-table";
import { LocationDialog } from "@/components/inventory/location-dialog";
import { Location } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Store, Building2, MapPin } from "lucide-react";
import { useTranslation } from "@/lib/i18n/provider";

interface StoreBranchesViewProps {
    storeProfile: any;
    locations: Location[];
}

export function StoreBranchesView({ storeProfile, locations }: StoreBranchesViewProps) {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | undefined>(undefined);

    const handleEditLocation = (location: Location) => {
        setEditingLocation(location);
        setDialogOpen(true);
    };

    const handleCreateLocation = () => {
        setEditingLocation(undefined);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="pb-3 border-b border-border">
                <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    ข้อมูลร้านค้าและสาขา
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                    จัดการข้อมูลโปรไฟล์ร้านค้า โลโก้ ที่อยู่ เลขผู้เสียภาษี และจัดการสาขา / คลังสินค้าทั้งหมด
                </p>
            </div>

            {/* 1. ข้อมูลร้านค้าหลัก (Main Store Details) */}
            <div className="space-y-4">
                <StoreForm store={storeProfile} />
            </div>

            {/* 2. จัดการสาขาและคลังสินค้า (Branches & Warehouses) */}
            <Card className="max-w-2xl border border-border bg-card shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            สาขาและคลังสินค้า ({locations.length})
                        </CardTitle>
                        <CardDescription className="text-xs">
                            เพิ่มสาขาหน้าร้าน จุดกระจายสินค้า หรือคลังสินค้าสำหรับตัดสต็อก
                        </CardDescription>
                    </div>
                    <Button size="sm" onClick={handleCreateLocation} className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground">
                        <Plus className="h-3.5 w-3.5" />
                        เพิ่มสาขา / คลัง
                    </Button>
                </CardHeader>
                <CardContent className="pt-0">
                    <LocationTable locations={locations} onEdit={handleEditLocation} />
                </CardContent>
            </Card>

            {/* Location Dialog for Add/Edit */}
            <LocationDialog
                open={dialogOpen}
                setOpen={setDialogOpen}
                location={editingLocation}
            />
        </div>
    );
}

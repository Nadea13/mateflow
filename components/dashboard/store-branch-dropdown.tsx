"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Building2, ChevronDown, Check, Plus, ArrowLeftRight, Settings, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { switchActiveStore } from "@/lib/actions/profile";
import { toast } from "sonner";
import { CreateStoreDialog } from "@/components/store/create-store-dialog";
import { LocationDialog } from "@/components/inventory/location-dialog";

interface StoreBranchDropdownProps {
    storeName?: string;
    activeStoreId?: string;
    userRole?: string;
    assignedBranchId?: string | null;
    stores?: any[];
    locations?: any[];
}

export function StoreBranchDropdown({
    storeName: initialStoreName,
    activeStoreId,
    userRole = "owner",
    assignedBranchId,
    stores = [],
    locations = [],
}: StoreBranchDropdownProps) {
    const [open, setOpen] = useState(false);
    const [createStoreOpen, setCreateStoreOpen] = useState(false);
    const [createLocationOpen, setCreateLocationOpen] = useState(false);
    const [switchStoreOpen, setSwitchStoreOpen] = useState(false);
    const [switchingStoreId, setSwitchingStoreId] = useState<string | null>(null);

    const hasStore = stores.length > 0;

    // Find current active store object
    const currentStoreObj = stores.find(s => s.id === activeStoreId) || stores[0];
    const displayStoreName = initialStoreName?.trim() || currentStoreObj?.store_name || "MateFlow Store";
    const effectiveRole = currentStoreObj?.user_role || userRole || "owner";

    // Filter accessible locations based on employee assigned_branch_id
    const accessibleLocations = assignedBranchId 
        ? locations.filter(l => l.id === assignedBranchId)
        : locations;

    // Active selected branch (defaults to assigned or first available)
    const [selectedBranchId, setSelectedBranchId] = useState<string>(
        assignedBranchId || accessibleLocations[0]?.id || "main"
    );

    const activeBranch = accessibleLocations.find((l) => l.id === selectedBranchId);
    const branchLabel = activeBranch ? activeBranch.name : (accessibleLocations.length > 0 ? accessibleLocations[0]?.name : "สาขาหลัก");

    const handleSelectStore = async (store: any) => {
        setSwitchingStoreId(store.id);
        try {
            const res = await switchActiveStore(store.id);
            if (res.success) {
                toast.success(`สลับไปที่ร้าน "${store.store_name}" เรียบร้อยแล้ว`);
                setSwitchStoreOpen(false);
                window.location.reload();
            } else {
                toast.error("Failed to switch store");
            }
        } catch (err: any) {
            console.error("Switch store error:", err);
            toast.error(err?.message || "Error switching store");
        } finally {
            setSwitchingStoreId(null);
        }
    };

    // If user has no store yet, render direct prominent "สร้างร้านค้า" Button
    if (!hasStore) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setCreateStoreOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-primary/60 bg-primary/10 hover:bg-primary/20 hover:border-primary text-primary transition-all duration-150 shadow-2xs group cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs font-bold">+ สร้างร้านค้าของคุณ</span>
                </button>

                <CreateStoreDialog
                    open={createStoreOpen}
                    setOpen={setCreateStoreOpen}
                />
            </>
        );
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border/80 bg-sidebar-accent/50 hover:bg-sidebar-accent hover:border-border transition-all duration-150 text-left shadow-2xs group cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 shadow-2xs">
                                <Store className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-xs font-bold text-foreground truncate" title={displayStoreName}>
                                    {displayStoreName}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 leading-none">
                                    <Building2 className="h-2.5 w-2.5 text-primary shrink-0" />
                                    <span className="truncate max-w-[140px] font-medium">{branchLabel}</span>
                                </span>
                            </div>
                        </div>
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-foreground" : ""}`} />
                    </button>
                </PopoverTrigger>

                <PopoverContent align="start" side="bottom" className="w-80 p-2.5 shadow-2xl border-border bg-popover/95 backdrop-blur-xl rounded-xl space-y-2.5 z-50">
                    {/* Active Store Card */}
                    <div className="p-2.5 rounded-xl bg-muted/60 border border-border/70">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                                    {currentStoreObj?.avatar_url ? (
                                        <img src={currentStoreObj.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        displayStoreName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                                        {displayStoreName}
                                    </span>
                                    {currentStoreObj?.tax_id && (
                                        <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[120px] mt-0.5">
                                            Tax ID: {currentStoreObj.tax_id}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setOpen(false);
                                        setSwitchStoreOpen(true);
                                    }}
                                    className="h-7 px-2 text-[10px] font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                                    title="เปลี่ยนร้านค้า"
                                >
                                    <ArrowLeftRight className="h-3 w-3" />
                                    เปลี่ยนร้าน
                                </Button>
                                {effectiveRole === "owner" && (
                                    <Link
                                        href="/dashboard/store"
                                        onClick={() => setOpen(false)}
                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="ตั้งค่าข้อมูลร้านค้า"
                                    >
                                        <Settings className="h-3.5 w-3.5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Branch Selection Section */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                สาขา ({accessibleLocations.length})
                            </span>
                            {effectiveRole === "owner" && (
                                <button
                                    onClick={() => {
                                        setOpen(false);
                                        setCreateLocationOpen(true);
                                    }}
                                    className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                                >
                                    <Plus className="h-2.5 w-2.5" />
                                    เพิ่มสาขา
                                </button>
                            )}
                        </div>

                        <div className="space-y-0.5 max-h-40 overflow-y-auto pr-0.5">
                            {accessibleLocations.length === 0 ? (
                                <div className="p-2 text-center text-[10px] text-muted-foreground">
                                    ยังไม่มีสาขาในร้านนี้
                                </div>
                            ) : (
                                accessibleLocations.map((loc) => {
                                    const isSelected = selectedBranchId === loc.id;
                                    return (
                                        <button
                                            key={loc.id}
                                            onClick={() => {
                                                setSelectedBranchId(loc.id);
                                                setOpen(false);
                                                toast.success(`เลือกสาขา: ${loc.name}`);
                                            }}
                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                                                isSelected
                                                    ? "bg-primary/10 text-primary font-bold"
                                                    : "hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Building2 className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="truncate">{loc.name}</span>
                                                    {loc.code && (
                                                        <span className="text-[9px] text-muted-foreground font-mono">
                                                            {loc.code} • {loc.type || "warehouse"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="border-t border-border/60 pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setOpen(false);
                                setCreateStoreOpen(true);
                            }}
                            className="w-full h-8 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary justify-center px-2 gap-1.5 cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5 text-primary" />
                            + เพิ่มร้านใหม่
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Dialog 1: Create New Store */}
            <CreateStoreDialog
                open={createStoreOpen}
                setOpen={setCreateStoreOpen}
            />

            {/* Dialog 2: Create New Branch/Location */}
            <LocationDialog
                open={createLocationOpen}
                setOpen={setCreateLocationOpen}
            />

            {/* Dialog 3: Switch Store Modal */}
            <Dialog open={switchStoreOpen} onOpenChange={setSwitchStoreOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <ArrowLeftRight className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    สลับร้านค้าที่กำลังทำงาน
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    เลือกร้านค้าที่คุณต้องการทำงาน
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-1.5 py-2 max-h-[280px] overflow-y-auto pr-1">
                        {stores.map((store) => {
                            const isCurrent = store.id === currentStoreObj?.id;
                            const isSwitching = switchingStoreId === store.id;

                            return (
                                <button
                                    key={store.id}
                                    type="button"
                                    onClick={() => !isCurrent && handleSelectStore(store)}
                                    disabled={isCurrent || !!switchingStoreId}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150 text-left cursor-pointer ${
                                        isCurrent
                                            ? "border-primary/40 bg-primary/5 text-foreground shadow-2xs font-bold"
                                            : "border-border/70 hover:border-border hover:bg-muted/50 text-foreground"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                                            {store.avatar_url ? (
                                                <img src={store.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                store.store_name?.charAt(0).toUpperCase() || "S"
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold truncate max-w-[170px]">
                                                    {store.store_name}
                                                </span>
                                                {isCurrent && (
                                                    <span className="text-[8px] bg-primary text-primary-foreground font-bold px-1.5 py-0.2 rounded-full">
                                                        กำลังใช้งาน
                                                    </span>
                                                )}
                                            </div>
                                            {store.tax_id && (
                                                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                    Tax: {store.tax_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isSwitching ? (
                                        <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                                    ) : isCurrent ? (
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSwitchStoreOpen(false);
                                setCreateStoreOpen(true);
                            }}
                            className="w-full h-8 text-xs font-semibold gap-1.5 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            + เพิ่มร้านค้าใหม่อีกร้าน
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

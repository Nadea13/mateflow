"use client";

import { useState } from "react";
import { Store, Building2, ChevronDown, Plus, Check, Settings, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocationDialog } from "@/components/inventory/location-dialog";
import { CreateStoreDialog } from "@/components/store/create-store-dialog";
import { Location } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StoreBranchDropdownProps {
    storeName?: string;
    activeStoreId?: string;
    stores?: any[];
    locations?: Location[];
}

export function StoreBranchDropdown({
    storeName,
    activeStoreId,
    stores = [],
    locations = [],
}: StoreBranchDropdownProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [addBranchOpen, setAddBranchOpen] = useState(false);
    const [createStoreOpen, setCreateStoreOpen] = useState(false);
    const [switchStoreOpen, setSwitchStoreOpen] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState<string>(locations[0]?.id || "main");

    const hasStore = !!storeName && storeName.trim().length > 0;
    const activeBranch = locations.find((l) => l.id === selectedBranchId);
    const branchLabel = activeBranch ? activeBranch.name : "สาขาหลัก (Headquarters)";

    // IF NO STORE YET: Render Clean Single "+" Button that triggers Dialog
    if (!hasStore) {
        return (
            <>
                <Button
                    size="sm"
                    onClick={() => setCreateStoreOpen(true)}
                    className="w-full h-9 text-xs font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs rounded-lg justify-start px-3 cursor-pointer"
                >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span className="truncate">สร้างร้านค้าของคุณ</span>
                </Button>

                <CreateStoreDialog
                    open={createStoreOpen}
                    setOpen={setCreateStoreOpen}
                />
            </>
        );
    }

    const handleSelectStore = (store: any) => {
        setSwitchStoreOpen(false);
        toast.success(`สลับไปที่ร้าน "${store.store_name}" เรียบร้อยแล้ว`);
        // Navigate or refresh to load this store's scope
        router.push(`/dashboard/store?storeId=${store.id}`);
        router.refresh();
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-border/80 bg-sidebar-accent/40 hover:bg-sidebar-accent hover:border-border transition-all duration-150 text-left shadow-2xs group cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                                <Store className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5 leading-none">
                                    <span className="text-xs font-bold text-foreground truncate max-w-[125px]">
                                        {storeName}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 leading-none">
                                    <Building2 className="h-2.5 w-2.5 text-primary shrink-0" />
                                    <span className="truncate max-w-[115px]">{branchLabel}</span>
                                </span>
                            </div>
                        </div>
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-foreground" : ""}`} />
                    </button>
                </PopoverTrigger>

                <PopoverContent align="start" side="bottom" className="w-72 p-2 shadow-2xl border-border bg-popover/95 backdrop-blur-xl rounded-xl space-y-2.5 z-50">
                    {/* Active Store Header & Actions (Settings + Switch Store Button on the right) */}
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                                    <Store className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-foreground truncate max-w-[100px]">{storeName}</span>
                                    <span className="text-[10px] text-muted-foreground">ร้านปัจจุบัน</span>
                                </div>
                            </div>
                            
                            {/* Action Buttons: 1. ตั้งค่า, 2. สลับร้าน (ทางขวาของตั้งค่า) */}
                            <div className="flex items-center gap-2 shrink-0">
                                <Link href="/dashboard/store" onClick={() => setOpen(false)}>
                                    <span className="text-[10px] text-muted-foreground hover:text-foreground font-medium cursor-pointer flex items-center gap-0.5 transition-colors">
                                        <Settings className="h-3 w-3" />
                                        ตั้งค่า
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        setSwitchStoreOpen(true);
                                    }}
                                    className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                                    title="สลับไปร้านอื่น"
                                >
                                    <ArrowLeftRight className="h-2.5 w-2.5" />
                                    เปลี่ยนร้าน
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Branches List Header */}
                    <div className="px-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            สาขาและคลัง ({locations.length > 0 ? locations.length : 1})
                        </span>
                    </div>

                    {/* Branches Selection List */}
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
                        {/* Default / Primary Headquarters Branch */}
                        {locations.length === 0 ? (
                            <button
                                onClick={() => {
                                    setSelectedBranchId("main");
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                    selectedBranchId === "main"
                                        ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                                        : "hover:bg-muted/60 text-foreground"
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <div className="flex flex-col text-left min-w-0">
                                        <span className="truncate">สาขาหลัก (Headquarters)</span>
                                        <span className="text-[10px] text-muted-foreground font-normal">คลังสินค้าเริ่มต้น</span>
                                    </div>
                                </div>
                                {selectedBranchId === "main" && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                            </button>
                        ) : (
                            locations.map((loc) => {
                                const isSelected = selectedBranchId === loc.id;
                                return (
                                    <button
                                        key={loc.id}
                                        onClick={() => {
                                            setSelectedBranchId(loc.id);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                                            isSelected
                                                ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                                                : "hover:bg-muted/60 text-foreground"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <div className="flex flex-col text-left min-w-0">
                                                <span className="truncate max-w-[170px]">{loc.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[170px]">
                                                    {loc.code ? `รหัส: ${loc.code}` : loc.address || "สาขา / คลัง"}
                                                </span>
                                            </div>
                                        </div>
                                        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom Actions: 1. Add Branch, 2. Add New Store */}
                    <div className="pt-1.5 border-t border-border/60 space-y-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setOpen(false);
                                setAddBranchOpen(true);
                            }}
                            className="w-full h-8 text-xs font-semibold justify-center gap-1.5 text-primary hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>+ เพิ่มสาขาใหม่</span>
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setOpen(false);
                                setCreateStoreOpen(true);
                            }}
                            className="w-full h-8 text-xs font-semibold justify-center gap-1.5 border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                        >
                            <Store className="h-3.5 w-3.5" />
                            <span>+ เพิ่มร้านใหม่</span>
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Modal Switch Store (เลือกร้านค้า) */}
            <Dialog open={switchStoreOpen} onOpenChange={setSwitchStoreOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <ArrowLeftRight className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">เลือกร้านค้าที่ต้องการจัดการ</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    คุณมีร้านค้าทั้งหมด {stores.length > 0 ? stores.length : 1} ร้าน
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-2 py-3 max-h-64 overflow-y-auto">
                        {stores.length === 0 ? (
                            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Store className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-semibold">{storeName}</span>
                                </div>
                                <span className="text-[10px] text-primary font-bold">กำลังใช้งาน</span>
                            </div>
                        ) : (
                            stores.map((s) => {
                                const isCurrent = (s.id === activeStoreId) || (s.store_name === storeName);
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSelectStore(s)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                            isCurrent
                                                ? "border-primary bg-primary/10 shadow-xs"
                                                : "border-border/80 hover:border-primary/40 hover:bg-muted/50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {s.avatar_url ? (
                                                <img src={s.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                            ) : (
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                                    <Store className="h-4 w-4" />
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-foreground truncate">{s.store_name || "ไม่มีชื่อร้าน"}</span>
                                                <span className="text-[10px] text-muted-foreground truncate">{s.store_phone || s.store_address || "ร้านค้าของคุณ"}</span>
                                            </div>
                                        </div>
                                        {isCurrent && (
                                            <div className="flex items-center gap-1 text-[11px] font-semibold text-primary shrink-0">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="pt-2 border-t border-border/60">
                        <Button
                            size="sm"
                            onClick={() => {
                                setSwitchStoreOpen(false);
                                setCreateStoreOpen(true);
                            }}
                            className="w-full h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            สร้างร้านค้าใหม่อีกร้าน
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal for adding a new location/branch */}
            <LocationDialog
                open={addBranchOpen}
                setOpen={setAddBranchOpen}
            />

            {/* Modal for adding a new store */}
            <CreateStoreDialog
                open={createStoreOpen}
                setOpen={setCreateStoreOpen}
            />
        </>
    );
}

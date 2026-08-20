"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Building2, ChevronDown, Check, Plus, ArrowLeftRight, Settings, Loader2, Sparkles, UserPlus, KeyRound, Shield, ShieldCheck, MapPin, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { switchActiveStore } from "@/lib/actions/profile";
import { joinStoreWithCode } from "@/app/actions/team";
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
    const [joinStoreOpen, setJoinStoreOpen] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [joining, setJoining] = useState(false);
    const [switchingStoreId, setSwitchingStoreId] = useState<string | null>(null);

    // Find current active store object
    const currentStoreObj = stores.find(s => s.id === activeStoreId) || (stores.length > 0 ? stores[0] : null);
    const hasAnyStore = !!currentStoreObj || (initialStoreName && initialStoreName.trim().length > 0 && initialStoreName !== "My Store");
    const displayStoreName = initialStoreName?.trim() || currentStoreObj?.store_name || "";
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

    // Format Role Thai Label
    const roleLabels: Record<string, { label: string; color: string; iconBg: string }> = {
        owner: { label: "เจ้าของร้าน", color: "bg-primary/10 text-primary border-primary/20", iconBg: "bg-primary/10 text-primary" },
        admin: { label: "ผู้จัดการสาขา", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", iconBg: "bg-indigo-500/10 text-indigo-600" },
        accountant: { label: "ฝ่ายบัญชี", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", iconBg: "bg-emerald-500/10 text-emerald-600" },
        stock_keeper: { label: "ผู้ดูแลคลัง", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", iconBg: "bg-amber-500/10 text-amber-600" },
        sales: { label: "พนักงานขาย", color: "bg-sky-500/10 text-sky-600 border-sky-500/20", iconBg: "bg-sky-500/10 text-sky-600" },
    };

    const currentRoleBadge = roleLabels[effectiveRole] || { label: effectiveRole, color: "bg-muted text-muted-foreground border-border", iconBg: "bg-muted text-muted-foreground" };

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

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) {
            toast.error("กรุณากรอกรหัสร้านค้า (Store Code)");
            return;
        }

        setJoining(true);
        try {
            const formData = new FormData();
            formData.append("storeCode", joinCode.trim().toUpperCase());
            const res = await joinStoreWithCode(formData);

            if (res?.success) {
                toast.success("เข้าร่วมทีมร้านค้าสำเร็จแล้ว!");
                setJoinStoreOpen(false);
                setJoinCode("");
                window.location.reload();
            } else {
                toast.error(res?.error || "รหัสไม่ถูกต้อง หรือหมดอายุ");
            }
        } catch (err: any) {
            toast.error(err?.message || "เกิดข้อผิดพลาดในการเข้าร่วมร้าน");
        } finally {
            setJoining(false);
        }
    };

    return (
        <>
            {!hasAnyStore ? (
                /* When user has NO stores yet -> Show clean Create Store Button */
                <button
                    type="button"
                    onClick={() => setCreateStoreOpen(true)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-150 text-left shadow-2xs group cursor-pointer"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground shrink-0 shadow-2xs">
                            <Plus className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate">
                                + สร้างร้านค้าใหม่
                            </span>
                            <span className="text-[10px] text-primary/80 truncate">
                                คลิกเพื่อเริ่มต้นสร้างร้าน
                            </span>
                        </div>
                    </div>
                </button>
            ) : (
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <button className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border/80 bg-sidebar-accent/50 hover:bg-sidebar-accent hover:border-border transition-all duration-150 text-left shadow-2xs group cursor-pointer">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`p-2 rounded-lg ${currentRoleBadge.iconBg} shrink-0 shadow-2xs`}>
                                    <Store className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1.5 leading-none">
                                        <span className="text-xs font-bold text-foreground truncate max-w-[110px]" title={displayStoreName}>
                                            {displayStoreName}
                                        </span>
                                        {/* Role Badge Indicator */}
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${currentRoleBadge.color}`}>
                                            {currentRoleBadge.label}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1.5 leading-none">
                                        <Building2 className="h-2.5 w-2.5 text-primary shrink-0" />
                                        <span className="truncate max-w-[120px] font-medium">{branchLabel}</span>
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
                                    <span className="text-xs font-bold text-foreground truncate max-w-[110px]" title={displayStoreName}>
                                        {displayStoreName}
                                    </span>
                                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <User className="h-2.5 w-2.5 text-primary" /> ตำแหน่ง: <span className="text-primary font-bold">{currentRoleBadge.label}</span>
                                    </span>
                                </div>
                            </div>
                            
                            {/* Action Buttons: 1. ตั้งค่า, 2. สลับร้าน */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {effectiveRole === "owner" && (
                                    <Link href="/dashboard/store" onClick={() => setOpen(false)}>
                                        <span className="text-[10px] text-muted-foreground hover:text-foreground font-medium cursor-pointer flex items-center gap-0.5 transition-colors px-1.5 py-1 rounded hover:bg-muted">
                                            <Settings className="h-3 w-3" />
                                            ตั้งค่า
                                        </span>
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        setSwitchStoreOpen(true);
                                    }}
                                    className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-2 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
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
                            สาขาที่คุณเข้าทำงาน ({accessibleLocations.length > 0 ? accessibleLocations.length : 1})
                        </span>
                    </div>

                    {/* Branches Selection List */}
                    <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
                        {accessibleLocations.length === 0 ? (
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
                                        <span className="truncate font-semibold">สาขาหลัก (Headquarters)</span>
                                        <span className="text-[10px] text-muted-foreground font-normal">คลังสินค้าเริ่มต้น</span>
                                    </div>
                                </div>
                                {selectedBranchId === "main" && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                            </button>
                        ) : (
                            accessibleLocations.map((loc) => {
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
                                                <span className="truncate max-w-[170px] font-semibold">{loc.name}</span>
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

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 border-t border-border space-y-1">
                        {effectiveRole === "owner" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        setCreateLocationOpen(true);
                                    }}
                                    className="w-full flex items-center gap-2 p-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition-colors font-medium cursor-pointer"
                                >
                                    <Plus className="h-3.5 w-3.5 text-primary" />
                                    + เพิ่มสาขาใหม่
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        setCreateStoreOpen(true);
                                    }}
                                    className="w-full flex items-center gap-2 p-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition-colors font-medium cursor-pointer"
                                >
                                    <Store className="h-3.5 w-3.5 text-primary" />
                                    + เพิ่มร้านใหม่
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                setJoinStoreOpen(true);
                            }}
                            className="w-full flex items-center gap-2 p-1.5 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors font-semibold cursor-pointer"
                        >
                            <UserPlus className="h-3.5 w-3.5 text-primary" />
                            เข้าร่วมร้านด้วยรหัส (Join Team)
                        </button>
                    </div>
                </PopoverContent>
            </Popover>
            )}

            {/* Modal 1: Switch Store Dialog */}
            <Dialog open={switchStoreOpen} onOpenChange={setSwitchStoreOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <ArrowLeftRight className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">ร้านค้าและสาขาที่คุณทำงาน</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    คลิกเลือกร้านค้าเพื่อสลับเข้าไปดูข้อมูลและจัดการสาขาที่ทำ
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-2.5 py-3 max-h-[340px] overflow-y-auto pr-1">
                        {stores.map((s) => {
                            const isCurrent = s.id === activeStoreId || s.store_name === displayStoreName;
                            const isSwitching = switchingStoreId === s.id;
                            const storeRole = s.user_role || (s.owner_id === s.id ? "owner" : "owner");
                            const badge = roleLabels[storeRole] || roleLabels.owner;
                            const storeBranches = s.branches || [];

                            return (
                                <div
                                    key={s.id}
                                    className={`rounded-xl border transition-all overflow-hidden ${
                                        isCurrent
                                            ? "border-primary/40 bg-primary/[0.03] shadow-2xs"
                                            : "border-border/80 bg-card hover:border-primary/30"
                                    }`}
                                >
                                    {/* Store Main Bar */}
                                    <div 
                                        onClick={() => {
                                            if (!isCurrent) {
                                                handleSelectStore(s);
                                            }
                                        }}
                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden">
                                                {s.avatar_url ? (
                                                    <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    s.store_name?.charAt(0)?.toUpperCase() || "S"
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-foreground truncate">{s.store_name}</span>
                                                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground truncate">
                                                    {s.tax_id ? `Tax ID: ${s.tax_id}` : s.store_address || "ร้านค้าที่คุณทำงาน"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {isSwitching ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            ) : isCurrent ? (
                                                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                                                    <Check className="h-3 w-3" /> ใช้งานอยู่
                                                </span>
                                            ) : (
                                                <Button size="sm" variant="outline" className="h-7 text-[11px] font-semibold px-2.5 text-primary border-primary/30 hover:bg-primary/10">
                                                    สลับเข้าร้านนี้
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Branches in this store */}
                                    {storeBranches.length > 0 && (
                                        <div className="px-3 py-2 bg-muted/20 border-t border-border/40 space-y-1">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                                                สาขาที่คุณทำในร้านนี้ ({storeBranches.length} สาขา):
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                {storeBranches.map((b: any) => (
                                                    <div 
                                                        key={b.id} 
                                                        className="flex items-center gap-1.5 p-1.5 rounded-md bg-background border border-border/60 text-xs"
                                                    >
                                                        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold truncate text-[11px]">{b.name}</span>
                                                            <span className="text-[9px] text-muted-foreground truncate">
                                                                {b.code ? `รหัส: ${b.code}` : b.address || "สาขา / คลัง"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter className="flex-row items-center justify-between sm:justify-between border-t border-border pt-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSwitchStoreOpen(false);
                                setJoinStoreOpen(true);
                            }}
                            className="h-8 text-xs font-semibold gap-1 text-primary cursor-pointer"
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                            ใส่รหัสเข้าร่วมร้าน
                        </Button>

                        {effectiveRole === "owner" && (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    setSwitchStoreOpen(false);
                                    setCreateStoreOpen(true);
                                }}
                                className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                สร้างร้านใหม่
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Join Store with Code Dialog */}
            <Dialog open={joinStoreOpen} onOpenChange={setJoinStoreOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <form onSubmit={handleJoinSubmit}>
                        <DialogHeader>
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-semibold">เข้าร่วมทีมร้านค้า</DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        กรอกรหัสเชิญ (เช่น MF-A8B9C2) ที่ได้รับจากเจ้าของร้าน
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="py-4 space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="join-code" className="text-xs font-semibold">
                                    รหัสร้านค้า (Store Code) *
                                </Label>
                                <Input
                                    id="join-code"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="MF-XXXXXX"
                                    className="h-11 text-center font-mono text-lg tracking-widest uppercase font-bold"
                                    required
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setJoinStoreOpen(false)}
                                className="h-8 text-xs cursor-pointer"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={joining}
                                className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground cursor-pointer"
                            >
                                {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                ยืนยันการเข้าร่วม
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 3: Create Store Dialog */}
            <CreateStoreDialog
                open={createStoreOpen}
                setOpen={setCreateStoreOpen}
            />

            {/* Modal 4: Location Dialog */}
            <LocationDialog
                open={createLocationOpen}
                setOpen={setCreateLocationOpen}
            />
        </>
    );
}

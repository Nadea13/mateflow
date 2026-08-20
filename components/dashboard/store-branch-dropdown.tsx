"use client";

import { useState } from "react";
import { Store, Building2, ChevronDown, Plus, Check, MapPin, Sparkles, PlusCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocationDialog } from "@/components/inventory/location-dialog";
import { Location } from "@/types";
import Link from "next/link";

interface StoreBranchDropdownProps {
    storeName?: string;
    locations?: Location[];
}

export function StoreBranchDropdown({
    storeName,
    locations = [],
}: StoreBranchDropdownProps) {
    const [open, setOpen] = useState(false);
    const [addBranchOpen, setAddBranchOpen] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState<string>(locations[0]?.id || "main");

    const hasStore = !!storeName && storeName.trim().length > 0;
    const activeBranch = locations.find((l) => l.id === selectedBranchId);
    const branchLabel = activeBranch ? activeBranch.name : "สาขาหลัก (Headquarters)";

    // IF NO STORE YET: Render prominent "+ Create Store" Button
    if (!hasStore) {
        return (
            <Link href="/dashboard/store">
                <Button
                    size="sm"
                    className="w-full h-9 text-xs font-semibold gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-xs rounded-lg justify-start px-2.5 cursor-pointer"
                >
                    <PlusCircle className="h-4 w-4 shrink-0" />
                    <span className="truncate">+ สร้างร้านค้าของคุณ</span>
                </Button>
            </Link>
        );
    }

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

                <PopoverContent align="start" side="bottom" className="w-72 p-2 shadow-2xl border-border bg-popover/95 backdrop-blur-xl rounded-xl space-y-2 z-50">
                    {/* Store Header Item */}
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                                    <Store className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-foreground truncate">{storeName}</span>
                                    <span className="text-[10px] text-muted-foreground">ร้านค้าหลัก</span>
                                </div>
                            </div>
                            <Link href="/dashboard/store" onClick={() => setOpen(false)}>
                                <span className="text-[10px] text-primary hover:underline font-semibold cursor-pointer">
                                    ตั้งค่าร้าน
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Branches List Header */}
                    <div className="px-1 pt-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            สาขาและคลัง ({locations.length > 0 ? locations.length : 1})
                        </span>
                    </div>

                    {/* Branches Selection List */}
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
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

                    {/* Add Branch Button inside Dropdown */}
                    <div className="pt-1 border-t border-border/60">
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
                            <span>+ เพิ่มสาขา / คลังสินค้าใหม่</span>
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Modal for adding a new location/branch */}
            <LocationDialog
                open={addBranchOpen}
                setOpen={setAddBranchOpen}
            />
        </>
    );
}

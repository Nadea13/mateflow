"use client";

import { useState } from "react";
import { Store, Building2, ChevronDown, Plus, Check, MapPin, Sparkles } from "lucide-react";
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
    storeName = "My Enterprise Store",
    locations = [],
}: StoreBranchDropdownProps) {
    const [open, setOpen] = useState(false);
    const [addBranchOpen, setAddBranchOpen] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState<string>(locations[0]?.id || "main");

    const activeBranch = locations.find((l) => l.id === selectedBranchId);
    const branchLabel = activeBranch ? activeBranch.name : "สาขาหลัก (Headquarters)";

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-accent/60 hover:border-border transition-all duration-150 text-left shadow-2xs group cursor-pointer">
                        <div className="p-1 rounded-md bg-primary/10 text-primary">
                            <Store className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 leading-none">
                                <span className="text-xs font-semibold text-foreground max-w-[130px] sm:max-w-[180px] truncate">
                                    {storeName}
                                </span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-muted/60 text-muted-foreground border-border uppercase font-semibold">
                                    Store
                                </Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 leading-none">
                                <Building2 className="h-2.5 w-2.5 text-primary" />
                                <span className="max-w-[120px] truncate">{branchLabel}</span>
                            </span>
                        </div>
                        <ChevronDown className={`h-3 w-3 text-muted-foreground ml-1 transition-transform duration-200 ${open ? "rotate-180 text-foreground" : ""}`} />
                    </button>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-80 p-2 shadow-xl border-border bg-popover/95 backdrop-blur-xl rounded-xl space-y-2">
                    {/* Store Header Item */}
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                    <Store className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-foreground truncate">{storeName}</span>
                                    <span className="text-[10px] text-muted-foreground">ร้านค้าหลักของคุณ</span>
                                </div>
                            </div>
                            <Link href="/dashboard/store" onClick={() => setOpen(false)}>
                                <span className="text-[10px] text-primary hover:underline font-medium cursor-pointer">
                                    ตั้งค่าร้าน
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Branches List Header */}
                    <div className="px-1 pt-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            สาขาและคลังสินค้า ({locations.length > 0 ? locations.length : 1})
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
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <div className="flex flex-col text-left">
                                        <span>สาขาหลัก (Headquarters)</span>
                                        <span className="text-[10px] text-muted-foreground font-normal">คลังสินค้าและหน้าร้านเริ่มต้น</span>
                                    </div>
                                </div>
                                {selectedBranchId === "main" && <Check className="h-3.5 w-3.5 text-primary" />}
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
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <div className="flex flex-col text-left">
                                                <span className="truncate max-w-[170px]">{loc.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[170px]">
                                                    {loc.code ? `รหัส: ${loc.code}` : loc.address || "คลังสินค้า / สาขา"}
                                                </span>
                                            </div>
                                        </div>
                                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
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
                            <span>เพิ่มสาขา / คลังสินค้าใหม่</span>
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

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { PODialog } from "./PODialog";

export function CreatePOButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} variant="secondary" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Create PO
            </Button>
            <PODialog open={open} onOpenChange={setOpen} />
        </>
    );
}

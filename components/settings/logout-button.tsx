"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOutUser } from "@/lib/actions/profile"
import { useState } from "react"

export function LogoutButton() {
    const [loading, setLoading] = useState(false)

    const handleLogout = async () => {
        setLoading(true)
        await signOutUser()
    }

    return (
        <Button
            variant="outline"
            className="w-full md:hidden border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
            disabled={loading}
        >
            <LogOut className="mr-2 h-4 w-4" />
            {loading ? "Logging out..." : "Log Out"}
        </Button>
    )
}

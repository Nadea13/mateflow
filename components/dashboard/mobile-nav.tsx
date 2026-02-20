"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    History,
    Settings,
    Users,
    Receipt,
    HandCoins,
    Scale,
    Package,
} from "lucide-react"

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Products",
        href: "/dashboard/products",
        icon: Package,
    },
    {
        title: "Customers",
        href: "/dashboard/customers",
        icon: Users,
    },
    {
        title: "Bills",
        href: "/dashboard/bills",
        icon: Receipt,
    },
    {
        title: "Expenses",
        href: "/dashboard/expenses",
        icon: HandCoins,
    },
    {
        title: "Tax",
        href: "/dashboard/tax",
        icon: Scale,
    },
    {
        title: "History",
        href: "/dashboard/history",
        icon: History,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

export function MobileNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden pb-safe print:hidden">
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full py-1 space-y-1",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div
                                className={cn(
                                    "p-1 rounded-full transition-colors",
                                    isActive && "bg-primary/10"
                                )}
                            >
                                <item.icon
                                    className={cn("h-6 w-6", isActive && "fill-current")}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </div>
                            <span className="text-[10px] font-medium">{item.title}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

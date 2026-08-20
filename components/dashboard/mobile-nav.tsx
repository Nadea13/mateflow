"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Settings,
    Library,
    Receipt,
    HandCoins,
    MapPin,
    Calculator,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/provider"

const navItems = [
    {
        titleKey: "nav.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        titleKey: "nav.registry",
        href: "/dashboard/catalog",
        icon: Library,
    },
    {
        titleKey: "nav.bills",
        href: "/dashboard/bills",
        icon: Receipt,
    },
    {
        titleKey: "nav.expenses",
        href: "/dashboard/expenses",
        icon: HandCoins,
    },
    {
        titleKey: "nav.settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

export function MobileNav({ userRole = 'owner' }: { userRole?: 'owner' | 'admin' | 'sales' }) {
    const pathname = usePathname()
    const { t } = useTranslation()

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden pb-safe print:hidden">
            <div className="flex h-16 items-center justify-around px-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
                {navItems.map((item) => {
                    // Role-Based Filtering
                    if (userRole === "sales") {
                        if (
                            item.href === "/dashboard/settings" ||
                            item.href === "/dashboard/expenses"
                        ) {
                            return null; // Hide these for sales
                        }
                    }
                    if (userRole === "admin") {
                        if (item.href === "/dashboard/expenses") {
                            return null; // Hide expense for admin
                        }
                    }

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
                            <span className="text-[10px] font-medium">{t(item.titleKey)}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

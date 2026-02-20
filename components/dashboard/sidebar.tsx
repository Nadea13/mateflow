"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    History,
    LogOut,
    Settings,
    Package,
    Users,
    Receipt,
    HandCoins,
    Scale,
} from "lucide-react"

const sidebarItems = [
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
        title: "Tax Report",
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

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden border-r border-border bg-card md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 print:hidden">
            <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4 mb-5">
                    <div className="mr-3">
                        <svg width="36" height="36" viewBox="0 0 234 234" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.00195 163C8.00195 163 31.6487 154.719 44.002 145C51.0962 139.419 54.7375 130.271 57.002 121M226.002 163C226.002 163 202.399 154.663 190.002 145C182.876 139.446 179.39 130.291 177.002 121M57.002 121C62.3023 99.3004 63.0614 74.6884 84.002 77.5C103.297 80.0907 100.002 112.743 117.002 112.5C134.002 112.257 131.052 80.5388 150.002 77.5C171.046 74.1255 171.368 99.082 177.002 121M57.002 121C57.002 121 65.0804 115.517 71.002 114C94.0634 108.093 94.493 155.36 117.002 155.5C139.647 155.641 139.94 108.093 163.002 114C168.923 115.517 172.236 117.173 177.002 121M58.0019 226H176.002C203.616 226 226.002 203.614 226.002 176V58C226.002 30.3858 203.616 8 176.002 8H58.002C30.3877 8 8.00195 30.3858 8.00195 58V176C8.00195 203.614 30.3877 226 58.0019 226Z" stroke="#0D9488" strokeWidth="16" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Outfit', var(--font-outfit), sans-serif" }}>
                        <span className="text-slate-700 dark:text-slate-200">Mate</span>
                        <span className="bg-teal-600 bg-clip-text text-transparent">Flow</span>
                    </span>
                </div>
                <div className="flex flex-col flex-grow px-3 mt-5">
                    <nav className="flex-1 space-y-1">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-colors group",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "flex-shrink-0 mr-3 h-5 w-5",
                                            isActive
                                                ? "text-primary-foreground"
                                                : "text-muted-foreground group-hover:text-accent-foreground"
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="p-4 border-t border-border">
                    <Link
                        href="/login"
                        className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-muted-foreground rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                        <LogOut className="flex-shrink-0 mr-3 h-5 w-5 text-muted-foreground" />
                        Sign Out
                    </Link>
                </div>
            </div>
        </div>
    )
}

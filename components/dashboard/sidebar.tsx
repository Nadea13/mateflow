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
    FileText,
    Receipt,
    Globe,
    CreditCard,
    Store,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/provider"
import { MateFlowLogo } from "@/components/brand/mateflow-logo"
import { StoreBranchDropdown } from "@/components/dashboard/store-branch-dropdown"
import { Location, Store as StoreType } from "@/types"

const sidebarItems = [
    {
        titleKey: "nav.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        titleKey: "nav.store",
        href: "/dashboard/store",
        icon: Store,
    },
    {
        titleKey: "nav.registry",
        href: "/dashboard/catalog",
        icon: Package,
    },
    {
        titleKey: "nav.bills",
        href: "/dashboard/bills",
        icon: FileText,
    },
    {
        titleKey: "nav.integrations",
        href: "/dashboard/integrations",
        icon: Globe,
    },
    {
        titleKey: "nav.expenses",
        href: "/dashboard/expenses",
        icon: Receipt,
    },
    {
        titleKey: "nav.history",
        href: "/dashboard/history",
        icon: History,
    },
    {
        titleKey: "nav.settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
    {
        titleKey: "nav.billing",
        href: "/dashboard/billing",
        icon: CreditCard,
    },
]

interface SidebarProps {
    userRole?: "owner" | "admin" | "sales";
    storeName?: string;
    activeStoreId?: string;
    stores?: any[];
    locations?: Location[];
}

export function Sidebar({ userRole = "owner", storeName, activeStoreId, stores = [], locations = [] }: SidebarProps) {
    const pathname = usePathname()
    const { t } = useTranslation()

    return (
        <aside className="hidden border-r border-border bg-sidebar md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 print:hidden z-40">
            <div className="flex flex-col flex-grow pt-4 overflow-y-auto">
                {/* Brand Header */}
                <div className="flex items-center px-4 mb-3">
                    <MateFlowLogo size={28} />
                </div>

                {/* Store & Branch Selector in Sidebar */}
                <div className="px-3 mb-4">
                    <StoreBranchDropdown
                        storeName={storeName}
                        activeStoreId={activeStoreId}
                        stores={stores}
                        locations={locations}
                    />
                </div>

                {/* Navigation Section */}
                <div className="flex flex-col flex-grow px-2">
                    <nav className="space-y-0.5">
                        {sidebarItems.map((item) => {
                            if (userRole === "sales") {
                                if (
                                    item.href === "/dashboard/settings" ||
                                    item.href === "/dashboard/expenses" ||
                                    item.href === "/dashboard/integrations" ||
                                    item.href === "/dashboard/billing" ||
                                    item.href === "/dashboard/store"
                                ) {
                                    return null
                                }
                            }

                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 relative",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                                    )}
                                    <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/80")} />
                                    <span>{t(item.titleKey)}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* User / Workspace Footer */}
                <div className="p-3 border-t border-border">
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/40 text-xs">
                        <div className="flex flex-col truncate">
                            <span className="font-medium text-foreground truncate">
                                {userRole === "owner" ? "Organization" : userRole === "admin" ? "Admin Access" : "Sales Team"}
                            </span>
                            <span className="text-[10px] text-muted-foreground capitalize">{userRole}</span>
                        </div>
                        <Link
                            href="/login"
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer"
                            title={t("nav.signOut")}
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    )
}

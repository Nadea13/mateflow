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
import { signOutUser } from "@/lib/actions/profile"

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
    userRole?: string;
    assignedBranchId?: string | null;
    storeName?: string;
    activeStoreId?: string;
    stores?: any[];
    locations?: Location[];
}

export function Sidebar({ 
    userRole = "owner", 
    assignedBranchId,
    storeName, 
    activeStoreId, 
    stores = [], 
    locations = [] 
}: SidebarProps) {
    const pathname = usePathname()
    const { t } = useTranslation()

    return (
        <aside className="hidden border-r border-border bg-sidebar md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 print:hidden z-40">
            <div className="flex flex-col flex-grow pt-4 overflow-y-auto">
                {/* Brand Header */}
                <div className="flex items-center px-4 mb-3">
                    <MateFlowLogo size={28} />
                </div>

                {/* Store & Branch Selector in Sidebar with Role Badge */}
                <div className="px-3 mb-4">
                    <StoreBranchDropdown
                        storeName={storeName}
                        activeStoreId={activeStoreId}
                        userRole={userRole}
                        assignedBranchId={assignedBranchId}
                        stores={stores}
                        locations={locations}
                    />
                </div>

                {/* Navigation Section */}
                <div className="flex flex-col flex-grow px-2">
                    <nav className="space-y-0.5">
                        {sidebarItems.map((item) => {
                            if (userRole === "sales" || userRole === "stock_keeper") {
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

                {/* Logout Button Section at Bottom of Sidebar */}
                <div className="p-3 border-t border-border mt-auto">
                    <form action={signOutUser}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span>ออกจากระบบ (Logout)</span>
                        </button>
                    </form>
                </div>
            </div>
        </aside>
    )
}

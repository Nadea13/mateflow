import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { FloatingChat } from "@/components/chat/floating-chat"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 md:pl-64 pb-20 md:pb-0 min-w-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
                    {children}
                </div>
            </main>
            <MobileNav />
            <FloatingChat />
        </div>
    )
}

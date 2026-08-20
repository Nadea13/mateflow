import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { FloatingChat } from "@/components/chat/floating-chat"
import { TopBar } from "@/components/dashboard/top-bar"
import { getUserProfile } from "@/lib/actions/profile"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getUserProfile();
    const role = profile?.role || 'owner';

    return (
        <div className="flex min-h-screen w-full overflow-x-hidden bg-background text-foreground">
            <Sidebar userRole={role} />
            <div className="flex-1 md:pl-60 flex flex-col min-w-0 w-full overflow-x-hidden">
                <TopBar />
                <main className="flex-1 pb-20 md:pb-8 min-w-0 w-full overflow-x-hidden">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 w-full">
                        {children}
                    </div>
                </main>
            </div>
            <MobileNav userRole={role} />
            {/* AI Floating Chat temporarily disabled for future development */}
            {/* <FloatingChat /> */}
        </div>
    )
}

import { Suspense } from "react";
import { Metadata } from "next";
import { getHistory } from "@/lib/actions/history";
import { HistoryFilter } from "@/components/history/history-filter";
import { RecentActivity } from "@/components/dashboard/activity-feed"; // Reuse for now, or adapt
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History as HistoryIcon } from "lucide-react";

export const metadata: Metadata = {
    title: "History | MateFlow",
    description: "View your business activity history.",
};

export const dynamic = 'force-dynamic';

export default async function HistoryPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string }>;
}) {
    const { type } = await searchParams;
    const history = await getHistory(type || "all");

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">History</h2>
                    <p className="text-muted-foreground">
                        All your recent business activities in one place.
                    </p>
                </div>
                <HistoryFilter />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Activities</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Loading history...</div>}>
                        {/* We can reuse RecentActivity since the data shape from getHistory matches what RecentActivity expects (normalized) */}
                        <RecentActivity data={history} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}

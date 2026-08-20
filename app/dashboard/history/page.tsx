import { Suspense } from "react";
import { Metadata } from "next";
import { getHistory } from "@/lib/actions/history";
import { HistoryFilter } from "@/components/history/history-filter";
import { PageHeader } from "@/components/shared/page-header";
import { HistoryContent } from "@/components/history/history-content";

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
            <PageHeader titleKey="history.title" subtitleKey="history.subtitle">
                <HistoryFilter />
            </PageHeader>
            <HistoryContent data={history} />
        </div>
    );
}


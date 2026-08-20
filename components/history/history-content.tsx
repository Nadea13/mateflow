"use client";

import { HistoryTable } from "@/components/history/history-table";
import { HistoryItem } from "@/lib/actions/history";

interface HistoryContentProps {
    data: HistoryItem[];
}

export function HistoryContent({ data }: HistoryContentProps) {
    return <HistoryTable data={data} />;
}

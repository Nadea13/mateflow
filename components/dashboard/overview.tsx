"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function Overview({
    data,
    title = "Sales",
    color = "#0d9488",
    queryKey = "range"
}: {
    data: any[],
    title?: string,
    color?: string,
    queryKey?: string
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentRange = searchParams.get(queryKey) || "7d"

    const ranges = [
        { label: "Daily", value: "1d" },
        { label: "3 Days", value: "3d" },
        { label: "7 Days", value: "7d" },
        { label: "14 Days", value: "14d" },
        { label: "1 Month", value: "30d" },
        { label: "1 Year", value: "1y" },
        { label: "3 Years", value: "3y" },
        { label: "5 Years", value: "5y" },
    ]

    const handleRangeChange = (range: string) => {
        const params = new URLSearchParams(searchParams)
        params.set(queryKey, range)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <Select value={currentRange} onValueChange={handleRangeChange}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                        {ranges.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                                {range.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                    <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `฿${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <Tooltip
                        formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, title]}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke={color}
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

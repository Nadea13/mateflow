"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCurrencyStore } from "@/lib/currency/store"
import { formatMoney, SUPPORTED_CURRENCIES } from "@/lib/currency"

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
    const { currency } = useCurrencyStore()
    const currConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD

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
                        tickFormatter={(value) => `${currConfig.symbol}${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.15} />
                    <Tooltip
                        formatter={(value: any) => [formatMoney(Number(value), currency), title]}
                        contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "8px",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.3)",
                            fontSize: "12px",
                            color: "var(--foreground)",
                        }}
                        labelStyle={{
                            color: "var(--muted-foreground)",
                            fontSize: "11px",
                            fontWeight: 600,
                            marginBottom: "2px",
                        }}
                        itemStyle={{
                            color: color,
                            fontSize: "12px",
                            fontWeight: 600,
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke={color}
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

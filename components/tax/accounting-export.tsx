"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Download, RefreshCw, Layers } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AccountingExport() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [platform, setPlatform] = useState("flowaccount");
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (!date) {
            toast.error("Please select an export month.");
            return;
        }

        setExporting(true);
        // Simulate API delay for export generation
        await new Promise(resolve => setTimeout(resolve, 1500));
        setExporting(false);
        toast.success(`Export successfully generated for ${format(date, "MMMM yyyy")} in ${platform.toUpperCase()} format!`);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Accounting Export</CardTitle>
                        <CardDescription>Export transactions directly to popular Thai accounting software.</CardDescription>
                    </div>
                    <Layers className="w-8 h-8 text-muted-foreground/30" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-2">
                        <Label>Target Platform</Label>
                        <Select value={platform} onValueChange={setPlatform}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flowaccount">FlowAccount</SelectItem>
                                <SelectItem value="peak">PEAK Account</SelectItem>
                                <SelectItem value="trcloud">TRCLOUD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Export Period (Month)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "MMMM yyyy") : <span>Pick a month</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2 lg:col-span-1 md:col-span-2 flex items-end">
                        <Button
                            onClick={handleExport}
                            disabled={exporting}
                            className="w-full gap-2"
                        >
                            {exporting ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            {exporting ? "Generating Export..." : `Export for ${platform === "flowaccount" ? "FlowAccount" : platform === "peak" ? "PEAK" : "TRCLOUD"}`}
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium">What gets exported?</h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
                        <li>All finalised Sales Invoices (Bills) for the selected period.</li>
                        <li>All recorded Expenses and Supplier Purchase Orders.</li>
                        <li>Payment reconciliation data (if configured).</li>
                        <li>Automatic mapping of basic chart of accounts (e.g., Sales, Cost of Goods Sold, Utilities).</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

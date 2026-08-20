"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, CalendarDays } from "lucide-react";
import { toast } from "sonner";

import { getVatReport } from "@/lib/actions/tax";

export function VatReport() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [vatRecords, setVatRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVat = async () => {
            setLoading(true);
            try {
                const data = await getVatReport(Number(selectedYear));
                setVatRecords(data);
            } catch (error) {
                console.error("Failed to fetch VAT report:", error);
                toast.error("Failed to load VAT report");
            } finally {
                setLoading(false);
            }
        };
        fetchVat();
    }, [selectedYear]);

    const handleExport = (month: string) => {
        toast.info(`Exporting P.P.30 data for ${month}...`);
        // Simulate CSV Generation
        setTimeout(() => toast.success("Export successful!"), 1000);
    };

    const handleExportAll = () => {
        toast.info(`Exporting all P.P.30 data for ${selectedYear}...`);
        setTimeout(() => toast.success("Export successful!"), 1500);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <CardTitle>VAT Report (P.P. 30)</CardTitle>
                        <CardDescription>Monthly Input vs. Output VAT report for filing P.P. 30.</CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[120px]">
                                <CalendarDays className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                                <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={handleExportAll}>
                            <FileDown className="w-4 h-4 mr-2" /> Export {selectedYear}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tax Month</TableHead>
                                <TableHead className="text-right">Total Sales</TableHead>
                                <TableHead className="text-right">Output VAT (7%)</TableHead>
                                <TableHead className="text-right">Total Purchases</TableHead>
                                <TableHead className="text-right">Input VAT (7%)</TableHead>
                                <TableHead className="text-right font-bold">Net VAT payable</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        Loading VAT report...
                                    </TableCell>
                                </TableRow>
                            ) : vatRecords.length > 0 ? (
                                vatRecords.map((record) => (
                                    <TableRow key={record.month}>
                                        <TableCell className="font-medium">
                                            {record.month}
                                            <div className="text-xs text-muted-foreground">{record.status}</div>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">฿{record.salesAmount.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-medium">฿{record.outputVat.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">฿{record.purchaseAmount.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-medium">฿{record.inputVat.toLocaleString()}</TableCell>
                                        <TableCell className={`text-right font-bold ${record.netVat > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            ฿{Math.abs(record.netVat).toLocaleString()} {record.netVat <= 0 && '(Refund)'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button size="sm" variant="ghost" onClick={() => handleExport(record.month)}>
                                                <FileDown className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No VAT data found for {selectedYear}.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

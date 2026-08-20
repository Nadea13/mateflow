"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, Printer, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { getWhtRecords } from "@/lib/actions/tax";
import { useRouter } from "next/navigation";

export function WhtReport() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [whtRecords, setWhtRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWht = async () => {
            setLoading(true);
            try {
                const data = await getWhtRecords();
                setWhtRecords(data);
            } catch (error) {
                console.error("Failed to fetch WHT records:", error);
                toast.error("Failed to load WHT records");
            } finally {
                setLoading(false);
            }
        };
        fetchWht();
    }, []);

    const handleGenerate = (id: string, partyName: string) => {
        toast.success(`Generated 50 Tawi Certificate for ${partyName}`);
    };

    const handlePrint = (id: string, source: string) => {
        toast.info(`Preparing to print certificate ${id}...`);
    };

    const filteredRecords = whtRecords.filter(r =>
        r.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <CardTitle>Withholding Tax (50 Tawi)</CardTitle>
                        <CardDescription>Manage and generate 50 Tawi certificates.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><FileDown className="w-4 h-4 mr-2" /> Export Summary</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 max-w-sm">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Party / Tax ID</TableHead>
                                <TableHead>Direction</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Base Amount</TableHead>
                                <TableHead className="text-right">WHT Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        Loading WHT records...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="whitespace-nowrap">{record.date}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{record.partyName}</div>
                                            <div className="text-xs text-muted-foreground">ID: {record.taxId}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={record.source === "expense" ? "outline" : "secondary"}>
                                                {record.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{record.category}</TableCell>
                                        <TableCell className="text-right">฿{record.baseAmount.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-medium text-red-500">฿{record.whtAmount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={record.status === 'generated' ? 'default' : 'secondary'}>
                                                {record.status === 'generated' ? 'Issued' : 'Pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {record.status === 'pending' ? (
                                                <Button size="sm" onClick={() => handleGenerate(record.id, record.partyName)}>
                                                    Generate
                                                </Button>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <Button size="icon" variant="ghost" onClick={() => router.push(`/dashboard/tax/wht/${record.id}`)}>
                                                        <Printer className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => router.push(`/dashboard/tax/wht/${record.id}`)}>
                                                        <FileDown className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        No WHT records found.
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


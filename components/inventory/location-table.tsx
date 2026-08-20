"use client";

import { Location } from "@/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Building2, Globe } from "lucide-react";

interface LocationTableProps {
    locations: Location[];
    onEdit: (location: Location) => void;
}

export function LocationTable({ locations, onEdit }: LocationTableProps) {
    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Location / Hub</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Facility Type</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {locations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">
                                No warehouse or fulfillment hubs found. Create one.
                            </TableCell>
                        </TableRow>
                    ) : (
                        locations.map((location) => (
                            <TableRow key={location.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    {location.name}
                                </TableCell>
                                <TableCell>
                                    {location.code ? (
                                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                            {location.code}
                                        </span>
                                    ) : (
                                        "-"
                                    )}
                                </TableCell>
                                <TableCell className="capitalize">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        {location.type === "3pl" ? "3PL / Fulfillment" : location.type}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center gap-1 text-sm font-medium">
                                        <Globe className="h-3 w-3 text-muted-foreground" />
                                        {location.country || "Global"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                                    {location.address || "-"}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(location)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

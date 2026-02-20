"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Edit } from "lucide-react";
import { Customer } from "@/types";
import { deleteCustomer } from "@/lib/actions/customers";
import { useToast } from "@/hooks/use-toast";
import { CustomerDialog } from "./customer-dialog";
import { useState } from "react";

interface CustomerTableProps {
    customers: Customer[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
    const { toast } = useToast();
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this customer?")) return;

        const result = await deleteCustomer(id);
        if (result.success) {
            toast({
                title: "Customer Deleted",
                description: "The customer has been removed.",
            });
        } else {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        }
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setDialogOpen(true);
    };

    return (
        <>
            <CustomerDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingCustomer(undefined);
                }}
                customerToEdit={editingCustomer}
            />

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 z-20 bg-background">No.</TableHead>
                            <TableHead className="sticky left-[40px] z-20 bg-background">Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Line ID</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer, index) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="sticky left-0 z-10 bg-background">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[40px] z-10 bg-background font-medium">{customer.name}</TableCell>
                                    <TableCell>{customer.phone || "-"}</TableCell>
                                    <TableCell>{customer.email || "-"}</TableCell>
                                    <TableCell>{customer.line_id || "-"}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={customer.address}>
                                        {customer.address || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}

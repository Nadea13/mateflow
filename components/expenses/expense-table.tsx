"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { deleteExpense } from "@/lib/actions/expenses";
import { Expense } from "@/types";
import { Trash, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ExpenseTableProps {
    expenses: Expense[];
}

export function ExpenseTable({ expenses }: ExpenseTableProps) {
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const result = await deleteExpense(id) as any;
            if (result.success) {
                toast({ title: "Deleted", description: "Expense deleted successfully." });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 z-20 bg-background">No.</TableHead>
                        <TableHead className="sticky left-[40px] z-20 bg-background">Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[100px] text-right">Receipt</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No expenses found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        expenses.map((expense, index) => (
                            <TableRow key={expense.id}>
                                <TableCell className="sticky left-0 z-10 bg-background">{index + 1}</TableCell>
                                <TableCell className="sticky left-[40px] z-10 bg-background font-medium whitespace-nowrap">
                                    {formatDate(expense.date)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{expense.title}</span>
                                        {expense.description && (
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {expense.description}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                        {expense.category}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-mono text-red-600">
                                    -฿{expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right">
                                    {expense.receipt_url && (
                                        <a
                                            href={expense.receipt_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center text-xs text-primary hover:underline"
                                        >
                                            <FileText className="mr-1 h-3 w-3" /> View
                                        </a>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete this expense record.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {deletingId === expense.id ? "Deleting..." : "Delete"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

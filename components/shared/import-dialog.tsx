"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileDown, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ImportDialogProps {
    type: "customer" | "product" | "bill" | "expense";
    onImport: (formData: FormData) => Promise<{ success: boolean; message: string; count?: number }>;
    triggerText?: string;
}

export function ImportDialog({ type, onImport, triggerText = "Import" }: ImportDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            setError("Please select a file to import.");
            return;
        }

        if (!file.name.endsWith(".csv")) {
            setError("Only .csv files are supported.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await onImport(formData);
            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: result.message,
                });
                setOpen(false);
                setFile(null);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("An unexpected error occurred during import.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getTemplateLink = () => {
        // In a real app, this would point to a static file in /public/templates/
        return `/templates/${type}_template.csv`;
    };

    const getTemplateHeaders = () => {
        switch (type) {
            case "customer": return "name,email,phone,address,line_id";
            case "product": return "name,price,stock,description,category";
            case "bill": return "customer_name,total_amount,status,date (YYYY-MM-DD)";
            case "expense": return "title,amount,category,date (YYYY-MM-DD)";
            default: return "";
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import {type.charAt(0).toUpperCase() + type.slice(1)}s</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file or Image to bulk import {type}s.
                        <br />
                        <span className="text-xs text-muted-foreground mt-2 block">
                            Required headers (CSV): {getTemplateHeaders()}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">File (CSV or Image)</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".csv,image/*"
                            onChange={handleFileChange}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    {/* Placeholder for template download if we had static files */}
                    {/* <Button variant="ghost" size="sm" className="w-full sm:w-auto" asChild>
                        <a href={getTemplateLink()} download>
                            <FileDown className="mr-2 h-3 w-3" />
                            Download Template
                        </a>
                    </Button> */}
                    <DropdownAction type={type} /> {/* Self-correction: I can't easily make a download link without the file. I'll just show headers in description for now. */}

                    <div className="flex-1" />

                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !file}>
                        {isLoading ? "Importing..." : "Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DropdownAction({ type }: { type: string }) {
    // Helper to just return nothing or a simple text helper
    return null;
}

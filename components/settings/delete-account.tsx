"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { softDeleteAccount } from "@/lib/actions/profile";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function DeleteAccountSection() {
    const [confirmText, setConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = async () => {
        if (confirmText !== "DELETE") return;

        setDeleting(true);
        try {
            const result = await softDeleteAccount() as any;
            if (result.success) {
                toast({
                    title: "Account Deleted",
                    description: "Your account has been deactivated.",
                });
                router.push("/login");
            } else {
                toast({
                    title: "เกิดข้อผิดพลาด",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to delete account.",
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Card className="max-w-2xl border-destructive/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                </CardTitle>
                <CardDescription>
                    This action cannot be undone. Please proceed with caution.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!showConfirm ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-foreground">Delete Account</p>
                            <p className="text-xs text-muted-foreground">Deactivate your account and hide all your data.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setShowConfirm(true)}
                        >
                            Delete Account
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                        <p className="text-sm text-foreground">
                            Type <span className="font-bold text-destructive">DELETE</span> to confirm
                        </p>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="border-destructive/30"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                disabled={confirmText !== "DELETE" || deleting}
                                onClick={handleDelete}
                            >
                                {deleting ? "Deleting..." : "Confirm Delete"}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowConfirm(false);
                                    setConfirmText("");
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

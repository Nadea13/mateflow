"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getStoreProfile, updateETaxSettings } from "@/lib/actions/profile";

export function ETaxSettings() {
    const [enabled, setEnabled] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const profile = await getStoreProfile();
            if (profile) {
                setEnabled(profile.etax_enabled || false);
                setApiKey(profile.etax_api_key || "");
                setCompanyId(profile.etax_company_id || "");
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const res = await updateETaxSettings({
            etax_enabled: enabled,
            etax_api_key: apiKey,
            etax_company_id: companyId
        });
        setSaving(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("E-Tax settings saved successfully.");
        }
    };

    if (loading) return <div className="p-4 text-center text-muted-foreground animate-pulse">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">E-Tax Invoice & E-Receipt</CardTitle>
                            <CardDescription>
                                Configure integration with the Revenue Department's E-Tax system.
                            </CardDescription>
                        </div>
                        <Switch
                            checked={enabled}
                            onCheckedChange={setEnabled}
                            id="e-tax-toggle"
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
                        {enabled ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                        )}
                        <div>
                            <h4 className="font-medium text-sm">
                                {enabled ? "E-Tax is Currently Enabled" : "E-Tax is Disabled"}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                {enabled
                                    ? "Your system will automatically generate and submit e-Tax Invoices to the Revenue Department when finalizing bills."
                                    : "Enable this feature to automate your e-Tax generation. Requires API integration."}
                            </p>
                        </div>
                    </div>

                    <div className={`space-y-4 transition-opacity duration-200 ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="grid gap-2">
                            <Label htmlFor="provider">E-Tax Service Provider</Label>
                            <Input id="provider" value="INEt (Mock Data)" disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Currently integrating with INET API.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="companyId">Company Tax ID</Label>
                            <Input
                                id="companyId"
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                placeholder="13-digit Tax ID"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="apiKey">Provider API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk_test_..."
                            />
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto mt-2">
                        {saving ? "Saving Configuration..." : "Save Configuration"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent E-Tax Documents</CardTitle>
                    <CardDescription>Documents generated and submitted recently.</CardDescription>
                </CardHeader>
                <CardContent>
                    {enabled ? (
                        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                            <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
                            <p>No e-Tax documents generated yet.</p>
                            <p className="text-sm">Create a final bill to generate your first document.</p>
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                            Please enable E-Tax to view generated documents.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

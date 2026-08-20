"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { generateStoreJoinCode, getActiveStoreCodes, revokeStoreJoinCode, removeTeamMember, updateTeamMemberRole } from "@/app/actions/team"
import { toast } from "sonner"
import { Users, Copy, Trash2, KeyRound, Shield } from "lucide-react"

// Types
type Profile = {
    id: string
    email: string
    role: string
    owner_id: string | null
}

type StoreCode = {
    id: string
    code: string
    role: string
    created_at: string
}

export function TeamManagement({ members }: { members: Profile[] }) {
    const [storeCodes, setStoreCodes] = useState<StoreCode[]>([])
    const [isLoadingCodes, setIsLoadingCodes] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedRole, setSelectedRole] = useState("sales")

    useEffect(() => {
        fetchStoreCodes()
    }, [])

    const fetchStoreCodes = async () => {
        setIsLoadingCodes(true)
        const result = await getActiveStoreCodes()
        if (result && result.storeCodes) {
            setStoreCodes(result.storeCodes)
        } else {
            setStoreCodes([])
        }
        setIsLoadingCodes(false)
    }

    const handleGenerateCode = async () => {
        setIsGenerating(true)
        const formData = new FormData()
        formData.append("role", selectedRole)

        const result = await generateStoreJoinCode(formData)
        setIsGenerating(false)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success && result.storeCode) {
            toast.success(`New ${selectedRole} Join Code generated!`)
            fetchStoreCodes() // Refresh the list
        }
    }

    const handleRevokeCode = async (codeId: string) => {
        if (!confirm("Are you sure? Users will no longer be able to join using this specific code.")) return;

        const formData = new FormData()
        formData.append("codeId", codeId)

        const result = await revokeStoreJoinCode(formData)
        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success("Store Code disabled.")
            fetchStoreCodes() // Refresh the list
        }
    }

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        toast.success("Store code copied to clipboard")
    }

    const handleRemoveMember = async (memberId: string) => {
        const confirmRemove = window.confirm("Are you sure you want to remove this member from your team? They will lose access immediately.")
        if (confirmRemove) {
            const formData = new FormData()
            formData.append("memberId", memberId)
            const result = await removeTeamMember(formData)
            if (result.success) {
                toast.success("Team member removed")
                window.location.reload()
            } else {
                toast.error(result.error || "Failed to remove member")
            }
        }
    }

    const handleRoleChange = async (memberId: string, newRole: string) => {
        const formData = new FormData()
        formData.append("memberId", memberId)
        formData.append("role", newRole)

        const result = await updateTeamMemberRole(formData)
        if (result.success) {
            toast.success("Role updated successfully")
            window.location.reload()
        } else {
            toast.error(result.error || "Failed to update role")
        }
    }

    return (
        <div className="space-y-6">
            {/* Store Code Section */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-border">
                    <div className="p-1.5 bg-muted rounded-lg text-primary">
                        <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Store Join Codes</h4>
                        <p className="text-xs text-muted-foreground">Generate temporary codes to let employees join your store with specific roles.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 bg-muted/40 p-3.5 rounded-lg border border-border/80 sm:items-end">
                    <div className="flex-1 space-y-1.5">
                        <Label htmlFor="roleSelect" className="text-xs">Role for new code</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger id="roleSelect" className="h-9 text-xs bg-background">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sales">Sales (Limited)</SelectItem>
                                <SelectItem value="accountant">Accountant (Reports)</SelectItem>
                                <SelectItem value="admin">Admin (Full Access)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleGenerateCode} disabled={isGenerating || isLoadingCodes} size="sm" className="h-9 text-xs gap-1.5 font-medium w-full sm:w-auto">
                        <KeyRound className="h-3.5 w-3.5" />
                        {isGenerating ? "Generating..." : "Generate Code"}
                    </Button>
                </div>

                {isLoadingCodes ? (
                    <div className="animate-pulse flex flex-col gap-2.5">
                        <div className="h-12 bg-muted/60 rounded-lg w-full"></div>
                        <div className="h-12 bg-muted/60 rounded-lg w-full"></div>
                    </div>
                ) : storeCodes.length === 0 ? (
                    <div className="text-center py-5 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
                        No active join codes. Generate one above to invite team members.
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <span className="text-xs font-semibold text-muted-foreground block">Active Codes</span>
                        {storeCodes.map((sc) => (
                            <div key={sc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-muted/30 transition-colors gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="font-mono text-lg font-bold tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                                        {sc.code}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="flex items-center text-xs font-semibold capitalize text-foreground">
                                            <Shield className="h-3 w-3 mr-1 text-muted-foreground" /> {sc.role}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">Created: {new Date(sc.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2.5" onClick={() => handleCopyCode(sc.code)}>
                                        <Copy className="h-3 w-3" /> Copy
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2" onClick={() => handleRevokeCode(sc.id)}>
                                        Disable
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Team Members */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-border">
                    <div className="p-1.5 bg-muted rounded-lg text-primary">
                        <Users className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Active Team Members</h4>
                        <p className="text-xs text-muted-foreground">Manage individuals and role permissions for this workspace.</p>
                    </div>
                </div>

                {members.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                        No active team members found. Share your Store Code to invite employees!
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {members.map((member) => (
                            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-muted/30 transition-colors gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                        {member.email?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">{member.email || "No Email Bound"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {member.role === 'owner' ? (
                                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-full border border-primary/20">Store Owner</span>
                                    ) : (
                                        <>
                                            <Select value={member.role} onValueChange={(val) => handleRoleChange(member.id, val)}>
                                                <SelectTrigger className="w-[120px] h-7 text-xs bg-background">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sales">Sales</SelectItem>
                                                    <SelectItem value="accountant">Accountant</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMember(member.id)} title="Remove Team Member">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

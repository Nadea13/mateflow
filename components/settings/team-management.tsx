"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { generateStoreJoinCode, getActiveStoreCodes, revokeStoreJoinCode, removeTeamMember, updateTeamMemberRole } from "@/app/actions/team"
import { toast } from "sonner"
import { Users, Copy, Trash2, KeyRound, Shield, UserPlus } from "lucide-react"

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

interface TeamManagementProps {
    members: Profile[]
}

export function TeamManagement({ members }: TeamManagementProps) {
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
            toast.success(`สร้างรหัสเข้าร่วมสำหรับตำแหน่ง ${selectedRole} สำเร็จ!`)
            fetchStoreCodes()
        }
    }

    const handleRevokeCode = async (codeId: string) => {
        if (!confirm("คุณต้องการยกเลิกการใช้งานรหัสนี้ใช่หรือไม่?")) return

        const formData = new FormData()
        formData.append("codeId", codeId)

        const result = await revokeStoreJoinCode(formData)
        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success("ยกเลิกรหัสเข้าร่วมร้านค้าเรียบร้อยแล้ว")
            fetchStoreCodes()
        }
    }

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        toast.success("คัดลอกรหัสร้านค้าแล้ว")
    }

    const handleRemoveMember = async (memberId: string) => {
        const confirmRemove = window.confirm("คุณแน่ใจหรือไม่ที่จะลบพนักงานท่านนี้ออกจากทีม? สิทธิ์การเข้าถึงจะถูกระงับทันที")
        if (confirmRemove) {
            const formData = new FormData()
            formData.append("memberId", memberId)
            const result = await removeTeamMember(formData)
            if (result.success) {
                toast.success("ลบพนักงานออกจากทีมเรียบร้อยแล้ว")
                window.location.reload()
            } else {
                toast.error(result.error || "ไม่สามารถลบพนักงานได้")
            }
        }
    }

    const handleRoleChange = async (memberId: string, newRole: string) => {
        const formData = new FormData()
        formData.append("memberId", memberId)
        formData.append("role", newRole)

        const result = await updateTeamMemberRole(formData)
        if (result.success) {
            toast.success("อัปเดตตำแหน่งพนักงานเรียบร้อยแล้ว")
            window.location.reload()
        } else {
            toast.error(result.error || "ไม่สามารถอัปเดตตำแหน่งได้")
        }
    }

    return (
        <div className="space-y-6">
            {/* Store Code Generator Section */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-border">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">รหัสเชิญพนักงานเข้าร้าน (Store Join Codes)</h4>
                        <p className="text-xs text-muted-foreground">สร้างรหัสเพื่อส่งให้พนักงานกดเข้าร่วมร้านค้า พร้อมกำหนดตำแหน่ง</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 bg-muted/40 p-3.5 rounded-lg border border-border/80 sm:items-end">
                    <div className="flex-1 space-y-1.5">
                        <Label htmlFor="roleSelect" className="text-xs font-semibold">ตำแหน่ง (Role)</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger id="roleSelect" className="h-9 text-xs bg-background">
                                <SelectValue placeholder="เลือกตำแหน่ง" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sales">Sales (พนักงานขายหน้าร้าน)</SelectItem>
                                <SelectItem value="stock_keeper">Stock Keeper (ผู้ดูแลคลังสินค้า)</SelectItem>
                                <SelectItem value="accountant">Accountant (ฝ่ายบัญชีและการเงิน)</SelectItem>
                                <SelectItem value="admin">Manager / Admin (ผู้จัดการ)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleGenerateCode} disabled={isGenerating || isLoadingCodes} size="sm" className="h-9 text-xs gap-1.5 font-semibold w-full sm:w-auto bg-primary text-primary-foreground cursor-pointer">
                        <UserPlus className="h-3.5 w-3.5" />
                        {isGenerating ? "กำลังสร้าง..." : "สร้างรหัสเชิญ"}
                    </Button>
                </div>

                {isLoadingCodes ? (
                    <div className="animate-pulse flex flex-col gap-2.5">
                        <div className="h-12 bg-muted/60 rounded-lg w-full"></div>
                    </div>
                ) : storeCodes.length === 0 ? (
                    <div className="text-center py-5 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
                        ยังไม่มีรหัสเชิญที่ใช้งานอยู่ สามารถกดสร้างรหัสเชิญด้านบนเพื่อส่งให้พนักงานได้ทันที
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <span className="text-xs font-semibold text-muted-foreground block">รหัสเชิญที่ใช้งานได้ในขณะนี้</span>
                        {storeCodes.map((sc) => (
                            <div key={sc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-muted/30 transition-colors gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="font-mono text-base font-bold tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                                        {sc.code}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="flex items-center text-xs font-semibold capitalize text-foreground">
                                            <Shield className="h-3 w-3 mr-1 text-muted-foreground" /> {sc.role}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">สร้างเมื่อ: {new Date(sc.created_at).toLocaleDateString("th-TH")}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2.5 cursor-pointer" onClick={() => handleCopyCode(sc.code)}>
                                        <Copy className="h-3 w-3" /> คัดลอกรหัส
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2 cursor-pointer" onClick={() => handleRevokeCode(sc.id)}>
                                        ยกเลิก
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
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        <Users className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">รายชื่อทีมงานในร้านค้า (Active Team Members)</h4>
                        <p className="text-xs text-muted-foreground">จัดการรายชื่อ และกำหนดสิทธิ์ตำแหน่งของพนักงานในร้านค้า</p>
                    </div>
                </div>

                {members.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                        ยังไม่มีพนักงานในร้านค้า ส่งรหัสเชิญด้านบนเพื่อให้พนักงานกดเข้าร่วมร้านค้าได้ทันที
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
                                        <p className="text-xs font-semibold text-foreground">{member.email || "พนักงานในระบบ"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {member.role === 'owner' ? (
                                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-full border border-primary/20">เจ้าของร้าน (Owner)</span>
                                    ) : (
                                        <>
                                            <Select value={member.role} onValueChange={(val) => handleRoleChange(member.id, val)}>
                                                <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sales">Sales (หน้าร้าน)</SelectItem>
                                                    <SelectItem value="stock_keeper">Stock Keeper (คลัง)</SelectItem>
                                                    <SelectItem value="accountant">Accountant (บัญชี)</SelectItem>
                                                    <SelectItem value="admin">Manager (ผู้จัดการ)</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Button size="icon-sm" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer" onClick={() => handleRemoveMember(member.id)} title="ลบพนักงาน">
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

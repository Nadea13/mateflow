"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Store, KeyRound, ArrowRight } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

export default function JoinStorePage() {
    const router = useRouter()
    const [code, setCode] = useState("")
    const [isJoining, setIsJoining] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            setIsAuthenticated(!!session)
        }
        checkAuth()
    }, [])

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code || code.trim().length === 0) {
            toast.error("Please enter a valid Store Code")
            return
        }

        setIsJoining(true)
        try {
            const response = await fetch('/api/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeCode: code })
            })

            const result = await response.json()
            setIsJoining(false)

            if (result.requiresLogin) {
                toast.success("Code verified! Please create an account or log in to continue.")
                window.location.href = "/signup"
                return
            }

            if (!response.ok || result.error) {
                toast.error(result.error || "Failed to join store.")
            } else if (result.success) {
                toast.success("Successfully joined the store!")
                // Full page reload to clear Apollo/SWR/RSC caches ensuring new store data loads
                window.location.href = "/dashboard"
            }
        } catch (err: any) {
            setIsJoining(false)
            toast.error("Network or server error occurred.")
            console.error(err)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Store className="h-6 w-6" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Join a Store Team
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter the 6-digit code provided by your store owner.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleJoin}>
                        <div>
                            <Label htmlFor="code" className="sr-only">
                                Store Code
                            </Label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyRound className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <Input
                                    id="code"
                                    type="text"
                                    required
                                    className="pl-10 uppercase tracking-widest text-center text-2xl h-14 font-mono font-bold"
                                    placeholder="XXXXXX"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
                                    maxLength={8}
                                />
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full h-12 text-lg" disabled={isJoining || code.length < 5}>
                                {isJoining ? "Verifying..." : (
                                    <>
                                        Enter Store <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

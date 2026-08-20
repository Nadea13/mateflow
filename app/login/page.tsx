"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { signIn } from "@/lib/actions/auth";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TurnstileWidget } from "@/components/cloudflare/turnstile-widget";
import { MateFlowIcon } from "@/components/brand/mateflow-logo";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        if (turnstileToken) {
            formData.append("turnstileToken", turnstileToken);
        }

        startTransition(async () => {
            try {
                await signIn(formData);
            } catch (err: any) {
                // Next.js redirect throws a NEXT_REDIRECT digest error which is normal behavior
                if (err.message && !err.message.includes("NEXT_REDIRECT")) {
                    setErrorMsg(err.message || "Invalid email or password");
                    toast.error(err.message || "Invalid credentials");
                }
            }
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Brand Header */}
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="p-2.5 rounded-2xl bg-card border border-border/80 shadow-md flex items-center justify-center mb-1">
                        <MateFlowIcon size={38} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-1">
                        <span>Mate</span>
                        <span className="text-primary font-extrabold">Flow</span>
                    </h1>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 text-primary inline" /> Global Enterprise Backoffice
                    </p>
                </div>

                {/* Login Card */}
                <Card className="border border-border bg-card shadow-sm rounded-xl">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-bold text-center">
                            Sign In to Mateflow
                        </CardTitle>
                        <CardDescription className="text-center text-xs text-muted-foreground">
                            Enter your email and password to access your dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {errorMsg && (
                            <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9 h-10 text-xs bg-background"
                                        required
                                        disabled={isPending}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                                    <Link
                                        href="/signup"
                                        className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-9 pr-9 h-10 text-xs bg-background"
                                        required
                                        disabled={isPending}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Cloudflare Turnstile CAPTCHA Widget */}
                            <TurnstileWidget onSuccess={(token) => setTurnstileToken(token)} />

                            <Button
                                type="submit"
                                className="w-full h-10 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="relative my-3">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <GoogleAuthButton />
                    </CardContent>
                    <CardFooter className="justify-center border-t border-border/60 pt-4">
                        <p className="text-xs text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="font-semibold text-primary hover:underline">
                                Register with Email OTP
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

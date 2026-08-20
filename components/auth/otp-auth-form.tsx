"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOtp, verifyOtp, setAccountPassword } from "@/lib/actions/auth";
import { Mail, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { TurnstileWidget } from "@/components/cloudflare/turnstile-widget";

export function OtpAuthForm({ mode = "signup" }: { mode?: "login" | "signup" }) {
    const router = useRouter();
    const [step, setStep] = useState<"enter_email" | "enter_otp" | "create_password">("enter_email");
    const [email, setEmail] = useState("");
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    
    // 6-digit OTP array state
    const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Password State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Auto-focus first input when entering OTP step
    useEffect(() => {
        if (step === "enter_otp") {
            inputRefs.current[0]?.focus();
        }
    }, [step]);

    // Handle typing in 6-digit boxes
    const handleOtpChange = (index: number, value: string) => {
        const cleanValue = value.replace(/\D/g, "");
        
        if (!cleanValue) {
            const newDigits = [...otpDigits];
            newDigits[index] = "";
            setOtpDigits(newDigits);
            return;
        }

        // Handle pasting complete 6-digit code into any box
        if (cleanValue.length > 1) {
            const pastedDigits = cleanValue.slice(0, 6).split("");
            const newDigits = [...otpDigits];
            pastedDigits.forEach((char, idx) => {
                if (index + idx < 6) {
                    newDigits[index + idx] = char;
                }
            });
            setOtpDigits(newDigits);
            const nextFocusIndex = Math.min(index + pastedDigits.length, 5);
            inputRefs.current[nextFocusIndex]?.focus();
            return;
        }

        // Single digit input
        const newDigits = [...otpDigits];
        newDigits[index] = cleanValue;
        setOtpDigits(newDigits);

        // Move to next box automatically
        if (cleanValue && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle Backspace navigation
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Step 1: Send OTP to Email (Only Email)
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const formData = new FormData();
        formData.append("email", email);
        if (turnstileToken) {
            formData.append("turnstileToken", turnstileToken);
        }

        startTransition(async () => {
            const res = await sendOtp(formData);
            if (res.success) {
                setStep("enter_otp");
                setOtpDigits(["", "", "", "", "", ""]);
                toast.success("Security Code sent to your email!");
            } else {
                setErrorMsg(res.error || "Failed to send code");
                toast.error(res.error || "Failed to send code");
            }
        });
    };

    // Step 2: Verify 6-digit OTP and switch to Create Password
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const fullOtp = otpDigits.join("");
        if (fullOtp.length < 6) {
            setErrorMsg("Please enter the complete 6-digit code");
            return;
        }

        startTransition(async () => {
            const res = await verifyOtp(email, fullOtp);
            if (res.success) {
                toast.success("Email verified successfully! Now create your password.");
                setStep("create_password");
            } else {
                setErrorMsg(res.error || "Invalid or expired verification code");
                toast.error(res.error || "Invalid verification code");
            }
        });
    };

    // Step 3: Set Password & Redirect to Dashboard
    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match");
            return;
        }

        startTransition(async () => {
            const res = await setAccountPassword(password);
            if (res.success) {
                toast.success("Account created successfully! Welcome to MateFlow.");
                router.push("/dashboard");
                router.refresh();
            } else {
                setErrorMsg(res.error || "Failed to set password");
                toast.error(res.error || "Failed to set password");
            }
        });
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setErrorMsg(null);
        const formData = new FormData();
        formData.append("email", email);
        if (turnstileToken) {
            formData.append("turnstileToken", turnstileToken);
        }

        startTransition(async () => {
            const res = await sendOtp(formData);
            if (res.success) {
                toast.success("New 6-digit security code sent!");
            } else {
                setErrorMsg(res.error || "Failed to resend code");
                toast.error(res.error || "Failed to resend code");
            }
        });
    };

    return (
        <div className="w-full">
            {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                    {errorMsg}
                </div>
            )}

            {/* STEP 1: Enter Business Email Only */}
            {step === "enter_email" && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="business-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Business Email
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="business-email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-11 bg-background border-border/80 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                required
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    {/* Cloudflare Turnstile CAPTCHA Widget */}
                    <TurnstileWidget onSuccess={(token) => setTurnstileToken(token)} />

                    <Button
                        type="submit"
                        className="w-full h-11 text-sm font-semibold tracking-wide gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Continue with Email
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            )}

            {/* STEP 2: 6-Digit OTP Verification Boxes */}
            {step === "enter_otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="text-center space-y-1">
                        <div className="inline-flex items-center justify-center p-2 rounded-full bg-primary/10 text-primary mb-1">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Enter 6-Digit Verification Code</h3>
                        <p className="text-xs text-muted-foreground">
                            Code sent to <span className="font-medium text-foreground">{email}</span>
                        </p>
                    </div>

                    {/* 6 Individual Digit Inputs */}
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                        {otpDigits.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => {
                                    inputRefs.current[idx] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={6}
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                disabled={isPending}
                                className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-bold font-mono bg-background border border-border/80 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        ))}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-sm font-semibold tracking-wide gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        disabled={isPending || otpDigits.join("").length < 6}
                    >
                        {isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Verify & Continue
                                <CheckCircle2 className="h-4 w-4" />
                            </>
                        )}
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-1">
                        <button
                            type="button"
                            onClick={() => setStep("enter_email")}
                            className="text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline"
                        >
                            ← Change email
                        </button>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isPending}
                            className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline"
                        >
                            Resend Code
                        </button>
                    </div>
                </form>
            )}

            {/* STEP 3: Create & Confirm Password */}
            {step === "create_password" && (
                <form onSubmit={handleSetPassword} className="space-y-4">
                    <div className="text-center space-y-1 mb-2">
                        <div className="inline-flex items-center justify-center p-2 rounded-full bg-emerald-500/10 text-emerald-600 mb-1">
                            <Lock className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Create Account Password</h3>
                        <p className="text-xs text-muted-foreground">
                            Set a password for <span className="font-medium text-foreground">{email}</span>
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Create Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="create-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10 h-11 bg-background border-border/80 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                required
                                minLength={6}
                                disabled={isPending}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="confirm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Confirm Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-11 bg-background border-border/80 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                required
                                minLength={6}
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-sm font-semibold tracking-wide gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Complete & Enter Backoffice
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            )}
        </div>
    );
}

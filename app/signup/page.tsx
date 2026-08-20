import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { OtpAuthForm } from "@/components/auth/otp-auth-form";
import { Shield } from "lucide-react";
import { MateFlowIcon } from "@/components/brand/mateflow-logo";

export default function SignUpPage() {
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

                {/* Sign Up Card */}
                <Card className="border border-border bg-card shadow-sm rounded-xl">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-bold text-center">
                            Register Your Business
                        </CardTitle>
                        <CardDescription className="text-center text-xs text-muted-foreground">
                            Enter your email to verify with 6-digit OTP and set your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <OtpAuthForm mode="signup" />

                        <div className="relative my-3">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Or register with
                                </span>
                            </div>
                        </div>

                        <GoogleAuthButton />
                    </CardContent>
                    <CardFooter className="justify-center border-t border-border/60 pt-4">
                        <p className="text-xs text-muted-foreground">
                            Already registered?{" "}
                            <Link href="/login" className="font-semibold text-primary hover:underline">
                                Sign in with Password
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

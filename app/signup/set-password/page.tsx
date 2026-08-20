import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPassword } from "@/lib/actions/auth";
import { MateFlowIcon } from "@/components/brand/mateflow-logo";

export default async function SetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="p-2.5 rounded-2xl bg-card border border-border/80 shadow-md flex items-center justify-center mb-1">
                        <MateFlowIcon size={38} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-1">
                        <span>Mate</span>
                        <span className="text-primary font-extrabold">Flow</span>
                    </h1>
                </div>

                <Card className="border border-border bg-card shadow-sm rounded-xl">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-bold text-center">
                            Set Your Password
                        </CardTitle>
                        <CardDescription className="text-center text-xs text-muted-foreground">
                            Your email has been verified! Now set a password for your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={setPassword} className="space-y-4">
                            {error && (
                                <div className="bg-destructive/15 text-destructive text-xs p-3 rounded-lg font-medium">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="At least 6 characters"
                                    className="h-10 text-xs bg-background"
                                />
                            </div>
                            <Button type="submit" className="w-full h-10 text-xs font-bold bg-primary text-primary-foreground">
                                Complete Registration
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { GoogleAuthButton } from "@/components/auth/google-auth-button"

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <svg width="56" height="56" viewBox="0 0 234 234" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.00195 163C8.00195 163 31.6487 154.719 44.002 145C51.0962 139.419 54.7375 130.271 57.002 121M226.002 163C226.002 163 202.399 154.663 190.002 145C182.876 139.446 179.39 130.291 177.002 121M57.002 121C62.3023 99.3004 63.0614 74.6884 84.002 77.5C103.297 80.0907 100.002 112.743 117.002 112.5C134.002 112.257 131.052 80.5388 150.002 77.5C171.046 74.1255 171.368 99.082 177.002 121M57.002 121C57.002 121 65.0804 115.517 71.002 114C94.0634 108.093 94.493 155.36 117.002 155.5C139.647 155.641 139.94 108.093 163.002 114C168.923 115.517 172.236 117.173 177.002 121M58.0019 226H176.002C203.616 226 226.002 203.614 226.002 176V58C226.002 30.3858 203.616 8 176.002 8H58.002C30.3877 8 8.00195 30.3858 8.00195 58V176C8.00195 203.614 30.3877 226 58.0019 226Z" stroke="#0D9488" strokeWidth="16" strokeLinecap="round" />
                    </svg>
                    <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        <span className="text-slate-700 dark:text-slate-300">Mate</span>
                        <span className="text-primary">Flow</span>
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Friendly as a chat app, Professional as an accountant.
                    </p>
                </div>

                <Card className="border-0 shadow-lg sm:rounded-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">
                            Welcome back!
                        </CardTitle>
                        <CardDescription className="text-center">
                            Sign in to manage your business with ease.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                className="h-11 rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="#"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                className="h-11 rounded-lg"
                            />
                        </div>
                        <Button className="w-full h-11 rounded-lg text-base" type="submit">
                            Sign In
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <GoogleAuthButton />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link href="#" className="font-medium text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

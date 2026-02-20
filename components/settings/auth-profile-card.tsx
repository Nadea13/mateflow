import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, User, Calendar, Shield } from "lucide-react";

interface AuthProfileCardProps {
    profile: {
        email: string;
        display_name: string;
        avatar_url: string;
        provider: string;
        created_at: string;
    };
}

export function AuthProfileCard({ profile }: AuthProfileCardProps) {
    const initials = profile.display_name
        ? profile.display_name.charAt(0).toUpperCase()
        : profile.email.charAt(0).toUpperCase();

    const providerLabel: Record<string, string> = {
        email: "Email / Password",
        google: "Google",
        github: "GitHub",
        facebook: "Facebook",
    };

    const formatDate = (d: string) => {
        if (!d) return "-";
        return new Date(d).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Profile
                </CardTitle>
                <CardDescription>User account information from Supabase Auth</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6 mb-6">
                    <Avatar className="h-20 w-20 border-2 border-border">
                        <AvatarImage src={profile.avatar_url} alt="Profile" />
                        <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            {profile.display_name || profile.email.split("@")[0]}
                        </h3>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground w-24">Email</span>
                        <span className="text-foreground">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground w-24">Login Provider</span>
                        <span className="text-foreground">{providerLabel[profile.provider] || profile.provider}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground w-24">Joined</span>
                        <span className="text-foreground">{formatDate(profile.created_at)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

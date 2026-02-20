import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Receipt,
    Package,
    User,
    CreditCard
} from "lucide-react"

export function RecentActivity({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p>No recent activity</p>
            </div>
        )
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "bill": return <Receipt className="h-4 w-4" />;
            case "product": return <Package className="h-4 w-4" />;
            case "customer": return <User className="h-4 w-4" />;
            case "expense": return <CreditCard className="h-4 w-4" />;
            default: return <Receipt className="h-4 w-4" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "bill": return "bg-emerald-100 text-emerald-700";
            case "product": return "bg-blue-100 text-blue-700";
            case "customer": return "bg-orange-100 text-orange-700";
            case "expense": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="space-y-8">
            {data.map((activity, index) => {
                const time = new Date(activity.time).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });

                return (
                    <div key={activity.id || index} className="flex items-center">
                        <Avatar className={`h-9 w-9 items-center justify-center border ${getColor(activity.type)}`}>
                            {getIcon(activity.type)}
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {activity.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {activity.description}
                            </p>
                        </div>
                        <div className="ml-auto font-medium text-xs text-muted-foreground">
                            {time}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

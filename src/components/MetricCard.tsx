import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent";
}
export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default"
}: MetricCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "gradient-primary text-primary-foreground shadow-primary";
      case "accent":
        return "gradient-accent text-accent-foreground shadow-accent";
      default:
        return "gradient-card shadow-card";
    }
  };
  return <Card className={`${getVariantClasses()} border-0 overflow-hidden animate-scale-in`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium mb-1 ${variant === "default" ? "text-muted-foreground" : "opacity-90"}`}>
              {title}
            </p>
            <h3 className="text-3xl font-bold mb-2">{value}</h3>
            {trend && <p className={`text-xs font-medium ${variant === "default" ? trend.isPositive ? "text-green-600" : "text-red-600" : "opacity-75"}`}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>}
          </div>
          
        </div>
      </CardContent>
    </Card>;
}
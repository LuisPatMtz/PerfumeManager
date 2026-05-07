import { memo } from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  trendDown?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  trendDown,
  className,
  style,
}: StatCardProps) {
  return (
    <div
      className={cn("bg-card rounded-xl p-6 border border-border/50 shadow-sm", className)}
      style={style}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm",
              trendUp && "text-chart-1",
              trendDown && "text-destructive",
              !trendUp && !trendDown && "text-muted-foreground"
            )}
          >
            {trendUp && <TrendingUp className="w-4 h-4" />}
            {trendDown && <TrendingDown className="w-4 h-4" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
});

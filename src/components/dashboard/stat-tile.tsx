import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  /** dòng phụ dưới value, vd "so với kỳ trước" hoặc mốc mục tiêu */
  sub?: string;
  delta?: { text: string; positive: boolean };
  icon: LucideIcon;
  /** progress 0..>1 — nếu có sẽ hiển thị thanh tiến độ (cho card mục tiêu) */
  progress?: number;
}

export function StatTile({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  progress,
}: StatTileProps) {
  const pct = progress != null ? Math.min(progress, 1) * 100 : null;

  return (
    <Card className="gap-0 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="size-[18px]" />
        </div>
      </div>

      <p className="mt-2 font-heading text-2xl font-bold tabular-nums tracking-tight">
        {value}
      </p>

      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              delta.positive
                ? "bg-success-50 text-success-600"
                : "bg-danger-50 text-danger-600",
            )}
          >
            {delta.positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {delta.text}
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>

      {pct != null && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

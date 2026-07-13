import { Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { statusFromProgress } from "@/lib/mock/dashboard";
import { formatCurrency, formatPercent } from "@/lib/format";

interface MonthTargetCardProps {
  achieved: number;
  target: number;
  /** nhãn kỳ, vd "tháng 07/2026" */
  period: string;
}

export function MonthTargetCard({
  achieved,
  target,
  period,
}: MonthTargetCardProps) {
  const progress = target > 0 ? achieved / target : 0;
  const pct = Math.min(progress, 1) * 100;
  const remaining = Math.max(target - achieved, 0);
  const status = statusFromProgress(progress);

  return (
    <Card className="gap-0 overflow-hidden border-brand-100 bg-gradient-to-r from-brand-50 to-card p-5">
      {/* Hàng trên: nhãn + % lớn */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <Target className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Tiến độ mục tiêu doanh thu · {period}
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold tabular-nums leading-none text-brand-600">
                {formatPercent(progress, 1)}
              </span>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      </div>

      {/* Thanh tiến độ dài */}
      <div className="mt-4">
        <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Hàng số liệu */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-border">
        <div className="pr-4">
          <p className="text-xs text-muted-foreground">Đã đạt</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
            {formatCurrency(achieved)}
          </p>
        </div>
        <div className="px-4">
          <p className="text-xs text-muted-foreground">Mục tiêu</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
            {formatCurrency(target)}
          </p>
        </div>
        <div className="pl-4">
          <p className="text-xs text-muted-foreground">Còn thiếu</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-brand-600">
            {remaining > 0 ? formatCurrency(remaining) : "Đã đạt 🎉"}
          </p>
        </div>
      </div>
    </Card>
  );
}

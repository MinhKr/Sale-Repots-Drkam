import { Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { statusFromProgress } from "@/lib/mock/dashboard";
import type { DeptProgress } from "@/lib/dashboard/queries";
import { formatCompactVnd, formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MonthTargetCardProps {
  achieved: number;
  target: number;
  /** nhãn kỳ, vd "tháng 07/2026" */
  period: string;
  /**
   * Tiến độ từng tổ — hiện thành thanh CON thụt vào dưới thanh tổng.
   * Bỏ trống (Dashboard cá nhân) thì khối này không render.
   */
  depts?: DeptProgress[];
}

export function MonthTargetCard({
  achieved,
  target,
  period,
  depts,
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

      {depts && depts.length > 0 && <DeptBreakdown depts={depts} />}
    </Card>
  );
}

/**
 * Khối thanh con theo tổ.
 *
 * Ba tín hiệu để người xem đọc ra "đây là con của thanh tổng phía trên":
 *  1. Thụt vào + đường nối dạng cây (dọc chạy suốt, ngang rẽ vào từng tổ)
 *  2. Thanh mỏng hơn (h-2 so với h-3.5) và màu nhạt hơn (brand-400 so với 500→600)
 *  3. Nằm trong CÙNG một Card, chỉ ngăn bằng đường kẻ mảnh — không tách card riêng
 */
function DeptBreakdown({ depts }: { depts: DeptProgress[] }) {
  return (
    <div className="mt-5 border-t border-brand-100 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tiến độ theo tổ
      </p>
      {/* Nói rõ mẫu số: mỗi tổ đo theo mục tiêu riêng, KHÔNG phải phần đóng góp
          vào thanh tổng — nếu không sẽ bị hiểu nhầm là 3 thanh cộng lại ra 100%. */}
      <p className="mt-0.5 text-xs text-muted-foreground">
        Mỗi tổ so với mục tiêu riêng của tổ đó
      </p>

      <ul className="mt-3 space-y-3">
        {depts.map((d, i) => {
          const isLast = i === depts.length - 1;
          const hasTarget = d.target > 0;
          const dPct = Math.min(d.progress, 1) * 100;

          return (
            <li key={d.dept} className="relative pl-6">
              {/* đường nối dọc — chạy tiếp qua khoảng cách giữa 2 dòng, trừ dòng cuối */}
              <span
                aria-hidden
                className={cn(
                  "absolute left-1 top-0 w-px bg-brand-200",
                  isLast ? "h-2.5" : "h-[calc(100%+0.75rem)]",
                )}
              />
              {/* nhánh ngang rẽ vào tên tổ */}
              <span
                aria-hidden
                className="absolute left-1 top-2.5 h-px w-3 bg-brand-200"
              />

              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="text-sm font-medium">{d.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold tabular-nums text-brand-600">
                    {hasTarget ? formatPercent(d.progress, 1) : "—"}
                  </span>
                  {hasTarget && <StatusBadge status={d.status} />}
                </div>
              </div>

              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-400 transition-all"
                  style={{ width: `${hasTarget ? dPct : 0}%` }}
                />
              </div>

              <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                {hasTarget ? (
                  <>
                    {formatCompactVnd(d.revenue)} / {formatCompactVnd(d.target)}
                  </>
                ) : (
                  <>
                    {formatCompactVnd(d.revenue)} · chưa đặt mục tiêu tháng này
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { CheckCircle2, CircleDashed, TrendingUp, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { KpiStatus } from "@/lib/mock/types";
import { KPI_STATUS_LABEL } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

const STYLE: Record<KpiStatus, { icon: LucideIcon; cls: string }> = {
  dat: { icon: CheckCircle2, cls: "bg-success-50 text-success-600" },
  "gan-dat": { icon: TrendingUp, cls: "bg-warning-50 text-warning-600" },
  yeu: { icon: TriangleAlert, cls: "bg-danger-50 text-danger-600" },
  "chua-nhap": { icon: CircleDashed, cls: "bg-muted text-muted-foreground" },
};

/** Badge trạng thái KPI — luôn kèm icon + chữ (không chỉ dựa vào màu). */
export function StatusBadge({ status }: { status: KpiStatus }) {
  const { icon: Icon, cls } = STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cls,
      )}
    >
      <Icon className="size-3.5" />
      {KPI_STATUS_LABEL[status]}
    </span>
  );
}

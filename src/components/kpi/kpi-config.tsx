"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, Save, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KPI_DEFAULT_WARNING,
  KPI_DEPTS,
  MONTHS,
  YEARS,
} from "@/lib/mock/kpi";
import type { MonthKpi } from "@/lib/kpi/queries";
import { saveKpiConfig } from "@/lib/kpi/actions";
import { MoneyInput } from "@/components/money-input";
import { PageHeader } from "@/components/page-header";
import { DEPT_LABEL, employeesByDept } from "@/lib/mock/employees";
import { formatCompactVnd, formatCurrency } from "@/lib/format";

const monthKey = (y: number, m: number) => `${y}-${m}`;
const emptyKpi = (): MonthKpi => ({ targets: {}, warning: KPI_DEFAULT_WARNING });

export function KpiConfig({ configs }: { configs: Record<string, MonthKpi> }) {
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2026);
  // Bản chỉnh sửa cục bộ theo từng tháng (ghi đè lên configs từ server).
  const [edited, setEdited] = useState<Record<string, MonthKpi>>({});
  const [saving, startSaving] = useTransition();

  const key = monthKey(year, month);
  const current: MonthKpi = edited[key] ?? configs[key] ?? emptyKpi();
  const targets = current.targets;
  const warning = current.warning;

  const teamTotal = Object.values(targets).reduce((s, v) => s + v, 0);

  function patch(next: Partial<MonthKpi>) {
    setEdited((prev) => ({ ...prev, [key]: { ...current, ...next } }));
  }
  function setWarning(w: number) {
    patch({ warning: w });
  }
  function setTarget(code: string, n: number) {
    patch({ targets: { ...targets, [code]: n } });
  }

  function copyPrev() {
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    const prev = edited[monthKey(py, pm)] ?? configs[monthKey(py, pm)];
    if (!prev) {
      toast.error(`Chưa có cấu hình KPI tháng ${pm}/${py} để sao chép`);
      return;
    }
    patch({ targets: { ...prev.targets } });
    toast.success(`Đã sao chép mục tiêu KPI tháng ${pm}/${py}`);
  }

  function save() {
    startSaving(async () => {
      try {
        await saveKpiConfig({ year, month, warning, targets });
        toast.success(`Đã lưu cấu hình KPI tháng ${month}/${year}`);
      } catch (err) {
        console.error(err);
        toast.error("Lưu cấu hình KPI thất bại. Thử lại.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Cấu hình KPI"
        description="Đặt mục tiêu doanh thu tháng cho từng nhân viên"
        action={
          <>
            <Select
              value={String(month)}
              onValueChange={(v) => v && setMonth(Number(v))}
              items={Object.fromEntries(
                MONTHS.map((m) => [String(m), `Tháng ${m}`]),
              )}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    Tháng {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(year)}
              onValueChange={(v) => v && setYear(Number(v))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={copyPrev}>
              <Copy className="size-4" />
              Sao chép tháng trước
            </Button>
          </>
        }
      />

      {/* Ngưỡng cảnh báo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <TriangleAlert className="size-4 text-warning-600" />
            Ngưỡng cảnh báo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="warning" className="text-xs font-normal">
                Ngưỡng “gần đạt” (%)
              </Label>
              <input
                id="warning"
                type="number"
                min={0}
                max={100}
                className="cell-input w-28"
                value={warning}
                onChange={(e) => setWarning(Number(e.target.value) || 0)}
              />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              <span className="font-medium text-success-600">Đạt</span> khi ≥ 100% mục tiêu ·{" "}
              <span className="font-medium text-warning-600">Gần đạt</span> khi ≥ {warning}% ·
              dưới {warning}% là{" "}
              <span className="font-medium text-danger-600">Yếu</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mục tiêu theo bộ phận */}
      {KPI_DEPTS.map((dept) => {
        const staff = employeesByDept(dept);
        const deptTotal = staff.reduce((s, e) => s + (targets[e.id] ?? 0), 0);
        return (
          <Card key={dept}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-heading text-base">
                {DEPT_LABEL[dept]}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                Tổng: <span className="font-mono tabular-nums">{formatCompactVnd(deptTotal)}</span>
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              {staff.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-medium">{e.shortName}</span>
                  <div className="flex items-center gap-2">
                    <MoneyInput
                      value={targets[e.id] ?? 0}
                      onValueChange={(n) => setTarget(e.id, n)}
                      className="cell-input w-44 text-sm"
                    />
                    <span className="w-6 text-xs text-muted-foreground">₫</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Tổng + lưu */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card/95 p-4 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs text-muted-foreground">Tổng mục tiêu toàn team</p>
          <p className="font-heading text-xl font-bold tabular-nums text-brand-600">
            {formatCurrency(teamTotal)}
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Lưu cấu hình KPI
        </Button>
      </div>
    </div>
  );
}

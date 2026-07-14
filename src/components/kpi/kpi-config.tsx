"use client";

import { useState } from "react";
import { Copy, Save, TriangleAlert } from "lucide-react";
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
  KPI_DEFAULT_TARGETS,
  KPI_DEFAULT_WARNING,
  KPI_DEPTS,
  KPI_PREV_MONTH_TARGETS,
  MONTHS,
  YEARS,
} from "@/lib/mock/kpi";
import { MoneyInput } from "@/components/money-input";
import { DEPT_LABEL, employeesByDept } from "@/lib/mock/employees";
import { formatCompactVnd, formatCurrency } from "@/lib/format";

export function KpiConfig() {
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2026);
  const [warning, setWarning] = useState(KPI_DEFAULT_WARNING);
  const [targets, setTargets] = useState<Record<string, number>>({
    ...KPI_DEFAULT_TARGETS,
  });

  const teamTotal = Object.values(targets).reduce((s, v) => s + v, 0);

  function copyPrev() {
    setTargets({ ...KPI_PREV_MONTH_TARGETS });
    toast.success("Đã sao chép mục tiêu KPI tháng trước");
  }

  function save() {
    toast.success(`Đã lưu cấu hình KPI tháng ${month}/${year}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header + kỳ */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">Cấu hình KPI</h2>
          <p className="text-sm text-muted-foreground">
            Đặt mục tiêu doanh thu tháng cho từng nhân viên · dữ liệu giả
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(month)}
            onValueChange={(v) => v && setMonth(Number(v))}
            items={Object.fromEntries(MONTHS.map((m) => [String(m), `Tháng ${m}`]))}
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
        </div>
      </div>

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
                  <span className="text-sm font-medium">{e.name}</span>
                  <div className="flex items-center gap-2">
                    <MoneyInput
                      value={targets[e.id] ?? 0}
                      onValueChange={(n) =>
                        setTargets((prev) => ({ ...prev, [e.id]: n }))
                      }
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
        <Button onClick={save}>
          <Save className="size-4" />
          Lưu cấu hình KPI
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coins, Target, Trophy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { StatTile } from "./stat-tile";
import { StatusBadge } from "./status-badge";
import { PageHeader } from "@/components/page-header";
import type { PersonalData } from "@/lib/dashboard/queries";
import { DEPT_LABEL } from "@/lib/mock/employees";
import {
  formatCompactVnd,
  formatCurrency,
  formatPercent,
} from "@/lib/format";

interface TooltipEntry {
  name?: string;
  value?: number;
  dataKey?: string;
  color?: string;
}

function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">Ngày {label}</p>
      {payload.map((e) => (
        <div key={e.dataKey} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: e.color }}
          />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="ml-auto font-medium tabular-nums text-popover-foreground">
            {formatCurrency(e.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PersonalDashboard({ data }: { data: PersonalData[] }) {
  const items: Record<string, string> = Object.fromEntries(
    data.map((d) => [d.code, `${d.name} · ${DEPT_LABEL[d.dept]}`]),
  );
  const [empCode, setEmpCode] = useState(data[0]?.code ?? "");
  const d = data.find((x) => x.code === empCode) ?? data[0];

  if (!d) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Dashboard cá nhân"
          description="Chọn nhân viên để xem chi tiết KPI"
        />
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu báo cáo để hiển thị.
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Chọn nhân viên */}
      <PageHeader
        title="Dashboard cá nhân"
        description="Chọn nhân viên để xem chi tiết KPI"
        action={
          <Select
            value={empCode}
            onValueChange={(v) => setEmpCode(v ?? d.code)}
            items={items}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Chọn nhân viên" />
            </SelectTrigger>
            <SelectContent>
              {data.map((x) => (
                <SelectItem key={x.code} value={x.code}>
                  {x.name} · {DEPT_LABEL[x.dept]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Header nhân viên */}
      <Card className="flex flex-row flex-wrap items-center gap-4 p-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-brand-500 text-lg font-semibold text-white">
            {d.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-heading text-xl font-bold">{d.name}</p>
          <p className="text-sm text-muted-foreground">{DEPT_LABEL[d.dept]}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-gold-500/10 px-3 py-1 text-sm font-semibold text-gold-600">
            <Trophy className="size-4" />
            Hạng {d.rank}/{d.total}
          </span>
          <StatusBadge status={d.status} />
        </div>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Doanh thu tháng"
          value={formatCompactVnd(d.revenue)}
          sub={`Mục tiêu ${formatCompactVnd(d.target)}`}
          icon={Coins}
        />
        <StatTile
          label="Tiến độ KPI"
          value={formatPercent(d.progress, 1)}
          sub="so với mục tiêu tháng"
          icon={Target}
          progress={d.progress}
        />
        <StatTile
          label="Xếp hạng"
          value={`#${d.rank}`}
          sub={`trên ${d.total} nhân viên`}
          icon={Trophy}
        />
      </div>

      {/* Biểu đồ đường */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="font-heading text-base">
            Doanh thu 14 ngày gần nhất
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[var(--chart-1)]" />
              Doanh thu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[var(--chart-3)]" />
              Mục tiêu
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={d.series}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCompactVnd(v)}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  dataKey="doanhThu"
                  name="Doanh thu"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  dataKey="mucTieu"
                  name="Mục tiêu"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

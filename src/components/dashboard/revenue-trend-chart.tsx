"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { REVENUE_14D } from "@/lib/mock/dashboard";
import { formatCompactVnd, formatCurrency } from "@/lib/format";

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
      <div className="space-y-0.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="ml-auto font-medium tabular-nums text-popover-foreground">
              {formatCurrency(entry.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueTrendChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={REVENUE_14D}
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
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          />
          <Bar
            dataKey="doanhThu"
            name="Doanh thu"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
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
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Bộ lọc theo ngày dùng chung cho các tab báo cáo.
 * - Đặt "Từ ngày" = "Đến ngày" → lọc đúng 1 ngày.
 * - Chỉ đặt "Từ ngày" → từ ngày đó trở đi; chỉ "Đến ngày" → tới ngày đó.
 */
export interface DateRange {
  from: string;
  to: string;
}

export function useDateRange() {
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const active = range.from !== "" || range.to !== "";

  const inRange = useMemo(() => {
    return (date: string) =>
      (!range.from || date >= range.from) && (!range.to || date <= range.to);
  }, [range.from, range.to]);

  return { range, setRange, active, inRange };
}

export function DateRangeFilter({
  range,
  setRange,
  active,
}: {
  range: DateRange;
  setRange: (r: DateRange) => void;
  active: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      <CalendarDays className="mb-1.5 size-4 text-muted-foreground" />
      <div className="space-y-1">
        <Label htmlFor="filter-from" className="text-xs font-normal">
          Từ ngày
        </Label>
        <Input
          id="filter-from"
          type="date"
          value={range.from}
          max={range.to || undefined}
          onChange={(e) => setRange({ ...range, from: e.target.value })}
          className="h-9 w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-to" className="text-xs font-normal">
          Đến ngày
        </Label>
        <Input
          id="filter-to"
          type="date"
          value={range.to}
          min={range.from || undefined}
          onChange={(e) => setRange({ ...range, to: e.target.value })}
          className="h-9 w-40"
        />
      </div>
      {active && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRange({ from: "", to: "" })}
        >
          <X className="size-3.5" />
          Xóa lọc
        </Button>
      )}
    </div>
  );
}

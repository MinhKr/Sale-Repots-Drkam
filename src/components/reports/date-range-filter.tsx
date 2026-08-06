"use client";

import { useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { todayIso } from "@/lib/format";

/**
 * Bộ lọc dùng chung cho các tab báo cáo: **chọn tháng** + **khoảng ngày**.
 *
 * Mặc định lọc theo THÁNG HIỆN TẠI để bảng không đổ hết báo cáo của mọi
 * tháng ra gây rối (PM chốt 2026-07-31c).
 *
 * Hai bộ lọc không đá nhau: đặt khoảng ngày thì tháng tự chuyển về "tất cả",
 * chọn tháng thì khoảng ngày tự xóa — thao tác sau cùng thắng.
 */

export interface DateRange {
  from: string;
  to: string;
}

/** Giá trị đặc biệt của ô chọn tháng: bỏ lọc theo tháng. */
export const ALL_MONTHS = "ALL";

/** "2026-07" → "Tháng 07/2026" */
export function monthOptionLabel(m: string) {
  const [y, mo] = m.split("-");
  return `Tháng ${mo}/${y}`;
}

export function useReportFilter(dates: string[]) {
  const currentMonth = todayIso().slice(0, 7);
  const [month, setMonthState] = useState<string>(currentMonth);
  const [range, setRangeState] = useState<DateRange>({ from: "", to: "" });

  const rangeActive = range.from !== "" || range.to !== "";
  const active = rangeActive || month !== ALL_MONTHS;

  /** Các tháng chọn được: tháng có dữ liệu + tháng hiện tại, mới → cũ. */
  const months = useMemo(() => {
    const set = new Set(dates.map((d) => d.slice(0, 7)));
    set.add(currentMonth);
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [dates, currentMonth]);

  function setRange(r: DateRange) {
    setRangeState(r);
    // Đặt khoảng ngày → bỏ lọc tháng, tránh 2 điều kiện chặn nhau ra bảng rỗng.
    if (r.from || r.to) setMonthState(ALL_MONTHS);
  }

  function setMonth(m: string) {
    setMonthState(m);
    setRangeState({ from: "", to: "" });
  }

  function reset() {
    setMonthState(ALL_MONTHS);
    setRangeState({ from: "", to: "" });
  }

  const inRange = useMemo(() => {
    return (date: string) => {
      if (rangeActive)
        return (
          (!range.from || date >= range.from) && (!range.to || date <= range.to)
        );
      if (month !== ALL_MONTHS) return date.startsWith(month);
      return true;
    };
  }, [range.from, range.to, rangeActive, month]);

  return { range, setRange, month, setMonth, months, active, inRange, reset };
}

export function ReportFilter({
  range,
  setRange,
  month,
  setMonth,
  months,
  active,
  reset,
}: {
  range: DateRange;
  setRange: (r: DateRange) => void;
  month: string;
  setMonth: (m: string) => void;
  months: string[];
  active: boolean;
  reset: () => void;
}) {
  const items: Record<string, string> = {
    [ALL_MONTHS]: "Tất cả các tháng",
    ...Object.fromEntries(months.map((m) => [m, monthOptionLabel(m)])),
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      <CalendarDays className="mb-1.5 size-4 text-muted-foreground" />

      <div className="space-y-1">
        <Label htmlFor="filter-month" className="text-xs font-normal">
          Tháng
        </Label>
        <Select
          value={month}
          onValueChange={(v) => v && setMonth(v)}
          items={items}
        >
          <SelectTrigger id="filter-month" className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MONTHS}>Tất cả các tháng</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthOptionLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          <X className="size-3.5" />
          Xem tất cả
        </Button>
      )}
    </div>
  );
}

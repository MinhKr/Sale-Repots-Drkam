"use client";

import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** "2026-07" → "Tháng 07/2026" */
function label(m: string) {
  const [y, mo] = m.split("-");
  return `Tháng ${mo}/${y}`;
}

/**
 * Bộ lọc tháng dùng chung cho Trang chủ và Dashboard cá nhân. Đổi tháng =
 * đổi query `?month=` để server component render lại số của tháng đó.
 */
export function MonthFilter({
  months,
  value,
  basePath = "/home",
}: {
  months: string[];
  value: string | null;
  /** Trang đang đặt bộ lọc — quyết định điều hướng về đâu khi đổi tháng */
  basePath?: string;
}) {
  const router = useRouter();
  if (!months.length || !value) return null;

  return (
    <Select
      value={value}
      onValueChange={(v) => v && router.push(`${basePath}?month=${v}`)}
      items={Object.fromEntries(months.map((m) => [m, label(m)]))}
    >
      <SelectTrigger className="w-44">
        <CalendarRange className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m} value={m}>
            {label(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

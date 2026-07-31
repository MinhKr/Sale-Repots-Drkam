/**
 * Helpers định dạng số/tiền cho báo cáo Sale DrKam.
 * Locale vi-VN, tiền tệ VND. Dùng chung toàn app.
 */

const vnd = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const vndCurrency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** 1250000 -> "1.250.000" */
export function formatNumber(value: number): string {
  return vnd.format(value);
}

/** 1250000 -> "1.250.000 ₫" */
export function formatCurrency(value: number): string {
  return vndCurrency.format(value);
}

/** 1250000 -> "1,25 tr" · 1500000000 -> "1,5 tỷ" (rút gọn cho KPI card) */
export function formatCompactVnd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${round(value / 1_000_000_000)} tỷ`;
  if (abs >= 1_000_000) return `${round(value / 1_000_000)} tr`;
  if (abs >= 1_000) return `${round(value / 1_000)} k`;
  return formatNumber(value);
}

/** 0.1234 -> "12,3%" (input là tỉ lệ 0..1) */
export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toLocaleString("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

/** Chênh lệch so với kỳ trước: trả dấu + màu gợi ý */
export function formatDelta(ratio: number): { text: string; positive: boolean } {
  const positive = ratio >= 0;
  const sign = positive ? "+" : "";
  return { text: `${sign}${formatPercent(ratio)}`, positive };
}

function round(n: number): string {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}

/**
 * Ngày hôm nay dạng "YYYY-MM-DD" theo giờ máy người dùng.
 * Không dùng toISOString() vì nó quy về UTC — sáng sớm ở VN (UTC+7) sẽ ra ngày hôm qua.
 */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-07-13" -> "13/07/2026" */
export function formatDateVn(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Định dạng một giá trị theo loại ô (int/money/percent/float) */
export function formatMetric(
  value: number,
  kind: "int" | "money" | "percent" | "float",
): string {
  if (kind === "money") return formatCurrency(value);
  if (kind === "percent") return formatPercent(value, 1);
  if (kind === "float")
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  return formatNumber(value);
}

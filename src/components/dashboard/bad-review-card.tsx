import Link from "next/link";
import { ShieldCheck, Star, TriangleAlert } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { BadReviewSummary } from "@/lib/dashboard/queries";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Khối Sao Xấu trên Trang chủ — tồn lũy kế so ngưỡng + tỉ lệ xử lý so mục tiêu,
 * kèm tên người phụ trách (yêu cầu của khách: dashboard phải thấy ai đang xử lý).
 */
export function BadReviewCard({ data }: { data: BadReviewSummary }) {
  const {
    tonLuyKe,
    hasData,
    carriedOver,
    carriedOverLabel,
    tonDauKy,
    tonDauKyLabel,
    threshold,
    warnThreshold,
    goal,
    newBad,
    resolved,
    tiLeXuLy,
    fixed5,
    pending,
    noContact,
    shopee,
    tiktok,
    handlers,
    monthLabel,
  } = data;

  const level =
    tonLuyKe >= threshold ? "danger" : tonLuyKe >= warnThreshold ? "warning" : "ok";

  const tone = {
    danger: {
      card: "border-danger-500/40 bg-danger-50/60",
      icon: "bg-danger-500",
      text: "text-danger-600",
      bar: "bg-danger-500",
      message: `Vượt ngưỡng đỏ ${threshold} — cần xử lý gấp!`,
    },
    warning: {
      card: "border-warning-500/50 bg-warning-50/60",
      icon: "bg-warning-500",
      text: "text-warning-600",
      bar: "bg-warning-500",
      message: `Qua ngưỡng vàng ${warnThreshold} — theo dõi sát.`,
    },
    ok: {
      card: "border-success-500/40 bg-success-50/60",
      icon: "bg-success-500",
      text: "text-success-600",
      bar: "bg-success-500",
      message: `Trong ngưỡng an toàn (< ${warnThreshold}).`,
    },
  }[level];

  const Icon = level === "ok" ? ShieldCheck : TriangleAlert;
  const pct = Math.min(tonLuyKe / threshold, 1) * 100;
  const goalMet = tiLeXuLy >= goal;

  return (
    <Card className={cn("gap-0 overflow-hidden p-5", tone.card)}>
      {/* Hàng trên: nhãn + tồn lũy kế + thông điệp ngưỡng */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
              tone.icon,
            )}
          >
            <Icon className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Sao xấu · {monthLabel}
            </p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span
                className={cn(
                  "font-heading text-3xl font-bold leading-none tabular-nums",
                  tone.text,
                )}
              >
                {formatNumber(tonLuyKe)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {formatNumber(threshold)} sao xấu tồn
              </span>
            </div>
            {/* Tách bạch 2 phần khách yêu cầu: lũy kế mang sang từ tháng trước
                và phần phát sinh trong chính tháng đang xem. */}
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {formatNumber(carriedOver)}
              </span>{" "}
              lũy kế mang sang từ {carriedOverLabel}
              {hasData && (
                <>
                  {" · "}
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    +{formatNumber(newBad)}
                  </span>{" "}
                  mới{" · "}
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    −{formatNumber(resolved)}
                  </span>{" "}
                  đã gỡ trong tháng
                </>
              )}
            </p>
            {tonDauKy > 0 && tonDauKyLabel && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                trong đó {formatNumber(tonDauKy)} là số chốt {tonDauKyLabel}
              </p>
            )}
          </div>
        </div>
        <p className={cn("text-sm font-medium", tone.text)}>{tone.message}</p>
      </div>

      {/* Thanh tiến độ so ngưỡng đỏ, có vạch ngưỡng vàng */}
      <div className="mt-4">
        <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", tone.bar)}
            style={{ width: `${pct}%` }}
          />
          <span
            className="absolute inset-y-0 w-0.5 bg-foreground/25"
            style={{ left: `${Math.min(warnThreshold / threshold, 1) * 100}%` }}
            title={`Ngưỡng vàng ${warnThreshold}`}
          />
        </div>
      </div>

      {hasData ? (
        <>
          {/* Hàng số liệu tháng */}
          <div className="mt-4 grid grid-cols-2 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Sao xấu mới" value={formatNumber(newBad)} />
            <Metric label="Đã xử lý / gỡ" value={formatNumber(resolved)} />
            <Metric
              label={`Tỉ lệ xử lý · MT ${formatPercent(goal, 0)}`}
              value={formatPercent(tiLeXuLy, 1)}
              className={goalMet ? "text-success-600" : "text-danger-600"}
            />
            <Metric label="Khách đã sửa 5★" value={formatNumber(fixed5)} />
            <Metric
              label="Đang chờ KH sửa"
              value={formatNumber(pending)}
              className={pending > 0 ? "text-warning-600" : undefined}
            />
            <Metric
              label="Không LH được KH"
              value={formatNumber(noContact)}
              className={noContact > 0 ? "text-danger-600" : undefined}
            />
          </div>

          {/* Nguồn phát sinh */}
          <p className="mt-3 text-xs text-muted-foreground">
            Nguồn phát sinh: Shopee {formatNumber(shopee)} · TikTok{" "}
            {formatNumber(tiktok)}
          </p>
        </>
      ) : (
        /* "Chưa ai nhập" khác hẳn "có nhập, phát sinh 0" — nhìn số liệu không
           phân biệt được, nên phải nói thẳng ra. */
        <p className="mt-4 rounded-lg border border-dashed border-border bg-card/60 px-3 py-2.5 text-sm text-muted-foreground">
          Chưa có báo cáo Sao Xấu nào trong {monthLabel}. Số tồn phía trên là
          phần lũy kế mang sang từ {carriedOverLabel}.
        </p>
      )}

      {/* Người phụ trách */}
      {handlers.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">Người phụ trách</span>
          {handlers.map((h) => (
            <span
              key={h.code}
              className="flex items-center gap-2 rounded-full bg-card py-1 pl-1 pr-3 shadow-sm"
            >
              <Avatar className="size-6">
                <AvatarFallback className="bg-brand-100 text-[10px] font-semibold text-brand-700">
                  {h.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{h.shortName}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                <Star className="size-3" />
                đã gỡ {formatNumber(h.resolved)}/{formatNumber(h.newBad)}
              </span>
            </span>
          ))}
          <Link
            href="/reports/sao-xau"
            className="ml-auto text-xs font-medium text-brand-600 hover:underline"
          >
            Xem chi tiết →
          </Link>
        </div>
      )}
    </Card>
  );
}

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-semibold tabular-nums",
          className,
        )}
      >
        {value}
      </p>
    </div>
  );
}

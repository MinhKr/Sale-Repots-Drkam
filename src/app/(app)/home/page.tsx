import { CalendarRange, Coins, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { MonthTargetCard } from "@/components/dashboard/month-target-card";
import { MonthFilter } from "@/components/dashboard/month-filter";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { TeamLeaderboard } from "@/components/dashboard/team-leaderboard";
import { BadReviewCard } from "@/components/dashboard/bad-review-card";
import { getBadReviewSummary, getTeamDashboard } from "@/lib/dashboard/queries";
import { formatCompactVnd, formatDelta } from "@/lib/format";

export const metadata = { title: "Trang chủ" };
// Dashboard đọc doanh thu thật theo request — không prerender tĩnh.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  // 2 truy vấn độc lập (doanh thu / sao xấu) — chạy song song, không nối tiếp.
  const [
    { summary, revenue14d, ranking, availableMonths, month, monthLabel },
    badReview,
  ] = await Promise.all([
    getTeamDashboard(monthParam),
    getBadReviewSummary(monthParam),
  ]);
  const { homQua, tuanNay, thangNay, mucTieuThang } = summary;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Lời chào + lọc tháng */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold sm:text-2xl">
            Chào Phòng Sale 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            Tổng quan hoạt động phòng Sale · {monthLabel || "chưa có dữ liệu"}
          </p>
        </div>
        <MonthFilter months={availableMonths} value={month} />
      </div>

      {/* Tiến độ mục tiêu tháng — nổi bật, full-width, trên cùng */}
      <MonthTargetCard
        achieved={thangNay.value}
        target={mucTieuThang}
        period={monthLabel}
      />

      {/* 3 KPI doanh thu */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Doanh thu hôm qua"
          value={formatCompactVnd(homQua.value)}
          delta={formatDelta(homQua.deltaVsTruoc)}
          sub="so với hôm kia"
          icon={Coins}
        />
        <StatTile
          label="Doanh thu tuần này"
          value={formatCompactVnd(tuanNay.value)}
          delta={formatDelta(tuanNay.deltaVsTruoc)}
          sub="so tuần trước"
          icon={CalendarRange}
        />
        <StatTile
          label="Doanh thu tháng này"
          value={formatCompactVnd(thangNay.value)}
          delta={formatDelta(thangNay.deltaVsTruoc)}
          sub="so tháng trước"
          icon={TrendingUp}
        />
      </div>

      {/* Sao Xấu — tồn lũy kế, tỉ lệ xử lý, người phụ trách */}
      {badReview.month && <BadReviewCard data={badReview} />}

      {/* Biểu đồ doanh thu */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="font-heading text-base">
            Doanh thu 14 ngày gần nhất
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[var(--chart-1)]" />
              Doanh thu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[var(--chart-3)]" />
              Mục tiêu
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <RevenueTrendChart data={revenue14d} />
        </CardContent>
      </Card>

      {/* Xếp hạng nhân viên */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            Bảng xếp hạng nhân viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TeamLeaderboard ranking={ranking} />
        </CardContent>
      </Card>
    </div>
  );
}

import { CalendarRange, Coins, Target, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { TeamLeaderboard } from "@/components/dashboard/team-leaderboard";
import { CURRENT_USER } from "@/lib/mock/employees";
import { TEAM_SUMMARY } from "@/lib/mock/dashboard";
import {
  formatCompactVnd,
  formatDelta,
  formatPercent,
} from "@/lib/format";

export const metadata = { title: "Trang chủ" };

const { homQua, tuanNay, thangNay, mucTieuThang } = TEAM_SUMMARY;
const progressThang = thangNay.value / mucTieuThang;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Lời chào */}
      <div>
        <h2 className="font-heading text-xl font-bold sm:text-2xl">
          Chào {CURRENT_USER.name} 👋
        </h2>
        <p className="text-sm text-muted-foreground">
          Tổng quan hoạt động phòng Sale · tháng 07/2026
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <StatTile
          label="Tiến độ mục tiêu tháng"
          value={formatPercent(progressThang, 1)}
          sub={`Mục tiêu ${formatCompactVnd(mucTieuThang)}`}
          icon={Target}
          progress={progressThang}
        />
      </div>

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
          <RevenueTrendChart />
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
          <TeamLeaderboard />
        </CardContent>
      </Card>
    </div>
  );
}

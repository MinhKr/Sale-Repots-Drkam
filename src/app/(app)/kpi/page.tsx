import { notFound } from "next/navigation";
import { KpiConfig } from "@/components/kpi/kpi-config";
import { getCurrentUser } from "@/lib/auth";
import { listKpiConfigs } from "@/lib/kpi/queries";
import { listOpenings, openingKey } from "@/lib/reports/bad-review-opening";
import { listRoster } from "@/lib/employees/roster";

export const metadata = { title: "Cấu hình KPI" };
export const dynamic = "force-dynamic";

export default async function KpiPage() {
  // Chỉ Lead / Admin / tài khoản chung được đặt mục tiêu KPI cho cả team.
  const me = await getCurrentUser();
  const allowed =
    me.isManager ||
    me.employee?.role === "LEAD" ||
    me.employee?.dept === "ADMIN";
  if (!allowed) notFound();

  const [configs, openings, roster] = await Promise.all([
    listKpiConfigs(),
    listOpenings(),
    listRoster(),
  ]);
  // Gom theo "yyyy-mm" để client tra theo tháng đang chọn.
  const openingByMonth = Object.fromEntries(
    openings.map((o) => [openingKey(o.year, o.month), o.balance]),
  );
  return (
    <KpiConfig
      configs={configs}
      openings={openingByMonth}
      roster={roster}
    />
  );
}

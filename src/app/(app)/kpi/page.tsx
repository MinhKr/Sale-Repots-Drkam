import { KpiConfig } from "@/components/kpi/kpi-config";
import { listKpiConfigs } from "@/lib/kpi/queries";
import { listOpenings, openingKey } from "@/lib/reports/bad-review-opening";

export const metadata = { title: "Cấu hình KPI" };
export const dynamic = "force-dynamic";

export default async function KpiPage() {
  const [configs, openings] = await Promise.all([
    listKpiConfigs(),
    listOpenings(),
  ]);
  // Gom theo "yyyy-mm" để client tra theo tháng đang chọn.
  const openingByMonth = Object.fromEntries(
    openings.map((o) => [openingKey(o.year, o.month), o.balance]),
  );
  return <KpiConfig configs={configs} openings={openingByMonth} />;
}

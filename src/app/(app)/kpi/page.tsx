import { KpiConfig } from "@/components/kpi/kpi-config";
import { listKpiConfigs } from "@/lib/kpi/queries";

export const metadata = { title: "Cấu hình KPI" };
export const dynamic = "force-dynamic";

export default async function KpiPage() {
  const configs = await listKpiConfigs();
  return <KpiConfig configs={configs} />;
}

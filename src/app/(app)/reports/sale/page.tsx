import { ReportTab } from "@/components/reports/report-tab";
import { listReports } from "@/lib/reports/queries";
import { loadTabPermission } from "@/lib/reports/guard";

export const metadata = { title: "Báo cáo Sale" };
// Luôn render theo request (dữ liệu báo cáo thật, không prerender tĩnh).
export const dynamic = "force-dynamic";

export default async function SaleReportPage() {
  const [rows, perm] = await Promise.all([
    listReports("SALE"),
    loadTabPermission("SALE"),
  ]);
  return <ReportTab tab="SALE" initialRows={rows} perm={perm} />;
}

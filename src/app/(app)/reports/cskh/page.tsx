import { ReportTab } from "@/components/reports/report-tab";
import { listReports } from "@/lib/reports/queries";
import { loadTabPermission } from "@/lib/reports/guard";

export const metadata = { title: "Báo cáo CSKH" };
// Luôn render theo request (dữ liệu báo cáo thật, không prerender tĩnh).
export const dynamic = "force-dynamic";

export default async function CskhReportPage() {
  const [rows, perm] = await Promise.all([
    listReports("CSKH"),
    loadTabPermission("CSKH"),
  ]);
  return <ReportTab tab="CSKH" initialRows={rows} perm={perm} />;
}

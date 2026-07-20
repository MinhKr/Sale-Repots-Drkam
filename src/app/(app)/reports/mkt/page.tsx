import { ReportTab } from "@/components/reports/report-tab";
import { listReports } from "@/lib/reports/queries";

export const metadata = { title: "Báo cáo Marketing" };
// Luôn render theo request (dữ liệu báo cáo thật, không prerender tĩnh).
export const dynamic = "force-dynamic";

export default async function MktReportPage() {
  const rows = await listReports("MKT");
  return <ReportTab tab="MKT" initialRows={rows} />;
}

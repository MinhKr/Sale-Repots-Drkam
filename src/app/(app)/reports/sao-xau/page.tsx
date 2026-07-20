import { ReportTab } from "@/components/reports/report-tab";
import { listReports } from "@/lib/reports/queries";

export const metadata = { title: "Báo cáo Sao Xấu" };
// Luôn render theo request (dữ liệu báo cáo thật, không prerender tĩnh).
export const dynamic = "force-dynamic";

export default async function SaoXauReportPage() {
  const rows = await listReports("SAO_XAU");
  return <ReportTab tab="SAO_XAU" initialRows={rows} />;
}

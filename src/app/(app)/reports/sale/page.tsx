import { notFound } from "next/navigation";
import { ReportTab } from "@/components/reports/report-tab";
import { listReports } from "@/lib/reports/queries";
import { loadTabAccess } from "@/lib/reports/guard";

export const metadata = { title: "Báo cáo Sale" };
// Luôn render theo request (dữ liệu báo cáo thật, không prerender tĩnh).
export const dynamic = "force-dynamic";

export default async function SaleReportPage() {
  // Nhân viên chỉ vào được tab của bộ phận mình.
  const access = await loadTabAccess("SALE");
  if (!access.canView) notFound();

  const rows = await listReports("SALE", access.visibleIds);
  return (
    <ReportTab
      tab="SALE"
      initialRows={rows}
      roster={access.roster}
      perm={access.perm}
    />
  );
}

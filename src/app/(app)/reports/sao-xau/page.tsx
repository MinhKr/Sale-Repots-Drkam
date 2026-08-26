import { notFound } from "next/navigation";
import { ReportTab } from "@/components/reports/report-tab";
import { listReports } from "@/lib/reports/queries";
import { listOpenings } from "@/lib/reports/bad-review-opening";
import { loadTabAccess } from "@/lib/reports/guard";

export const metadata = { title: "Báo cáo Sao Xấu" };
// Luôn render theo request (dữ liệu báo cáo thật, không prerender tĩnh).
export const dynamic = "force-dynamic";

export default async function SaoXauReportPage() {
  // Nhân viên chỉ vào được tab của bộ phận mình.
  const access = await loadTabAccess("SAO_XAU");
  if (!access.canView) notFound();

  const [rows, openings] = await Promise.all([
    listReports("SAO_XAU", access.visibleIds),
    listOpenings(),
  ]);
  return (
    <ReportTab
      tab="SAO_XAU"
      initialRows={rows}
      roster={access.roster}
      openings={openings}
      perm={access.perm}
    />
  );
}

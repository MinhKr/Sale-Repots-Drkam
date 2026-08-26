import { notFound } from "next/navigation";
import { LivestreamTab } from "@/components/reports/livestream-tab";
import { listReports } from "@/lib/reports/queries";
import { loadTabAccess } from "@/lib/reports/guard";

export const metadata = { title: "Báo cáo Livestream" };
// Luôn render theo request (dữ liệu báo cáo thật, không prerender tĩnh).
export const dynamic = "force-dynamic";

export default async function LivestreamReportPage() {
  // Nhân viên chỉ vào được tab của bộ phận mình.
  const access = await loadTabAccess("LIVESTREAM");
  if (!access.canView) notFound();

  const rows = await listReports("LIVESTREAM", access.visibleIds);
  return (
    <LivestreamTab initialRows={rows} roster={access.roster} perm={access.perm} />
  );
}

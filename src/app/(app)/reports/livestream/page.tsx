import { LivestreamTab } from "@/components/reports/livestream-tab";
import { listReports } from "@/lib/reports/queries";

export const metadata = { title: "Báo cáo Livestream" };
// Luôn render theo request (dữ liệu báo cáo thật, không prerender tĩnh).
export const dynamic = "force-dynamic";

export default async function LivestreamReportPage() {
  const rows = await listReports("LIVESTREAM");
  return <LivestreamTab initialRows={rows} />;
}

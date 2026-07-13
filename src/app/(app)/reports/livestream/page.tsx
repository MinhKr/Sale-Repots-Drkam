import { LivestreamTab } from "@/components/reports/livestream-tab";
import { LIVESTREAM_SEED } from "@/lib/mock/reports";

export const metadata = { title: "Báo cáo Livestream" };

export default function LivestreamReportPage() {
  return <LivestreamTab initialRows={LIVESTREAM_SEED} />;
}

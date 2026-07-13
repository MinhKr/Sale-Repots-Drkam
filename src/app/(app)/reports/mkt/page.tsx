import { ReportTab } from "@/components/reports/report-tab";
import { MKT_SEED } from "@/lib/mock/reports";

export const metadata = { title: "Báo cáo Marketing" };

export default function MktReportPage() {
  return <ReportTab tab="MKT" initialRows={MKT_SEED} />;
}

import { ReportTab } from "@/components/reports/report-tab";
import { CSKH_SEED } from "@/lib/mock/reports";

export const metadata = { title: "Báo cáo CSKH" };

export default function CskhReportPage() {
  return <ReportTab tab="CSKH" initialRows={CSKH_SEED} />;
}

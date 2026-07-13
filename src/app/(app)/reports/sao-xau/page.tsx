import { ReportTab } from "@/components/reports/report-tab";
import { SAO_XAU_SEED } from "@/lib/mock/reports";

export const metadata = { title: "Báo cáo Sao Xấu" };

export default function SaoXauReportPage() {
  return <ReportTab tab="SAO_XAU" initialRows={SAO_XAU_SEED} />;
}

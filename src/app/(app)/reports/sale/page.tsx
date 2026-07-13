import { ReportTab } from "@/components/reports/report-tab";
import { SALE_SEED } from "@/lib/mock/reports";

export const metadata = { title: "Báo cáo Sale" };

export default function SaleReportPage() {
  return <ReportTab tab="SALE" initialRows={SALE_SEED} />;
}

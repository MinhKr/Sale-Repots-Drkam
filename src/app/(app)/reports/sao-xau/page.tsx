import { ReportTab } from "@/components/reports/report-tab";
import { listReports } from "@/lib/reports/queries";
import { listOpenings } from "@/lib/reports/bad-review-opening";

export const metadata = { title: "Báo cáo Sao Xấu" };
// Luôn render theo request (dữ liệu báo cáo thật, không prerender tĩnh).
export const dynamic = "force-dynamic";

export default async function SaoXauReportPage() {
  const [rows, openings] = await Promise.all([
    listReports("SAO_XAU"),
    listOpenings(),
  ]);
  // Bảng liệt kê MỌI kỳ nên tồn lũy kế lấy mốc đầu kỳ SỚM NHẤT đã khai báo.
  const opening = openings[0]?.balance ?? 0;
  return <ReportTab tab="SAO_XAU" initialRows={rows} opening={opening} />;
}

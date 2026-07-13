import { FileDown } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Xuất báo cáo" };

export default function ExportPage() {
  return (
    <PagePlaceholder
      icon={FileDown}
      title="Xuất báo cáo"
      description="Màn xuất báo cáo Excel/Word (giai đoạn này chỉ mô phỏng nút xuất, chưa sinh file thật)."
      phase="Phiên 5"
    />
  );
}

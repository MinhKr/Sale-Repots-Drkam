import { ShoppingBag } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata = { title: "Báo cáo Sale" };

export default function SaleReportPage() {
  return (
    <PagePlaceholder
      icon={ShoppingBag}
      title="Báo cáo Sale"
      description="Bảng danh sách báo cáo Sale và form nhập (ô vàng nhập tay, ô xanh tự tính) sẽ được dựng trên dữ liệu giả."
      phase="Phiên 2"
    />
  );
}

/**
 * Mock pipeline khách sỉ (wholesale) — bảng wholesale_customers + wholesale_contact_logs.
 */

export type WholesaleStage =
  | "moi"
  | "tu-van"
  | "bao-gia"
  | "dam-phan"
  | "chot";

export interface StageDef {
  key: WholesaleStage;
  label: string;
  /** true = giai đoạn thắng (tô xanh) */
  won?: boolean;
}

export const STAGES: StageDef[] = [
  { key: "moi", label: "Mới" },
  { key: "tu-van", label: "Đang tư vấn" },
  { key: "bao-gia", label: "Gửi báo giá" },
  { key: "dam-phan", label: "Đàm phán" },
  { key: "chot", label: "Chốt đơn", won: true },
];

export type ContactChannel = "call" | "zalo" | "meet" | "email";

export const CHANNEL_LABEL: Record<ContactChannel, string> = {
  call: "Gọi điện",
  zalo: "Zalo",
  meet: "Gặp mặt",
  email: "Email",
};

export interface ContactLog {
  id: string;
  date: string; // ISO
  channel: ContactChannel;
  note: string;
}

export interface WholesaleCustomer {
  id: string;
  company: string;
  contactName: string;
  phone: string;
  /** NV phụ trách */
  assignedTo: string;
  potentialValue: number;
  stage: WholesaleStage;
  /** Đã lưu trữ → ẩn khỏi board pipeline (dữ liệu thật luôn có; seed mặc định false) */
  archived?: boolean;
  createdDate: string;
  logs: ContactLog[];
}

export const WHOLESALE_SEED: WholesaleCustomer[] = [
  {
    id: "w-1",
    company: "Nhà thuốc Minh Châu",
    contactName: "Chị Châu",
    phone: "0901 234 567",
    assignedTo: "sale-phuong",
    potentialValue: 45_000_000,
    stage: "dam-phan",
    createdDate: "2026-07-02",
    logs: [
      { id: "w1-l1", date: "2026-07-02", channel: "call", note: "Khách hỏi bảng giá sỉ dòng xương khớp." },
      { id: "w1-l2", date: "2026-07-06", channel: "zalo", note: "Đã gửi báo giá + chính sách chiết khấu." },
      { id: "w1-l3", date: "2026-07-11", channel: "meet", note: "Gặp trực tiếp, đang thương lượng công nợ 30 ngày." },
    ],
  },
  {
    id: "w-2",
    company: "Chuỗi Mẹ & Bé An Nhiên",
    contactName: "Anh Tuấn",
    phone: "0912 888 777",
    assignedTo: "cskh-huong",
    potentialValue: 120_000_000,
    stage: "bao-gia",
    createdDate: "2026-07-04",
    logs: [
      { id: "w2-l1", date: "2026-07-04", channel: "call", note: "Quan tâm dòng lợi khuẩn cho bé." },
      { id: "w2-l2", date: "2026-07-09", channel: "email", note: "Gửi báo giá 3 mức số lượng." },
    ],
  },
  {
    id: "w-3",
    company: "Phòng khám Đa khoa Tâm Đức",
    contactName: "BS. Hà",
    phone: "0987 111 222",
    assignedTo: "sale-phuong",
    potentialValue: 78_000_000,
    stage: "chot",
    createdDate: "2026-06-28",
    logs: [
      { id: "w3-l1", date: "2026-06-28", channel: "meet", note: "Giới thiệu sản phẩm tại phòng khám." },
      { id: "w3-l2", date: "2026-07-05", channel: "zalo", note: "Chốt đơn 80 hộp, thanh toán chuyển khoản." },
    ],
  },
  {
    id: "w-4",
    company: "Đại lý Hoàng Gia",
    contactName: "Chị Lan",
    phone: "0933 445 566",
    assignedTo: "cskh-phuong",
    potentialValue: 35_000_000,
    stage: "tu-van",
    createdDate: "2026-07-08",
    logs: [
      { id: "w4-l1", date: "2026-07-08", channel: "call", note: "Mới liên hệ, đang tư vấn dòng bán chạy." },
    ],
  },
  {
    id: "w-5",
    company: "Nhà thuốc Long Châu (CN Q7)",
    contactName: "Anh Dũng",
    phone: "0977 654 321",
    assignedTo: "sale-phuong",
    potentialValue: 200_000_000,
    stage: "moi",
    createdDate: "2026-07-12",
    logs: [
      { id: "w5-l1", date: "2026-07-12", channel: "zalo", note: "Khách để lại thông tin qua form Ladi." },
    ],
  },
  {
    id: "w-6",
    company: "Cửa hàng TPCN Sức Khoẻ Vàng",
    contactName: "Chị Mai",
    phone: "0909 222 333",
    assignedTo: "cskh-chinh",
    potentialValue: 28_000_000,
    stage: "tu-van",
    createdDate: "2026-07-09",
    logs: [
      { id: "w6-l1", date: "2026-07-09", channel: "call", note: "Hỏi về dòng vitamin tổng hợp." },
      { id: "w6-l2", date: "2026-07-10", channel: "zalo", note: "Gửi catalogue sản phẩm." },
    ],
  },
  {
    id: "w-7",
    company: "Chuỗi Pharmacity (mua sỉ)",
    contactName: "Anh Khoa",
    phone: "0966 777 888",
    assignedTo: "cskh-huong",
    potentialValue: 320_000_000,
    stage: "dam-phan",
    createdDate: "2026-06-30",
    logs: [
      { id: "w7-l1", date: "2026-06-30", channel: "email", note: "Đề nghị hợp tác phân phối." },
      { id: "w7-l2", date: "2026-07-07", channel: "meet", note: "Họp vòng 1, đang duyệt mẫu QA." },
    ],
  },
  {
    id: "w-8",
    company: "Nhà thuốc Gia An",
    contactName: "Chị Thu",
    phone: "0944 555 666",
    assignedTo: "sale-phuong",
    potentialValue: 52_000_000,
    stage: "bao-gia",
    createdDate: "2026-07-06",
    logs: [
      { id: "w8-l1", date: "2026-07-06", channel: "call", note: "Đã tư vấn, khách xin báo giá sỉ." },
      { id: "w8-l2", date: "2026-07-08", channel: "email", note: "Gửi báo giá kèm ưu đãi tháng 7." },
    ],
  },
];

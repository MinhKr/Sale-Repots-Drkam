import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Enums Postgres — ánh xạ 1-1 với các union type ở src/lib/mock/types.ts & wholesale.ts.
 * Giữ đúng tên value để seed từ mock không phải map lại.
 */

/**
 * Bộ phận biên chế nhân sự (ADMIN = quản trị, nhập được mọi tab như Lead).
 * "MKT" đã ngưng dùng từ 2026-07-31 (không còn NV nào) nhưng giữ trong enum:
 * Postgres không xóa được value của enum, và bỏ đi sẽ sinh migration lỗi.
 */
export const deptEnum = pgEnum("dept", ["SALE", "CSKH", "LIVESTREAM", "MKT", "ADMIN", "LEAD"]);

/** Vai trò */
export const roleEnum = pgEnum("role", ["STAFF", "LEAD"]);

/**
 * Miền làm việc — chỉ dùng cho Livestream.
 * Quyết định phạm vi nhập báo cáo: NV fulltime nhập hộ được các bạn
 * parttime CÙNG MIỀN (PM chốt 2026-07-31).
 */
export const regionEnum = pgEnum("region", ["MB", "MN"]);

/**
 * Loại hợp đồng — chỉ dùng cho Livestream.
 * FT (fulltime) mới có quyền nhập báo cáo; PT chỉ xem.
 */
export const employmentEnum = pgEnum("employment", ["FT", "PT"]);

/** Giai đoạn pipeline khách sỉ */
export const wholesaleStageEnum = pgEnum("wholesale_stage", [
  "moi",
  "tu-van",
  "bao-gia",
  "dam-phan",
  "chot",
]);

/** Kênh liên hệ trong log pipeline */
export const contactChannelEnum = pgEnum("contact_channel", [
  "call",
  "zalo",
  "meet",
  "email",
]);

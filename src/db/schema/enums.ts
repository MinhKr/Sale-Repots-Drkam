import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Enums Postgres — ánh xạ 1-1 với các union type ở src/lib/mock/types.ts & wholesale.ts.
 * Giữ đúng tên value để seed từ mock không phải map lại.
 */

/** Bộ phận biên chế nhân sự */
export const deptEnum = pgEnum("dept", ["SALE", "CSKH", "LIVESTREAM", "MKT", "LEAD"]);

/** Vai trò */
export const roleEnum = pgEnum("role", ["STAFF", "LEAD"]);

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

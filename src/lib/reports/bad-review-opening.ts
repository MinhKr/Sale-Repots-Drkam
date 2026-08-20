import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OpeningRow } from "./backlog";

/**
 * Tồn sao xấu ĐẦU KỲ — số case còn tồn tại thời điểm đầu 1 tháng, mang sang từ
 * kỳ trước.
 *
 * Vì sao cần: app chỉ có báo cáo từ T7/2026, trong khi sao xấu đã tồn từ T6
 * (sheet "Lũy kế T6" của khách chốt 37 case). Không có số này thì tồn lũy kế
 * trên dashboard luôn thấp hơn thực tế.
 *
 * ⚠️ chỉ import ở phía SERVER. Phần tính toán thuần tuý (openingFor,
 * computeBacklog) nằm ở `./backlog` để client dùng chung được.
 */

export type { OpeningRow };
export { openingKey, openingFor, computeBacklog } from "./backlog";

/** Đọc toàn bộ mốc tồn đầu kỳ, cũ → mới. */
export async function listOpenings(): Promise<OpeningRow[]> {
  const rows = await db
    .select({
      year: schema.badReviewOpening.year,
      month: schema.badReviewOpening.month,
      balance: schema.badReviewOpening.balance,
      note: schema.badReviewOpening.note,
    })
    .from(schema.badReviewOpening)
    .orderBy(asc(schema.badReviewOpening.year), asc(schema.badReviewOpening.month));

  return rows.map((r) => ({
    year: r.year,
    month: r.month,
    balance: r.balance ?? 0,
    note: r.note ?? undefined,
  }));
}

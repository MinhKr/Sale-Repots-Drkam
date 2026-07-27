import { asc } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Tồn sao xấu ĐẦU KỲ — số case còn tồn tại thời điểm đầu 1 tháng, mang sang từ
 * kỳ trước.
 *
 * Vì sao cần: app chỉ có báo cáo từ T7/2026, trong khi sao xấu đã tồn từ T6
 * (sheet "Lũy kế T6" của khách chốt 37 case). Không có số này thì tồn lũy kế
 * trên dashboard luôn thấp hơn thực tế.
 *
 * ⚠️ chỉ import ở phía SERVER.
 */

export interface OpeningRow {
  year: number;
  month: number;
  balance: number;
  note?: string;
}

/** Khóa gom theo tháng, so sánh được bằng chuỗi: "2026-06". */
export const openingKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

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

/**
 * Mốc tồn đầu kỳ áp dụng khi tính lũy kế đến tháng `monthIso` (yyyy-mm):
 * dòng MỚI NHẤT có (year, month) ≤ monthIso. Trả null nếu chưa khai báo mốc nào.
 *
 * Dùng dòng gần nhất thay vì dòng đầu tiên để khi khách chốt lại số ở một tháng
 * sau (vd chốt tồn đầu T9) thì mọi sai lệch tích lũy trước đó được nắn lại.
 */
export function openingFor(
  openings: OpeningRow[],
  monthIso: string,
): OpeningRow | null {
  let found: OpeningRow | null = null;
  for (const o of openings) {
    if (openingKey(o.year, o.month) <= monthIso) found = o;
    else break; // đã sắp xếp tăng dần
  }
  return found;
}

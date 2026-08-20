/**
 * Quy tắc tính TỒN LŨY KẾ sao xấu — thuần tuý, KHÔNG chạm DB.
 *
 * Tách riêng khỏi `bad-review-opening.ts` (file đó import `db`, chỉ dùng được ở
 * server) để component client `ReportTab` dùng chung được đúng một quy tắc với
 * Trang chủ. Trước đây hai màn tự tính theo hai cách nên cùng một chỉ số ra hai
 * con số khác nhau (tab 32 · trang chủ 61).
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

/**
 * Mốc tồn đầu kỳ áp dụng khi tính lũy kế đến tháng `monthIso` (yyyy-mm):
 * dòng MỚI NHẤT có (year, month) ≤ monthIso. Trả null nếu chưa khai báo mốc nào.
 *
 * Dùng dòng gần nhất thay vì dòng đầu tiên để khi khách chốt lại số ở một tháng
 * sau (vd chốt tồn đầu T9) thì mọi sai lệch tích lũy trước đó được nắn lại.
 *
 * ⚠️ `openings` phải được sắp xếp tăng dần theo (year, month) — `listOpenings()`
 * đã làm việc đó.
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

/** Một dòng báo cáo rút gọn, đủ để tính tồn. */
export interface BacklogRow {
  date: string;
  /** net của dòng đó, vd sao xấu mới − đã xử lý */
  net: number;
}

export interface BacklogResult {
  /** tồn tại thời điểm cuối kỳ đang xem */
  total: number;
  /** phần mang sang từ trước kỳ đang xem (gồm cả mốc đầu kỳ) */
  carriedOver: number;
  /** net phát sinh trong chính kỳ đang xem */
  netInPeriod: number;
}

/**
 * Tồn lũy kế đến HẾT `endBound`.
 *
 * Điểm mấu chốt: phải nhận **toàn bộ** dòng báo cáo, không phải danh sách đã
 * lọc. "Lũy kế" nghĩa là cộng dồn từ mốc đầu kỳ đến hết kỳ đang xem — lọc sang
 * tháng 8 mà chỉ cộng dòng tháng 8 thì phần còn tồn của tháng 7 biến mất khỏi
 * phép tính dù thực tế vẫn đang treo.
 *
 * @param allRows  mọi dòng báo cáo, không lọc
 * @param endBound ngày cuối của kỳ đang xem (yyyy-mm-dd); null = không chặn trên
 * @param startBound ngày đầu của kỳ đang xem; null = mọi thứ tính là trong kỳ
 */
export function computeBacklog(
  allRows: BacklogRow[],
  openings: OpeningRow[],
  endBound: string | null,
  startBound: string | null,
): BacklogResult {
  // Mốc đầu kỳ áp dụng theo tháng của endBound (không có endBound → mốc mới nhất)
  const opening = endBound
    ? openingFor(openings, endBound.slice(0, 7))
    : (openings[openings.length - 1] ?? null);
  const openingStart = opening
    ? `${openingKey(opening.year, opening.month)}-01`
    : null;

  let carriedOver = opening?.balance ?? 0;
  let netInPeriod = 0;

  for (const r of allRows) {
    // Trước mốc đầu kỳ → bỏ, phần đó đã nằm sẵn trong số chốt (tránh đếm trùng)
    if (openingStart && r.date < openingStart) continue;
    if (endBound && r.date > endBound) continue;

    if (startBound && r.date < startBound) carriedOver += r.net;
    else netInPeriod += r.net;
  }

  return { total: carriedOver + netInPeriod, carriedOver, netInPeriod };
}

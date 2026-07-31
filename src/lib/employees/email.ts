/**
 * Sinh email đăng nhập từ họ tên tiếng Việt.
 *
 * Quy tắc (PM chốt 2026-07-31): **tên gọi + viết tắt phần họ đệm**, viết liền,
 * không dấu, thường — vd "Lê Đắc Nhật Minh" → `minhldn@drkam.vn`.
 *
 * Email này chỉ dùng làm TÊN ĐĂNG NHẬP (Supabase bắt buộc mỗi tài khoản có 1
 * email). Không cần hộp thư thật vì tài khoản được tạo với email_confirm = true.
 */

export const EMAIL_DOMAIN = "drkam.vn";

/** Dấu thanh/dấu phụ sau khi normalize("NFD") — viết dạng escape cho dễ đọc. */
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Bỏ dấu tiếng Việt. NFD tách chữ và dấu thành 2 ký tự rồi xóa dấu;
 * riêng đ/Đ (đ / Đ) không phải "d + dấu" nên phải thay tay.
 */
export function removeDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * "Lê Đắc Nhật Minh" → "minhldn"
 * "Nguyễn Thu Phương" → "phuongnt"
 * "Ly" (1 chữ) → "ly"
 */
export function localPartFromName(fullName: string): string {
  const words = removeDiacritics(fullName)
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "";

  const given = words[words.length - 1]; // tên gọi = chữ cuối
  const initials = words
    .slice(0, -1)
    .map((w) => w[0])
    .join(""); // họ đệm viết tắt
  return given + initials;
}

/**
 * Email đầy đủ, tự tránh trùng bằng hậu tố số: minhldn → minhldn2 → minhldn3.
 * `taken` là tập email đã dùng (so sánh không phân biệt hoa/thường).
 */
export function emailFromName(
  fullName: string,
  taken: Iterable<string> = [],
): string {
  const base = localPartFromName(fullName);
  if (!base) return "";

  const used = new Set([...taken].map((e) => e.toLowerCase()));
  let candidate = `${base}@${EMAIL_DOMAIN}`;
  let n = 1;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${base}${n}@${EMAIL_DOMAIN}`;
  }
  return candidate;
}

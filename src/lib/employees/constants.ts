/**
 * Hằng số dùng chung cho phần quản lý tài khoản nhân viên.
 *
 * Để riêng file này vì `actions.ts` có `"use server"` — file đó CHỈ được
 * export hàm async, không export được hằng số.
 */

/**
 * Độ dài mật khẩu tối thiểu — Supabase từ chối mật khẩu ngắn hơn 6 ký tự,
 * nên chặn sẵn ở form cho người quản lý biết ngay thay vì lỗi từ server.
 */
export const MIN_PASSWORD_LENGTH = 6;

/** Các bộ phận chọn được khi thêm nhân viên mới. */
export const DEPTS = ["SALE", "CSKH", "LIVESTREAM", "ADMIN", "LEAD"] as const;

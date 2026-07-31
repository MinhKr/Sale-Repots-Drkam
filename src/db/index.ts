import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Client Drizzle dùng chung cho server (Server Actions / seed).
 *
 * 🔴 GIỚI HẠN KẾT NỐI — đây là thứ đã làm sập bản deploy 2026-07-31:
 *
 * Supabase pooler chỉ cho tối đa 15 client. Trên Vercel mỗi request có thể
 * rơi vào một serverless instance riêng, mà `postgres.js` mặc định mở tới
 * **10 kết nối mỗi client** → chỉ 2 instance chạy song song là vượt trần và
 * mọi truy vấn ném lỗi `(EMAXCONNSESSION) max clients reached`.
 *
 * Vì vậy:
 *  - `max: 1` — mỗi instance chỉ giữ 1 kết nối. Serverless xử lý tuần tự
 *    từng request nên không cần nhiều hơn.
 *  - `idle_timeout` — nhả kết nối khi rảnh, không giữ mãi.
 *  - `prepare: false` — BẮT BUỘC khi đi qua pooler ở Transaction mode.
 *
 * ⚠️ DATABASE_URL phải trỏ vào **Transaction pooler (port 6543)**, không phải
 * Session pooler (5432). Session mode cấp hẳn 1 kết nối Postgres cho mỗi
 * client nên không hợp với serverless.
 */
const globalForDb = globalThis as unknown as {
  _pg?: ReturnType<typeof postgres>;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL chưa được thiết lập (xem .env.example / bước 7.1).");
}

const client =
  globalForDb._pg ??
  postgres(connectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

// Dev: giữ singleton để hot-reload không mở thêm kết nối mới mỗi lần sửa file.
if (process.env.NODE_ENV !== "production") globalForDb._pg = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };

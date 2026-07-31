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
 *    từng request nên không cần nhiều hơn. **Đây là bản sửa thật sự.**
 *  - `idle_timeout` — nhả kết nối khi rảnh, không giữ mãi.
 *  - `prepare: false` — bắt buộc khi đi qua pooler của Supabase.
 *
 * ⚠️ ĐỪNG đổi DATABASE_URL sang Transaction pooler (cổng 6543). Đã thử
 * 2026-07-31: từ máy local thì kết nối được, nhưng trên Vercel mọi request
 * TREO tới khi hết 300s ("Vercel Runtime Timeout Error"). Giữ **Session
 * pooler cổng 5432** — với `max: 1` thì 15 client của Supabase đủ cho 15
 * serverless instance chạy song song, thừa sức cho quy mô phòng Sale.
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

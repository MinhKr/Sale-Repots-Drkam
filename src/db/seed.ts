/**
 * Seed script (P7.8) — đổ dữ liệu mock hiện có vào DB thật.
 *
 * Chạy:  npm run db:seed   (cần .env.local có DATABASE_URL + đã db:push schema)
 *
 * Nguyên tắc:
 *  - Employees seed với `code` = slug mock (vd "sale-phuong"); id là uuid tự sinh.
 *  - Mọi FK map qua bảng code→uuid nên khi thay danh sách NV thật chỉ sửa mảng employees.
 *  - Ô tự tính (ô xanh) tính lại bằng computeMetrics() — cùng công thức với UI, không lệch.
 *  - Idempotent: xóa sạch (đúng thứ tự FK) rồi insert lại.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import {
  employees,
  reportsSale,
  reportsCskh,
  reportsBadReview,
  reportsLivestream,
  reportsMarketing,
  kpiConfig,
  wholesaleCustomers,
  wholesaleContactLogs,
} from "./schema";

import { EMPLOYEES } from "../lib/mock/employees";
import {
  SALE_CONFIG,
  CSKH_CONFIG,
  SAO_XAU_CONFIG,
  LIVESTREAM_CONFIG,
  SALE_SEED,
  CSKH_SEED,
  SAO_XAU_SEED,
  LIVESTREAM_SEED,
  TODAY_ISO,
  computeMetrics,
  type ReportConfig,
  type ReportRow,
} from "../lib/mock/reports";
import { KPI_DEFAULT_TARGETS, KPI_DEFAULT_WARNING } from "../lib/mock/kpi";
import { WHOLESALE_SEED } from "../lib/mock/wholesale";

async function main() {
  // Import động để dotenv nạp DATABASE_URL trước khi src/db/index.ts đọc env.
  const { db } = await import("./index");

  console.log("🌱 Bắt đầu seed...");

  // 1) Xóa sạch (con trước, cha sau) để chạy lại được nhiều lần.
  await db.delete(wholesaleContactLogs);
  await db.delete(wholesaleCustomers);
  await db.delete(kpiConfig);
  await db.delete(reportsSale);
  await db.delete(reportsCskh);
  await db.delete(reportsBadReview);
  await db.delete(reportsLivestream);
  // Marketing đã gỡ khỏi app (2026-07-31) và không còn seed. Vẫn dọn bảng này để
  // các DB cũ còn sót dòng MKT không làm vỡ FK khi xóa employees bên dưới.
  await db.delete(reportsMarketing);
  await db.delete(employees);
  console.log("🧹 Đã xóa dữ liệu cũ.");

  // 2) Employees — insert và lấy map code→uuid.
  const insertedEmployees = await db
    .insert(employees)
    .values(
      EMPLOYEES.map((e) => ({
        code: e.id, // slug mock làm code
        name: e.name,
        shortName: e.shortName,
        dept: e.dept,
        role: e.role,
        initials: e.initials,
        active: e.active,
      })),
    )
    .returning({ id: employees.id, code: employees.code });

  const idByCode = new Map<string, string>();
  for (const row of insertedEmployees) {
    if (row.code) idByCode.set(row.code, row.id);
  }
  const idOf = (code: string): string => {
    const id = idByCode.get(code);
    if (!id) throw new Error(`Không tìm thấy employee code="${code}" (lệch mock?)`);
    return id;
  };
  console.log(`👥 Employees: ${insertedEmployees.length}`);

  // 3) 5 bảng báo cáo — tính lại ô tự tính, map FK.
  //    Cột property trong schema trùng key mock nên build từ config là an toàn.
  const buildReportRows = (cfg: ReportConfig, seed: ReportRow[]) =>
    seed.map((r) => {
      const v = computeMetrics(cfg, r.values);
      const cols: Record<string, number> = {};
      for (const f of cfg.inputs) cols[f.key] = v[f.key] ?? 0;
      for (const f of cfg.computed) cols[f.key] = v[f.key] ?? 0;
      return {
        employeeId: idOf(r.employeeId),
        reportDate: r.date,
        note: r.note ?? null,
        ...cols,
      };
    });

  await db
    .insert(reportsSale)
    .values(buildReportRows(SALE_CONFIG, SALE_SEED) as (typeof reportsSale.$inferInsert)[]);
  await db
    .insert(reportsCskh)
    .values(buildReportRows(CSKH_CONFIG, CSKH_SEED) as (typeof reportsCskh.$inferInsert)[]);
  await db
    .insert(reportsBadReview)
    .values(
      buildReportRows(SAO_XAU_CONFIG, SAO_XAU_SEED) as (typeof reportsBadReview.$inferInsert)[],
    );
  await db
    .insert(reportsLivestream)
    .values(
      buildReportRows(LIVESTREAM_CONFIG, LIVESTREAM_SEED) as (typeof reportsLivestream.$inferInsert)[],
    );
  console.log(
    `📊 Báo cáo: sale ${SALE_SEED.length} · cskh ${CSKH_SEED.length} · sao_xau ${SAO_XAU_SEED.length} · live ${LIVESTREAM_SEED.length}`,
  );

  // 4) KPI config — cho tháng của TODAY_ISO (vd 2026-07).
  const [y, m] = TODAY_ISO.split("-").map(Number);
  const kpiRows = Object.entries(KPI_DEFAULT_TARGETS).map(([code, target]) => ({
    year: y,
    month: m,
    employeeId: idOf(code),
    targetRevenue: target,
    warningThreshold: KPI_DEFAULT_WARNING,
  }));
  await db.insert(kpiConfig).values(kpiRows);
  console.log(`🎯 KPI config: ${kpiRows.length} (tháng ${m}/${y})`);

  // 5) Wholesale — customer trước, logs sau (map id mock → uuid).
  let logCount = 0;
  for (const c of WHOLESALE_SEED) {
    const [inserted] = await db
      .insert(wholesaleCustomers)
      .values({
        company: c.company,
        contactName: c.contactName,
        phone: c.phone,
        assignedTo: idOf(c.assignedTo),
        potentialValue: c.potentialValue,
        stage: c.stage,
        createdDate: c.createdDate,
      })
      .returning({ id: wholesaleCustomers.id });

    if (c.logs.length > 0) {
      await db.insert(wholesaleContactLogs).values(
        c.logs.map((l) => ({
          customerId: inserted.id,
          logDate: l.date,
          channel: l.channel,
          note: l.note,
        })),
      );
      logCount += c.logs.length;
    }
  }
  console.log(`🤝 Wholesale: ${WHOLESALE_SEED.length} khách · ${logCount} log liên hệ`);

  console.log("✅ Seed xong.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed lỗi:", err);
    process.exit(1);
  });

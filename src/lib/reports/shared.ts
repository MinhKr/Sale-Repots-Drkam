import { db, schema } from "@/db";
import {
  computeMetrics,
  CONFIG_BY_TAB,
  type ConfigTab,
  type ReportRow,
} from "@/lib/mock/reports";

/**
 * Hạ tầng dùng chung cho đọc/ghi 5 loại báo cáo (P9 — dữ liệu thật).
 *
 * Ánh xạ tab → bảng Drizzle. Tên field trong schema TRÙNG KHỚP key trong
 * config (mock/reports.ts): messReceived, tongDon, ... nên có thể build
 * record chèn/đọc một cách tổng quát theo config.
 *
 * ⚠️ file này chỉ được import ở phía SERVER (queries/actions).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const REPORT_TABLES = {
  SALE: schema.reportsSale,
  CSKH: schema.reportsCskh,
  SAO_XAU: schema.reportsBadReview,
  LIVESTREAM: schema.reportsLivestream,
  MKT: schema.reportsMarketing,
} as const satisfies Record<ConfigTab, unknown>;

export function reportTable(tab: ConfigTab) {
  return REPORT_TABLES[tab] as any;
}

/** Dữ liệu 1 báo cáo do client gửi lên (trước khi validate). */
export interface ReportInput {
  /** slug nhân viên (= employees.code), vd "sale-phuong" */
  employeeCode: string;
  /** ISO yyyy-mm-dd */
  date: string;
  values: Record<string, number>;
  note?: string;
}

/* -------------------- Ánh xạ code (slug) ↔ id (uuid) -------------------- */

interface EmpMaps {
  codeToId: Map<string, string>;
  idToCode: Map<string, string>;
}

/** Nạp toàn bộ nhân viên (1 query) để map code↔uuid. */
export async function loadEmployeeMaps(): Promise<EmpMaps> {
  const rows = await db
    .select({ id: schema.employees.id, code: schema.employees.code })
    .from(schema.employees);
  const codeToId = new Map<string, string>();
  const idToCode = new Map<string, string>();
  for (const r of rows) {
    if (!r.code) continue;
    codeToId.set(r.code, r.id);
    idToCode.set(r.id, r.code);
  }
  return { codeToId, idToCode };
}

/**
 * Bản cache của loadEmployeeMaps — danh sách NV đổi rất hiếm (chỉ ở P10 quản lý
 * NV) nên cache 60s để đường GHI khỏi tốn 1 round-trip mỗi lần lưu.
 * Cache theo tiến trình; hot-reload dev sẽ tự reset.
 */
let _mapsCache: { data: EmpMaps; at: number } | null = null;
const MAPS_TTL_MS = 60_000;

export async function getEmployeeMaps(): Promise<EmpMaps> {
  const now = Date.now();
  if (_mapsCache && now - _mapsCache.at < MAPS_TTL_MS) return _mapsCache.data;
  const data = await loadEmployeeMaps();
  _mapsCache = { data, at: now };
  return data;
}

/**
 * Dựng record để chèn/cập nhật DB từ config + giá trị ô nhập.
 * Ô tự tính (ô xanh) được TÍNH LẠI ở server bằng computeMetrics — không tin
 * số client gửi lên, tránh lệch/giả mạo.
 */
export function buildDbRecord(
  tab: ConfigTab,
  employeeUuid: string,
  date: string,
  values: Record<string, number>,
  note?: string,
): Record<string, unknown> {
  const config = CONFIG_BY_TAB[tab];
  const metrics = computeMetrics(config, values);

  const record: Record<string, unknown> = {
    employeeId: employeeUuid,
    reportDate: date,
    note: note?.trim() ? note.trim() : null,
  };
  for (const f of config.inputs) record[f.key] = values[f.key] ?? 0;
  for (const c of config.computed) record[c.key] = metrics[c.key] ?? 0;
  return record;
}

/** Các cột sẽ được cập nhật khi upsert (mọi cột số + note + updatedAt). */
export function buildUpdateSet(record: Record<string, unknown>) {
  const { employeeId: _e, reportDate: _d, ...rest } = record;
  void _e;
  void _d;
  return { ...rest, updatedAt: new Date() };
}

/** Chuyển 1 dòng DB về ReportRow (employeeId = slug) cho UI dùng lại. */
export function toReportRow(
  tab: ConfigTab,
  dbRow: Record<string, any>,
  idToCode: Map<string, string>,
): ReportRow {
  const config = CONFIG_BY_TAB[tab];
  const values: Record<string, number> = {};
  for (const f of config.inputs) values[f.key] = Number(dbRow[f.key] ?? 0);
  return {
    id: dbRow.id as string,
    employeeId: idToCode.get(dbRow.employeeId as string) ?? (dbRow.employeeId as string),
    date: dbRow.reportDate as string,
    values,
    note: (dbRow.note as string | null) ?? undefined,
  };
}

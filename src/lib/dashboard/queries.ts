import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { statusFromProgress } from "@/lib/mock/dashboard";
import { SAO_XAU_CONFIG, SAO_XAU_GOAL_TI_LE_XU_LY } from "@/lib/mock/reports";
import {
  listOpenings,
  openingFor,
  openingKey,
} from "@/lib/reports/bad-review-opening";
import type {
  DeptCode,
  KpiStatus,
  RankRow,
  RevenuePoint,
} from "@/lib/mock/types";

/**
 * Tầng dữ liệu Dashboard (P10) — tổng hợp doanh thu THẬT từ 4 bảng báo cáo có
 * doanh thu (Sale, CSKH, Livestream, MKT).
 *
 * "Mốc ngày" (anchor) = ngày báo cáo MỚI NHẤT có trong DB (PM chốt), nên
 * "hôm qua / tuần này / tháng này" luôn có số cả ở demo lẫn production.
 */

/* --------------------------- helper ngày (ISO) --------------------------- */
const toDate = (iso: string) => new Date(iso + "T00:00:00Z");
const fmtIso = (d: Date) => d.toISOString().slice(0, 10);
function addDays(iso: string, n: number) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fmtIso(d);
}
/** Thứ Hai của tuần chứa iso (tuần Mon→Sun). */
function mondayOf(iso: string) {
  const d = toDate(iso);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dow);
  return fmtIso(d);
}
const monthKey = (iso: string) => iso.slice(0, 7); // yyyy-mm
function daysInMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
const ddmm = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};
const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);

/* ----------------------------- nạp dữ liệu ------------------------------ */

interface EmpRow {
  id: string;
  code: string;
  name: string;
  shortName: string;
  initials: string;
  dept: DeptCode;
}

interface Base {
  anchor: string | null;
  /** date → tổng doanh thu toàn team ngày đó */
  dailyTotal: Map<string, number>;
  /** empId(uuid) → (date → doanh thu) */
  empDaily: Map<string, Map<string, number>>;
  employees: EmpRow[];
  /** empId(uuid) → mục tiêu tháng anchor */
  targetById: Map<string, number>;
  mucTieuThang: number;
  /** các tháng (yyyy-mm) có dữ liệu, mới → cũ */
  availableMonths: string[];
  /** tháng đang xem (yyyy-mm) */
  month: string | null;
}

/** UNION ALL 4 bảng doanh thu về (employeeId, date, rev) — 1 round-trip. */
async function loadRevenueRows() {
  const s = schema;
  const q1 = db
    .select({
      employeeId: s.reportsSale.employeeId,
      date: s.reportsSale.reportDate,
      rev: s.reportsSale.tongDoanhThu,
    })
    .from(s.reportsSale);
  const q2 = db
    .select({
      employeeId: s.reportsCskh.employeeId,
      date: s.reportsCskh.reportDate,
      rev: s.reportsCskh.tongDoanhThu,
    })
    .from(s.reportsCskh);
  const q3 = db
    .select({
      employeeId: s.reportsLivestream.employeeId,
      date: s.reportsLivestream.reportDate,
      rev: s.reportsLivestream.revenue,
    })
    .from(s.reportsLivestream);
  const q4 = db
    .select({
      employeeId: s.reportsMarketing.employeeId,
      date: s.reportsMarketing.reportDate,
      rev: s.reportsMarketing.revenue,
    })
    .from(s.reportsMarketing);
  return q1.unionAll(q2).unionAll(q3).unionAll(q4);
}

/**
 * Nạp + tổng hợp doanh thu. `selectedMonth` (yyyy-mm) chọn tháng để xem;
 * bỏ trống → tháng có dữ liệu mới nhất. Anchor = ngày báo cáo mới nhất TRONG
 * tháng đang xem. KPI nạp theo đúng tháng đó.
 */
async function loadBase(selectedMonth?: string): Promise<Base> {
  const [rows, employees] = await Promise.all([
    loadRevenueRows(),
    db
      .select({
        id: schema.employees.id,
        code: schema.employees.code,
        name: schema.employees.name,
        shortName: schema.employees.shortName,
        initials: schema.employees.initials,
        dept: schema.employees.dept,
      })
      .from(schema.employees),
  ]);

  const dailyTotal = new Map<string, number>();
  const empDaily = new Map<string, Map<string, number>>();
  const monthsSet = new Set<string>();

  for (const r of rows) {
    const rev = Number(r.rev ?? 0);
    const date = r.date as string;
    monthsSet.add(monthKey(date));
    dailyTotal.set(date, (dailyTotal.get(date) ?? 0) + rev);
    let m = empDaily.get(r.employeeId);
    if (!m) {
      m = new Map();
      empDaily.set(r.employeeId, m);
    }
    m.set(date, (m.get(date) ?? 0) + rev);
  }

  const availableMonths = [...monthsSet].sort((a, b) => b.localeCompare(a));
  const month =
    selectedMonth && availableMonths.includes(selectedMonth)
      ? selectedMonth
      : (availableMonths[0] ?? null);

  // Anchor = ngày mới nhất trong tháng đang xem
  let anchor: string | null = null;
  if (month) {
    for (const d of dailyTotal.keys()) {
      if (monthKey(d) === month && (!anchor || d > anchor)) anchor = d;
    }
  }

  // Mục tiêu KPI cho tháng đang xem
  const targetById = new Map<string, number>();
  let mucTieuThang = 0;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const kpiRows = await db
      .select({
        employeeId: schema.kpiConfig.employeeId,
        target: schema.kpiConfig.targetRevenue,
      })
      .from(schema.kpiConfig)
      .where(and(eq(schema.kpiConfig.year, y), eq(schema.kpiConfig.month, m)));
    for (const k of kpiRows) {
      targetById.set(k.employeeId, Number(k.target ?? 0));
      mucTieuThang += Number(k.target ?? 0);
    }
  }

  const empList: EmpRow[] = employees
    .filter((e) => e.code)
    .map((e) => ({
      id: e.id,
      code: e.code as string,
      name: e.name,
      shortName: e.shortName,
      initials: e.initials,
      dept: e.dept as DeptCode,
    }));

  return {
    anchor,
    dailyTotal,
    empDaily,
    employees: empList,
    targetById,
    mucTieuThang,
    availableMonths,
    month,
  };
}

/** "2026-07" → "tháng 07/2026" */
export function monthLabel(m: string | null): string {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return `tháng ${mo}/${y}`;
}

/** Tổng các ngày trong [from, to] (bao gồm 2 đầu). */
function sumRange(map: Map<string, number>, from: string, to: string) {
  let s = 0;
  for (const [d, v] of map) if (d >= from && d <= to) s += v;
  return s;
}

/* --------------------------- Dashboard team ----------------------------- */

export interface TeamDashboard {
  summary: {
    homQua: { value: number; deltaVsTruoc: number };
    tuanNay: { value: number; deltaVsTruoc: number };
    thangNay: { value: number; deltaVsTruoc: number };
    mucTieuThang: number;
  };
  revenue14d: RevenuePoint[];
  ranking: RankRow[];
  anchorLabel: string | null;
  /** các tháng có dữ liệu (yyyy-mm), mới → cũ */
  availableMonths: string[];
  /** tháng đang xem (yyyy-mm) */
  month: string | null;
  /** nhãn tháng đang xem, vd "tháng 07/2026" */
  monthLabel: string;
}

export async function getTeamDashboard(
  selectedMonth?: string,
): Promise<TeamDashboard> {
  const base = await loadBase(selectedMonth);
  const { anchor, dailyTotal, mucTieuThang, availableMonths, month } = base;

  if (!anchor) {
    return {
      summary: {
        homQua: { value: 0, deltaVsTruoc: 0 },
        tuanNay: { value: 0, deltaVsTruoc: 0 },
        thangNay: { value: 0, deltaVsTruoc: 0 },
        mucTieuThang: 0,
      },
      revenue14d: [],
      ranking: [],
      anchorLabel: null,
      availableMonths,
      month,
      monthLabel: monthLabel(month),
    };
  }

  // Hôm qua = ngày anchor · hôm kia = anchor - 1
  const homQua = dailyTotal.get(anchor) ?? 0;
  const homKia = dailyTotal.get(addDays(anchor, -1)) ?? 0;

  // Tuần này = từ thứ Hai → anchor · tuần trước = 7 ngày liền trước tuần đó
  const wStart = mondayOf(anchor);
  const tuanNay = sumRange(dailyTotal, wStart, anchor);
  const tuanTruoc = sumRange(
    dailyTotal,
    addDays(wStart, -7),
    addDays(wStart, -1),
  );

  // Tháng này = từ mùng 1 → anchor · tháng trước = cùng khoảng ngày (1..dayNum)
  const mStart = monthKey(anchor) + "-01";
  const thangNay = sumRange(dailyTotal, mStart, anchor);
  const [ay, am, ad] = anchor.split("-").map(Number);
  const prevM = am === 1 ? 12 : am - 1;
  const prevY = am === 1 ? ay - 1 : ay;
  const prevMStart = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
  const prevDays = daysInMonth(prevMStart);
  const prevMEnd = `${prevY}-${String(prevM).padStart(2, "0")}-${String(
    Math.min(ad, prevDays),
  ).padStart(2, "0")}`;
  const thangTruoc = sumRange(dailyTotal, prevMStart, prevMEnd);

  // Biểu đồ 14 ngày kết thúc ở anchor
  const dailyTarget = Math.round(ratio(mucTieuThang, daysInMonth(anchor)));
  const revenue14d: RevenuePoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = addDays(anchor, -i);
    revenue14d.push({
      label: ddmm(d),
      doanhThu: dailyTotal.get(d) ?? 0,
      mucTieu: dailyTarget,
    });
  }

  return {
    summary: {
      homQua: { value: homQua, deltaVsTruoc: ratio(homQua - homKia, homKia) },
      tuanNay: { value: tuanNay, deltaVsTruoc: ratio(tuanNay - tuanTruoc, tuanTruoc) },
      thangNay: { value: thangNay, deltaVsTruoc: ratio(thangNay - thangTruoc, thangTruoc) },
      mucTieuThang,
    },
    revenue14d,
    ranking: buildRanking(base),
    anchorLabel: ddmm(anchor),
    availableMonths,
    month,
    monthLabel: monthLabel(month),
  };
}

/** Xếp hạng NV theo doanh thu tháng anchor (trừ LEAD). */
function buildRanking(base: Base): RankRow[] {
  const { anchor, empDaily, employees, targetById } = base;
  if (!anchor) return [];
  const mKey = monthKey(anchor);

  const rows = employees
    // Admin + Lead không phải NV KPI bán hàng → không lên bảng xếp hạng
    .filter((e) => e.dept !== "LEAD" && e.dept !== "ADMIN")
    .map((e) => {
      const revenue = empMonthRevenue(empDaily, e.id, mKey);
      const target = targetById.get(e.id) ?? 0;
      const progress = ratio(revenue, target);
      return {
        rank: 0,
        employeeId: e.code,
        name: e.shortName,
        dept: e.dept,
        revenue,
        target,
        progress,
        status: statusFromProgress(progress) as KpiStatus,
      } satisfies RankRow;
    });

  return rows
    .sort((a, b) => b.revenue - a.revenue)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function empMonthRevenue(
  empDaily: Map<string, Map<string, number>>,
  empId: string,
  mKey: string,
) {
  let s = 0;
  const m = empDaily.get(empId);
  if (m) for (const [d, v] of m) if (d.slice(0, 7) === mKey) s += v;
  return s;
}

/* --------------------------- Khối Sao Xấu ------------------------------- */

/** Một NV có nhập báo cáo Sao Xấu trong tháng đang xem. */
export interface BadReviewHandler {
  code: string;
  name: string;
  shortName: string;
  initials: string;
  newBad: number;
  resolved: number;
}

export interface BadReviewSummary {
  /** tháng đang xem (yyyy-mm) — null khi chưa có báo cáo Sao Xấu nào */
  month: string | null;
  monthLabel: string;
  /**
   * Tồn lũy kế = tồn đầu kỳ + Σ(sao xấu mới − đã xử lý) từ mốc đầu kỳ đến HẾT
   * tháng đang xem.
   */
  tonLuyKe: number;
  /** tồn mang sang từ mốc đầu kỳ đang áp dụng */
  tonDauKy: number;
  /** nhãn mốc đầu kỳ, vd "đầu tháng 07/2026" — null nếu chưa khai báo mốc nào */
  tonDauKyLabel: string | null;
  /** ngưỡng cảnh báo ĐỎ / VÀNG, lấy chung với trang Sao Xấu */
  threshold: number;
  warnThreshold: number;
  /** mục tiêu tỉ lệ xử lý (0..1) */
  goal: number;
  /** phát sinh trong tháng đang xem */
  newBad: number;
  resolved: number;
  /** đã xử lý / sao xấu mới trong tháng */
  tiLeXuLy: number;
  /** sao khách đã sửa lại thành 5★ trong tháng */
  fixed5: number;
  /** case đang chờ khách sửa (số của ngày mới nhất có dữ liệu) */
  pending: number;
  /** không liên hệ được khách — cộng dồn trong tháng */
  noContact: number;
  /** case liên quan kho — cộng dồn trong tháng */
  warehouseIssue: number;
  /** phát sinh theo sàn trong tháng */
  shopee: number;
  tiktok: number;
  /** phân loại sao xấu trong tháng */
  star1: number;
  star2: number;
  star3: number;
  /** người phụ trách, nhiều → ít sao xấu đã gỡ */
  handlers: BadReviewHandler[];
}

const BACKLOG = SAO_XAU_CONFIG.backlog!;

const EMPTY_BAD_REVIEW: BadReviewSummary = {
  month: null,
  monthLabel: "",
  tonLuyKe: 0,
  tonDauKy: 0,
  tonDauKyLabel: null,
  threshold: BACKLOG.threshold,
  warnThreshold: BACKLOG.warnThreshold,
  goal: SAO_XAU_GOAL_TI_LE_XU_LY,
  newBad: 0,
  resolved: 0,
  tiLeXuLy: 0,
  fixed5: 0,
  pending: 0,
  noContact: 0,
  warehouseIssue: 0,
  shopee: 0,
  tiktok: 0,
  star1: 0,
  star2: 0,
  star3: 0,
  handlers: [],
};

/**
 * Tổng hợp Sao Xấu cho Trang chủ — bảng `reports_bad_review` KHÔNG có doanh thu
 * nên không nằm trong `loadBase()`; đọc riêng ở đây (JOIN sang employees để lấy
 * tên người phụ trách) cùng bảng mốc tồn đầu kỳ, 2 query chạy song song.
 *
 * `selectedMonth` dùng chung bộ lọc tháng của Trang chủ; nếu tháng đó không có
 * báo cáo Sao Xấu thì rơi về tháng mới nhất CÓ dữ liệu (card tự hiện nhãn tháng
 * của mình nên số liệu không bao giờ bị gán nhầm kỳ).
 *
 * Lưu ý "Chờ khách sửa": đây là số case ĐANG treo tại một thời điểm chứ không
 * phải lượng phát sinh, nên lấy giá trị của ngày mới nhất có dữ liệu trong
 * tháng — cộng dồn sẽ đếm trùng một case qua nhiều ngày.
 */
export async function getBadReviewSummary(
  selectedMonth?: string,
): Promise<BadReviewSummary> {
  const t = schema.reportsBadReview;
  const [rows, openings] = await Promise.all([
    db
      .select({
        employeeId: t.employeeId,
        date: t.reportDate,
        newBad: t.newBad,
        resolved: t.resolved,
        star1: t.star1,
        star2: t.star2,
        star3: t.star3,
        shopee: t.shopee,
        tiktok: t.tiktok,
        fixed5Total: t.fixed5Total,
        pendingTotal: t.pendingTotal,
        noContact: t.noContact,
        warehouseIssue: t.warehouseIssue,
        code: schema.employees.code,
        name: schema.employees.name,
        shortName: schema.employees.shortName,
        initials: schema.employees.initials,
      })
      .from(t)
      .leftJoin(schema.employees, eq(t.employeeId, schema.employees.id))
      .orderBy(desc(t.reportDate)),
    listOpenings(),
  ]);

  if (rows.length === 0) return EMPTY_BAD_REVIEW;

  const months = [...new Set(rows.map((r) => monthKey(r.date as string)))].sort(
    (a, b) => b.localeCompare(a),
  );
  const month =
    selectedMonth && months.includes(selectedMonth) ? selectedMonth : months[0];
  const monthEnd = month + "-32"; // so sánh chuỗi: mọi ngày trong tháng đều < "-32"

  // Mốc đầu kỳ áp dụng: chỉ cộng net từ mốc đó trở đi, tránh đếm trùng phần
  // đã nằm sẵn trong số chốt.
  const opening = openingFor(openings, month);
  const openingStart = opening
    ? `${openingKey(opening.year, opening.month)}-01`
    : null;

  const acc = {
    newBad: 0,
    resolved: 0,
    fixed5: 0,
    noContact: 0,
    warehouseIssue: 0,
    shopee: 0,
    tiktok: 0,
    star1: 0,
    star2: 0,
    star3: 0,
  };
  let tonLuyKe = opening?.balance ?? 0;
  let pending = 0;
  let pendingDate = "";
  const byEmp = new Map<string, BadReviewHandler>();

  for (const r of rows) {
    const date = r.date as string;
    const n = r.newBad ?? 0;
    const s = r.resolved ?? 0;

    // Tồn lũy kế: cộng dồn từ mốc đầu kỳ đến hết tháng đang xem
    if (date <= monthEnd && (!openingStart || date >= openingStart))
      tonLuyKe += n - s;
    if (monthKey(date) !== month) continue;

    acc.newBad += n;
    acc.resolved += s;
    acc.fixed5 += r.fixed5Total ?? 0;
    acc.noContact += r.noContact ?? 0;
    acc.warehouseIssue += r.warehouseIssue ?? 0;
    acc.shopee += r.shopee ?? 0;
    acc.tiktok += r.tiktok ?? 0;
    acc.star1 += r.star1 ?? 0;
    acc.star2 += r.star2 ?? 0;
    acc.star3 += r.star3 ?? 0;

    // Chờ KH sửa = số đang treo ở ngày mới nhất, không cộng dồn
    if (date > pendingDate) {
      pendingDate = date;
      pending = r.pendingTotal ?? 0;
    }

    const code = r.code ?? (r.employeeId as string);
    let h = byEmp.get(code);
    if (!h) {
      h = {
        code,
        name: r.name ?? code,
        shortName: r.shortName ?? r.name ?? code,
        initials: r.initials ?? "?",
        newBad: 0,
        resolved: 0,
      };
      byEmp.set(code, h);
    }
    h.newBad += n;
    h.resolved += s;
  }

  return {
    month,
    monthLabel: monthLabel(month),
    tonLuyKe,
    tonDauKy: opening?.balance ?? 0,
    tonDauKyLabel: opening
      ? `đầu ${monthLabel(openingKey(opening.year, opening.month))}`
      : null,
    threshold: BACKLOG.threshold,
    warnThreshold: BACKLOG.warnThreshold,
    goal: SAO_XAU_GOAL_TI_LE_XU_LY,
    ...acc,
    tiLeXuLy: ratio(acc.resolved, acc.newBad),
    pending,
    handlers: [...byEmp.values()].sort((a, b) => b.resolved - a.resolved),
  };
}

/* ------------------------- Dashboard cá nhân ---------------------------- */

export interface PersonalData {
  code: string;
  name: string;
  shortName: string;
  initials: string;
  dept: DeptCode;
  rank: number;
  total: number;
  revenue: number;
  target: number;
  progress: number;
  status: KpiStatus;
  series: RevenuePoint[];
}

/** Dữ liệu dashboard cá nhân cho MỌI NV (client tự đổi qua selector). */
export async function getPersonalDashboards(): Promise<PersonalData[]> {
  const base = await loadBase();
  const ranking = buildRanking(base);
  const total = ranking.length;
  if (!base.anchor) return [];

  const empByCode = new Map(base.employees.map((e) => [e.code, e]));
  const dailyTarget = (target: number) =>
    Math.round(ratio(target, daysInMonth(base.anchor!)));

  return ranking.map((r) => {
    const emp = empByCode.get(r.employeeId)!;
    const daily = base.empDaily.get(emp.id);
    const perDayTarget = dailyTarget(r.target);
    const series: RevenuePoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(base.anchor!, -i);
      series.push({
        label: ddmm(d),
        doanhThu: daily?.get(d) ?? 0,
        mucTieu: perDayTarget,
      });
    }
    return {
      code: r.employeeId,
      name: emp.name,
      shortName: emp.shortName,
      initials: emp.initials,
      dept: emp.dept,
      rank: r.rank,
      total,
      revenue: r.revenue,
      target: r.target,
      progress: r.progress,
      status: r.status,
      series,
    };
  });
}

import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { statusFromProgress } from "@/lib/mock/dashboard";
import { DEPT_LABEL } from "@/lib/mock/employees";
import { KPI_DEPTS } from "@/lib/mock/kpi";
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
 * Tầng dữ liệu Dashboard (P10) — tổng hợp doanh thu THẬT từ 3 bảng báo cáo có
 * doanh thu (Sale, CSKH, Livestream).
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
/** "2026-08" → "2026-07" */
function prevMonthKey(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return mo === 1
    ? `${y - 1}-12`
    : `${y}-${String(mo - 1).padStart(2, "0")}`;
}
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
  /** "SALE" | "CSKH" | "LIVE" → (date → doanh thu ngày đó của bộ phận) */
  dailyByDept: Map<string, Map<string, number>>;
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

/**
 * UNION ALL 3 bảng doanh thu về (employeeId, date, rev, src) — 1 round-trip.
 *
 * `src` để tách doanh thu ngày theo từng bộ phận. Trang chủ hiện 3 ô riêng —
 * Sale, CSKH, Livestream — trong đó Livestream lấy số LÙI 1 NGÀY vì báo cáo
 * nhập lúc 17h mà tối vẫn còn live.
 */
async function loadRevenueRows() {
  const s = schema;
  const q1 = db
    .select({
      employeeId: s.reportsSale.employeeId,
      date: s.reportsSale.reportDate,
      rev: s.reportsSale.tongDoanhThu,
      src: sql<string>`'SALE'`.as("src"),
    })
    .from(s.reportsSale);
  const q2 = db
    .select({
      employeeId: s.reportsCskh.employeeId,
      date: s.reportsCskh.reportDate,
      rev: s.reportsCskh.tongDoanhThu,
      src: sql<string>`'CSKH'`.as("src"),
    })
    .from(s.reportsCskh);
  const q3 = db
    .select({
      employeeId: s.reportsLivestream.employeeId,
      date: s.reportsLivestream.reportDate,
      rev: s.reportsLivestream.revenue,
      src: sql<string>`'LIVE'`.as("src"),
    })
    .from(s.reportsLivestream);
  return q1.unionAll(q2).unionAll(q3);
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
  const dailyByDept = new Map<string, Map<string, number>>();
  const empDaily = new Map<string, Map<string, number>>();
  const monthsSet = new Set<string>();

  for (const r of rows) {
    const rev = Number(r.rev ?? 0);
    const date = r.date as string;
    monthsSet.add(monthKey(date));
    dailyTotal.set(date, (dailyTotal.get(date) ?? 0) + rev);
    let bySrc = dailyByDept.get(r.src);
    if (!bySrc) {
      bySrc = new Map();
      dailyByDept.set(r.src, bySrc);
    }
    bySrc.set(date, (bySrc.get(date) ?? 0) + rev);
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
    dailyByDept,
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

/**
 * Tiến độ doanh thu của MỘT tổ trong phòng Sale (Sale / CSKH / Livestream).
 *
 * ⚠️ Tổng `revenue` của 3 tổ KHÔNG chắc bằng doanh thu toàn phòng, và tổng
 * `target` cũng không chắc bằng `mucTieuThang`: nếu người ở bộ phận ADMIN/LEAD
 * có dòng báo cáo doanh thu hoặc có KPI thì phần đó nằm ngoài 3 tổ này. Vì vậy
 * mỗi thanh con luôn đo theo mục tiêu của CHÍNH tổ đó, không phải phần trăm
 * đóng góp vào thanh cha.
 */
export interface DeptProgress {
  dept: DeptCode;
  /** nhãn hiển thị, vd "Livestream" */
  label: string;
  revenue: number;
  target: number;
  progress: number;
  status: KpiStatus;
  /** số NV của tổ có phát sinh doanh thu trong tháng */
  activeCount: number;
}

/**
 * Doanh thu của MỘT ngày cụ thể, kèm ngày để hiển thị — không dùng chữ
 * "hôm nay/hôm qua" cứng vì mốc phụ thuộc ngày báo cáo mới nhất có trong DB.
 */
export interface DayRevenue {
  value: number;
  deltaVsTruoc: number;
  /** ngày của số liệu (yyyy-mm-dd) */
  date: string;
  /** nhãn ngắn để hiện trên thẻ, vd "19/08" */
  label: string;
}

export interface TeamDashboard {
  summary: {
    homQua: { value: number; deltaVsTruoc: number };
    tuanNay: { value: number; deltaVsTruoc: number };
    thangNay: { value: number; deltaVsTruoc: number };
    mucTieuThang: number;
    /** Doanh thu ngày của Sale — theo ngày báo cáo mới nhất. */
    saleNgay: DayRevenue;
    /** Doanh thu ngày của CSKH — cùng mốc ngày với Sale. */
    cskhNgay: DayRevenue;
    /**
     * Doanh thu ngày của Livestream — LÙI LẠI 1 NGÀY so với Sale/CSKH.
     * Lý do (PM chốt 2026-08-20): báo cáo nhập lúc 17h nhưng livestream còn
     * chạy cả buổi tối, nên số của chính ngày đó luôn thiếu; phải sang hôm sau
     * chốt lại mới đúng.
     */
    livestreamNgay: DayRevenue;
  };
  revenue14d: RevenuePoint[];
  ranking: RankRow[];
  /** tiến độ từng tổ trong phòng — thanh con của thanh tổng */
  deptProgress: DeptProgress[];
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
        saleNgay: { value: 0, deltaVsTruoc: 0, date: "", label: "" },
        cskhNgay: { value: 0, deltaVsTruoc: 0, date: "", label: "" },
        livestreamNgay: { value: 0, deltaVsTruoc: 0, date: "", label: "" },
      },
      revenue14d: [],
      ranking: [],
      deptProgress: [],
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

  // 3 ô doanh thu ngày, mỗi bộ phận một ô (xem chú thích ở kiểu TeamDashboard).
  // Sale/CSKH lấy mốc anchor; Livestream lùi 1 ngày.
  const { dailyByDept } = base;
  const dayRev = (src: string, on: string): DayRevenue => {
    const m = dailyByDept.get(src);
    const value = m?.get(on) ?? 0;
    const truoc = m?.get(addDays(on, -1)) ?? 0;
    return {
      value,
      deltaVsTruoc: ratio(value - truoc, truoc),
      date: on,
      label: ddmm(on),
    };
  };
  const liveDate = addDays(anchor, -1);

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
      saleNgay: dayRev("SALE", anchor),
      cskhNgay: dayRev("CSKH", anchor),
      livestreamNgay: dayRev("LIVE", liveDate),
    },
    revenue14d,
    ranking: buildRanking(base),
    deptProgress: buildDeptProgress(base),
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

/**
 * Gộp doanh thu + mục tiêu theo tổ cho tháng anchor.
 *
 * Dùng đúng KPI_DEPTS (SALE / CSKH / LIVESTREAM) — ADMIN và LEAD không có
 * mục tiêu bán hàng nên không hiện thành thanh con, giống cách bảng xếp hạng
 * đang loại 2 bộ phận này.
 */
function buildDeptProgress(base: Base): DeptProgress[] {
  const { anchor, empDaily, employees, targetById } = base;
  if (!anchor) return [];
  const mKey = monthKey(anchor);

  return KPI_DEPTS.map((dept) => {
    const members = employees.filter((e) => e.dept === dept);
    let revenue = 0;
    let target = 0;
    let activeCount = 0;
    for (const e of members) {
      const rev = empMonthRevenue(empDaily, e.id, mKey);
      revenue += rev;
      target += targetById.get(e.id) ?? 0;
      if (rev > 0) activeCount += 1;
    }
    const progress = ratio(revenue, target);
    return {
      dept,
      label: DEPT_LABEL[dept],
      revenue,
      target,
      progress,
      status: statusFromProgress(progress) as KpiStatus,
      activeCount,
    } satisfies DeptProgress;
  });
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
   * Tháng đang xem CÓ ít nhất 1 dòng báo cáo Sao Xấu hay không.
   *
   * Quan trọng: "chưa ai nhập" và "có nhập, phát sinh 0 case" nhìn ra số liệu
   * là y hệt nhau. Tách cờ này để card nói rõ, tránh việc chưa nhập liệu bị
   * đọc thành tháng sạch sao xấu.
   */
  hasData: boolean;
  /**
   * Tồn lũy kế = tồn mang sang + (mới − đã xử lý) của CHÍNH tháng đang xem.
   * Đây là số tồn tại thời điểm cuối tháng đang xem.
   */
  tonLuyKe: number;
  /**
   * Tồn mang sang từ các tháng TRƯỚC tháng đang xem (= tồn chốt cuối tháng
   * trước). Khách gọi là "lũy kế T<tháng trước>", trong sheet của họ là một
   * tab riêng — nên ở đây cũng phải là một con số riêng, không gộp vào tổng.
   */
  carriedOver: number;
  /** nhãn tháng mang sang, vd "tháng 07/2026" */
  carriedOverLabel: string;
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
  /**
   * Tách "Sao xấu mới" theo việc có lấy được SĐT khách trên sàn hay không.
   *
   * `unclassified` là phần nhập TRƯỚC ngày có ô này (cột DB đang NULL) — cố ý
   * không dồn vào `noPhone`, vì không ai biết thực tế 59 case của T7 ra sao.
   * withPhone + noPhone + unclassified === newBad.
   */
  withPhone: number;
  noPhone: number;
  unclassified: number;
  /** đã xử lý / sao xấu mới trong tháng */
  tiLeXuLy: number;
  /** sao khách đã sửa lại thành 5★ trong tháng */
  fixed5: number;
  /** case đang chờ khách sửa (số của ngày mới nhất có dữ liệu) */
  pending: number;
  /**
   * @deprecated Ô "Không LH được KH" đã gỡ khỏi form 2026-08-20, thay bằng
   * productEfficacy + productDefect. Vẫn tổng hợp để còn đọc được dữ liệu cũ
   * (T8/2026 có 29 case), nhưng KHÔNG còn hiển thị trên Trang chủ và sẽ đứng
   * yên vì không ai nhập nữa.
   */
  noContact: number;
  /** case liên quan kho — cộng dồn trong tháng */
  warehouseIssue: number;
  /** khách chê sản phẩm không hiệu quả — cộng dồn trong tháng */
  productEfficacy: number;
  /** sản phẩm lỗi — cộng dồn trong tháng */
  productDefect: number;
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
  hasData: false,
  tonLuyKe: 0,
  carriedOver: 0,
  carriedOverLabel: "",
  tonDauKy: 0,
  tonDauKyLabel: null,
  threshold: BACKLOG.threshold,
  warnThreshold: BACKLOG.warnThreshold,
  goal: SAO_XAU_GOAL_TI_LE_XU_LY,
  newBad: 0,
  resolved: 0,
  withPhone: 0,
  noPhone: 0,
  unclassified: 0,
  tiLeXuLy: 0,
  fixed5: 0,
  pending: 0,
  noContact: 0,
  warehouseIssue: 0,
  productEfficacy: 0,
  productDefect: 0,
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
 * `selectedMonth` LUÔN được tôn trọng, kể cả khi tháng đó chưa có dòng báo cáo
 * Sao Xấu nào.
 *
 * ⚠️ Trước đây hàm này tự rơi về tháng mới nhất CÓ dữ liệu. Hệ quả: trang lọc
 * tháng 08 nhưng khối Sao Xấu lại ghi "tháng 07" (T8 chưa ai nhập), khách đọc
 * thành sai kỳ. Nay tháng nào chưa có dữ liệu thì hiện đúng tháng đó với
 * `hasData: false` để card báo "chưa có báo cáo", còn phần tồn của các tháng
 * trước vẫn hiện qua `carriedOver`.
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
        newBadWithPhone: t.newBadWithPhone,
        star1: t.star1,
        star2: t.star2,
        star3: t.star3,
        shopee: t.shopee,
        tiktok: t.tiktok,
        fixed5Total: t.fixed5Total,
        pendingTotal: t.pendingTotal,
        noContact: t.noContact,
        warehouseIssue: t.warehouseIssue,
        productEfficacy: t.productEfficacy,
        productDefect: t.productDefect,
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
  // Bộ lọc của Trang chủ là nguồn quyết định. Chỉ tự chọn khi không truyền vào
  // (hoặc truyền chuỗi rác từ query string).
  const month =
    selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)
      ? selectedMonth
      : months[0];
  const monthStart = month + "-01";
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
    withPhone: 0,
    noPhone: 0,
    unclassified: 0,
    fixed5: 0,
    noContact: 0,
    warehouseIssue: 0,
    productEfficacy: 0,
    productDefect: 0,
    shopee: 0,
    tiktok: 0,
    star1: 0,
    star2: 0,
    star3: 0,
  };
  /** Tồn chốt cuối tháng trước = mốc đầu kỳ + net của mọi ngày TRƯỚC tháng này */
  let carriedOver = opening?.balance ?? 0;
  let hasData = false;
  let pending = 0;
  let pendingDate = "";
  const byEmp = new Map<string, BadReviewHandler>();

  for (const r of rows) {
    const date = r.date as string;
    const n = r.newBad ?? 0;
    const s = r.resolved ?? 0;

    // Trước mốc đầu kỳ thì bỏ — phần đó đã nằm sẵn trong số chốt, cộng nữa là
    // đếm trùng. Sau tháng đang xem cũng bỏ, vì đang nhìn về quá khứ của tháng.
    if (openingStart && date < openingStart) continue;
    if (date > monthEnd) continue;

    if (date < monthStart) {
      carriedOver += n - s;
      continue;
    }

    hasData = true;

    acc.newBad += n;
    acc.resolved += s;
    // NULL = dòng cũ chưa phân loại → dồn hết vào `unclassified`, không đoán.
    if (r.newBadWithPhone == null) {
      acc.unclassified += n;
    } else {
      const wp = Math.min(r.newBadWithPhone, n); // chặn dữ liệu lỗi làm âm
      acc.withPhone += wp;
      acc.noPhone += n - wp;
    }
    acc.fixed5 += r.fixed5Total ?? 0;
    acc.noContact += r.noContact ?? 0;
    acc.warehouseIssue += r.warehouseIssue ?? 0;
    acc.productEfficacy += r.productEfficacy ?? 0;
    acc.productDefect += r.productDefect ?? 0;
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
    hasData,
    // Tồn cuối tháng đang xem = mang sang + net phát sinh trong tháng
    tonLuyKe: carriedOver + acc.newBad - acc.resolved,
    carriedOver,
    carriedOverLabel: monthLabel(prevMonthKey(month)),
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

export interface PersonalDashboardPayload {
  /** Danh sách người xem được — NV thường chỉ có đúng mình họ */
  people: PersonalData[];
  /** uuid tương ứng từng người (theo `code`) — dùng để nạp chỉ số chi tiết */
  idByCode: Record<string, string>;
  month: string | null;
  monthLabel: string;
  /** các tháng có dữ liệu (yyyy-mm), mới → cũ — cho bộ lọc tháng */
  availableMonths: string[];
}

/**
 * Dữ liệu dashboard cá nhân.
 *
 * `onlyCodes` giới hạn danh sách trả về (nhân viên thường chỉ được xem chính
 * mình — PM chốt 2026-07-31c). Bỏ trống = trả hết, cho Lead/Admin.
 * `selectedMonth` (yyyy-mm) chọn tháng để xem lại; bỏ trống = tháng mới nhất.
 */
export async function getPersonalDashboards(
  onlyCodes?: string[],
  selectedMonth?: string,
): Promise<PersonalDashboardPayload> {
  const base = await loadBase(selectedMonth);
  const ranking = buildRanking(base);
  const total = ranking.length;
  const monthLbl = monthLabel(base.month);
  const idByCode = Object.fromEntries(
    base.employees.map((e) => [e.code, e.id]),
  );
  if (!base.anchor)
    return {
      people: [],
      idByCode,
      month: base.month,
      monthLabel: monthLbl,
      availableMonths: base.availableMonths,
    };

  const empByCode = new Map(base.employees.map((e) => [e.code, e]));
  const dailyTarget = (target: number) =>
    Math.round(ratio(target, daysInMonth(base.anchor!)));

  const allow = onlyCodes ? new Set(onlyCodes) : null;
  const people = ranking
    .filter((r) => !allow || allow.has(r.employeeId))
    .map((r) => {
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

  return {
    people,
    idByCode,
    month: base.month,
    monthLabel: monthLbl,
    availableMonths: base.availableMonths,
  };
}

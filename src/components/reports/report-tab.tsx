"use client";

import { Fragment, useState, useTransition } from "react";
import {
  ChevronRight,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DateRangeFilter, useDateRange } from "./date-range-filter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportForm } from "./report-form";
import {
  computeMetrics,
  CONFIG_BY_TAB,
  type BacklogConfig,
  type ConfigTab,
  type ReportConfig,
  type ReportRow,
} from "@/lib/mock/reports";
import { getEmployee } from "@/lib/mock/employees";
import { formatDateVn, formatMetric, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { deleteReport, saveReport } from "@/lib/reports/actions";

/** Khối cảnh báo tồn lũy kế theo ngưỡng (Sao Xấu) */
function BacklogAlert({
  backlog,
  rows,
  opening,
}: {
  backlog: BacklogConfig;
  rows: ReportRow[];
  /** tồn mang sang từ kỳ trước — không suy ra được từ các dòng trong app */
  opening: number;
}) {
  const total =
    opening + rows.reduce((sum, r) => sum + backlog.net(r.values), 0);
  const level =
    total >= backlog.threshold
      ? "danger"
      : total >= backlog.warnThreshold
        ? "warning"
        : "ok";

  const styles = {
    danger: "border-danger-500/40 bg-danger-50 text-danger-600",
    warning: "border-warning-500/50 bg-warning-50 text-warning-600",
    ok: "border-success-500/40 bg-success-50 text-success-600",
  }[level];

  const Icon = level === "ok" ? ShieldCheck : TriangleAlert;
  const message =
    level === "danger"
      ? `Vượt ngưỡng đỏ ${backlog.threshold} — cần xử lý gấp!`
      : level === "warning"
        ? `Qua ngưỡng vàng ${backlog.warnThreshold} — theo dõi sát.`
        : `Trong ngưỡng an toàn (< ${backlog.warnThreshold}).`;

  return (
    <div className={cn("flex items-center gap-4 rounded-lg border p-4", styles)}>
      <Icon className="size-8 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90">{backlog.label}</p>
        <p className="font-heading text-2xl font-bold tabular-nums">
          {formatNumber(total)}{" "}
          <span className="text-base font-normal opacity-70">
            / {backlog.threshold} {backlog.unit}
          </span>
        </p>
        {opening > 0 && (
          <p className="text-xs opacity-80">
            gồm {formatNumber(opening)} mang sang từ kỳ trước
          </p>
        )}
      </div>
      <p className="hidden max-w-[220px] text-right text-sm font-medium sm:block">
        {message}
      </p>
    </div>
  );
}

interface ReportTabProps {
  tab: ConfigTab;
  initialRows: ReportRow[];
  /** tồn đầu kỳ mang sang (chỉ tab có backlog dùng tới) */
  opening?: number;
}

export function ReportTab({ tab, initialRows, opening = 0 }: ReportTabProps) {
  const config = CONFIG_BY_TAB[tab];
  const [rows, setRows] = useState<ReportRow[]>(initialRows);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReportRow | null>(null);
  const [seq, setSeq] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const { range, setRange, active, inRange } = useDateRange();

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openNew() {
    setEditing(null);
    setSeq((s) => s + 1);
    setOpen(true);
  }

  function openEdit(row: ReportRow) {
    setEditing(row);
    setSeq((s) => s + 1);
    setOpen(true);
  }

  /** Ghép dòng vừa lưu vào state (bỏ dòng cũ đang sửa + dòng trùng id trả về). */
  function mergeSaved(saved: ReportRow, editingId?: string) {
    setRows((prev) => {
      const filtered = prev.filter(
        (r) => r.id !== saved.id && r.id !== editingId,
      );
      return [saved, ...filtered];
    });
  }

  async function handleSubmit(row: ReportRow) {
    setSaving(true);
    try {
      const saved = await saveReport(tab, {
        employeeCode: row.employeeId,
        date: row.date,
        values: row.values,
        texts: row.texts,
        note: row.note,
      });
      mergeSaved(saved, editing?.id);
      toast.success(editing ? "Đã cập nhật báo cáo" : "Đã lưu báo cáo");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Lưu báo cáo thất bại. Thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(row: ReportRow) {
    const prevRows = rows;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      return next;
    });
    startTransition(async () => {
      try {
        await deleteReport(tab, row.id);
        toast.success("Đã xóa báo cáo", {
          action: {
            label: "Hoàn tác",
            onClick: () => {
              startTransition(async () => {
                try {
                  const saved = await saveReport(tab, {
                    employeeCode: row.employeeId,
                    date: row.date,
                    values: row.values,
                    note: row.note,
                  });
                  mergeSaved(saved);
                } catch {
                  toast.error("Hoàn tác thất bại.");
                }
              });
            },
          },
        });
      } catch (err) {
        console.error(err);
        setRows(prevRows); // khôi phục nếu xóa lỗi
        toast.error("Xóa báo cáo thất bại.");
      }
    });
  }

  const sorted = [...rows]
    .filter((r) => inRange(r.date))
    .sort((a, b) => b.date.localeCompare(a.date));
  const colSpan = 4 + config.tableMetrics.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={`Báo cáo ${config.title}`}
        description={
          active
            ? `${sorted.length} / ${rows.length} báo cáo (đang lọc)`
            : `${rows.length} báo cáo`
        }
        action={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Nhập báo cáo
          </Button>
        }
      />

      <DateRangeFilter range={range} setRange={setRange} active={active} />

      {config.backlog && (
        <BacklogAlert
          backlog={config.backlog}
          rows={sorted}
          opening={opening}
        />
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-9" />
                <TableHead>Nhân viên</TableHead>
                <TableHead>Ngày</TableHead>
                {config.tableMetrics.map((m) => (
                  <TableHead key={m.key} className="text-right">
                    {m.label}
                  </TableHead>
                ))}
                <TableHead className="w-28 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => {
                const emp = getEmployee(row.employeeId);
                const metrics = computeMetrics(config, row.values);
                const isOpen = expanded.has(row.id);
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => toggleExpand(row.id)}
                    >
                      <TableCell className="pr-0 text-muted-foreground">
                        <ChevronRight
                          className={cn(
                            "size-4 transition-transform",
                            isOpen && "rotate-90",
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-brand-100 text-xs font-semibold text-brand-700">
                              {emp?.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{emp?.shortName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatDateVn(row.date)}
                      </TableCell>
                      {config.tableMetrics.map((m) => (
                        <TableCell
                          key={m.key}
                          className="text-right font-mono text-sm tabular-nums"
                        >
                          {formatMetric(metrics[m.key], m.kind)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(row);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-danger-600 hover:bg-danger-50 hover:text-danger-600"
                            title="Xóa báo cáo"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(row);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={colSpan} className="p-0">
                          <RowDetail config={config} row={row} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
              {sorted.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={colSpan}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {active
                      ? "Không có báo cáo nào trong khoảng ngày đã chọn."
                      : "Chưa có báo cáo nào."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* dialog nhập/sửa */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editing ? "Sửa" : "Nhập"} báo cáo {config.title}
            </DialogTitle>
            <DialogDescription>
              Ô <span className="font-medium text-accent-600">vàng</span> nhập
              tay · ô <span className="font-medium text-brand-600">xanh</span> tự
              tính real-time.
            </DialogDescription>
          </DialogHeader>
          <ReportForm
            key={seq}
            config={config}
            initial={editing}
            pending={saving}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Panel chi tiết xổ xuống — hiển thị toàn bộ ô đã điền + ô tự tính của 1 báo cáo */
function RowDetail({ config, row }: { config: ReportConfig; row: ReportRow }) {
  const metrics = computeMetrics(config, row.values);

  const groups = new Map<string, typeof config.inputs>();
  for (const f of config.inputs) {
    const arr = groups.get(f.group) ?? [];
    arr.push(f);
    groups.set(f.group, arr);
  }

  return (
    <div className="space-y-4 border-l-2 border-brand-200 bg-muted/30 px-4 py-4">
      {[...groups.entries()].map(([group, fields]) => (
        <div key={group}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group}
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
            {fields.map((f) => (
              <DetailItem
                key={f.key}
                label={f.label}
                value={formatMetric(row.values[f.key] ?? 0, f.kind)}
              />
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Tự động tính
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
          {config.computed.map((c) => (
            <DetailItem
              key={c.key}
              label={c.label}
              value={formatMetric(metrics[c.key], c.kind)}
              highlight
            />
          ))}
        </div>
      </div>

      {config.textInputs?.map((t) => {
        const value = row.texts?.[t.key];
        if (!value) return null;
        const isLink = /^https?:\/\//i.test(value);
        return (
          <div key={t.key}>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.label}
            </p>
            {isLink ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-brand-600 hover:underline"
              >
                {value}
              </a>
            ) : (
              <p className="whitespace-pre-line text-sm">{value}</p>
            )}
          </div>
        );
      })}

      {row.note && (
        <div>
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {config.noteLabel ?? "Ghi chú"}
          </p>
          <p className="text-sm">{row.note}</p>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-border/60 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-sm tabular-nums",
          highlight && "font-semibold text-brand-600",
        )}
      >
        {value}
      </span>
    </div>
  );
}

"use client";

import { Fragment, useState } from "react";
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
import { useLocalStorageState } from "@/lib/use-local-storage-state";

/** Khối cảnh báo tồn lũy kế theo ngưỡng (Sao Xấu) */
function BacklogAlert({
  backlog,
  rows,
}: {
  backlog: BacklogConfig;
  rows: ReportRow[];
}) {
  const total = rows.reduce((sum, r) => sum + backlog.net(r.values), 0);
  const level =
    total >= backlog.threshold
      ? "danger"
      : total >= backlog.threshold * 0.7
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
      ? `Vượt ngưỡng ${backlog.threshold} — cần xử lý gấp!`
      : level === "warning"
        ? `Gần chạm ngưỡng ${backlog.threshold} — theo dõi sát.`
        : `Trong ngưỡng an toàn (< ${backlog.threshold}).`;

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
}

export function ReportTab({ tab, initialRows }: ReportTabProps) {
  const config = CONFIG_BY_TAB[tab];
  const [rows, setRows] = useLocalStorageState<ReportRow[]>(
    `reports:${tab}`,
    initialRows,
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReportRow | null>(null);
  const [seq, setSeq] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  function handleSubmit(row: ReportRow) {
    if (editing) {
      setRows((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...row, id: editing.id } : r)),
      );
      toast.success("Đã cập nhật báo cáo");
    } else {
      setRows((prev) => [{ ...row, id: `${config.tab}-new-${seq}` }, ...prev]);
      toast.success("Đã lưu báo cáo");
    }
    setOpen(false);
  }

  function handleDelete(row: ReportRow) {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      return next;
    });
    toast.success("Đã xóa báo cáo", {
      action: {
        label: "Hoàn tác",
        onClick: () => setRows((prev) => [row, ...prev]),
      },
    });
  }

  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const colSpan = 4 + config.tableMetrics.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={`Báo cáo ${config.title}`}
        description={`${rows.length} báo cáo · dữ liệu giả`}
        action={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Nhập báo cáo
          </Button>
        }
      />

      {config.backlog && <BacklogAlert backlog={config.backlog} rows={rows} />}

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

      {row.note && (
        <div>
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ghi chú
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

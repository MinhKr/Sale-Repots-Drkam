"use client";

import { Fragment, useState } from "react";
import { ClipboardPaste, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  computeMetrics,
  CONFIG_BY_TAB,
  TODAY_ISO,
  type ReportRow,
} from "@/lib/mock/reports";
import { employeesByDept, getEmployee } from "@/lib/mock/employees";
import { formatCurrency, formatDateVn, formatMetric } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { useLocalStorageState } from "@/lib/use-local-storage-state";

const config = CONFIG_BY_TAB.LIVESTREAM;
const STAFF = employeesByDept("LIVESTREAM");
const FIELDS = config.inputs;

type ValMap = Record<string, Record<string, number>>;

function zeros(): ValMap {
  return Object.fromEntries(
    STAFF.map((s) => [s.id, Object.fromEntries(FIELDS.map((f) => [f.key, 0]))]),
  );
}

export function LivestreamTab({ initialRows }: { initialRows: ReportRow[] }) {
  const [rows, setRows] = useLocalStorageState<ReportRow[]>(
    "reports:LIVESTREAM",
    initialRows,
  );
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(TODAY_ISO);
  const [vals, setVals] = useState<ValMap>(zeros);
  const [paste, setPaste] = useState("");

  function prefillFor(d: string): ValMap {
    const base = zeros();
    for (const r of rows) {
      if (r.date === d && base[r.employeeId]) {
        for (const f of FIELDS) base[r.employeeId][f.key] = r.values[f.key] ?? 0;
      }
    }
    return base;
  }

  function openBulk() {
    setDate(TODAY_ISO);
    setVals(prefillFor(TODAY_ISO));
    setPaste("");
    setOpen(true);
  }

  function changeDate(d: string) {
    setDate(d);
    setVals(prefillFor(d));
  }

  function setCell(empId: string, key: string, raw: string) {
    const n = raw === "" ? 0 : Number(raw);
    setVals((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], [key]: Number.isFinite(n) ? n : 0 },
    }));
  }

  function applyPaste() {
    const lines = paste.trim().split(/\r?\n/).filter(Boolean);
    const next = zeros();
    // giữ giá trị hiện có
    for (const s of STAFF) next[s.id] = { ...vals[s.id] };
    let filled = 0;
    lines.forEach((line, i) => {
      if (i >= STAFF.length) return;
      const nums = line
        .split(/[\t,;]+|\s+/)
        .map((t) => Number(t.replace(/[^\d.]/g, "")))
        .filter((n) => Number.isFinite(n));
      if (!nums.length) return;
      const emp = STAFF[i];
      FIELDS.forEach((f, j) => {
        if (nums[j] != null) next[emp.id][f.key] = nums[j];
      });
      filled++;
    });
    setVals(next);
    toast.success(`Đã dán ${filled} dòng`);
  }

  function save() {
    setRows((prev) => {
      const kept = prev.filter((r) => r.date !== date);
      const dayRows: ReportRow[] = [];
      for (const s of STAFF) {
        const v = vals[s.id];
        const hasData = FIELDS.some((f) => (v[f.key] ?? 0) > 0);
        if (hasData) {
          dayRows.push({
            id: `live-${date}-${s.id}`,
            employeeId: s.id,
            date,
            values: { ...v },
          });
        }
      }
      return [...dayRows, ...kept];
    });
    setOpen(false);
    toast.success("Đã lưu báo cáo Livestream");
  }

  function handleDelete(row: ReportRow) {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    toast.success("Đã xóa báo cáo", {
      action: {
        label: "Hoàn tác",
        onClick: () => setRows((prev) => [row, ...prev]),
      },
    });
  }

  const sorted = [...rows].sort(
    (a, b) => b.date.localeCompare(a.date) || a.employeeId.localeCompare(b.employeeId),
  );

  // Gom nhóm theo ngày (giữ thứ tự đã sort)
  const groups: { date: string; items: ReportRow[] }[] = [];
  for (const row of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === row.date) last.items.push(row);
    else groups.push({ date: row.date, items: [row] });
  }
  const colSpan = 2 + config.tableMetrics.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Báo cáo Livestream"
        description={`${rows.length} báo cáo · Lead nhập hộ 6 nhân viên`}
        action={
          <Button onClick={openBulk}>
            <Users className="size-4" />
            Nhập bulk 6 dòng
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nhân viên</TableHead>
                {config.tableMetrics.map((m) => (
                  <TableHead key={m.key} className="text-right">
                    {m.label}
                  </TableHead>
                ))}
                <TableHead className="w-16 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => {
                const dayTotal = g.items.reduce(
                  (s, r) => s + (r.values.revenue ?? 0),
                  0,
                );
                return (
                  <Fragment key={g.date}>
                    {/* Dòng tiêu đề ngày */}
                    <TableRow className="border-t-2 border-brand-100 bg-muted/60 hover:bg-muted/60">
                      <TableCell colSpan={colSpan} className="py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-heading text-sm font-semibold tabular-nums">
                            {formatDateVn(g.date)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {g.items.length} báo cáo · Tổng DT{" "}
                            <span className="font-medium text-foreground">
                              {formatCurrency(dayTotal)}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Các dòng nhân viên trong ngày */}
                    {g.items.map((row) => {
                      const emp = getEmployee(row.employeeId);
                      const metrics = computeMetrics(config, row.values);
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-8">
                                <AvatarFallback className="bg-brand-100 text-xs font-semibold text-brand-700">
                                  {emp?.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{emp?.name}</span>
                            </div>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-danger-600 hover:bg-danger-50 hover:text-danger-600"
                              title="Xóa báo cáo"
                              onClick={() => handleDelete(row)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Nhập báo cáo Livestream — 6 nhân viên
            </DialogTitle>
            <DialogDescription>
              Nhập cùng lúc cho cả ca. Ô{" "}
              <span className="font-medium text-accent-600">vàng</span> nhập tay.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Ngày */}
            <div className="w-full space-y-1.5 sm:w-56">
              <Label htmlFor="live-date">Ngày báo cáo</Label>
              <Input
                id="live-date"
                type="date"
                value={date}
                onChange={(e) => changeDate(e.target.value)}
              />
            </div>

            {/* Bảng nhập 6 dòng */}
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-2 font-medium">Nhân viên</th>
                    {FIELDS.map((f) => (
                      <th key={f.key} className="p-2 text-right font-medium">
                        {f.label}
                        {f.kind === "money" && " (₫)"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STAFF.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap p-2 font-medium">
                        {s.name}
                      </td>
                      {FIELDS.map((f) => (
                        <td key={f.key} className="p-1.5">
                          <input
                            type="number"
                            min={0}
                            step={f.kind === "float" ? 0.5 : 1}
                            className="cell-input w-full text-sm"
                            value={vals[s.id][f.key] === 0 ? "" : vals[s.id][f.key]}
                            placeholder="0"
                            onChange={(e) => setCell(s.id, f.key, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dán nhanh */}
            <div className="space-y-1.5">
              <Label htmlFor="live-paste" className="text-xs font-normal">
                Dán nhanh từ TikTok Center (mỗi dòng 1 NV:{" "}
                <span className="font-mono">phiên giờ người-mua doanh-thu</span>)
              </Label>
              <textarea
                id="live-paste"
                rows={3}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder={"2 4.5 120 5000000\n1 3 80 3200000"}
                className="w-full rounded-md border bg-background p-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyPaste}
                disabled={!paste.trim()}
              >
                <ClipboardPaste className="size-3.5" />
                Áp dụng vào bảng
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="button" onClick={save}>
              Lưu 6 báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

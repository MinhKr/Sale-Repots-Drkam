"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
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
  type ConfigTab,
  type ReportRow,
} from "@/lib/mock/reports";
import { getEmployee } from "@/lib/mock/employees";
import { formatDateVn, formatMetric } from "@/lib/format";

interface ReportTabProps {
  tab: ConfigTab;
  initialRows: ReportRow[];
}

export function ReportTab({ tab, initialRows }: ReportTabProps) {
  const config = CONFIG_BY_TAB[tab];
  const [rows, setRows] = useState<ReportRow[]>(initialRows);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReportRow | null>(null);
  const [seq, setSeq] = useState(1);

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

  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Báo cáo {config.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {rows.length} báo cáo · dữ liệu giả
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Nhập báo cáo
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nhân viên</TableHead>
                <TableHead>Ngày</TableHead>
                {config.tableMetrics.map((m) => (
                  <TableHead key={m.key} className="text-right">
                    {m.label}
                  </TableHead>
                ))}
                <TableHead className="w-20 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => {
                const emp = getEmployee(row.employeeId);
                const metrics = computeMetrics(config, row.values);
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-brand-100 text-xs font-semibold text-brand-700">
                            {emp?.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{emp?.name}</span>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="size-3.5" />
                        Sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

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

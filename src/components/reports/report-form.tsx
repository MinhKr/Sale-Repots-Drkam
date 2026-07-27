"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  computeMetrics,
  emptyTexts,
  emptyValues,
  TODAY_ISO,
  type ReportConfig,
  type ReportRow,
} from "@/lib/mock/reports";
import { EMPLOYEES } from "@/lib/mock/employees";
import { formatMetric } from "@/lib/format";
import { MoneyInput } from "@/components/money-input";
import { cn } from "@/lib/utils";

interface ReportFormProps {
  config: ReportConfig;
  /** null = tạo mới; có giá trị = sửa */
  initial: ReportRow | null;
  /** đang lưu xuống server — khóa nút để tránh double submit */
  pending?: boolean;
  onSubmit: (row: ReportRow) => void;
  onCancel: () => void;
}

export function ReportForm({
  config,
  initial,
  pending,
  onSubmit,
  onCancel,
}: ReportFormProps) {
  const employees = useMemo(
    () => EMPLOYEES.filter((e) => config.allowedDepts.includes(e.dept)),
    [config],
  );
  const employeeItems = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.shortName])),
    [employees],
  );

  const [employeeId, setEmployeeId] = useState(
    initial?.employeeId ?? employees[0]?.id ?? "",
  );
  const [date, setDate] = useState(initial?.date ?? TODAY_ISO);
  const [values, setValues] = useState<Record<string, number>>(
    initial ? { ...initial.values } : emptyValues(config),
  );
  const [texts, setTexts] = useState<Record<string, string>>(
    initial?.texts ? { ...emptyTexts(config), ...initial.texts } : emptyTexts(config),
  );
  const [note, setNote] = useState(initial?.note ?? "");

  // Ô tự tính — tính lại mỗi lần render (real-time theo state)
  const computed = computeMetrics(config, values);

  // Nhóm các ô nhập theo group để bố cục
  const groups = useMemo(() => {
    const map = new Map<string, typeof config.inputs>();
    for (const f of config.inputs) {
      const arr = map.get(f.group) ?? [];
      arr.push(f);
      map.set(f.group, arr);
    }
    return [...map.entries()];
  }, [config]);

  function setValue(key: string, raw: string) {
    const n = raw === "" ? 0 : Number(raw);
    setValues((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      id: initial?.id ?? `tmp-${config.tab}-${date}-${employeeId}`,
      employeeId,
      date,
      values,
      texts: config.textInputs?.length ? texts : undefined,
      note: note.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nhân viên + Ngày */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nhân viên</Label>
          <Select
            value={employeeId}
            onValueChange={(v) => setEmployeeId(v ?? "")}
            items={employeeItems}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn nhân viên" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.shortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-date">Ngày báo cáo</Label>
          <Input
            id="report-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Ô nhập (vàng) theo nhóm */}
      {groups.map(([group, fields]) => (
        <div key={group} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`f-${f.key}`} className="text-xs font-normal">
                  {f.label}
                  {f.kind === "money" && (
                    <span className="text-muted-foreground"> (₫)</span>
                  )}
                  {f.kind === "float" && (
                    <span className="text-muted-foreground"> (giờ)</span>
                  )}
                </Label>
                {f.kind === "float" ? (
                  <input
                    id={`f-${f.key}`}
                    type="number"
                    min={0}
                    step={0.5}
                    inputMode="decimal"
                    className="cell-input w-full text-sm"
                    value={values[f.key] === 0 ? "" : values[f.key]}
                    placeholder="0"
                    onChange={(e) => setValue(f.key, e.target.value)}
                  />
                ) : (
                  <MoneyInput
                    id={`f-${f.key}`}
                    value={values[f.key]}
                    onValueChange={(n) =>
                      setValues((prev) => ({ ...prev, [f.key]: n }))
                    }
                    className="cell-input w-full text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Ô tự tính (xanh, readonly) */}
      <div className="space-y-2 rounded-lg border border-brand-100 bg-brand-50/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Tự động tính
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {config.computed.map((c) => (
            <div key={c.key} className="space-y-1">
              <Label className="text-xs font-normal text-muted-foreground">
                {c.label}
              </Label>
              <div
                className={cn("cell-computed w-full text-sm", "truncate")}
                title={formatMetric(computed[c.key], c.kind)}
              >
                {formatMetric(computed[c.key], c.kind)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ô nhập chữ (link, nguyên nhân…) */}
      {config.textInputs?.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={`t-${f.key}`} className="text-xs font-normal">
            {f.label}
          </Label>
          {f.multiline ? (
            <textarea
              id={`t-${f.key}`}
              rows={2}
              className="cell-input w-full resize-y text-sm"
              value={texts[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) =>
                setTexts((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            />
          ) : (
            <Input
              id={`t-${f.key}`}
              value={texts[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) =>
                setTexts((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            />
          )}
        </div>
      ))}

      {/* Ghi chú */}
      <div className="space-y-1.5">
        <Label htmlFor="note" className="text-xs font-normal">
          {config.noteLabel ?? "Ghi chú"}
        </Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú thêm (tuỳ chọn)"
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Huỷ
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {initial ? "Cập nhật" : "Lưu báo cáo"}
        </Button>
      </DialogFooter>
    </form>
  );
}

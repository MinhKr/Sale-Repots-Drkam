"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerDetailDialog } from "./customer-detail-dialog";
import {
  STAGES,
  WHOLESALE_SEED,
  type ContactChannel,
  type WholesaleCustomer,
  type WholesaleStage,
} from "@/lib/mock/wholesale";
import { getEmployee } from "@/lib/mock/employees";
import { formatCompactVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

const ASSIGNEES = [...new Set(WHOLESALE_SEED.map((c) => c.assignedTo))];
const FILTER_ITEMS: Record<string, string> = {
  all: "Tất cả phụ trách",
  ...Object.fromEntries(
    ASSIGNEES.map((id) => [id, getEmployee(id)?.name ?? id]),
  ),
};

export function PipelineBoard() {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>(WHOLESALE_SEED);
  const [filter, setFilter] = useState<string>("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<WholesaleStage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logSeq, setLogSeq] = useState(1);

  const visible =
    filter === "all"
      ? customers
      : customers.filter((c) => c.assignedTo === filter);

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  const totalValue = visible.reduce((s, c) => s + c.potentialValue, 0);
  const wonValue = visible
    .filter((c) => c.stage === "chot")
    .reduce((s, c) => s + c.potentialValue, 0);

  function moveTo(id: string, stage: WholesaleStage) {
    const c = customers.find((x) => x.id === id);
    if (!c || c.stage === stage) return;
    setCustomers((prev) =>
      prev.map((x) => (x.id === id ? { ...x, stage } : x)),
    );
    const stageLabel = STAGES.find((s) => s.key === stage)?.label;
    toast.success(`Chuyển "${c.company}" → ${stageLabel}`);
  }

  function addLog(customerId: string, channel: ContactChannel, note: string) {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              logs: [
                ...c.logs,
                {
                  id: `log-${customerId}-${logSeq}`,
                  date: "2026-07-13",
                  channel,
                  note,
                },
              ],
            }
          : c,
      ),
    );
    setLogSeq((s) => s + 1);
    toast.success("Đã thêm log liên hệ");
  }

  return (
    <div className="space-y-4">
      {/* Header + filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Pipeline khách sỉ
          </h2>
          <p className="text-sm text-muted-foreground">
            {visible.length} khách · tiềm năng {formatCompactVnd(totalValue)} ·
            đã chốt {formatCompactVnd(wonValue)}
          </p>
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v ?? "all")}
          items={FILTER_ITEMS}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phụ trách</SelectItem>
            {ASSIGNEES.map((id) => (
              <SelectItem key={id} value={id}>
                {getEmployee(id)?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const cards = visible.filter((c) => c.stage === stage.key);
          const sum = cards.reduce((s, c) => s + c.potentialValue, 0);
          return (
            <div
              key={stage.key}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage.key);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingId) moveTo(draggingId, stage.key);
                setOverStage(null);
                setDraggingId(null);
              }}
              className={cn(
                "flex w-[260px] shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
                overStage === stage.key && "border-brand-400 bg-brand-50/50",
              )}
            >
              {/* Column header */}
              <div
                className={cn(
                  "flex items-center justify-between gap-2 rounded-t-lg border-b px-3 py-2",
                  stage.won && "bg-success-50",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <span className="rounded-full bg-background px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {cards.length}
                  </span>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatCompactVnd(sum)}
                </span>
              </div>

              {/* Cards */}
              <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                {cards.map((c) => {
                  const emp = getEmployee(c.assignedTo);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        setDraggingId(c.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", c.id);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "cursor-grab rounded-md border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
                        draggingId === c.id && "opacity-50",
                      )}
                    >
                      <p className="text-sm font-medium leading-snug">
                        {c.company}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.contactName} · {c.phone}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold tabular-nums text-brand-600">
                          {formatCompactVnd(c.potentialValue)}
                        </span>
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-brand-100 text-[10px] font-semibold text-brand-700">
                            {emp?.initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </button>
                  );
                })}
                {cards.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Kéo thẻ vào đây
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Kéo-thả thẻ giữa các cột để đổi giai đoạn, hoặc bấm thẻ để xem chi
        tiết & thêm log liên hệ.
      </p>

      <CustomerDetailDialog
        customer={selected}
        open={selectedId !== null}
        onOpenChange={(o) => !o && setSelectedId(null)}
        onAddLog={addLog}
        onStageChange={moveTo}
      />
    </div>
  );
}

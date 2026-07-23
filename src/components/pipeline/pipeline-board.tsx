"use client";

import { useMemo, useState, useTransition } from "react";
import { Archive, ArchiveRestore, Plus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerDetailDialog } from "./customer-detail-dialog";
import {
  CustomerFormDialog,
  type CustomerFormValues,
} from "./customer-form-dialog";
import { PageHeader } from "@/components/page-header";
import {
  STAGES,
  type ContactChannel,
  type WholesaleCustomer,
  type WholesaleStage,
} from "@/lib/mock/wholesale";
import {
  addContactLog,
  createCustomer,
  deleteCustomer,
  setArchived,
  setStage,
  updateCustomer,
} from "@/lib/wholesale/actions";
import { getEmployee } from "@/lib/mock/employees";
import { formatCompactVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PipelineBoard({
  initialCustomers,
}: {
  initialCustomers: WholesaleCustomer[];
}) {
  const [customers, setCustomers] =
    useState<WholesaleCustomer[]>(initialCustomers);
  const [filter, setFilter] = useState<string>("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<WholesaleStage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [, startTransition] = useTransition();
  // Form thêm/sửa khách
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WholesaleCustomer | null>(null);
  const [saving, setSaving] = useState(false);

  const assignees = useMemo(
    () => [...new Set(customers.map((c) => c.assignedTo))],
    [customers],
  );
  const filterItems = useMemo<Record<string, string>>(
    () => ({
      all: "Tất cả phụ trách",
      ...Object.fromEntries(
        assignees.map((id) => [id, getEmployee(id)?.shortName ?? id]),
      ),
    }),
    [assignees],
  );

  // Lọc theo phụ trách (chưa lọc lưu trữ)
  const base =
    filter === "all"
      ? customers
      : customers.filter((c) => c.assignedTo === filter);

  // Hiển thị trên board: ẩn khách đã lưu trữ (trừ khi bật xem lại)
  const visible = base.filter((c) => showArchived || !c.archived);
  const archivedCount = base.filter((c) => c.archived).length;

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  // Tiềm năng = khách chưa lưu trữ trên board · Đã chốt = mọi đơn chốt (kể cả đã lưu trữ)
  const totalValue = base
    .filter((c) => !c.archived)
    .reduce((s, c) => s + c.potentialValue, 0);
  const wonValue = base
    .filter((c) => c.stage === "chot")
    .reduce((s, c) => s + c.potentialValue, 0);

  function moveTo(id: string, stage: WholesaleStage) {
    const c = customers.find((x) => x.id === id);
    if (!c || c.stage === stage) return;
    const prevStage = c.stage;
    setCustomers((prev) =>
      prev.map((x) => (x.id === id ? { ...x, stage } : x)),
    );
    const stageLabel = STAGES.find((s) => s.key === stage)?.label;
    startTransition(async () => {
      try {
        await setStage(id, stage);
        toast.success(`Chuyển "${c.company}" → ${stageLabel}`);
      } catch (err) {
        console.error(err);
        setCustomers((prev) =>
          prev.map((x) => (x.id === id ? { ...x, stage: prevStage } : x)),
        );
        toast.error("Đổi giai đoạn thất bại.");
      }
    });
  }

  function addLog(customerId: string, channel: ContactChannel, note: string) {
    startTransition(async () => {
      try {
        const log = await addContactLog(customerId, channel, note);
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerId ? { ...c, logs: [...c.logs, log] } : c,
          ),
        );
        toast.success("Đã thêm log liên hệ");
      } catch (err) {
        console.error(err);
        toast.error("Thêm log thất bại.");
      }
    });
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(customer: WholesaleCustomer) {
    setEditing(customer);
    setSelectedId(null); // đóng dialog chi tiết
    setFormOpen(true);
  }

  async function handleFormSubmit(values: CustomerFormValues) {
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateCustomer(editing.id, values);
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editing.id ? { ...c, ...updated } : c,
          ),
        );
        toast.success("Đã cập nhật khách hàng");
      } else {
        const created = await createCustomer(values);
        setCustomers((prev) => [created, ...prev]);
        toast.success("Đã thêm khách hàng");
      }
      setFormOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Lưu khách hàng thất bại. Thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(customer: WholesaleCustomer) {
    const prevRows = customers;
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    setSelectedId(null);
    startTransition(async () => {
      try {
        await deleteCustomer(customer.id);
        toast.success(`Đã xóa "${customer.company}"`);
      } catch (err) {
        console.error(err);
        setCustomers(prevRows);
        toast.error("Xóa khách hàng thất bại.");
      }
    });
  }

  function handleArchive(customer: WholesaleCustomer, archived: boolean) {
    const prevRows = customers;
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, archived } : c)),
    );
    setSelectedId(null);
    startTransition(async () => {
      try {
        await setArchived(customer.id, archived);
        toast.success(
          archived
            ? `Đã lưu trữ "${customer.company}"`
            : `Đã bỏ lưu trữ "${customer.company}"`,
        );
      } catch (err) {
        console.error(err);
        setCustomers(prevRows);
        toast.error("Thao tác lưu trữ thất bại.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Pipeline khách sỉ"
        description={`${visible.length} khách · tiềm năng ${formatCompactVnd(totalValue)} · đã chốt ${formatCompactVnd(wonValue)}`}
        action={
          <div className="flex items-center gap-2">
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v ?? "all")}
              items={filterItems}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phụ trách</SelectItem>
                {assignees.map((id) => (
                  <SelectItem key={id} value={id}>
                    {getEmployee(id)?.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openAdd}>
              <Plus className="size-4" />
              Thêm khách
            </Button>
          </div>
        }
      />

      {/* Toggle xem đã lưu trữ */}
      {archivedCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {showArchived ? (
              <>
                <ArchiveRestore className="size-3.5" />
                Ẩn đơn đã lưu trữ
              </>
            ) : (
              <>
                <Archive className="size-3.5" />
                Hiện đơn đã lưu trữ ({archivedCount})
              </>
            )}
          </button>
        </div>
      )}

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
                        c.archived && "border-dashed bg-muted/40 opacity-70",
                      )}
                    >
                      {c.archived && (
                        <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <Archive className="size-2.5" />
                          Đã lưu trữ
                        </span>
                      )}
                      <p className="text-sm font-medium leading-snug">
                        {c.company}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.contactName} · {c.phone}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-brand-600">
                          {formatCompactVnd(c.potentialValue)}
                        </span>
                        <span
                          className="flex min-w-0 items-center gap-1 rounded-full bg-muted py-0.5 pl-0.5 pr-2"
                          title={emp?.name}
                        >
                          <Avatar className="size-5 shrink-0">
                            <AvatarFallback className="bg-brand-100 text-[9px] font-semibold text-brand-700">
                              {emp?.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-[11px] font-medium text-foreground">
                            {emp?.shortName ?? "—"}
                          </span>
                        </span>
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
        💡 Bấm <span className="font-medium">Thêm khách</span> để tạo mới · kéo-thả
        thẻ để đổi giai đoạn · bấm thẻ để xem chi tiết, thêm log, sửa hoặc xóa.
      </p>

      <CustomerDetailDialog
        customer={selected}
        open={selectedId !== null}
        onOpenChange={(o) => !o && setSelectedId(null)}
        onAddLog={addLog}
        onStageChange={moveTo}
        onEdit={() => selected && openEdit(selected)}
        onDelete={() => selected && handleDelete(selected)}
        onArchive={(archived) => selected && handleArchive(selected, archived)}
      />

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        pending={saving}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

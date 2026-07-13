"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone, Plus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CHANNEL_LABEL,
  STAGES,
  type ContactChannel,
  type WholesaleCustomer,
  type WholesaleStage,
} from "@/lib/mock/wholesale";
import { getEmployee } from "@/lib/mock/employees";
import { formatCurrency, formatDateVn } from "@/lib/format";

const CHANNEL_ICON: Record<ContactChannel, LucideIcon> = {
  call: Phone,
  zalo: MessageCircle,
  meet: Users,
  email: Mail,
};

interface Props {
  customer: WholesaleCustomer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLog: (customerId: string, channel: ContactChannel, note: string) => void;
  onStageChange: (customerId: string, stage: WholesaleStage) => void;
}

export function CustomerDetailDialog({
  customer,
  open,
  onOpenChange,
  onAddLog,
  onStageChange,
}: Props) {
  const [channel, setChannel] = useState<ContactChannel>("call");
  const [note, setNote] = useState("");

  if (!customer) return null;
  const emp = getEmployee(customer.assignedTo);
  const logs = [...customer.logs].sort((a, b) => b.date.localeCompare(a.date));

  function submitLog(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() || !customer) return;
    onAddLog(customer.id, channel, note.trim());
    setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{customer.company}</DialogTitle>
        </DialogHeader>

        {/* Thông tin */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Người liên hệ" value={customer.contactName} />
          <Info label="Điện thoại" value={customer.phone} />
          <Info label="Phụ trách" value={emp?.name ?? "—"} />
          <Info
            label="Giá trị tiềm năng"
            value={formatCurrency(customer.potentialValue)}
          />
        </div>

        {/* Đổi giai đoạn */}
        <div className="space-y-1.5">
          <Label>Giai đoạn</Label>
          <Select
            value={customer.stage}
            onValueChange={(v) =>
              v && onStageChange(customer.id, v as WholesaleStage)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Thêm log */}
        <form onSubmit={submitLog} className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Thêm log liên hệ
          </p>
          <div className="flex gap-2">
            <Select
              value={channel}
              onValueChange={(v) => v && setChannel(v as ContactChannel)}
            >
              <SelectTrigger className="w-32 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CHANNEL_LABEL) as ContactChannel[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nội dung trao đổi..."
            />
            <Button type="submit" size="icon" disabled={!note.trim()}>
              <Plus className="size-4" />
            </Button>
          </div>
        </form>

        {/* Timeline */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lịch sử liên hệ ({logs.length})
          </p>
          <ol className="space-y-3 border-l pl-4">
            {logs.map((log) => {
              const Icon = CHANNEL_ICON[log.channel];
              return (
                <li key={log.id} className="relative">
                  <span className="absolute -left-[22px] flex size-6 items-center justify-center rounded-full border bg-card text-brand-600">
                    <Icon className="size-3" />
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {CHANNEL_LABEL[log.channel]}
                    </span>
                    <span>·</span>
                    <span className="tabular-nums">{formatDateVn(log.date)}</span>
                  </div>
                  <p className="text-sm">{log.note}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

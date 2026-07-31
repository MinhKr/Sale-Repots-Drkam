"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "@/components/money-input";
import {
  STAGES,
  type WholesaleCustomer,
  type WholesaleStage,
} from "@/lib/mock/wholesale";
import { DEPT_LABEL, EMPLOYEES } from "@/lib/mock/employees";
import { todayIso } from "@/lib/format";

/** NV có thể phụ trách khách sỉ (Sale · CSKH · Admin · Lead). */
const ASSIGNEE_OPTIONS = EMPLOYEES.filter(
  (e) => ["SALE", "CSKH", "ADMIN", "LEAD"].includes(e.dept) && e.active,
);

export interface CustomerFormValues {
  company: string;
  contactName: string;
  phone: string;
  assigneeCode: string;
  potentialValue: number;
  stage: WholesaleStage;
  createdDate: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = thêm mới; có giá trị = sửa */
  initial: WholesaleCustomer | null;
  pending: boolean;
  onSubmit: (values: CustomerFormValues) => void;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  initial,
  pending,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {initial ? "Sửa khách sỉ" : "Thêm khách sỉ"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Cập nhật thông tin khách hàng."
              : "Nhập thông tin khách hàng sỉ mới vào pipeline."}
          </DialogDescription>
        </DialogHeader>
        {/* Mount khi mở → state khởi tạo lại từ `initial`, không cần effect */}
        {open && (
          <CustomerForm
            initial={initial}
            pending={pending}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  initial: WholesaleCustomer | null;
  pending: boolean;
  onSubmit: (values: CustomerFormValues) => void;
  onCancel: () => void;
}) {
  const [company, setCompany] = useState(initial?.company ?? "");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [assigneeCode, setAssigneeCode] = useState(
    initial?.assignedTo ?? ASSIGNEE_OPTIONS[0]?.id ?? "",
  );
  const [potentialValue, setPotentialValue] = useState(
    initial?.potentialValue ?? 0,
  );
  const [stage, setStage] = useState<WholesaleStage>(initial?.stage ?? "moi");
  const [createdDate, setCreatedDate] = useState(
    initial?.createdDate ?? todayIso(),
  );

  const isEdit = initial !== null;
  const canSubmit =
    company.trim() !== "" && contactName.trim() !== "" && assigneeCode !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      company: company.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      assigneeCode,
      potentialValue,
      stage,
      createdDate,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="c-company">
          Công ty / Cửa hàng <span className="text-danger-600">*</span>
        </Label>
        <Input
          id="c-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="VD: Nhà thuốc Minh Châu"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-contact">
            Người liên hệ <span className="text-danger-600">*</span>
          </Label>
          <Input
            id="c-contact"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="VD: Chị Châu"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-phone">Điện thoại</Label>
          <Input
            id="c-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="VD: 0901 234 567"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>NV phụ trách</Label>
          <Select
            value={assigneeCode}
            onValueChange={(v) => setAssigneeCode(v ?? "")}
            items={Object.fromEntries(
              ASSIGNEE_OPTIONS.map((e) => [
                e.id,
                `${e.shortName} · ${DEPT_LABEL[e.dept]}`,
              ]),
            )}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn NV" />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNEE_OPTIONS.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.shortName} · {DEPT_LABEL[e.dept]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Giai đoạn</Label>
          <Select
            value={stage}
            onValueChange={(v) => v && setStage(v as WholesaleStage)}
            items={Object.fromEntries(STAGES.map((s) => [s.key, s.label]))}
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-value">
            Giá trị tiềm năng <span className="text-muted-foreground">(₫)</span>
          </Label>
          <MoneyInput
            id="c-value"
            value={potentialValue}
            onValueChange={setPotentialValue}
            className="cell-input w-full text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-date">Ngày tạo</Label>
          <Input
            id="c-date"
            type="date"
            value={createdDate}
            onChange={(e) => setCreatedDate(e.target.value)}
          />
        </div>
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
        <Button type="submit" disabled={pending || !canSubmit}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Cập nhật" : "Thêm khách"}
        </Button>
      </DialogFooter>
    </form>
  );
}

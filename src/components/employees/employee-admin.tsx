"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Unlock,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { DEPT_LABEL } from "@/lib/mock/employees";
import { localPartFromName, EMAIL_DOMAIN } from "@/lib/employees/email";
import type { EmployeeAccountRow } from "@/lib/employees/queries";
import type { DeptCode, Employment, Region } from "@/lib/mock/types";
import {
  createAccount,
  createEmployee,
  deleteAccount,
  resetPassword,
  setEmployeeActive,
  setWorkInfo,
} from "@/lib/employees/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/employees/constants";

/** Livestream part-time: fulltime cùng miền nhập hộ nên không cấp tài khoản. */
function isPartTimeLive(r: EmployeeAccountRow): boolean {
  return r.dept === "LIVESTREAM" && r.employment === "PT";
}

/** Thông tin tài khoản vừa cấp — hiện ở dialog để quản lý chép đưa nhân viên. */
interface Credentials {
  name: string;
  email: string;
  password: string;
}

export function EmployeeAdmin({
  rows,
  serviceKeyReady,
}: {
  rows: EmployeeAccountRow[];
  /** Đã cấu hình SUPABASE_SERVICE_ROLE_KEY chưa — thiếu thì không cấp được tài khoản */
  serviceKeyReady: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [accountTarget, setAccountTarget] = useState<AccountTarget | null>(
    null,
  );

  const withAccount = rows.filter((r) => r.hasAccount).length;
  const existingEmails = rows
    .map((r) => r.email)
    .filter((e): e is string => !!e);

  /** Bọc 1 action: khóa nút theo dòng, hiện toast lỗi, nạp lại bảng. */
  async function run(id: string, fn: () => Promise<void>, okMessage?: string) {
    setPendingId(id);
    try {
      await fn();
      if (okMessage) toast.success(okMessage);
      // revalidatePath ở server chỉ đánh dấu cache bẩn — phải refresh để
      // server component chạy lại và bảng hiện trạng thái mới.
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác không thành công.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Quản lý nhân viên"
        description={`${rows.length} nhân viên · ${withAccount} người đã có tài khoản đăng nhập`}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" />
            Thêm nhân viên
          </Button>
        }
      />

      {!serviceKeyReady && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-accent-500/30 bg-accent-50 p-3 text-sm text-accent-700"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div className="leading-snug">
            <p className="font-medium">Chưa cấu hình khóa quản trị Supabase</p>
            <p className="text-accent-700/80">
              Biến <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span>{" "}
              trong <span className="font-mono">.env.local</span> đang để trống
              nên chưa cấp được tài khoản. Lấy khóa tại Supabase Dashboard →
              Project Settings → API keys → <em>service_role</em>, dán vào rồi
              khởi động lại server.
            </p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Bộ phận</TableHead>
              <TableHead>Miền · Hợp đồng</TableHead>
              <TableHead>Email đăng nhập</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const busy = pendingId === r.id;
              return (
                <TableRow key={r.id} className={r.active ? "" : "opacity-55"}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                          {r.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.shortName}
                          {r.role === "LEAD" && " · Lead"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{DEPT_LABEL[r.dept]}</Badge>
                  </TableCell>

                  {/* Miền + FT/PT: chỉ Livestream mới có nghĩa, và chính 2 ô
                      này quyết định ai được nhập báo cáo Livestream. */}
                  <TableCell>
                    {r.dept === "LIVESTREAM" ? (
                      <WorkInfoPicker
                        row={r}
                        busy={busy}
                        onChange={(region, employment) =>
                          run(
                            r.id,
                            () =>
                              setWorkInfo({
                                employeeId: r.id,
                                region,
                                employment,
                              }),
                            `Đã cập nhật ${r.shortName}.`,
                          )
                        }
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    {r.email ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {!r.active ? (
                      <Badge variant="destructive">Đã khóa</Badge>
                    ) : r.hasAccount ? (
                      <Badge variant="secondary">Đã cấp</Badge>
                    ) : (
                      <Badge variant="outline">Chưa cấp</Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {busy && (
                        <Loader2 className="mr-1 size-4 animate-spin text-muted-foreground" />
                      )}

                      {!r.hasAccount ? (
                        isPartTimeLive(r) ? (
                          // Part-time không nhập báo cáo nên không cấp tài khoản.
                          <span className="text-xs text-muted-foreground">
                            Không cần tài khoản
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || !r.active}
                            onClick={() =>
                              setAccountTarget({ row: r, mode: "create" })
                            }
                          >
                            <ShieldCheck className="size-3.5" />
                            Tạo tài khoản
                          </Button>
                        )
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            title="Đặt mật khẩu mới"
                            onClick={() =>
                              setAccountTarget({ row: r, mode: "reset" })
                            }
                          >
                            <KeyRound className="size-3.5" />
                            Đặt lại MK
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            disabled={busy}
                            title={
                              r.active ? "Khóa đăng nhập" : "Mở lại đăng nhập"
                            }
                            onClick={() =>
                              run(
                                r.id,
                                () =>
                                  setEmployeeActive({
                                    employeeId: r.id,
                                    active: !r.active,
                                  }),
                                r.active
                                  ? `Đã khóa đăng nhập của ${r.shortName}.`
                                  : `Đã mở lại đăng nhập cho ${r.shortName}.`,
                              )
                            }
                          >
                            {r.active ? (
                              <Lock className="size-3.5" />
                            ) : (
                              <Unlock className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            disabled={busy}
                            title="Thu hồi tài khoản (giữ nguyên báo cáo cũ)"
                            onClick={() => {
                              if (
                                !confirm(
                                  `Thu hồi tài khoản của ${r.name}?\n\nNgười này sẽ không đăng nhập được nữa. Báo cáo đã nhập vẫn giữ nguyên và có thể cấp lại tài khoản sau.`,
                                )
                              )
                                return;
                              run(
                                r.id,
                                () => deleteAccount({ employeeId: r.id }),
                                `Đã thu hồi tài khoản của ${r.shortName}.`,
                              );
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <AddEmployeeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingEmails={existingEmails}
        onCreated={(c) => setCreds(c)}
      />

      <AccountDialog
        target={accountTarget}
        existingEmails={existingEmails}
        onClose={() => setAccountTarget(null)}
        onDone={(c) => setCreds(c)}
      />

      <CredentialsDialog creds={creds} onClose={() => setCreds(null)} />
    </div>
  );
}

/* ==================================================================== */
/*  Ô chọn Miền + Fulltime/Parttime cho nhân viên Livestream             */
/* ==================================================================== */

/** Base UI cần map value→nhãn, thiếu thì ô chọn hiện "MB"/"FT" thay vì nhãn đầy đủ. */
const REGION_ITEMS = { MB: "Miền Bắc", MN: "Miền Nam" };
const EMPLOYMENT_ITEMS = { FT: "Fulltime", PT: "Parttime" };

function WorkInfoPicker({
  row,
  busy,
  onChange,
}: {
  row: EmployeeAccountRow;
  busy: boolean;
  onChange: (region: Region | null, employment: Employment | null) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={row.region ?? ""}
        onValueChange={(v) =>
          v && onChange(v as Region, row.employment ?? null)
        }
        items={REGION_ITEMS}
        disabled={busy}
      >
        <SelectTrigger size="sm" className="w-[104px]">
          <SelectValue placeholder="Miền" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MB">Miền Bắc</SelectItem>
          <SelectItem value="MN">Miền Nam</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={row.employment ?? ""}
        onValueChange={(v) =>
          v && onChange(row.region ?? null, v as Employment)
        }
        items={EMPLOYMENT_ITEMS}
        disabled={busy}
      >
        <SelectTrigger size="sm" className="w-[112px]">
          <SelectValue placeholder="FT/PT" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="FT">Fulltime</SelectItem>
          <SelectItem value="PT">Parttime</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/* ==================================================================== */
/*  Dialog hiện email + mật khẩu vừa cấp                                 */
/* ==================================================================== */

function CredentialsDialog({
  creds,
  onClose,
}: {
  creds: Credentials | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const text = creds
    ? `Đăng nhập Sales Report DrKam\nEmail: ${creds.email}\nMật khẩu: ${creds.password}`
    : "";

  return (
    <Dialog open={!!creds} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Thông tin đăng nhập</DialogTitle>
          <DialogDescription>
            Gửi riêng cho {creds?.name}. Đóng cửa sổ này rồi sẽ không xem lại
            được mật khẩu — nếu quên thì bấm &quot;Đặt lại MK&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Email</span>
            <span className="font-mono">{creds?.email}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Mật khẩu</span>
            <span className="font-mono font-semibold">{creds?.password}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Đã chép" : "Chép thông tin"}
          </Button>
          <Button onClick={onClose}>Xong</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
/* ==================================================================== */
/*  Ô nhập mật khẩu (có nút hiện/ẩn)                                     */
/* ==================================================================== */

function PasswordField({
  id,
  label,
  value,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          className="pr-10"
          aria-invalid={invalid}
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {invalid
          ? `Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`
          : `Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`}
      </p>
    </div>
  );
}

/** Gợi ý tài khoản từ họ tên, tránh trùng với email đã dùng. */
function suggestEmail(fullName: string, taken: Iterable<string>): string {
  const base = localPartFromName(fullName);
  if (!base) return "";
  const used = new Set([...taken].map((e) => e.toLowerCase()));
  let candidate = `${base}@${EMAIL_DOMAIN}`;
  let n = 1;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${base}${n}@${EMAIL_DOMAIN}`;
  }
  return candidate;
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/* ==================================================================== */
/*  Dialog thêm nhân viên mới                                            */
/* ==================================================================== */

const DEPT_OPTIONS: DeptCode[] = ["SALE", "CSKH", "LIVESTREAM", "ADMIN", "LEAD"];
/** Base UI cần map value→nhãn, không có thì ô chọn hiện "SALE" thay vì "Sale". */
const DEPT_ITEMS = Object.fromEntries(
  DEPT_OPTIONS.map((d) => [d, DEPT_LABEL[d]]),
);

function AddEmployeeDialog({
  open,
  onOpenChange,
  existingEmails,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existingEmails: string[];
  onCreated: (c: Credentials) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [dept, setDept] = useState<DeptCode>("SALE");
  const [region, setRegion] = useState<Region | "">("");
  const [employment, setEmployment] = useState<Employment | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Khi quản lý đã tự sửa ô tài khoản thì thôi không gợi ý đè lên nữa.
  const [emailTouched, setEmailTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setShortName("");
    setDept("SALE");
    setRegion("");
    setEmployment("");
    setEmail("");
    setPassword("");
    setEmailTouched(false);
  }

  function changeName(v: string) {
    setName(v);
    if (!emailTouched) setEmail(suggestEmail(v, existingEmails));
  }

  const isLive = dept === "LIVESTREAM";
  // Livestream part-time không nhập báo cáo nên không cấp tài khoản.
  const isLivePartTime = isLive && employment === "PT";
  const workInfoMissing = isLive && (!region || !employment);

  const emailInvalid = !!email && !EMAIL_RE.test(email);
  const passwordShort = !!password && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit =
    name.trim().length >= 2 &&
    !workInfoMissing &&
    (isLivePartTime ||
      (!!email && !emailInvalid && password.length >= MIN_PASSWORD_LENGTH));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createEmployee({
        name: name.trim(),
        shortName: shortName.trim() || name.trim().split(/\s+/).slice(-1)[0],
        dept,
        role: dept === "LEAD" ? "LEAD" : "STAFF",
        region: isLive ? region : null,
        employment: isLive ? employment : null,
        email: isLivePartTime ? undefined : email.trim(),
        password: isLivePartTime ? undefined : password,
      });
      toast.success(`Đã thêm ${name.trim()}.`);
      onOpenChange(false);
      router.refresh();
      if (res.account) {
        onCreated({
          name: name.trim(),
          email: res.account.email,
          password: res.account.password,
        });
      }
      reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thêm được nhân viên.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Thêm nhân viên</DialogTitle>
          <DialogDescription>
            Điền thông tin nhân sự và tài khoản đăng nhập được cấp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={saving} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Họ tên đầy đủ</Label>
              <Input
                id="emp-name"
                value={name}
                onChange={(e) => changeName(e.target.value)}
                placeholder="Lê Hoài Ly"
                autoFocus
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="emp-short">Tên hiển thị</Label>
                <Input
                  id="emp-short"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="Ly"
                />
                <p className="text-xs text-muted-foreground">
                  Bỏ trống thì lấy tên gọi.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emp-dept">Bộ phận</Label>
                <Select
                  value={dept}
                  onValueChange={(v) => v && setDept(v as DeptCode)}
                  items={DEPT_ITEMS}
                >
                  <SelectTrigger id="emp-dept" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPT_OPTIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DEPT_LABEL[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Miền + hợp đồng: bắt buộc với Livestream vì chính 2 giá trị này
                quyết định ai được nhập báo cáo. */}
            {isLive && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="emp-region">Miền</Label>
                  <Select
                    value={region}
                    onValueChange={(v) => v && setRegion(v as Region)}
                    items={REGION_ITEMS}
                  >
                    <SelectTrigger id="emp-region" className="w-full">
                      <SelectValue placeholder="Chọn miền" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MB">Miền Bắc</SelectItem>
                      <SelectItem value="MN">Miền Nam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emp-employment">Loại hợp đồng</Label>
                  <Select
                    value={employment}
                    onValueChange={(v) => v && setEmployment(v as Employment)}
                    items={EMPLOYMENT_ITEMS}
                  >
                    <SelectTrigger id="emp-employment" className="w-full">
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FT">Fulltime</SelectItem>
                      <SelectItem value="PT">Parttime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {isLivePartTime ? (
              <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>
                  Livestream part-time không nhập báo cáo (bạn fulltime cùng
                  miền nhập hộ) nên <strong>không cần tài khoản đăng nhập</strong>.
                  Nếu sau này chuyển sang fulltime, cấp tài khoản ngay tại bảng.
                </span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="emp-email">Tài khoản đăng nhập</Label>
                  <Input
                    id="emp-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmailTouched(true);
                      setEmail(e.target.value);
                    }}
                    placeholder="ví dụ: lylh@drkam.vn"
                    aria-invalid={emailInvalid}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {emailInvalid
                      ? "Địa chỉ email không hợp lệ."
                      : "Gợi ý sẵn từ họ tên — sửa lại tùy ý."}
                  </p>
                </div>

                <PasswordField
                  id="emp-password"
                  label="Mật khẩu"
                  value={password}
                  onChange={setPassword}
                  invalid={passwordShort}
                />
              </>
            )}
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving || !canSubmit}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving
                ? "Đang lưu..."
                : isLivePartTime
                  ? "Thêm (không cấp tài khoản)"
                  : "Thêm nhân viên"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ==================================================================== */
/*  Dialog cấp tài khoản / đặt lại mật khẩu cho NV đã có trong danh sách  */
/* ==================================================================== */

export interface AccountTarget {
  row: EmployeeAccountRow;
  mode: "create" | "reset";
}

function AccountDialog({
  target,
  existingEmails,
  onClose,
  onDone,
}: {
  target: AccountTarget | null;
  existingEmails: string[];
  onClose: () => void;
  onDone: (c: Credentials) => void;
}) {
  const router = useRouter();
  const isReset = target?.mode === "reset";

  // Dùng key để remount → state khởi tạo lại theo đúng nhân viên đang mở.
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && (
          <AccountForm
            key={`${target.row.id}-${target.mode}`}
            target={target}
            isReset={!!isReset}
            existingEmails={existingEmails}
            onClose={onClose}
            onDone={(c) => {
              router.refresh();
              onDone(c);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AccountForm({
  target,
  isReset,
  existingEmails,
  onClose,
  onDone,
}: {
  target: AccountTarget;
  isReset: boolean;
  existingEmails: string[];
  onClose: () => void;
  onDone: (c: Credentials) => void;
}) {
  const [email, setEmail] = useState(
    () =>
      target.row.email ??
      suggestEmail(
        target.row.name,
        existingEmails.filter((e) => e !== target.row.email),
      ),
  );
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const emailInvalid = !!email && !EMAIL_RE.test(email);
  const passwordShort = !!password && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit =
    password.length >= MIN_PASSWORD_LENGTH &&
    (isReset || (!!email && !emailInvalid));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = isReset
        ? await resetPassword({ employeeId: target.row.id, password })
        : await createAccount({
            employeeId: target.row.id,
            email: email.trim(),
            password,
          });
      onClose();
      onDone({
        name: target.row.name,
        email: target.row.email ?? email.trim(),
        password: res.password,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Thao tác không thành công.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">
          {isReset ? "Đặt lại mật khẩu" : "Cấp tài khoản"}
        </DialogTitle>
        <DialogDescription>
          {isReset
            ? `Đặt mật khẩu mới cho ${target.row.name}.`
            : `Tạo tài khoản đăng nhập cho ${target.row.name}.`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={saving} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="acc-email">Tài khoản đăng nhập</Label>
            <Input
              id="acc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isReset}
              aria-invalid={emailInvalid}
              required
            />
            <p className="text-xs text-muted-foreground">
              {isReset
                ? "Không đổi được tài khoản ở đây — cần đổi thì thu hồi rồi cấp lại."
                : emailInvalid
                  ? "Địa chỉ email không hợp lệ."
                  : "Gợi ý sẵn từ họ tên — sửa lại tùy ý."}
            </p>
          </div>

          <PasswordField
            id="acc-password"
            label={isReset ? "Mật khẩu mới" : "Mật khẩu"}
            value={password}
            onChange={setPassword}
            invalid={passwordShort}
          />
        </fieldset>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={saving || !canSubmit}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isReset ? "Đặt lại mật khẩu" : "Cấp tài khoản"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

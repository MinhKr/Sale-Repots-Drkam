import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RANKING } from "@/lib/mock/dashboard";
import { DEPT_LABEL, getEmployee } from "@/lib/mock/employees";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

const MEDAL: Record<number, string> = {
  1: "bg-[var(--color-rank-gold)] text-white",
  2: "bg-[var(--color-rank-silver)] text-white",
  3: "bg-[var(--color-rank-bronze)] text-white",
};

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums",
        MEDAL[rank] ?? "bg-muted text-muted-foreground",
      )}
    >
      {rank}
    </span>
  );
}

export function TeamLeaderboard() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">#</TableHead>
            <TableHead>Nhân viên</TableHead>
            <TableHead className="text-right">Doanh thu tháng</TableHead>
            <TableHead className="w-[180px]">Tiến độ KPI</TableHead>
            <TableHead className="text-right">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RANKING.map((row) => {
            const emp = getEmployee(row.employeeId);
            const pct = Math.min(row.progress, 1) * 100;
            return (
              <TableRow key={row.employeeId}>
                <TableCell>
                  <RankBadge rank={row.rank} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-brand-100 text-xs font-semibold text-brand-700">
                        {emp?.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {DEPT_LABEL[row.dept]}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatCurrency(row.revenue)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                      {formatPercent(row.progress, 0)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <StatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

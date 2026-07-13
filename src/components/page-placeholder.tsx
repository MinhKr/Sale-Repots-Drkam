import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PagePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Nhãn phiên sẽ dựng, vd "Phiên 2" */
  phase: string;
}

/** Khối placeholder thống nhất cho các màn chưa dựng nội dung (P0 chỉ có shell). */
export function PagePlaceholder({
  icon: Icon,
  title,
  description,
  phase,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl pt-6">
      <Card className="flex flex-col items-center gap-5 border-dashed p-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="size-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-heading text-xl font-semibold">{title}</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="border-accent-200 bg-accent-50 text-accent-700"
        >
          Sắp dựng · {phase}
        </Badge>
      </Card>
    </div>
  );
}

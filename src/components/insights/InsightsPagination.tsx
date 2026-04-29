import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (p: number) => void;
  activeCount?: number;
  inactiveCount?: number;
}

export function InsightsPagination({ total, page, perPage, onPageChange, onPerPageChange, activeCount, inactiveCount }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const showing = Math.min(perPage, total - (page - 1) * perPage);

  const pageNumbers: (number | "...")[] = [];
  for (let i = 1; i <= Math.min(5, totalPages); i++) pageNumbers.push(i);
  if (totalPages > 5) {
    pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground bg-background/50">
      <div className="flex items-center gap-1.5">
        <span>Total {total},</span>
        <span>Showing {showing} Ads</span>
        {activeCount != null && inactiveCount != null && (
          <span>: {activeCount} Active, {inactiveCount} Inactive</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1">...</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7 text-xs"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        <Select value={String(perPage)} onValueChange={(v) => { onPerPageChange(Number(v)); onPageChange(1); }}>
          <SelectTrigger className="w-[120px] h-8 ml-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[12, 24, 48, 100].map((n) => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

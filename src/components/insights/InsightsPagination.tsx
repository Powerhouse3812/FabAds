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
    <div className="flex flex-col gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground bg-background/50 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-center md:justify-start md:text-left">
        <span>Total {total},</span>
        <span>Showing {showing} Ads</span>
        {activeCount != null && inactiveCount != null && (
          <span>: {activeCount} Active, {inactiveCount} Inactive</span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1 md:flex-nowrap md:justify-end">
        {/* Mobile (<md): collapsed pager — prev / current-of-total / next.
            A 6-button numeric pager doesn't fit or work well on a phone. */}
        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 h-11 w-11"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="whitespace-nowrap px-1 text-xs">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 h-11 w-11"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop (md+): full pager — unchanged from original. */}
        <div className="hidden items-center gap-1 md:flex">
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
        </div>

        <Select value={String(perPage)} onValueChange={(v) => { onPerPageChange(Number(v)); onPageChange(1); }}>
          <SelectTrigger className="ml-2 h-11 min-h-11 w-[110px] max-w-[calc(100vw-2rem)] md:h-8 md:min-h-0 md:w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[12, 24, 48, 100].map((n) => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

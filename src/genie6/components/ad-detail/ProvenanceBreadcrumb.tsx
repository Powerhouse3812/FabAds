import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProvenanceBreadcrumbProps {
  brand: string;
  concept: string;
  angle: string;
  hook: string;
  /** Which segment is the currently focused / live one. */
  current?: "brand" | "concept" | "angle" | "hook" | "ad";
  className?: string;
}

/**
 * ProvenanceBreadcrumb — compact 4-step chain showing how this generation
 * was sourced. Reads bottom-of-card on the LEFT creative panel of Variant A.
 *
 * Lime dot at start. ChevronRight separators. Current segment in lime,
 * others in muted-foreground. "THIS AD" always lime (default current).
 */
export function ProvenanceBreadcrumb({
  brand,
  concept,
  angle,
  hook,
  current = "ad",
  className,
}: ProvenanceBreadcrumbProps) {
  const segments: Array<{
    key: "brand" | "concept" | "angle" | "hook" | "ad";
    label: string;
  }> = [
    { key: "brand", label: brand },
    { key: "concept", label: concept },
    { key: "angle", label: angle },
    { key: "hook", label: hook },
    { key: "ad", label: "This ad" },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]",
        className,
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"
      />
      {segments.map((seg, i) => (
        <span key={seg.key} className="flex items-center gap-1.5">
          <span
            className={cn(
              seg.key === current ? "text-primary" : "text-muted-foreground",
            )}
          >
            {seg.label}
          </span>
          {i < segments.length - 1 && (
            <ChevronRight
              className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0"
              strokeWidth={2.2}
              aria-hidden
            />
          )}
        </span>
      ))}
    </div>
  );
}

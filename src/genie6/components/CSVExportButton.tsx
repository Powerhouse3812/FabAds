import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadCSV, toCSV } from "../lib/csv";
import type { OutputData } from "../types/output";

/**
 * CSV export button — top-right of every Results screen, every Library tab,
 * and inside the BulkToolbar. Always visible, never hidden behind a menu.
 *
 * Output columns (matches the spec / Genie_6.0_IA.md §8):
 *   variant_id, headline, body, cta, brand, product, mode,
 *   quality_score, generated_at, media_type, thumbnail
 */

type Props = {
  outputs: OutputData[];
  filename?: string;
  label?: string;
  className?: string;
};

export function CSVExportButton({
  outputs,
  filename = "genie6-batch.csv",
  label = "Export CSV",
  className,
}: Props) {
  const handleClick = () => {
    const rows = outputs.map((o) => ({
      variant_id: o.id,
      headline: o.headline ?? "",
      body: o.body ?? "",
      cta: o.cta ?? "",
      brand: o.brand?.name ?? "",
      product: o.product?.name ?? "",
      mode: o.mode,
      quality_score: o.qualityScore ?? "",
      generated_at: o.generatedAt.toISOString(),
      media_type: o.mediaType,
      thumbnail: o.thumbnail ?? "",
    }));
    const cols: Array<keyof (typeof rows)[number]> = [
      "variant_id",
      "headline",
      "body",
      "cta",
      "brand",
      "product",
      "mode",
      "quality_score",
      "generated_at",
      "media_type",
      "thumbnail",
    ];
    downloadCSV(filename, toCSV(rows, cols));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={outputs.length === 0}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-3 font-g6-sans text-g6-sm font-medium text-g6-text transition-colors",
        "hover:border-g6-border hover:bg-g6-bg-spotlight",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <Download className="h-3.5 w-3.5" />
      {label}
      <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{outputs.length}</span>
    </button>
  );
}

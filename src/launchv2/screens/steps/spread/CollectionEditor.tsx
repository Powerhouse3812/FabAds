/**
 * CollectionEditor — collection ad cover + copy. A collection ad = one cover
 * media (image/video) + a product grid that auto-fills from the selected
 * catalog/product set. There is NO destination URL field — the cover opens an
 * Instant Experience. We capture the cover media id (plan.collectionCoverCreativeId),
 * the cover primary text + headline (adCopy), and surface a read-only hint about
 * where the grid comes from (plan.catalogSelections).
 */
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreativeRef } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import MediaPicker from "./MediaPicker";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function CollectionEditor({
  flow,
  creatives,
}: {
  flow: UseFlowV2;
  creatives: CreativeRef[];
}) {
  const { plan } = flow;
  const copy = plan.adCopy;
  const set = (p: Partial<typeof copy>) => flow.patch({ adCopy: { ...copy, ...p } });

  // Read-only count of product sets across catalog selections (grid source hint).
  const setCount = Object.values(plan.catalogSelections ?? {}).reduce(
    (n, sel) => n + (sel.productSetIds?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-3">
      <Field label="Cover media">
        <MediaPicker
          creatives={creatives}
          value={plan.collectionCoverCreativeId ?? undefined}
          onChange={(id) => flow.patch({ collectionCoverCreativeId: id ?? null })}
        />
      </Field>

      <Field label="Primary text">
        <Textarea
          rows={3}
          value={copy.primaryText}
          onChange={(e) => set({ primaryText: e.target.value })}
          placeholder="What's the hook? Lead with the benefit…"
          className="resize-none text-sm"
        />
      </Field>

      <Field label="Headline">
        <Input
          value={copy.headline}
          onChange={(e) => set({ headline: e.target.value })}
          placeholder="Short, bold promise"
          className="text-sm"
        />
      </Field>

      {/* Product grid source — read-only hint */}
      <div className="flex items-start gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
        <span>
          The product grid auto-fills from your selected catalog
          {setCount > 0 ? (
            <>
              {" "}— <span className="font-mono tabular-nums text-foreground">{setCount}</span> product set
              {setCount !== 1 ? "s" : ""} selected.
            </>
          ) : (
            <> / product set (configure in catalogue setup).</>
          )}{" "}
          The cover opens an Instant Experience — no destination URL needed.
        </span>
      </div>
    </div>
  );
}

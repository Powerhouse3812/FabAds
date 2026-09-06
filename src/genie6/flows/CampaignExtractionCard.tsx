/**
 * Campaign Urls → Genie extraction card (§7.5).
 *
 * "Context extraction is visible and editable... the extraction is a POC and
 * will sometimes be wrong; the user must be able to see and fix it rather
 * than discover the error in the output." This card is the one place that
 * promise is kept — it renders BEFORE the user leaves for Studio, and every
 * field is editable or clearable, never just a read-only preview.
 */
import { useState, type ReactNode } from "react";
import { Check, ImageIcon, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignUrlExtraction } from "./flowTypes";

interface CampaignExtractionCardProps {
  /** Currently edited extraction — null only if the source had none at all. */
  extraction: CampaignUrlExtraction | null;
  /** The as-detected extraction, kept around so "Reset" has something to restore. */
  original: CampaignUrlExtraction | null;
  onChange: (next: CampaignUrlExtraction) => void;
  onCancel: () => void;
  onContinue: () => void;
  className?: string;
}

export function CampaignExtractionCard({
  extraction,
  original,
  onChange,
  onCancel,
  onContinue,
  className,
}: CampaignExtractionCardProps) {
  const [newClaim, setNewClaim] = useState("");

  if (!extraction) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-border bg-muted/30 p-4", className)}>
        <p className="text-[13px] text-muted-foreground">
          Nothing was extracted from this landing page. You can still continue — Studio will ask
          for the product directly.
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Continue to Studio
        </button>
      </div>
    );
  }

  const canContinue = extraction.product.trim().length > 0;
  const changedFromOriginal = original ? JSON.stringify(original) !== JSON.stringify(extraction) : false;

  return (
    <div className={cn("flex flex-col gap-4 rounded-2xl border border-border bg-card p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            <Pencil className="h-3 w-3" />
            Extracted from the landing page — POC, review before you proceed
          </span>
          <p className="text-[12px] text-muted-foreground">
            Edit anything that&apos;s wrong. Nothing here is final until you continue.
          </p>
        </div>
        {changedFromOriginal && original && (
          <button
            type="button"
            onClick={() => onChange({ ...original, claims: [...original.claims], images: [...original.images] })}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-1 font-mono text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {extraction.matchedProductId && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-primary">
          <Check className="h-3 w-3" />
          Matched catalogue product &middot; pre-selected &amp; editable
        </span>
      )}

      {/* Product */}
      <Field label="Product">
        <EditableText
          value={extraction.product}
          placeholder="No product detected"
          onChange={(v) => onChange({ ...extraction, product: v })}
        />
      </Field>

      {/* Offer */}
      <Field label="Offer">
        <EditableText
          value={extraction.offer}
          placeholder="No offer detected"
          onChange={(v) => onChange({ ...extraction, offer: v })}
        />
      </Field>

      {/* Claims */}
      <Field label={`Claims (${extraction.claims.length})`}>
        <div className="flex flex-wrap gap-1.5">
          {extraction.claims.map((claim, i) => (
            <span
              key={`${claim}-${i}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-foreground"
            >
              <span className="truncate">{claim}</span>
              <button
                type="button"
                aria-label={`Remove claim: ${claim}`}
                onClick={() => onChange({ ...extraction, claims: extraction.claims.filter((_, idx) => idx !== i) })}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-1">
            <input
              value={newClaim}
              onChange={(e) => setNewClaim(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newClaim.trim()) {
                  onChange({ ...extraction, claims: [...extraction.claims, newClaim.trim()] });
                  setNewClaim("");
                }
              }}
              placeholder="Add a claim"
              className="w-24 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              aria-label="Add claim"
              disabled={!newClaim.trim()}
              onClick={() => {
                if (!newClaim.trim()) return;
                onChange({ ...extraction, claims: [...extraction.claims, newClaim.trim()] });
                setNewClaim("");
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
            </button>
          </span>
        </div>
      </Field>

      {/* Images */}
      {extraction.images.length > 0 && (
        <Field label={`Images (${extraction.images.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {extraction.images.map((img, i) => (
              <span
                key={`${img}-${i}`}
                className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] text-foreground"
              >
                <ImageIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{img}</span>
                <button
                  type="button"
                  aria-label={`Remove image: ${img}`}
                  onClick={() =>
                    onChange({ ...extraction, images: extraction.images.filter((_, idx) => idx !== i) })
                  }
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </Field>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          Pick a different landing page
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-transform",
            canContinue
              ? "bg-primary text-primary-foreground hover:-translate-y-0.5"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          Continue to Studio
        </button>
      </div>
      {!canContinue && (
        <p className="-mt-2 text-right text-[10.5px] text-muted-foreground">
          Product can&apos;t be empty — type one or pick a different landing page.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function EditableText({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value && (
        <button
          type="button"
          aria-label={`Clear ${placeholder}`}
          onClick={() => onChange("")}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

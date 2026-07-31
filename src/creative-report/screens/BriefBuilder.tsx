/**
 * Brief Builder (P5 rollups & loop) — Foreplay-style, reference-first,
 * block-based creative brief. Instead of writing a brief from a blank page,
 * the buyer picks 1-3 REAL past-performing creatives as references and the
 * tool pre-fills Hook / Body / CTA / Visual direction / Offer from those
 * references' actual content — which the buyer then rewrites — before
 * handing the finished brief to Genie via the same simulated-handoff
 * pattern used everywhere else in this module (see GenieHandoffStub).
 *
 * Honesty rules carried over from BenchmarkPanel / TrustMeterChip: winners
 * suggestions are labeled "curated" vs "bootstrap" (never presented as if
 * curated when they're not), every metric shown next to a reference is a
 * REAL folded number for that creative, and no score or performance
 * prediction is ever computed for the brief itself — it's a starting point,
 * not an analysis.
 *
 * Self-contained: zero required props, owns all state via hooks. Not wired
 * into any route/sidebar yet — a separate integration step adds that.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreativePicker } from "@/creative-report/components/CreativePicker";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { BriefBlock } from "@/creative-report/components/BriefBlock";
import { StateMessage } from "@/creative-report/components/states/StateMessage";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useWinnersBank } from "@/creative-report/lib/winnersBank";
import { fmtCompactCurrency, fmtMultiple, truncate } from "@/creative-report/lib/format";
import type { Creative } from "@/data/model";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import { useReportBasePath } from "@/creative-report/state/ReportBasePathContext";

const MAX_REFERENCES = 3;

type BlockKey = "hook" | "body" | "cta" | "visualDirection" | "offer";

interface Blocks {
  hook: string;
  body: string;
  cta: string;
  visualDirection: string;
  offer: string;
}

const EMPTY_BLOCKS: Blocks = {
  hook: "",
  body: "",
  cta: "",
  visualDirection: "",
  offer: "",
};

/** Which real field each block pre-fills from, and how many rows it needs.
 *  Hook/Body/CTA come from the literal script lines (not the style TAGS);
 *  Visual direction combines the format tag + style tag; Offer is the tag. */
const BLOCK_META: {
  key: BlockKey;
  label: string;
  rows: number;
  prefill: (c: Creative) => string;
}[] = [
  { key: "hook", label: "Hook", rows: 2, prefill: (c) => c.script.sections.hookLine },
  { key: "body", label: "Body", rows: 3, prefill: (c) => c.script.sections.body },
  { key: "cta", label: "CTA", rows: 1, prefill: (c) => c.script.sections.ctaLine },
  {
    key: "visualDirection",
    label: "Visual direction",
    rows: 2,
    prefill: (c) => `${c.tags.visualFormat} — ${c.components.visualStyle}`,
  },
  { key: "offer", label: "Offer", rows: 1, prefill: (c) => c.tags.offerType },
];

const EMPTY_TOUCHED: Record<BlockKey, boolean> = {
  hook: false,
  body: false,
  cta: false,
  visualDirection: false,
  offer: false,
};

export function BriefBuilder() {
  const navigate = useNavigate();
  const data = useCreativeData();
  const bank = useWinnersBank();
  const basePath = useReportBasePath();

  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<Blocks>(EMPTY_BLOCKS);
  // Tracks which blocks the buyer has hand-edited so re-prefilling on a new
  // primary reference never clobbers their own rewrite.
  const touchedRef = useRef<Record<BlockKey, boolean>>({ ...EMPTY_TOUCHED });

  const rollupsById = useMemo(() => {
    const map = new Map<string, CreativeRollup>();
    for (const r of data.rollups) map.set(r.creative.id, r);
    return map;
  }, [data.rollups]);

  const references = useMemo(
    () =>
      referenceIds
        .map((id) => rollupsById.get(id))
        .filter((r): r is CreativeRollup => Boolean(r)),
    [referenceIds, rollupsById],
  );
  const primary = references[0];
  const primaryId = primary?.creative.id;

  const bankRollups = useMemo(
    () => data.rollups.filter((r) => bank.creativeIds.includes(r.creative.id)),
    [data.rollups, bank.creativeIds],
  );

  // Re-prefill only the untouched blocks whenever the PRIMARY reference
  // changes (picking a 2nd/3rd reference without changing who's primary
  // never re-triggers this, so it never overwrites edits in progress).
  useEffect(() => {
    if (!primary) return;
    setBlocks((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const meta of BLOCK_META) {
        if (touchedRef.current[meta.key]) continue;
        const val = meta.prefill(primary.creative);
        if (next[meta.key] !== val) {
          next[meta.key] = val;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryId]);

  function addReference(id: string) {
    setReferenceIds((prev) => {
      if (prev.includes(id) || prev.length >= MAX_REFERENCES) return prev;
      return [...prev, id];
    });
  }

  function removeReference(id: string) {
    setReferenceIds((prev) => {
      const next = prev.filter((x) => x !== id);
      if (next.length === 0) {
        // Back to zero references — full reset so the next pick starts
        // from a clean, honest pre-fill rather than stale edits.
        touchedRef.current = { ...EMPTY_TOUCHED };
        setBlocks(EMPTY_BLOCKS);
      }
      return next;
    });
  }

  function updateBlock(key: BlockKey, value: string) {
    touchedRef.current[key] = true;
    setBlocks((prev) => ({ ...prev, [key]: value }));
  }

  /** "Also seen in" inspiration line from any secondary references. */
  function hintFor(key: BlockKey): string | undefined {
    const others = references.slice(1);
    if (others.length === 0) return undefined;
    const meta = BLOCK_META.find((m) => m.key === key)!;
    const parts = others.map((r) => `"${meta.prefill(r.creative)}" (${r.creative.name})`);
    return `Also seen in: ${parts.join("; ")}`;
  }

  function handleSendToGenie() {
    if (!primary) return;
    const briefPayload = {
      hook: blocks.hook,
      body: blocks.body,
      cta: blocks.cta,
      visualDirection: blocks.visualDirection,
      offer: blocks.offer,
      referenceCreativeIds: referenceIds,
    };
    const params = new URLSearchParams();
    params.set("concept", primary.creative.id);
    params.set("angle", primary.creative.angleId);
    params.set("hook", blocks.hook);
    params.set("brief", JSON.stringify(briefPayload));
    // Tells the app-level /genie/new stub which Creative Report version to
    // send the buyer back to.
    params.set("from", basePath);
    navigate(`/genie/new?${params.toString()}`);
  }

  if (data.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">Loading creatives…</p>
      </div>
    );
  }

  if (data.status === "error") {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <StateMessage
          variant="error"
          title="Couldn't load your creatives"
          body="Something went wrong loading the creatives to reference. Try again."
          actionLabel="Retry"
          onAction={() => navigate(0)}
        />
      </div>
    );
  }

  if (data.rollups.length === 0) {
    const filtered = data.status === "filtered-empty";
    return (
      <div className="mx-auto max-w-3xl p-6">
        <StateMessage
          variant={filtered ? "filtered" : "empty"}
          title={filtered ? "No creatives match your filters" : "No creatives to reference yet"}
          body={
            filtered
              ? "Adjust or clear filters to bring creatives back into range to reference."
              : "Once creatives are running, come back here to pick 1-3 winners and start a brief from what's already worked."
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link
        to={`${basePath}/creatives`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Creative Report
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Wand2 className="h-5 w-5 text-primary-text" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Brief Builder</h1>
          <p className="text-sm text-muted-foreground">
            Start a brief from what's already worked, then rewrite it.
          </p>
        </div>
      </div>

      {/* References */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">References</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick 1-3 winning creatives to start a brief from what's already worked. The first one
              picked sets the pre-fill — edit anything before sending it on.
            </p>
          </div>
          <CreativePicker
            rollups={data.rollups}
            selectedIds={referenceIds}
            onAdd={addReference}
            disabled={referenceIds.length >= MAX_REFERENCES}
          />
        </div>

        {references.length > 0 && (
          <div className="mt-4 space-y-2">
            {references.map((r, i) => (
              <div
                key={r.creative.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
              >
                <CreativeThumb creative={r.creative} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {r.creative.name}
                    </p>
                    {i === 0 && (
                      <span className="shrink-0 rounded-full border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary-text">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.creative.product} · {fmtMultiple(r.metrics.roas)} ROAS ·{" "}
                    {fmtCompactCurrency(r.metrics.spend)} spend
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeReference(r.creative.id)}
                  aria-label={`Remove ${r.creative.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {bankRollups.length > 0 && referenceIds.length < MAX_REFERENCES && (
          <div className="mt-4 border-t border-border pt-4">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Suggested from{" "}
              {bank.source === "curated"
                ? "your Winners"
                : "starter Winners (bootstrap — mark a winner to refine)"}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {bankRollups
                .filter((r) => !referenceIds.includes(r.creative.id))
                .slice(0, 6)
                .map((r) => (
                  <button
                    key={r.creative.id}
                    type="button"
                    onClick={() => addReference(r.creative.id)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 text-left hover:border-primary/40"
                  >
                    <CreativeThumb creative={r.creative} size={24} />
                    <span className="text-xs font-medium text-foreground">
                      {truncate(r.creative.name, 28).text}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {fmtMultiple(r.metrics.roas)}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Blocks — only once at least one reference is picked */}
      {primary && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Brief blocks</h2>
            <span className="text-[11px] text-muted-foreground">
              Pre-filled from {primary.creative.name} — edit freely
            </span>
          </div>

          {BLOCK_META.map((meta) => (
            <BriefBlock
              key={meta.key}
              label={meta.label}
              value={blocks[meta.key]}
              onChange={(v) => updateBlock(meta.key, v)}
              fromLabel={`From: ${primary.creative.name}`}
              hint={hintFor(meta.key)}
              rows={meta.rows}
            />
          ))}

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              The only numbers above are the reference creative's real folded metrics, shown for
              context on why it was picked — this brief itself isn't scored or predicted.
            </p>
            <Button onClick={handleSendToGenie} className="shrink-0 gap-1.5">
              <Sparkles className="h-4 w-4" />
              Send to Genie
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

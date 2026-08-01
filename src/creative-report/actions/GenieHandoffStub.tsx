/**
 * Genie handoff stub (/genie/new) — the "Generate variation → Genie" exit.
 *
 * The real destination is Genie 6.0's generation flow; in this prototype we
 * render a clearly-SIMULATED landing that proves the concept/angle/hook payload
 * was carried across from the Creative Report (handoff §6). No generation runs.
 */
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDataset } from "@/data/generator";
import {
  CREATIVE_REPORT_BASES,
  DEFAULT_REPORT_BASE_PATH,
} from "@/creative-report/state/ReportBasePathContext";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

/** Shape written by BriefBuilder's `brief=` param — kept loose/optional per
 *  field since this is user-navigable URL content and must never crash the
 *  page on a malformed or hand-edited link. */
interface BriefPayload {
  hook?: string;
  body?: string;
  cta?: string;
  visualDirection?: string;
  offer?: string;
  referenceCreativeIds?: string[];
}

type BriefTextKey = "hook" | "body" | "cta" | "visualDirection" | "offer";

const BRIEF_BLOCK_LABELS: { key: BriefTextKey; label: string }[] = [
  { key: "hook", label: "Hook" },
  { key: "body", label: "Body" },
  { key: "cta", label: "CTA" },
  { key: "visualDirection", label: "Visual direction" },
  { key: "offer", label: "Offer" },
];

/** Shape written by the Compare element composer's `elements=` param. Each
 *  slot carries its own source creative, because the whole point of the
 *  composer is that a hook can come from one creative and a CTA from another
 *  — so there is no single "source creative" for the set. `value` is absent
 *  for "media" (asset only, no copy). */
interface ElementPayload {
  creativeId?: string;
  creativeName?: string;
  value?: string;
}

/** Kept in sync with composer/types.ts ELEMENT_ORDER + ELEMENT_LABELS. Not
 *  imported from there on purpose: this stub is mounted at app level and must
 *  render a hand-edited URL without pulling module internals into the shell. */
const ELEMENT_ROWS: { key: string; label: string }[] = [
  { key: "hook", label: "Hook" },
  { key: "headline", label: "Headline" },
  { key: "primaryText", label: "Primary text" },
  { key: "cta", label: "CTA" },
  { key: "visualDirection", label: "Visual direction" },
  { key: "offer", label: "Offer" },
  { key: "media", label: "Media only" },
  { key: "framework", label: "Framework" },
];

/** Same defensive contract as parseBrief: a malformed or hand-edited
 *  `elements=` must degrade to null, and each field is type-checked so
 *  `{"hook":{"value":{}}}` can never hand React an object as a child. */
function parseElements(raw: string | null): Record<string, ElementPayload> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
    const out: Record<string, ElementPayload> = {};
    for (const { key } of ELEMENT_ROWS) {
      const slot = (parsed as Record<string, unknown>)[key];
      if (!slot || typeof slot !== "object" || Array.isArray(slot)) continue;
      const s = slot as Record<string, unknown>;
      out[key] = {
        creativeId: str(s.creativeId),
        creativeName: str(s.creativeName),
        value: str(s.value),
      };
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

/** Defensive parse — this page is reachable via a user-navigable URL, so a
 *  malformed or truncated `brief=` param must fall back to null, never throw.
 *  Fields are sanitized per-type too: a hand-edited payload like
 *  `{"hook":{}}` must render as "—", not crash React with an object child. */
function parseBrief(raw: string | null): BriefPayload | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const o = parsed as Record<string, unknown>;
    const str = (v: unknown): string | undefined =>
      typeof v === "string" ? v : undefined;
    return {
      hook: str(o.hook),
      body: str(o.body),
      cta: str(o.cta),
      visualDirection: str(o.visualDirection),
      offer: str(o.offer),
      referenceCreativeIds: Array.isArray(o.referenceCreativeIds)
        ? o.referenceCreativeIds.filter((id): id is string => typeof id === "string")
        : undefined,
    };
  } catch {
    return null;
  }
}

export function GenieHandoffStub() {
  const [params] = useSearchParams();
  const conceptId = params.get("concept") ?? "";
  const angleId = params.get("angle") ?? "";
  const hook = params.get("hook") ?? "";
  const brief = parseBrief(params.get("brief"));
  const elements = parseElements(params.get("elements"));
  // This stub is mounted at app level (/genie/new), OUTSIDE the Creative
  // Report layout, so it cannot read ReportBasePathContext. The caller stamps
  // its version onto `from=` instead; anything else (hand-typed URL, old
  // bookmark) falls back to the deployed 2.0 prefix. Whitelisted against the
  // two known bases so a crafted `from=` can't turn this into an open
  // redirect.
  const fromParam = params.get("from") ?? "";
  const backTo = CREATIVE_REPORT_BASES.includes(fromParam)
    ? fromParam
    : DEFAULT_REPORT_BASE_PATH;

  const dataset = getDataset();
  const creative = dataset.creativeById[conceptId];
  const angle = dataset.angleById[angleId];
  const concept = angle ? dataset.conceptById[angle.conceptId] : undefined;
  const referenceCreatives = (brief?.referenceCreativeIds ?? [])
    .map((id) => dataset.creativeById[id])
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link
        to={`${backTo}/creatives`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Creative Report
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Wand2 className="h-5 w-5 text-primary-text" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Genie — generation prefilled from Creative Report
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" />
              Simulated handoff — no generation runs in this prototype
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          These inputs were carried straight from the creative you chose to iterate.
          In the live product this pre-loads Genie 6.0's Studio so you brief the next
          batch without re-typing anything.
        </p>

        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <Row label="Concept" value={concept?.name ?? conceptId ?? "—"} />
          {concept?.thesis && <Row label="Concept thesis" value={concept.thesis} />}
          <Row label="Angle" value={angle?.name ?? angleId ?? "—"} />
          <Row label="Winning hook" value={hook || "—"} />
          {creative && <Row label="Source creative" value={creative.name} />}
          {creative && <Row label="Product" value={creative.product} />}
        </div>

        {elements && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Assembled in Compare
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Each element keeps the creative it came from — a hook from one ad and a CTA from
              another is the point, so there is no single source creative for this set.
            </p>
            <div className="mt-1">
              {ELEMENT_ROWS.filter(({ key }) => elements[key]).map(({ key, label }) => {
                const slot = elements[key];
                const from = slot.creativeName ?? slot.creativeId;
                return (
                  <div
                    key={key}
                    className="flex flex-col gap-1 border-b border-border py-3 last:border-0"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {label}
                    </span>
                    {/* "media" carries no copy — say so rather than rendering an
                        empty value or a bare dash. */}
                    <span className="text-sm font-medium text-foreground">
                      {slot.value || (key === "media" ? "Asset only — no copy" : "Not set")}
                    </span>
                    {from && (
                      <span className="text-xs text-muted-foreground">From: {from}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {brief && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Brief (from an older Brief Builder link)
            </p>
            <div className="mt-1">
              {BRIEF_BLOCK_LABELS.map(({ key, label }) => (
                <Row key={key} label={label} value={brief[key] || "—"} />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {referenceCreatives.length > 0
                ? `Referenced: ${referenceCreatives.map((c) => c.name).join(", ")}`
                : "No reference creatives carried over with this brief."}
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2">
          <Button disabled className="gap-1.5">
            <Wand2 className="h-4 w-4" />
            Generate 3 variations
          </Button>
          <span className="text-xs text-muted-foreground">(disabled in prototype)</span>
        </div>
      </div>
    </div>
  );
}

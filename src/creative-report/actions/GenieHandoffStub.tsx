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
        to="/reports/creative-v2/creatives"
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

        {brief && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Brief (from Brief Builder)
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

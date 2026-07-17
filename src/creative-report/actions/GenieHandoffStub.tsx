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

export function GenieHandoffStub() {
  const [params] = useSearchParams();
  const conceptId = params.get("concept") ?? "";
  const angleId = params.get("angle") ?? "";
  const hook = params.get("hook") ?? "";

  const dataset = getDataset();
  const creative = dataset.creativeById[conceptId];
  const angle = dataset.angleById[angleId];
  const concept = angle ? dataset.conceptById[angle.conceptId] : undefined;

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

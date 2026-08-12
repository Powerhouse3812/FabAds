/**
 * ModulePreviewScreen — /automation/launch, /automation/rrm, /automation/genie.
 *
 * ONE component for three sub-routes because the three screens differ only in
 * which module's seeded rows they show and which sentence explains why those
 * rows aren't live. Forking it into three files would have triplicated the
 * honesty copy, which is exactly the copy that must not drift.
 *
 * HONESTY BOUNDARY (see previewStore.ts's header): none of these rows are
 * wired to a runner. Launch's auto-launch is a stub, RRM's engine lives in
 * another repo, Genie has nothing. So this screen states that three times over,
 * at three different distances: a banner under the header (why the whole page
 * is a preview), a `preview` chip on EVERY row (so a screenshot of one row
 * still carries it), and a caption under every switch (so the one control that
 * moves can't be read as arming anything). The switch does persist — that is
 * the demo's only mutable state — but persisting a boolean is not a runner and
 * the caption says so.
 *
 * Design note: honest, not apologetic. The preview facts are stated in muted
 * tone (border-border / text-muted-foreground), never in a warning tone — these
 * rows aren't broken, they're unbuilt, and a page of warning chips would read
 * as a page of errors in a leadership demo.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CENTER_MODULE_META, KIND_LABELS } from "@/automations/center/model";
import {
  setPreviewEnabled,
  usePreviewAutomations,
} from "@/automations/center/previewStore";

type PreviewModuleKey = "launch" | "rrm" | "genie";

/** Why this module's rows are a preview, in that module's own terms. Kept as
 *  one Record so all three sentences are edited side by side and none of them
 *  can quietly grow a claim the others don't make. */
const PREVIEW_NOTE: Record<PreviewModuleKey, string> = {
  launch:
    "Preview — these automations aren't wired to the Launch engine yet. They show what Launch automations will manage from here.",
  rrm: "Preview — RRM's live triggers run in the production rule engine. These rows show how they'll surface here.",
  genie:
    "Preview — Genie generation triggers aren't live yet. These rows show the planned shape.",
};

interface DestinationMeta {
  /** Verified against src/App.tsx + the module route files, not assumed. */
  href: string;
  linkLabel: string;
  line: string;
}

const DESTINATION: Record<PreviewModuleKey, DestinationMeta> = {
  launch: {
    href: "/launchv2/auto",
    linkLabel: "Open Launch · Auto-launch",
    line: "Authoring will live in Launch, next to auto-launch and its guardrails — this center is where you'll see them all at once.",
  },
  rrm: {
    href: "/rrm",
    linkLabel: "Open RRM",
    line: "RRM's triggers are configured inside RRM against live account health — this center will mirror them, not replace them.",
  },
  genie: {
    href: "/iq/genie6",
    linkLabel: "Open Genie",
    line: "Generation triggers will be set up in Genie, next to the folders and briefs they feed — this center lists them alongside every other module's.",
  },
};

export function ModulePreviewScreen({ module }: { module: PreviewModuleKey }) {
  const { automations } = usePreviewAutomations();
  const rows = useMemo(
    () => automations.filter((a) => a.module === module),
    [automations, module],
  );

  const meta = CENTER_MODULE_META[module];
  const ModuleIcon = meta.icon;
  const destination = DESTINATION[module];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ModuleIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground">{meta.label}</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{meta.blurb}</p>
        </div>
        {rows.length > 0 && (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {rows.length} preview {rows.length === 1 ? "row" : "rows"}
          </span>
        )}
      </header>

      {/* Directly under the header, before any row is read — the page-level
          reason. Muted, not warning-toned: unbuilt is not broken. */}
      <div className="flex gap-2 rounded-lg border border-border bg-card p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" />
        <p className="text-xs text-muted-foreground">{PREVIEW_NOTE[module]}</p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No preview automations.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="truncate text-sm font-medium text-foreground"
                      title={row.name}
                    >
                      {row.name}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {KIND_LABELS[row.kind]}
                    </span>
                    {/* On every row, unconditionally — a row screenshotted out
                        of this page still carries its own disclosure. */}
                    <span className="shrink-0 rounded border border-border px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      preview
                    </span>
                  </div>

                  <p
                    className="mt-0.5 truncate text-xs text-muted-foreground"
                    title={row.summary}
                  >
                    {row.summary}
                  </p>

                  {/* Always visible rather than an expander: five rows total
                      across three screens, and the whole point of the pitch is
                      that you can read what each one would do. */}
                  <div className="mt-1.5 space-y-0.5 rounded-md bg-muted px-2 py-1.5">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">
                        When:
                      </span>{" "}
                      {row.trigger}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">
                        Then:
                      </span>{" "}
                      {row.action}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                  <Switch
                    checked={row.enabled}
                    onCheckedChange={(v) => setPreviewEnabled(row.id, v)}
                    aria-label={`${row.name} — demo toggle, arms nothing`}
                  />
                  <span className="text-right font-mono text-[10px] text-muted-foreground">
                    demo toggle — arms nothing
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-foreground">Where this will live</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{destination.line}</p>
        </div>
        <Link
          to={destination.href}
          className="inline-flex shrink-0 items-center gap-1 text-xs text-primary-text hover:underline"
        >
          {destination.linkLabel}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

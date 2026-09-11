import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { AppFieldValues, GenieApp } from "./appTypes";
import { previewCost } from "./data/appCost";
import { startBatch, useRunsForApp } from "../lib/genieRunStore";
import { batchDoneCount, batchStatus } from "../lib/genieRunTypes";
import { CREDITS_REMAINING, exceedsBalance, formatCredits, creditsLabel } from "../lib/credits";
import { firstMissingRequiredField } from "./lib/fieldHelpers";
import { buildRunPlan } from "./lib/runPlan";
import { FieldRenderer } from "./fields";
import { CostBreakdown } from "./components/CostBreakdown";
import { AppZeroState } from "./components/AppZeroState";
import { RunDrawer } from "./components/RunDrawer";
import { AppScreenSkeleton } from "./components/AppSkeleton";

const OUTCOME_VALUES = ["all-done", "one-failed", "all-failed", "partial"] as const;

/**
 * AppRunner — the ONE screen anatomy for every live app (§8), driven
 * entirely by `app.sections` / `app.cost` / `app.stages` / `app.zeroState`.
 * A new app is a registry entry, never a new screen (see appTypes.ts's
 * top-of-file rationale) — this file is that promise kept.
 *
 * 750px centred column · centred 30px title + 14px subtitle · sections
 * divided by hairline rules (never nested cards) · full-width primary
 * action with the cost stated beneath it.
 *
 * RESULTS ARE NOT ON THIS PAGE ANY MORE (Maalik, 2026-09-09). They used to
 * render below the fold, where they were missed so completely that the owner
 * read a working generation as a broken button — "pata hi nahi chal rha ki
 * generate ho rha hai kuchh, merko lga bug hai." His ruling: a drawer that
 * opens itself the moment Generate is pressed. So `handleSubmit` opens
 * `RunDrawer` synchronously with the batch id `startBatch()` just returned,
 * and the page keeps only two things in that space: the zero state (nothing
 * has ever run here) or the persistent "View results" pill (something has).
 * Nothing about WHERE the data lives changed — same store, same Library, same
 * Batch ID.
 */
export function AppRunner({ app }: { app: GenieApp }) {
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState<AppFieldValues>({});
  /** Which run the drawer is focused on. Null = "the most recent one", which
   *  is what re-opening the drawer without generating should show. */
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // A VIEW over the ONE run store (§8) — never a second array. Must be read
  // before the `?loading=1` early return, or the hook order changes with a
  // query param.
  const runs = useRunsForApp(app.key);

  if (searchParams.get("loading") === "1") {
    return <AppScreenSkeleton />;
  }

  const preview = previewCost(app, values);
  const missing = firstMissingRequiredField(app.sections, values);
  const overBalance = !missing && exceedsBalance(preview.total);
  const disabled = !!missing || overBalance;

  // House convention (Library.tsx, and the old RunResults) — ?empty=1 forces
  // the zero-data state for demo walkthroughs, whatever the store holds.
  const forceEmpty = searchParams.get("empty") === "1";
  const batches = forceEmpty ? [] : runs;
  // A batch the user started THIS session is looked up in the unfiltered
  // list: `?empty=1` is a demo switch for the zero state, and it must not be
  // able to strand a real, running batch behind a permanent "Starting…".
  const activeBatch =
    (activeBatchId && runs.find((b) => b.batchId === activeBatchId)) || batches[0];
  const earlier = batches.filter((b) => b.batchId !== activeBatch?.batchId);
  const liveBatch = batches.find((b) => batchStatus(b) === "running");

  const setField = (id: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    if (disabled) return;
    const plan = buildRunPlan(app, values, preview);
    const outcomeParam = searchParams.get("outcome");
    const outcome = (OUTCOME_VALUES as readonly string[]).includes(outcomeParam ?? "")
      ? (outcomeParam as (typeof OUTCOME_VALUES)[number])
      : undefined;

    const batchId = startBatch({
      origin: { kind: "app", app: app.key },
      label: plan.label,
      stages: app.stages ?? ["Queued", "Processing", "Finalizing"],
      count: plan.count,
      creditsPerItem: plan.creditsPerItem,
      creditsTotal: plan.creditsTotal, // exactly what the cost line under the button said
      config: plan.config,
      itemSeed: plan.itemSeed,
      outcome,
    });
    // THE fix. Same tick as the click — no timeout, no "once the first item
    // resolves", no condition. `startBatch` commits before it returns, so the
    // drawer paints with real stage progress on its very first frame.
    // Re-pointing `activeBatchId` is also what makes a second run reopen the
    // drawer cleanly on the NEW batch rather than the one it last showed.
    setActiveBatchId(batchId);
    setDrawerOpen(true);
    setValues({});
  };

  return (
    <div className="mx-auto flex w-full max-w-[750px] flex-col gap-8 px-6 pb-16 pt-14">
      <header className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-[30px] font-bold tracking-tight text-foreground">{app.name}</h1>
        <p className="text-[14px] text-muted-foreground">{app.subtitle}</p>
      </header>

      <div className="flex flex-col">
        {(app.sections ?? []).map((section, i) => (
          <section
            key={section.title}
            className={cn("flex flex-col gap-4 py-6", i > 0 && "border-t border-border")}
          >
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {section.title}
            </h2>
            <div className="flex flex-col gap-5">
              {section.fields.map((field) => (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-foreground">
                    {field.label}
                    {field.required && <span className="ml-0.5 text-primary-text">*</span>}
                  </label>
                  {field.hint && <p className="text-[12px] text-muted-foreground">{field.hint}</p>}
                  <FieldRenderer
                    field={field}
                    value={values[field.id]}
                    onChange={(v) => setField(field.id, v)}
                    ratePerLanguageMinute={
                      field.kind === "language-select" && app.cost?.unit === "language-minute"
                        ? app.cost.rate
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex w-full flex-col items-center gap-2 border-t border-border pt-6">
        <button
          type="button"
          disabled={disabled}
          aria-disabled={disabled}
          onClick={handleSubmit}
          className={cn(
            "w-full rounded-full py-3 text-[14px] font-semibold transition-colors",
            disabled
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {/* The label must never assert a charge the run can't produce.
              previewCost() floors an empty multi-select at 1 (0 languages × a
              rate is 0, which is a worse lie), so while required fields are
              missing `preview.total` is a FLOOR, not a quote — CostBreakdown
              below already says "From ~". Printing a hard figure up here at
              the same time put two contradicting numbers on one screen, which
              is the §21.2 defect this release exists to remove. So: a figure
              only once the form can actually be priced. */}
          {preview.provisional
            ? "Generate"
            : `Generate (${creditsLabel(preview.total)})`}
        </button>

        {missing && (
          <p className="text-[12.5px] text-muted-foreground">Add {missing.label} to continue.</p>
        )}
        {!missing && overBalance && (
          <p className="text-[12.5px] text-destructive">
            Not enough credits — you're short {formatCredits(preview.total - CREDITS_REMAINING)}.{" "}
            <a href="/plans-v2?addon=credits" className="font-medium underline">
              Top up
            </a>
          </p>
        )}

        <CostBreakdown preview={preview} />
      </div>

      {/* Nothing has ever run here — the zero state stays ON the page, because
          a drawer you have to open to find out what an empty app does is a
          worse first run than a page that just tells you. */}
      {batches.length === 0 && <AppZeroState app={app} />}

      {/* …and once something HAS run, this is the only trace on the page. A
          fixed pill rather than another below-fold block: the whole defect
          being fixed was a results surface you had to scroll to find, so the
          way back into them must be reachable without scrolling at all. It is
          in normal DOM order after the form (tab lands on it right after
          Generate), and it hides while the drawer is open so there is never a
          control offering to open what is already open. */}
      {batches.length > 0 && !drawerOpen && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[12.5px] font-semibold text-foreground shadow-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {liveBatch ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />
              Rendering
              <span className="font-mono text-[11px] font-normal text-muted-foreground">
                {batchDoneCount(liveBatch)}
              </span>
            </>
          ) : (
            <>
              View results
              <span className="font-mono text-[11px] font-normal text-muted-foreground">
                {batches.length} run{batches.length === 1 ? "" : "s"}
              </span>
            </>
          )}
        </button>
      )}

      <RunDrawer
        app={app}
        batch={activeBatch}
        earlier={earlier}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

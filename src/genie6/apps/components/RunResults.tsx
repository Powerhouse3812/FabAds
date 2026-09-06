import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { BatchProgressHeader, RunItemTile } from "../../progress";
import { batchStatus } from "../../lib/genieRunTypes";
import type { RunBatch } from "../../lib/genieRunTypes";
import { cancelBatch, retry, useRunsForApp } from "../../lib/genieRunStore";
import type { GenieApp } from "../appTypes";
import { formatRelativeTime } from "../lib/fieldHelpers";
import { RunItemDetailsDialog } from "./RunItemDetailsDialog";

/**
 * Results section (§8 anatomy) — a VIEW over the central Genie run store,
 * never a separate array (§8: "Per-app history is a view, not a separate
 * store"). One list covers all three of the mandatory run states at once:
 * a batch still `running` reads as the "Run state" (stage text + progress +
 * step list, via `RunItemTile`), a `failed`/`partial` batch stays visible
 * with Retry (§18 — never a toast), and a `done` batch is just a result.
 * Falls back to the zero state (`app.zeroState`) when nothing has run yet.
 */
export function RunResults({ app }: { app: GenieApp }) {
  const [searchParams] = useSearchParams();
  // House convention (Library.tsx) — ?empty=1 forces the zero-data state for
  // demo walkthroughs, regardless of what the store actually holds.
  const forceEmpty = searchParams.get("empty") === "1";
  const batches = useRunsForApp(app.key);
  const effective = forceEmpty ? [] : batches;

  if (effective.length === 0) {
    return <ZeroState app={app} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Results
      </h2>
      <div className="flex flex-col gap-4">
        {effective.map((batch) => (
          <BatchGroup key={batch.batchId} batch={batch} />
        ))}
      </div>
    </div>
  );
}

function BatchGroup({ batch }: { batch: RunBatch }) {
  const status = batchStatus(batch);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <BatchProgressHeader
          batch={batch}
          onRetry={(scope) => retry(batch.batchId, scope)}
          onCancel={() => cancelBatch(batch.batchId)}
        />
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {formatRelativeTime(batch.createdAt)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {batch.items.map((item) => (
          <div key={item.id} className="flex flex-col gap-1">
            <RunItemTile
              item={item}
              stages={batch.stages}
              // itemId disambiguates "this-item" retry — genieRunStore.ts's
              // RetryOpts gap-fix (retry()/creditsForRetry() only take a
              // batchId; this is the additive opts.itemId it added for it).
              onRetry={(scope) => retry(batch.batchId, scope, { itemId: item.id })}
            />
            <RunItemDetailsDialog item={item}>
              <button
                type="button"
                className="self-start text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                View details
              </button>
            </RunItemDetailsDialog>
          </div>
        ))}
      </div>

      {status === "done" && (
        <Link
          to="/iq/genie6/library"
          className="inline-flex items-center gap-1 self-start text-[12.5px] font-medium text-primary-text hover:underline"
        >
          View in your Library
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function ZeroState({ app }: { app: GenieApp }) {
  const z = app.zeroState;
  if (!z) return null;
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <h2 className="text-[15px] font-bold text-foreground">{z.title}</h2>
      <p className="max-w-sm text-[13px] text-muted-foreground">{z.line}</p>
      <ol className="flex w-full max-w-sm flex-col gap-2 text-left">
        {z.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10.5px] font-bold text-primary-text">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

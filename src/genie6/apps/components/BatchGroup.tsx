import { Link } from "react-router-dom";
import { ArrowUpRight, Download } from "lucide-react";
import { BatchProgressHeader, RunItemTile } from "../../progress";
import { batchStatus } from "../../lib/genieRunTypes";
import type { RunBatch, RunItem } from "../../lib/genieRunTypes";
import { cancelBatch, retry } from "../../lib/genieRunStore";
import { formatRelativeTime } from "../lib/fieldHelpers";
import { RunItemDetailsDialog } from "./RunItemDetailsDialog";

/**
 * BatchGroup — ONE batch rendered the §8/§18 way: `BatchProgressHeader` for
 * the batch-level state (Batch ID, status pill, stage-wise progress, retry)
 * and a `RunItemTile` per output. Extracted out of the old below-fold
 * `RunResults` so the results DRAWER (`RunDrawer.tsx`) and any on-page list
 * render the identical thing — §18's "ONE progress + failure pattern... two
 * systems must not exist" applies to the composition around the shared
 * components too, not just the components themselves.
 *
 * Nothing here owns state: the batch comes from the ONE run store, and
 * retry/cancel call straight back into it. Closing the drawer therefore can't
 * affect a run — there is no run state anywhere but the store.
 */

const ACTION_LINK =
  "inline-flex items-center gap-1 rounded text-[11px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

/**
 * A RunItem's only media is its `thumbnail` (an app output has no OutputData
 * to join to — see `RunItem.outputId`'s doc comment), so `outputActions.ts`'s
 * `downloadOutputMedia(output: OutputData)` cannot be reused as-is. Same
 * anchor mechanism, different input type — deliberately kept to one small
 * local function rather than widening the Library's signature.
 */
function downloadRunItem(item: RunItem): void {
  if (!item.thumbnail) return;
  const a = document.createElement("a");
  a.href = item.thumbnail;
  a.download = `${item.id}.jpg`;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function BatchGroup({ batch }: { batch: RunBatch }) {
  const status = batchStatus(batch);

  return (
    /* No outer card. `BatchProgressHeader` already IS a bordered card, and the
       old below-fold list wrapped it in a second one — nested cards, a banned
       §7 anti-pattern that only got worse inside a drawer. */
    <div className="flex flex-col gap-3">
      <p className="text-right font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {formatRelativeTime(batch.createdAt)}
      </p>

      <BatchProgressHeader
        batch={batch}
        onRetry={(scope) => retry(batch.batchId, scope)}
        onCancel={() => cancelBatch(batch.batchId)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {batch.items.map((item) => (
          <div key={item.id} className="flex flex-col gap-1.5">
            <RunItemTile
              item={item}
              stages={batch.stages}
              format={batch.config?.format}
              // itemId disambiguates "this-item" retry — genieRunStore.ts's
              // RetryOpts gap-fix (retry()/creditsForRetry() only take a
              // batchId; this is the additive opts.itemId it added for it).
              onRetry={(scope) => retry(batch.batchId, scope, { itemId: item.id })}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <RunItemDetailsDialog item={item}>
                <button type="button" className={ACTION_LINK}>
                  View details
                </button>
              </RunItemDetailsDialog>

              {/* A finished item gets its two terminal actions right here —
                  the drawer is the first place the output is seen, so "save
                  it" and "where does it live" must not require a trip
                  somewhere else first. */}
              {item.status === "done" && item.thumbnail && (
                <button type="button" onClick={() => downloadRunItem(item)} className={ACTION_LINK}>
                  <Download className="h-3 w-3" aria-hidden />
                  Download
                </button>
              )}
              {item.status === "done" && (
                <Link
                  to={
                    item.outputId
                      ? `/iq/genie6/library?ad=${encodeURIComponent(item.outputId)}`
                      : "/iq/genie6/library"
                  }
                  className={ACTION_LINK}
                >
                  Open in Library
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {status === "done" && (
        <Link
          to="/iq/genie6/library"
          className="inline-flex items-center gap-1 self-start rounded text-[12.5px] font-medium text-primary-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          View this batch in your Library
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      )}
    </div>
  );
}

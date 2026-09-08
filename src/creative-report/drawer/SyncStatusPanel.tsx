/**
 * SyncStatusPanel — "Synced to ad libraries" band (creative drawer, v3 only).
 *
 * Maalik's actual ask: "creative report me btana bhi pd skta hai ki you
 * already uploaded/synced this creative in these ad accounts... kisi or
 * automation se kisi or me chla gya ho." — this band is the provenance
 * answer. Per account: what happened, when, which rule (if any) did it, what
 * KIND of automation that was (canvas workflow vs Creative-Report rule — see
 * `sourceKind` below), and whether it rode along with a whole Creative
 * Library folder push (see `folderLine` below) rather than an ad-hoc
 * selection — that folder case is the literal "kisi or automation se kisi or
 * me chla gya ho" scenario.
 *
 * Deliberately NOT the same fact as RunningInTable above it in the drawer:
 * "where it's running" = live ad delivery context; this band = whether the
 * creative asset has been pushed into an ad account's creative *library* by
 * the sync automation. Conflating the two would make the UI lie about what
 * "running in an account" means, so the label here says "library", never
 * "accounts" or "running" on its own.
 *
 * SNAPSHOT-STABILITY: `useSyncStore()` is the only hook the store exposes and
 * its snapshot is a cached module-level reference (see syncStore.ts header +
 * boards.ts:11-16 for the bug this guards against). `summariseCreative`
 * builds a NEW object every call, so it is memoised here — never read
 * directly in render, never wrapped in a second hook.
 */
import { useMemo } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import { PLATFORM_LABELS } from "@/creative-report/lib/paramSchema";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { useReportWorkflowsEnabled } from "@/creative-report/state/ReportBasePathContext";
import { useSyncStore, retrySync } from "@/creative-report/automations/sync/syncStore";
import { summariseCreative } from "@/creative-report/automations/sync/selectors";
import { SYNC_STATUS_LABELS, type SyncRecord, type WorkflowJobStatus } from "@/creative-report/automations/sync/syncModel";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const ACCOUNT_NAME_MAX_CH = 22; // ch-unit cap for the truncate box, not a slice length

const STATUS_TEXT_CLASS: Record<WorkflowJobStatus, string> = {
  queued: "text-muted-foreground",
  running: "text-foreground",
  done: "text-primary-text",
  failed: "text-destructive",
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * A canvas workflow (Automation Center) and a Creative-Report rule are both
 * just a `ruleId`/`ruleName` pair on the record today — nothing on the
 * SyncRecord says which SYSTEM fired it, only which specific one did. Maalik's
 * ask ("kisi or automation se kisi or me chla gya ho") is exactly about
 * telling those apart, so this resolves the KIND of automation without
 * resolving the specific workflow.
 *
 * FRAGILE ON PURPOSE, and documented as such: this file cannot import the
 * canvas graph store (`src/automations/graphStore.ts`) to look the workflow
 * up by id without pulling automation-builder internals into the creative
 * drawer — a layering violation for a "which kind" label. Instead it reads
 * the id's own shape: canvas workflow ids are minted as `wf-<ts>-<n>` by
 * `makeGraphId()` (graphStore.ts), Creative-Report rule ids as
 * `rule-<ts>-<n>` by `makeId()` (creative-report/automations/rulesStore.ts).
 * Both are literal template strings with no user input in the prefix, so the
 * two spaces don't collide today — but if either generator's prefix ever
 * changes, this silently misclassifies the KIND. It never invents WHICH rule
 * fired (`ruleName` already carries that, verbatim), so the worst case of
 * this heuristic breaking is a wrong category word next to a still-correct
 * name — never a fabricated name.
 */
type SyncSourceKind = "manual" | "workflow" | "rule";

function sourceKind(ruleId: string | null): SyncSourceKind {
  if (ruleId === null) return "manual";
  return ruleId.startsWith("wf-") ? "workflow" : "rule";
}

/**
 * VOCABULARY ALIGNMENT (decided 2026-08-13): this drawer is a PROSE surface —
 * one row read at a time — so it spells these out in full: "Synced manually" /
 * "Creative Report rule" / "Automation Center workflow". `SyncHistoryScreen.tsx`
 * (`src/automations/center/`) is a DENSE TABLE surface and renders the same
 * three categories as short uppercase chips instead (its own
 * `SOURCE_KIND_LABEL`, duplicated rather than imported — see that file's
 * header). That's a density choice for two different layouts, not two
 * different provenance models — both read off the same `ruleId`/`ruleName`
 * and the same `sourceKind()`-shaped reasoning. Do not compact these strings
 * here; do not expand the chips there.
 */
const SOURCE_KIND_LABEL: Record<Exclude<SyncSourceKind, "manual">, string> = {
  workflow: "Automation Center workflow",
  rule: "Creative Report rule",
};

/** Honest provenance copy — never fabricates a rule name, a new timestamp,
 *  or an API error string. See file header + task contract for the exact
 *  phrasing this must produce for the manual / resumed cases. */
function provenanceLine(record: SyncRecord): string {
  const kind = sourceKind(record.ruleId);
  const source =
    kind === "manual" ? "Synced manually" : `via ${SOURCE_KIND_LABEL[kind]} "${record.ruleName}"`;

  if (record.resumedAfterReload) {
    // Still sitting in the requeued state from the reload rewind — the only
    // honest timestamp we have is the ORIGINAL queuedAt, and printing that
    // next to "just resumed" would misleadingly imply it's fresh. Say only
    // what's true: it was resumed and put back in the queue.
    if (record.status === "queued") {
      return "Resumed after reload · queued again (simulated)";
    }
    // Progressed past queued since the resume — keep the normal attribution
    // line (now backed by a real started/finished time) and note the resume
    // as historical context rather than overwriting it.
    const ts = record.finishedAt ?? record.startedAt ?? record.queuedAt;
    return `${source} · ${fmtTime(ts)} (simulated) · resumed after reload`;
  }

  const ts = record.finishedAt ?? record.startedAt ?? record.queuedAt;
  return `${source} · ${fmtTime(ts)} (simulated)`;
}

/**
 * "kisi or automation se kisi or me chla gya ho" — this line is the whole
 * point of the folder half of that ask: a creative can leave via a folder
 * push (a canvas workflow's `addToFolder` → `syncFolderToAccounts` chain)
 * rather than an ad-hoc creative selection, and a user only looking at "who
 * synced this" would miss that it rode along with an entire folder. Guard on
 * `folderName` alone, not `folderId` — every pre-2026-08-13 record and every
 * `mode: "creatives"` workflow push carries neither field (see the file
 * header on syncModel.ts's `SyncRecord.folderId`). `folderId` without a
 * resolvable name is ACTIVELY PREVENTED, not merely assumed away: since
 * Finding S12 (2026-08-13), `syncStore.ts`'s `sanitize()` strips both folder
 * fields together whenever exactly one is present on a loaded record (see
 * `hasAsymmetricFolderFields` there), so by the time a record reaches this
 * component `folderName` is either a real, renderable snapshot or absent —
 * never a dangling `folderId` with nothing to show.
 */
function folderLine(record: SyncRecord): string | null {
  if (!record.folderName) return null;
  return `Pushed as part of the "${record.folderName}" folder`;
}

function SyncRow({ record }: { record: SyncRecord }) {
  const account = ACCOUNT_BY_ID[record.accountId];
  // Honesty layer: never render a raw account id where a name belongs — an
  // unresolvable id (account removed since the record was written) says so.
  const accountName = account?.name ?? "Unknown account";
  const platformLabel = account ? PLATFORM_LABELS[account.platform] : null;
  const folderNote = folderLine(record);

  return (
    <div className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className="truncate text-sm text-foreground"
            style={{ maxWidth: `${ACCOUNT_NAME_MAX_CH}ch` }}
            title={accountName}
          >
            {accountName}
          </span>
          {platformLabel && (
            <span className="shrink-0 text-xs text-muted-foreground">{platformLabel}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("text-xs font-medium", STATUS_TEXT_CLASS[record.status])}>
            {SYNC_STATUS_LABELS[record.status]}
          </span>
          {record.status === "failed" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => retrySync(record.id)}
            >
              <RotateCw className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {record.status === "running" && <Progress value={record.progress} className="h-1.5" />}

      <p className="text-xs text-muted-foreground">{provenanceLine(record)}</p>

      {folderNote && <p className="text-xs text-muted-foreground">{folderNote}</p>}

      {record.status === "failed" && record.failedReason && (
        <p className="text-xs text-destructive">{record.failedReason}</p>
      )}
    </div>
  );
}

export function SyncStatusPanel({ rollup }: { rollup: CreativeRollup }): JSX.Element | null {
  const enabled = useReportWorkflowsEnabled();
  const state = useSyncStore();
  const summary = useMemo(() => summariseCreative(state, rollup.creative.id), [state, rollup.creative.id]);

  if (!enabled) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">Synced to ad libraries</span>
        <WhyDot id="drawer.sync.status" className="h-3 w-3" />
      </div>

      {summary.records.length === 0 ? (
        <p className="text-xs text-muted-foreground">Not synced to any ad account yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {summary.records.map((record) => (
            <SyncRow key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

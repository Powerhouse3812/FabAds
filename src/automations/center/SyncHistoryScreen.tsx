/**
 * SyncHistoryScreen — "what has been pushed where, by which automation?"
 * `/automation/sync-history`.
 *
 * WHY THIS SCREEN EXISTS: `SyncStatusPanel` in the Creative Report drawer
 * answers this question for ONE creative at a time. Nothing in the app
 * answers it across every creative, every account, every automation at once —
 * exactly the audit view a leadership demo of "one automation center" needs.
 * It reads `sync/syncStore.ts` (the SAME store `SyncStatusPanel` reads) via
 * the new `allSyncRecordsNewestFirst` selector — there is no second sync
 * store, no second write path, just a wider read.
 *
 * ONE STORE, TWO CALLERS: `SyncRecord.ruleId` holds either a Creative-Report
 * v3 rule id (`rule-<ts>-<n>`, minted by `creative-report/automations/
 * rulesStore.ts`) or a canvas workflow id (`wf-<ts>-<n>`, minted by
 * `automations/graphStore.ts`) — the canvas's `syncFolderToAccounts` executor
 * calls the exact same `enqueueSyncMany` v3's rule engine does (see
 * `automations/executors.ts:353`). So this list is already, for free, the
 * union of both automation systems' uploads. `ruleId === null` is the third
 * case — a manual sync, never a rule or workflow.
 *
 * SOURCE-KIND HEURISTIC IS DUPLICATED, NOT IMPORTED, ON PURPOSE: `sourceKind`
 * below is the same id-shape heuristic `creative-report/drawer/
 * SyncStatusPanel.tsx` uses (and documents at length) to tell a workflow
 * apart from a rule without importing the canvas graph store into a
 * lower-level surface. That file doesn't export it, and reaching into a
 * sibling screen's private helper would be worse than a five-line duplicate.
 * If the id prefixes `wf-`/`rule-` ever change, both copies need updating —
 * same trade-off that file already accepts.
 *
 * WHY THREE FILTERS, NOT MORE: this list can run past a hundred rows the
 * moment a rule or workflow has been live a few days (60 creatives × up to 2
 * Meta accounts from the seed alone, before any real activity). The three
 * questions a visitor actually asks are "is anything stuck/failed", "who
 * fired this" and "which account" — so Status, Automation and Account are the
 * three controls. Each is capped at 3-4 options (Hick's law): Automation is a
 * KIND filter (Manual / Rule / Workflow), never a per-rule-name picker — with
 * dozens of rules possible, a name-level filter would itself become the
 * overwhelming list this screen exists to tame. `ruleName` still renders on
 * every row (a deleted rule's name survives via the snapshot), it's just not
 * a filter dimension.
 *
 * GROUPING: rows are bucketed by calendar day (Today / Yesterday / date) —
 * the one aggregation that reduces a hundred-row wall of pairs to a scannable
 * shape without hiding any row or inventing a rollup number.
 *
 * LIVE, TRUTHFULLY: `queued`/`running` records advance for real while this
 * screen is mounted — `AutomationsLayout` (the parent route) already arms
 * both workflow-tick runners unconditionally, and v3's own runner ticks
 * `advanceQueue` on the same 500ms clock independently of which page is open.
 * This screen adds no timer of its own; `useSyncStore()`'s external-store
 * subscription is what makes a `running` row's progress bar move without a
 * manual refresh.
 */
import { Fragment, useMemo, useState } from "react";
import { ArrowUpRight, Folder, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import { getDataset } from "@/data/generator";
import type { Dataset } from "@/data/model";
import { useSyncStore } from "@/creative-report/automations/sync/syncStore";
import { allSyncRecordsNewestFirst } from "@/creative-report/automations/sync/selectors";
import { SYNC_STATUS_LABELS, type SyncRecord, type WorkflowJobStatus } from "@/creative-report/automations/sync/syncModel";

/* ------------------------------------------------------------------ */
/*  Source-kind heuristic — see file header for why this is a local   */
/*  duplicate of SyncStatusPanel's, not an import.                     */
/* ------------------------------------------------------------------ */

type SourceKind = "manual" | "rule" | "workflow";

function sourceKind(ruleId: string | null): SourceKind {
  if (ruleId === null) return "manual";
  return ruleId.startsWith("wf-") ? "workflow" : "rule";
}

/**
 * VOCABULARY ALIGNMENT (canonical, decided 2026-08-13): the same record is
 * described in two vocabularies across the app on purpose, not by accident —
 * a density choice, not two data models. This screen is a dense table, so it
 * gets the compact chip forms below (rendered upper-case by the chip's own
 * `uppercase` class: "CR RULE" / "WORKFLOW" / "MANUAL"). The prose surface —
 * `creative-report/drawer/SyncStatusPanel.tsx`'s `SOURCE_KIND_LABEL` —
 * spells the same three kinds out in full ("Creative Report rule" /
 * "Automation Center workflow" / "Synced manually") because a single-record
 * band in a drawer has room for words a 92-row table doesn't.
 */
const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  manual: "Manual",
  rule: "CR Rule",
  workflow: "Workflow",
};

/* ------------------------------------------------------------------ */
/*  Filters                                                            */
/* ------------------------------------------------------------------ */

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In progress" },
  { key: "done", label: "Done" },
  { key: "failed", label: "Failed" },
] as const;
type StatusFilterKey = (typeof STATUS_FILTERS)[number]["key"];

/** Mirrors `selectors.ts`'s IN_FLIGHT_STATUSES bucket — kept as a tiny local
 *  constant rather than an import; there is nothing here worth a shared
 *  export beyond what `selectors.ts` already provides. */
const IN_FLIGHT_STATUSES = new Set<WorkflowJobStatus>(["queued", "running"]);

function matchesStatusFilter(status: WorkflowJobStatus, filter: StatusFilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "in-progress") return IN_FLIGHT_STATUSES.has(status);
  return status === filter;
}

const AUTOMATION_FILTERS = [
  { key: "all", label: "All automations" },
  { key: "manual", label: "Manual" },
  { key: "rule", label: "Creative Report rules" },
  { key: "workflow", label: "Workflows" },
] as const;
type AutomationFilterKey = (typeof AUTOMATION_FILTERS)[number]["key"];

const ACCOUNT_FILTER_ALL = "all";

/* ------------------------------------------------------------------ */
/*  Formatting                                                          */
/* ------------------------------------------------------------------ */

/** Same unparseable-timestamp guard `dayLabel` (below) already has — an
 *  adversarial review measured this function returning the literal string
 *  "Invalid Date" (79px, blowing out the time column) before this guard
 *  existed. `isoToMs` in `automations/autoRunner.ts` is the in-repo
 *  precedent for degrading a bad ISO string to "no value" instead of an
 *  NaN-derived string. */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** Calendar-day bucket label for the row's `queuedAt` — the one timestamp
 *  every record has regardless of status, same reasoning `selectors.ts`'s
 *  sort already uses. */
function dayLabel(iso: string, now: Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

const STATUS_CHIP_CLASS: Record<WorkflowJobStatus, string> = {
  queued: "rounded border border-border px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
  running: "rounded border border-border px-1 font-mono text-[10px] uppercase tracking-wider text-foreground",
  done: "rounded border border-primary-text px-1 font-mono text-[10px] uppercase tracking-wider text-primary-text",
  failed: "rounded border border-destructive/40 px-1 font-mono text-[10px] uppercase tracking-wider text-destructive",
};

/** Matches the id `generateVariation` in `automations/executors.ts` mints
 *  (`${item.id}-var-${i}`, e.g. `cr-040-var-1`) — capture group 1 is the
 *  parent creative id. */
const VARIATION_ID_PATTERN = /^(.+)-var-\d+$/;

/**
 * Resolves a record's `creativeId` to display copy — NOT a plain
 * `creativeById[id]?.name` lookup, because that lie was exactly the bug an
 * adversarial review caught: 92 live records, only 74 resolving, and the
 * other 18 are ALL Genie variation ids (`cr-NNN-var-N`) from the flagship
 * "Scale winners into new variations" template. Because the list sorts
 * newest-first, those 18 were the top 18 rows — the first thing anyone saw.
 *
 * Root cause (see `executors.ts`'s `generateVariation` + `syncFolderToAccounts`
 * headers): a generated variation is deliberately never written into
 * `getDataset().creativeById` — inserting a fabricated creative into the
 * generator's dataset would corrupt the audited creative count. So a
 * variation id is a real, expected shape here, not a data-integrity failure —
 * treating it as "unknown" was the actual defect. A variation has no name of
 * its own in this prototype, so the honest row says what it IS (a variation
 * of a named parent) instead of inventing one.
 *
 * Returns a discriminated result rather than a pre-joined string (Finding 2,
 * 2026-08-13 review): the middle-ellipsis fix below needs to truncate the
 * PARENT NAME specifically for a variation row, not whatever character
 * happens to sit in the middle of the assembled "Variation of "..."" prose —
 * re-parsing that string with a regex to get the name back out would be
 * both fragile and pointless when this function already has the name in hand.
 *
 * Four cases, in priority order:
 *   1. `creativeId` resolves directly -> its real name.
 *   2. `creativeId` matches the `cr-NNN-var-N` shape and the parent resolves
 *      -> the parent's name, tagged as a variation.
 *   3. Matches the variation shape but the parent doesn't resolve -> a
 *      distinct "unresolved parent" case (parent could theoretically be
 *      pruned from a future dataset regen; this keeps that path non-fatal).
 *   4. Neither shape -> a real "unresolved" fallback. Hand-edited
 *      localStorage can produce arbitrary ids, so this path must still
 *      exist — it is just no longer the common case the review measured.
 */
type CreativeLabel =
  | { kind: "direct"; name: string }
  | { kind: "variation"; parentName: string }
  | { kind: "variation-unresolved" }
  | { kind: "unresolved" };

function resolveCreativeLabel(dataset: Dataset, creativeId: string): CreativeLabel {
  const direct = dataset.creativeById[creativeId]?.name;
  if (direct) return { kind: "direct", name: direct };

  const variationMatch = creativeId.match(VARIATION_ID_PATTERN);
  if (variationMatch) {
    const parentName = dataset.creativeById[variationMatch[1]]?.name;
    return parentName ? { kind: "variation", parentName } : { kind: "variation-unresolved" };
  }

  return { kind: "unresolved" };
}

/**
 * Finding 2 (S11, 2026-08-13 review) — CSS `truncate` only ever keeps the
 * HEAD of a string, and all 60 generated creative names share the
 * `MBS_NC_LS_CC_` prefix (`adConventionName` in `data/generator.ts`) — the
 * head is exactly the part every name has in common. The trailing
 * `_set{N}_v{NN}_{ddmmyyyy}` segment is what actually tells two rows with the
 * same product/hook apart, and CSS truncation was cutting precisely that off.
 * This keeps a fixed window from BOTH ends and drops only the middle, so the
 * recognizable prefix and the distinguishing suffix both stay on-screen no
 * matter how long the name is.
 *
 * The returned string carries its own "…" — the caller must not also rely on
 * CSS `text-overflow: ellipsis` to do the cutting (a second, uncoordinated cut
 * could land inside the tail this function went out of its way to keep). The
 * containing element still keeps Tailwind's `truncate` class as a pixel-level
 * backstop only, in case an unusually wide character set makes the character
 * budget below run a few px over its box — see HistoryRow.
 */
function middleEllipsis(text: string, headChars: number, tailChars: number): string {
  if (text.length <= headChars + tailChars + 1) return text;
  return `${text.slice(0, headChars)}…${text.slice(text.length - tailChars)}`;
}

/** `_set{1-digit}_v{2-digit}_{ddmmyyyy}` is always exactly 18 characters —
 *  `setNo` is randInt(1,4) (one digit) and `versionNo` is zero-padded to two
 *  digits (`adConventionName`, `data/generator.ts`). Keeping all 18 guarantees
 *  the one segment that actually varies between two names sharing every other
 *  token is never the part that gets cut. 20 head characters covers the full
 *  `MBS_NC_LS_CC_{VI|IA}_SS_` scaffold plus a couple of characters of the
 *  product token — enough to recognize which product/format a row is before
 *  the ellipsis, without spending the budget on filler underscores alone. */
const NAME_HEAD_CHARS = 20;
const NAME_TAIL_CHARS = 18;

/**
 * Builds the row's visible name text + full-name tooltip from a resolved
 * `CreativeLabel`. Middle-ellipsis is applied to the actual NAME in each
 * case — for a variation, that means the parent's name gets the treatment
 * and the "Variation of "..."" wrapper text stays intact around it, so a
 * variation row still reads as "Variation of <partial-but-identifiable name>"
 * rather than the wrapper itself getting arbitrarily chopped. The two
 * fallback/error cases are short, fixed, non-identifying strings — no
 * information is lost by leaving them un-truncated, so they're returned as-is.
 */
function displayCreativeName(label: CreativeLabel): { text: string; title: string } {
  switch (label.kind) {
    case "direct": {
      return { text: middleEllipsis(label.name, NAME_HEAD_CHARS, NAME_TAIL_CHARS), title: label.name };
    }
    case "variation": {
      const truncatedParent = middleEllipsis(label.parentName, NAME_HEAD_CHARS, NAME_TAIL_CHARS);
      return {
        text: `Variation of "${truncatedParent}"`,
        title: `Variation of "${label.parentName}"`,
      };
    }
    case "variation-unresolved":
      return { text: "Variation (parent creative unresolved)", title: "Variation (parent creative unresolved)" };
    case "unresolved":
      return { text: "Unresolved creative", title: "Unresolved creative" };
  }
}

/**
 * Finding 1 (S10, 2026-08-13 review) — a seeded row must not read as "a
 * person did this, on that date." `record.simulated` can't be the disclosure
 * signal: it's `true` on every record this store holds, seeded or genuinely
 * fired by a rule/workflow this session, so a per-row "simulated" chip would
 * be identical noise on all ~92 rows, not information (see syncModel.ts:6-8
 * for the simulated/seeded distinction this function exists to honor).
 *
 * NOT a `ruleId === null` check, even though every seeded row happens to have
 * one today (`seedInitialRecords` in syncStore.ts is currently the only
 * writer that ever sets `ruleId: null` in this v3 store) — `SyncSource`'s own
 * type still allows a future live manual-sync caller, so keying off "manual"
 * would quietly stop being correct the day one is added. What stays true
 * either way is the STRUCTURAL fingerprint: `seedInitialRecords` invents
 * `startedAt` as the exact same instant as `queuedAt` (both derived from one
 * `queuedAtMs`) because it fabricates an already-finished pair in one step. A
 * record that lived through a real `queued -> running -> done` transition
 * always gets `startedAt` stamped on a LATER tick when `advanceQueue`
 * promotes it (syncStore.ts's queued -> running branch uses that tick's own
 * `nowMs`) — so the two timestamps are never bit-identical for anything that
 * genuinely ran.
 */
function isFabricatedHistory(record: SyncRecord): boolean {
  return record.status === "done" && record.startedAt !== undefined && record.startedAt === record.queuedAt;
}

/* ------------------------------------------------------------------ */
/*  Row                                                                 */
/* ------------------------------------------------------------------ */

function HistoryRow({ record }: { record: SyncRecord }) {
  const dataset = getDataset();
  const creativeLabel = resolveCreativeLabel(dataset, record.creativeId);
  const { text: creativeNameText, title: creativeNameTitle } = displayCreativeName(creativeLabel);
  const account = ACCOUNT_BY_ID[record.accountId];
  const accountName = account?.name ?? "Unknown account";
  const kind = sourceKind(record.ruleId);
  const inFlight = IN_FLIGHT_STATUSES.has(record.status);
  const ts = record.finishedAt ?? record.startedAt ?? record.queuedAt;

  // Finding 1 fix: this row is fabricated bootstrap history, not evidence a
  // person or automation acted — see `isFabricatedHistory`'s header. The
  // ruleName TEXT itself is what changes (not a new chip stacked alongside
  // "MANUAL"): "Manual sync" reads as a completed human action, which is
  // exactly the false claim to remove. Full detail lives in the title for
  // anyone who hovers; the visible words alone already stop the false read,
  // so the honesty survives a screenshot crop of just this row.
  const fabricated = isFabricatedHistory(record);
  const ruleNameText = fabricated ? "Seeded — no sync occurred" : record.ruleName;
  const ruleNameTitle = fabricated
    ? `"${record.ruleName}" was written when this browser first opened the app, to make the history list look lived-in. No person or automation actually synced this — nothing was pushed anywhere.`
    : record.ruleName;

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      {/* w-14 (56px) + whitespace-nowrap, not w-10 (40px) with no wrap guard:
          measured live, `"08:55 PM"` (en-US/en-IN 12-hour locales) renders at
          53px against the old 40px column and wraps to two lines, breaking
          every row's rhythm. en-GB's 24-hour `"20:55"` (33px) never exposed
          it. `whitespace-nowrap` is the actual fix — it makes wrapping
          impossible regardless of locale width; the wider column just keeps
          the common case from touching its own border. */}
      <span className="w-14 shrink-0 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
        {fmtTime(ts)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* max-w-[24rem], not 16rem: the old width was sized for the raw
              CSS `truncate` cut (which only ever needed room for the HEAD).
              `middleEllipsis` below now returns up to ~39 chars for a bare
              name and ~54 for a "Variation of "..."" wrapper, and this box
              has to fit that without CSS truncate quietly re-cutting the
              tail it exists to protect. `truncate` stays on as a pixel-level
              backstop only — see `middleEllipsis`'s header. */}
          <span className="max-w-[24rem] truncate text-xs font-medium text-foreground" title={creativeNameTitle}>
            {creativeNameText}
          </span>
          {/* Finding 3 fix: account (destination — where the asset landed)
              and folder (provenance — how it was grouped before the push)
              were pixel-identical grey chips with nothing distinguishing
              them. Same chip shell for both (no third style invented) — an
              outbound-arrow marks "went to an ad account", a folder glyph
              marks "grouped under this Creative Library folder". Icons are
              `aria-hidden`: the chip's own text + title already carry the
              accessible name, the icon is a sighted-only accelerator. */}
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded border border-border px-1 font-mono text-[10px] text-muted-foreground"
            title={`Pushed to ${accountName}`}
          >
            <ArrowUpRight className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            {accountName}
          </span>
          {record.folderName && (
            <span
              className="inline-flex max-w-[10rem] shrink-0 items-center gap-1 rounded border border-border px-1 font-mono text-[10px] text-muted-foreground"
              title={`Pushed as part of the "${record.folderName}" folder`}
            >
              <Folder className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{record.folderName}</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className="shrink-0 rounded border border-border px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            title={
              kind === "manual"
                ? "Not fired by any rule or workflow"
                : kind === "rule"
                  ? "Fired by a Creative Report reporting rule"
                  : "Fired by an Automation Center canvas workflow"
            }
          >
            {SOURCE_KIND_LABEL[kind]}
          </span>
          <span className="truncate" title={ruleNameTitle}>
            {ruleNameText}
          </span>
          {record.resumedAfterReload && record.status === "queued" && (
            <span className="shrink-0">· resumed after reload</span>
          )}
        </p>
        {record.status === "failed" && record.failedReason && (
          <p className="mt-0.5 truncate text-[11px] text-destructive" title={record.failedReason}>
            {record.failedReason}
          </p>
        )}
      </div>

      <div className="flex w-28 shrink-0 flex-col items-end gap-1">
        <span className={STATUS_CHIP_CLASS[record.status]}>{SYNC_STATUS_LABELS[record.status]}</span>
        {inFlight && <Progress value={record.progress} className="h-1 w-full" />}
      </div>
    </li>
  );
}

/** A day bucket's label row plus its records. Returns a Fragment so every
 *  `<li>` stays a direct child of the one outer `<ul>` — same shape as
 *  OverviewScreen's `ModuleGroup`, so `divide-y` draws one border rhythm down
 *  the whole list instead of a nested list-in-list border doubling up. */
function HistoryGroup({ label, records }: { label: string; records: SyncRecord[] }) {
  return (
    <Fragment>
      <li className="bg-muted/50 px-4 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">{label}</span>
        <span className="ml-2 font-mono text-[10px] text-muted-foreground">{records.length}</span>
      </li>
      {records.map((record) => (
        <HistoryRow key={record.id} record={record} />
      ))}
    </Fragment>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                              */
/* ------------------------------------------------------------------ */

export function SyncHistoryScreen() {
  const state = useSyncStore();
  // Pure selector — new array per call, so it's memoised here rather than
  // read directly in render (syncStore.ts's snapshot-stability discipline;
  // see selectors.ts's own header).
  const allRecords = useMemo(() => allSyncRecordsNewestFirst(state), [state]);

  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [automationFilter, setAutomationFilter] = useState<AutomationFilterKey>("all");
  const [accountFilter, setAccountFilter] = useState<string>(ACCOUNT_FILTER_ALL);

  // Account options are built from accounts that actually appear in history
  // rather than the full AD_ACCOUNTS directory — an account nothing has ever
  // synced to isn't a useful filter option and would just be dead weight in
  // the dropdown.
  const accountOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const record of allRecords) {
      if (seen.has(record.accountId)) continue;
      seen.set(record.accountId, ACCOUNT_BY_ID[record.accountId]?.name ?? "Unknown account");
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allRecords]);

  const now = new Date();

  const visibleRecords = useMemo(
    () =>
      allRecords.filter((record) => {
        if (!matchesStatusFilter(record.status, statusFilter)) return false;
        if (automationFilter !== "all" && sourceKind(record.ruleId) !== automationFilter) return false;
        if (accountFilter !== ACCOUNT_FILTER_ALL && record.accountId !== accountFilter) return false;
        return true;
      }),
    [allRecords, statusFilter, automationFilter, accountFilter],
  );

  // Grouped by calendar day. `allRecords`/`visibleRecords` are already
  // newest-first, so a day's rows are always contiguous — no re-sort needed,
  // just a walk that starts a new bucket when the label changes.
  const groups = useMemo(() => {
    const buckets: { label: string; records: SyncRecord[] }[] = [];
    for (const record of visibleRecords) {
      const label = dayLabel(record.queuedAt, now);
      const last = buckets[buckets.length - 1];
      if (last && last.label === label) last.records.push(record);
      else buckets.push({ label, records: [record] });
    }
    return buckets;
    // `now` is a render-local Date; including it would recompute every render
    // for no behavioural change (day boundaries don't move within one session).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see note above
  }, [visibleRecords]);

  const resetFilters = () => {
    setStatusFilter("all");
    setAutomationFilter("all");
    setAccountFilter(ACCOUNT_FILTER_ALL);
  };

  const filtersActive =
    statusFilter !== "all" || automationFilter !== "all" || accountFilter !== ACCOUNT_FILTER_ALL;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-6">
      <header>
        <h1 className="text-lg font-semibold text-foreground">Sync History</h1>
        <p className="text-sm text-muted-foreground">
          Every creative pushed to an ad account library, from any automation — a Creative
          Report rule, a canvas workflow, or a manual sync. Everything here runs simulated —
          nothing is sent to a real ad account.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-medium text-foreground">All syncs</h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            simulated
          </span>
        </div>

        {allRecords.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No syncs yet.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Uploads appear here the moment a rule, a workflow, or a manual sync queues one.
            </p>
          </div>
        ) : (
          <div className="space-y-3 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setStatusFilter(f.key)}
                      aria-pressed={statusFilter === f.key}
                      className={cn(
                        "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                        statusFilter === f.key
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <Select
                  value={automationFilter}
                  onValueChange={(v) => setAutomationFilter(v as AutomationFilterKey)}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTOMATION_FILTERS.map((f) => (
                      <SelectItem key={f.key} value={f.key} className="text-xs">
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {accountOptions.length > 0 && (
                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ACCOUNT_FILTER_ALL} className="text-xs">
                        All accounts
                      </SelectItem>
                      {accountOptions.map(([id, name]) => (
                        <SelectItem key={id} value={id} className="text-xs">
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {visibleRecords.length} of {allRecords.length} shown
              </p>
            </div>

            {visibleRecords.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">Nothing matches these filters.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-1 text-xs text-primary-text hover:underline"
                >
                  Show all
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {groups.map((group) => (
                  <HistoryGroup key={group.label} label={group.label} records={group.records} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {filtersActive && visibleRecords.length > 0 && (
        <div className="flex gap-2 rounded-lg border border-border bg-card p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" />
          <p className="text-xs text-muted-foreground">
            Filtered view — <button type="button" onClick={resetFilters} className="text-primary-text hover:underline">show every record</button> to
            see the full history.
          </p>
        </div>
      )}
    </div>
  );
}

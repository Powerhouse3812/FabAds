/**
 * NodeConfigPanel — the right-hand inspector that edits whichever canvas node
 * is selected.
 *
 * FULLY CONTROLLED, BY DESIGN. This component holds NO local copy of the
 * selected node's `data`. Every keystroke, pick and toggle calls
 * `onChange(node.id, nextData)` immediately, and the next render reads the
 * node back out of the canvas's own state. A local mirror (the shape
 * `RuleBuilder` uses, which is correct for a modal that opens once over one
 * rule) would desync the moment the user clicks a different node: the panel
 * would still be showing — and on the next edit, writing back — the previous
 * node's draft. The canvas owns node state; this panel is a pure view over it.
 *
 * Two consequences of that rule worth stating up front:
 *   - Condition rows are keyed by INDEX, not by a generated row id. A row id
 *     would be local state this component isn't allowed to keep. Index keys
 *     are safe here precisely because every input is fully controlled by
 *     props — after a removal the surviving rows re-render from the new array
 *     rather than carrying stale internal values.
 *   - Nothing here ever repairs the graph behind the user's back. Where
 *     `RuleBuilder` silently clears a folder that no longer exists, this panel
 *     says so in the UI and waits for a re-pick — an effect that called
 *     `onChange` on mount would write to the canvas just because the user
 *     glanced at a node.
 *
 * The panel is READ-ONLY towards every store. It reads `useClFolders()` (real
 * Supabase) and `useCreativeData()` (the report's filtered rollups, for the
 * live match preview) and otherwise only ever calls the two callbacks it was
 * handed. Nothing in here writes a workflow, a status tag, or a folder.
 *
 * Honesty rules this file exists to enforce, one per action kind:
 *   - `source` is filter-independent and says so.
 *   - `condition` with zero conditions matches NOTHING (see
 *     `@/workflows/core/evaluate.ts`), never everything.
 *   - `markStatus` writes a simulated tag, not a report bucket
 *     (`SIMULATED_STATUS_NOTE`).
 *   - `generateVariation` and `syncFolderToAccounts` are simulated actions.
 *   - `syncFolderToAccounts` asks for a folder ONLY in folder mode, because
 *     that is the only mode where the answer changes what runs. Every mode
 *     edit preserves the rest of the node's config — see the block itself.
 * No number shown here is estimated — the match count comes from the same
 * `evaluateRule` the run engine calls.
 */
import { useMemo } from "react";
import {
  BarChart3,
  Filter,
  FolderPlus,
  Plus,
  Sparkles,
  StickyNote,
  Tag,
  Trash2,
  UploadCloud,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  NODE_KIND_META,
  STATUS_TAG_LABELS,
  SYNC_GRANULARITIES,
  SYNC_GRANULARITY_META,
  WORKFLOW_STATUS_TAGS,
  nodeConfigIssue,
  type SyncGranularity,
  type WorkflowNode,
  type WorkflowNodeData,
  type WorkflowNodeKind,
  type WorkflowStatusTag,
} from "@/automations/model";
import { SIMULATED_STATUS_NOTE } from "@/automations/statusStore";
import { AccountPicker } from "@/creative-report/automations/components/AccountPicker";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { evaluateRule } from "@/creative-report/automations/engine";
import {
  EQUALITY_OPERATORS,
  METRIC_CONDITION_FIELDS,
  NUMERIC_OPERATORS,
  isMetricField,
  type ConditionField,
  type Operator,
  type RuleCondition,
} from "@/creative-report/automations/model";
import { COLUMN_BY_KEY } from "@/creative-report/lib/columns";
import {
  BUCKETS,
  BUCKET_LABELS,
  FORMATS,
  FORMAT_LABELS,
  PLATFORMS,
  PLATFORM_LABELS,
} from "@/creative-report/lib/paramSchema";
import { EMOTION_TAGS, MESSAGING_ANGLES } from "@/data/content";
import { brands } from "@/mocks/shared/brands";
import { useClFolders, type ClFolder } from "@/hooks/use-cl-folders";
import type { WorkflowCondition } from "@/workflows/core";

/* ------------------------------------------------------------------ */
/*  Condition vocabulary                                              */
/* ------------------------------------------------------------------ */

/** Attribute (non-metric) fields, in the order the field Select groups them.
 *  Same list `RuleBuilder` uses — metrics come from METRIC_CONDITION_FIELDS. */
const ATTRIBUTE_FIELDS: ConditionField[] = [
  "bucket",
  "fatiguing",
  "platform",
  "brand",
  "format",
  "messagingAngle",
  "emotion",
];

const OPERATOR_LABELS: Record<Operator, string> = {
  gt: "is greater than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
  between: "is between",
  eq: "is",
  neq: "is not",
};

function fieldLabel(field: ConditionField): string {
  if (isMetricField(field)) return COLUMN_BY_KEY[field].label;
  switch (field) {
    case "bucket": return "Bucket";
    case "fatiguing": return "Fatiguing";
    case "platform": return "Platform";
    case "brand": return "Brand";
    case "format": return "Format";
    case "messagingAngle": return "Messaging angle";
    case "emotion": return "Emotion";
    default: return field;
  }
}

/**
 * A workflow condition carries `field: string` (the core seam is deliberately
 * domain-blind). Every field this panel can *author* comes from the Creative
 * Report vocabulary, so narrowing here is safe — and it's the single narrowing
 * point, the same discipline the node components use for react-flow's loose
 * `data`.
 */
function asConditionField(field: string): ConditionField {
  return field as ConditionField;
}

/**
 * Numeric operators for metric fields, equality operators for everything else
 * — a range over a bucket key or a brand id is meaningless. Derived from
 * NUMERIC_OPERATORS / EQUALITY_OPERATORS so the arrays stay the source of
 * truth and a new operator shows up here for free.
 *
 * JUDGEMENT CALL: `between` is offered unconditionally. RuleBuilder gates it
 * behind the v3 report flag because that one component is mounted by both
 * report versions; this panel exists only inside the new Automations canvas,
 * which has no v2 equivalent to lie to. `compareNumeric` in
 * `@/workflows/core` already handles the operator.
 */
function operatorsForField(field: ConditionField): Operator[] {
  return isMetricField(field) ? [...NUMERIC_OPERATORS] : [...EQUALITY_OPERATORS];
}

/** True when a `between` condition has no upper bound yet. Such a condition is
 *  dropped by the graph sanitiser, so the panel flags it rather than letting
 *  the match count quietly speak for a condition that won't survive a save. */
function isIncompleteRange(c: WorkflowCondition): boolean {
  if (c.operator !== "between") return false;
  return !(typeof c.value2 === "number" && Number.isFinite(c.value2));
}

/**
 * A fresh condition for a newly-picked field. Changing the field REPLACES the
 * whole condition rather than patching it: the old operator may not exist for
 * the new field (`gt` on a brand) and the old value almost certainly isn't in
 * the new field's value set (a bucket key sitting in a spend threshold). A
 * patched-through condition would look configured and match nothing —
 * RuleBuilder's `updateField` makes the same call.
 */
function defaultConditionForField(field: ConditionField): WorkflowCondition {
  if (isMetricField(field)) return { field, operator: "gt", value: 0 };
  switch (field) {
    case "bucket": return { field, operator: "eq", value: BUCKETS[0] };
    case "fatiguing": return { field, operator: "eq", value: "true" };
    case "platform": return { field, operator: "eq", value: PLATFORMS[0] };
    case "brand": return { field, operator: "eq", value: brands[0]?.id ?? "" };
    case "format": return { field, operator: "eq", value: FORMATS[0] };
    case "messagingAngle": return { field, operator: "eq", value: MESSAGING_ANGLES[0] };
    case "emotion": return { field, operator: "eq", value: EMOTION_TAGS[0] };
    default: return { field, operator: "eq", value: "" };
  }
}

/* ------------------------------------------------------------------ */
/*  Shared bits of chrome                                             */
/* ------------------------------------------------------------------ */

const KIND_ICONS: Record<WorkflowNodeKind, LucideIcon> = {
  source: BarChart3,
  condition: Filter,
  markStatus: Tag,
  generateVariation: Sparkles,
  addToFolder: FolderPlus,
  syncFolderToAccounts: UploadCloud,
  note: StickyNote,
};

/**
 * TWO LAYOUTS, ONE CLASS STRING. From `2xl` up this is the static 320px column
 * it has always been. Below `2xl` it is an absolute overlay on the right of the
 * canvas, because a `shrink-0` column that wide leaves the canvas nothing at
 * 768–1280px — `WorkflowCanvas.tsx`'s header note 3 owns that reasoning.
 * `bg-background` is opaque already, so only the shadow is needed to read as a
 * layer above the canvas rather than beside it.
 */
const PANEL_CLASS =
  "w-80 shrink-0 overflow-y-auto border-l border-border bg-background p-4 " +
  "absolute inset-y-0 right-0 z-20 shadow-lg 2xl:static 2xl:z-auto 2xl:shadow-none";

/** A short, always-visible caveat. Muted rather than alarming — these state a
 *  boundary of the prototype, they are not errors the user can fix. */
function Caveat({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] leading-relaxed text-muted-foreground">{children}</p>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-[12px] font-medium text-foreground">{children}</Label>;
}

/* ------------------------------------------------------------------ */
/*  Folder control (shared by two node kinds)                         */
/* ------------------------------------------------------------------ */

/**
 * The Creative Library folder picker, used by both node kinds that need one:
 * `addToFolder` (which folder to file into) and a FOLDER-MODE
 * `syncFolderToAccounts` (which folder to push). One copy on purpose — the
 * fiddly part is the four distinct placeholder states, the disabled rule, and
 * the "that folder is gone" warning, and two drifting copies of that is how one
 * node ends up silently clearing a folder while the other reports it.
 *
 * PRESENTATIONAL. It takes the folder query's states as props instead of
 * calling `useClFolders()` itself, so the panel keeps one query per render and
 * a hook order that can't change with the selection.
 *
 * `onPick` hands back BOTH id and name: the name is snapshotted onto the node
 * because the run engine has no Supabase client in scope and can never
 * re-resolve an id — the same denormalisation `SyncRecord.ruleName` uses.
 */
function FolderSelect({
  folderId,
  folderName,
  folders,
  loading,
  error,
  ariaLabel,
  onPick,
}: {
  folderId: string;
  folderName: string;
  folders: ClFolder[];
  loading: boolean;
  error: boolean;
  ariaLabel: string;
  onPick: (folderId: string, folderName: string) => void;
}) {
  const isEmpty = !loading && !error && folders.length === 0;
  const placeholder = loading
    ? "Loading folders…"
    : error
      ? "Couldn't load folders"
      : isEmpty
        ? "No folders yet"
        : "Choose a folder";
  // A stored folder that no longer exists is REPORTED, not silently cleared:
  // repairing the graph from an effect would write to the canvas just because
  // the user clicked this node.
  const missing = !loading && !error && !!folderId && !folders.some((f) => f.id === folderId);

  return (
    <>
      <Select
        // A value outside the option list would leave the trigger blank, so
        // fall back to "" and let the placeholder speak (plus the warning
        // below, which names the folder that went missing).
        value={folders.some((f) => f.id === folderId) ? folderId : ""}
        onValueChange={(v) => onPick(v, folders.find((f) => f.id === v)?.name ?? "")}
        disabled={loading || error || isEmpty}
      >
        <SelectTrigger className="h-8 text-[13px]" aria-label={ariaLabel}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {folders.map((folder) => (
            <SelectItem key={folder.id} value={folder.id}>
              {folder.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-[11px] leading-relaxed text-destructive">
          Couldn&apos;t load Creative Library folders. Try again in a moment.
        </p>
      )}
      {isEmpty && <Caveat>No folders yet — create one in Creative Library first.</Caveat>}
      {missing && (
        <p className="text-[12px] leading-relaxed text-warning-text">
          {folderName
            ? `"${folderName}" isn't in Creative Library any more.`
            : "The folder this step points at isn't in Creative Library any more."}{" "}
          Pick another one.
        </p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Value editor                                                      */
/* ------------------------------------------------------------------ */

/**
 * The value control swaps shape entirely per field: a closed Select for every
 * enum-ish attribute, a Yes/No Select for the one boolean, a number Input for
 * metrics — plus a second number Input when the operator is `between`. No
 * free-text input ever backs a field with a closed value set, because a typo
 * there would silently never match. Mirrors RuleBuilder's
 * `ConditionValueEditor`.
 */
function ConditionValueEditor({
  condition,
  onChangeValue,
  onChangeValue2,
}: {
  condition: WorkflowCondition;
  onChangeValue: (value: string | number) => void;
  onChangeValue2: (value2: number | undefined) => void;
}) {
  const field = asConditionField(condition.field);
  const { value } = condition;

  if (isMetricField(field)) {
    const isRange = condition.operator === "between";
    const lower = (
      <Input
        type="number"
        value={String(value)}
        aria-label={isRange ? "Range lower bound" : `${fieldLabel(field)} value`}
        onChange={(e) => {
          const raw = e.target.value;
          const n = Number(raw);
          onChangeValue(raw.trim() === "" || Number.isNaN(n) ? 0 : n);
        }}
        className="h-8 text-[13px]"
      />
    );

    if (!isRange) return lower;

    // The upper bound starts empty and stays empty until the user types a
    // number. It is never defaulted to 0 — a silently-complete "between 0 and
    // 0" is a worse lie than a visibly-unfinished range.
    return (
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{lower}</div>
        <span className="shrink-0 text-[12px] text-muted-foreground">and</span>
        <div className="min-w-0 flex-1">
          <Input
            type="number"
            value={condition.value2 === undefined ? "" : String(condition.value2)}
            aria-label="Range upper bound"
            aria-invalid={isIncompleteRange(condition) || undefined}
            placeholder="Upper"
            onChange={(e) => {
              const raw = e.target.value;
              const n = Number(raw);
              onChangeValue2(raw.trim() === "" || Number.isNaN(n) ? undefined : n);
            }}
            className="h-8 text-[13px]"
          />
        </div>
      </div>
    );
  }

  const options: { value: string; label: string }[] =
    field === "bucket"
      ? BUCKETS.map((b) => ({ value: b, label: BUCKET_LABELS[b] }))
      : field === "fatiguing"
        ? [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]
        : field === "platform"
          ? PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))
          : field === "format"
            ? FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))
            : field === "brand"
              ? brands.map((b) => ({ value: b.id, label: b.name }))
              : field === "messagingAngle"
                ? MESSAGING_ANGLES.map((a) => ({ value: a, label: a }))
                : field === "emotion"
                  ? EMOTION_TAGS.map((e) => ({ value: e, label: e }))
                  : [];

  if (options.length === 0) return null;

  return (
    <Select value={String(value)} onValueChange={onChangeValue}>
      <SelectTrigger className="h-8 text-[13px]" aria-label={`${fieldLabel(field)} value`}>
        <SelectValue placeholder="Choose a value" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/*  Panel                                                             */
/* ------------------------------------------------------------------ */

/** Stable empty array so the match-count `useMemo` doesn't re-run on every
 *  render when a non-condition node (or nothing) is selected. */
const NO_CONDITIONS: WorkflowCondition[] = [];

export function NodeConfigPanel({
  node,
  onChange,
  onDelete,
  onClose,
}: {
  node: WorkflowNode | null;
  onChange: (nodeId: string, data: WorkflowNodeData) => void;
  onDelete: (nodeId: string) => void;
  /** Clears the selection. Only rendered below `2xl`, where this panel floats
   *  over the canvas and would otherwise have no way back to it. */
  onClose?: () => void;
}) {
  // Hooks run before any early return, unconditionally — the panel must not
  // change its hook order when the selection moves between kinds or to null.
  //
  // JUDGEMENT CALL: both hooks run for every selection, not just the kinds
  // that need them. `useCreativeData` is memoised and `useClFolders` is a
  // react-query cache read keyed by workspace, so the cost is one fetch per
  // workspace regardless — and the folder Select is warm the instant the user
  // clicks an "Add to folder" node instead of flashing "Loading folders…".
  const { rollups } = useCreativeData();
  const {
    data: folderData,
    isLoading: foldersLoading,
    isError: foldersError,
  } = useClFolders();
  const folderList = folderData ?? [];

  const conditions =
    node?.data.kind === "condition" ? node.data.conditions : NO_CONDITIONS;

  // The SAME function the run engine calls, on the same rollups — so the
  // preview cannot disagree with what a run would actually do. The cast is
  // safe in the assignable direction: RuleCondition["field"] is a subset of
  // WorkflowCondition["field"] (string).
  const matchCount = useMemo(
    () => evaluateRule({ conditions: conditions as RuleCondition[] }, rollups).length,
    [conditions, rollups],
  );

  if (!node) {
    return (
      // `hidden 2xl:flex`: with nothing selected there is nothing to configure,
      // and below `2xl` this panel is an overlay — floating "Select a step to
      // configure it." over the canvas would cover the very steps it asks the
      // user to select. The wide layout keeps it: there the column's space is
      // reserved either way, and an empty column with no explanation is worse.
      <aside className={cn(PANEL_CLASS, "hidden items-center justify-center 2xl:flex")}>
        <p className="max-w-[15rem] text-center text-[13px] leading-relaxed text-muted-foreground">
          Select a step to configure it.
        </p>
      </aside>
    );
  }

  const { data } = node;
  const meta = NODE_KIND_META[node.kind];
  const Icon = KIND_ICONS[node.kind];
  const issue = nodeConfigIssue(data);
  const isTrigger = data.kind === "source";

  /* ---- condition-row mutators (each writes straight through) ---- */

  function writeConditions(next: WorkflowCondition[]) {
    if (!node) return;
    onChange(node.id, { kind: "condition", conditions: next });
  }
  function replaceCondition(index: number, next: WorkflowCondition) {
    writeConditions(conditions.map((c, i) => (i === index ? next : c)));
  }
  function addCondition() {
    writeConditions([...conditions, defaultConditionForField("bucket")]);
  }
  function removeCondition(index: number) {
    writeConditions(conditions.filter((_, i) => i !== index));
  }
  function changeField(index: number, field: ConditionField) {
    replaceCondition(index, defaultConditionForField(field));
  }
  function changeOperator(index: number, operator: Operator) {
    const next: WorkflowCondition = { ...conditions[index], operator };
    // `value2` only means anything for `between`. Leaving a stale upper bound
    // behind is a correctness bug, not clutter — an operator change back to
    // `between` later would silently inherit a bound the user never re-typed.
    if (operator !== "between") delete next.value2;
    replaceCondition(index, next);
  }
  function changeValue(index: number, value: string | number) {
    replaceCondition(index, { ...conditions[index], value });
  }
  function changeValue2(index: number, value2: number | undefined) {
    const next: WorkflowCondition = { ...conditions[index], value2 };
    if (value2 === undefined) delete next.value2;
    replaceCondition(index, next);
  }

  const incompleteRanges = conditions.filter(isIncompleteRange).length;

  /* ---- folder state lives in `FolderSelect` ----
     Its four distinct placeholders (loading / error / empty / ready), the
     disabled rule and the went-missing warning are all derived from the three
     props it takes, so both node kinds that pick a folder get identical
     behaviour without this component tracking it twice. */

  return (
    <aside className={cn(PANEL_CLASS, "space-y-4")}>
      {/* ---------------- header ---------------- */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Icon className="h-3 w-3" />
            {meta.family}
          </div>
          <h2 className="mt-0.5 truncate text-sm font-semibold text-foreground" title={meta.label}>
            {meta.label}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          onClick={() => onDelete(node.id)}
          disabled={isTrigger}
          aria-label={isTrigger ? "The trigger can't be deleted" : "Delete this step"}
          title={
            isTrigger
              ? "A workflow needs its trigger — this step can't be deleted"
              : "Delete this step"
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        {/* Below `2xl` this panel floats over the canvas, so it needs a way back
            to it that isn't "click the pane you can't see". Deliberately NOT an
            outside-click dismiss (this repo's overlays never do that) and
            deliberately absent from the wide layout, where the panel is a
            column that closing would leave as a hole. It clears the selection
            rather than hiding the panel, so the canvas and the panel keep
            agreeing about what is selected. */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground 2xl:hidden"
          onClick={onClose}
          aria-label="Close the step settings"
          title="Close the step settings"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* One "needs setup" signal for the whole app: the node card and this
          panel both read `nodeConfigIssue`, so they can never disagree. */}
      {issue && (
        <p className="text-[12px] leading-relaxed text-warning-text">{issue}</p>
      )}

      {/* ---------------- source ---------------- */}
      {data.kind === "source" && (
        <div className="space-y-2">
          <p className="text-[13px] leading-relaxed text-foreground">
            Nothing to configure. Every creative in the Creative Report enters the workflow here,
            unfiltered.
          </p>
          <Caveat>
            Deliberately filter-independent: a workflow reads a fixed subject set — the whole
            dataset over the report&apos;s default window — so flipping a date chip or typing in
            search can never change which creatives it acts on.
          </Caveat>
        </div>
      )}

      {/* ---------------- condition ---------------- */}
      {data.kind === "condition" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Conditions</SectionLabel>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={addCondition}
            >
              <Plus className="h-3.5 w-3.5" />
              Add condition
            </Button>
          </div>

          {/* Index keys: see the header note — this panel may hold no local
              row-id state, and every input below is fully controlled. */}
          <div className="space-y-3">
            {conditions.map((condition, index) => {
              const field = asConditionField(condition.field);
              return (
                <div key={index} className="space-y-1.5 rounded-md border border-border p-2">
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={condition.field}
                      onValueChange={(v) => changeField(index, asConditionField(v))}
                    >
                      <SelectTrigger className="h-8 min-w-0 flex-1 text-[13px]" aria-label="Field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Attributes</SelectLabel>
                          {ATTRIBUTE_FIELDS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {fieldLabel(f)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Metrics</SelectLabel>
                          {METRIC_CONDITION_FIELDS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {fieldLabel(f)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground"
                      onClick={() => removeCondition(index)}
                      aria-label="Remove condition"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Select
                    value={condition.operator}
                    onValueChange={(v) => changeOperator(index, v as Operator)}
                  >
                    <SelectTrigger className="h-8 text-[13px]" aria-label="Operator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorsForField(field).map((o) => (
                        <SelectItem key={o} value={o}>
                          {OPERATOR_LABELS[o]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <ConditionValueEditor
                    condition={condition}
                    onChangeValue={(v) => changeValue(index, v)}
                    onChangeValue2={(v) => changeValue2(index, v)}
                  />
                </div>
              );
            })}
          </div>

          {conditions.length > 1 && (
            <Caveat>
              All conditions must match (AND) — this engine has no OR groups. Chain another
              Condition step to keep narrowing.
            </Caveat>
          )}
          {conditions.some((c) => c.operator === "between") && (
            <Caveat>Ranges are inclusive — between 2 and 4 includes both ends.</Caveat>
          )}

          {/* The live preview. Zero conditions is NOT "match everything":
              `evaluateConditions` returns [] for an empty list, deliberately.
              Saying "all creatives match" here would be the exact opposite of
              what a run would do. */}
          {conditions.length === 0 ? (
            <p className="text-[12px] leading-relaxed text-warning-text">
              With no conditions this step matches <span className="font-medium">nothing</span> — not
              everything. An empty condition list stops the chain here, so add at least one.
            </p>
          ) : (
            <p className="text-[12px] text-foreground">
              <span className="font-medium">{matchCount}</span>{" "}
              {matchCount === 1 ? "creative" : "creatives"} currently{" "}
              {matchCount === 1 ? "matches" : "match"}.
            </p>
          )}
          {incompleteRanges > 0 && (
            <p className="text-[12px] leading-relaxed text-destructive">
              {incompleteRanges === 1
                ? "A range is missing its upper value"
                : `${incompleteRanges} ranges are missing their upper value`}
              , so that count isn&apos;t the whole story yet — a range with only a lower bound
              can&apos;t be stored.
            </p>
          )}
        </div>
      )}

      {/* ---------------- markStatus ---------------- */}
      {data.kind === "markStatus" && (
        <div className="space-y-2">
          <SectionLabel>Status to apply</SectionLabel>
          <Select
            value={data.status}
            onValueChange={(v) =>
              onChange(node.id, { kind: "markStatus", status: v as WorkflowStatusTag })
            }
          >
            <SelectTrigger className="h-8 text-[13px]" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKFLOW_STATUS_TAGS.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {STATUS_TAG_LABELS[tag]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Always visible, never behind a hover or a disclosure — the whole
              point is that nobody reads this dropdown as bucket editing.
              Wording comes from the shared constant, not re-worded here. */}
          <Caveat>
            This writes a {SIMULATED_STATUS_NOTE}. The Creative Report derives buckets from
            spend/ROAS thresholds, and a workflow tag sits alongside that — it never overwrites it.
          </Caveat>
        </div>
      )}

      {/* ---------------- generateVariation ---------------- */}
      {data.kind === "generateVariation" && (
        <div className="space-y-2">
          <SectionLabel>Variations per creative</SectionLabel>
          {/* A Select of 1–3 rather than a clamped number Input: the clamp is
              structural, so there is no moment where the field shows a 9 the
              system is about to silently rewrite. */}
          <Select
            value={String(data.count)}
            onValueChange={(v) =>
              onChange(node.id, { kind: "generateVariation", count: Number(v) })
            }
          >
            <SelectTrigger className="h-8 text-[13px]" aria-label="Variations per creative">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === 1 ? "1 variation" : `${n} variations`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Caveat>
            Generation is simulated in this prototype — the run records the variations it would ask
            Genie for, but no image is produced. Same boundary the /genie/new handoff states.
          </Caveat>
        </div>
      )}

      {/* ---------------- addToFolder ---------------- */}
      {data.kind === "addToFolder" && (
        <div className="space-y-2">
          <SectionLabel>Creative Library folder</SectionLabel>
          <FolderSelect
            folderId={data.folderId}
            folderName={data.folderName}
            folders={folderList}
            loading={foldersLoading}
            error={foldersError}
            ariaLabel="Folder"
            onPick={(folderId, folderName) =>
              onChange(node.id, { kind: "addToFolder", folderId, folderName })
            }
          />
          <Caveat>
            The list is your real Creative Library folders, but filing into one is simulated — no
            folder membership is written. The name is snapshotted when you pick it, so a later
            rename still shows the old name in past runs.
          </Caveat>
        </div>
      )}

      {/* ---------------- syncFolderToAccounts ---------------- */}
      {data.kind === "syncFolderToAccounts" && (
        <div className="space-y-4">
          {/* WHAT to push comes before WHERE, because the answer decides
              whether the folder question below is asked at all. */}
          <div className="space-y-2">
            <SectionLabel>What to push</SectionLabel>
            <Select
              // Every write here SPREADS the existing data. The accounts the
              // user already picked are unrelated to the granularity, and a
              // panel that silently emptied them on a mode flip would punish
              // the user for exploring the very choice this control exists to
              // offer. `folderId` survives too, so flipping to matched
              // creatives and back restores the folder rather than making them
              // hunt for it again — the executor ignores it in creatives mode
              // (see executors.ts), so a stale value can't leak into a push.
              value={data.mode === "creatives" ? "creatives" : "folder"}
              onValueChange={(v) =>
                onChange(node.id, { ...data, mode: v as SyncGranularity })
              }
            >
              <SelectTrigger className="h-8 text-[13px]" aria-label="What to push">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYNC_GRANULARITIES.map((granularity) => (
                  <SelectItem key={granularity} value={granularity}>
                    {SYNC_GRANULARITY_META[granularity].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* The blurb comes from the shared meta, not re-worded here, so the
                palette, the node card and this panel describe the two modes in
                the same words. */}
            <Caveat>
              {SYNC_GRANULARITY_META[data.mode === "creatives" ? "creatives" : "folder"].blurb}.
            </Caveat>
          </div>

          {/* Folder mode only. In creatives mode there is no folder in the job,
              so asking for one would imply it changes something. */}
          {data.mode !== "creatives" && (
            <div className="space-y-2">
              <SectionLabel>Folder to push</SectionLabel>
              <FolderSelect
                folderId={data.folderId ?? ""}
                folderName={data.folderName ?? ""}
                folders={folderList}
                loading={foldersLoading}
                error={foldersError}
                ariaLabel="Folder to push"
                onPick={(folderId, folderName) =>
                  onChange(node.id, { ...data, folderId, folderName })
                }
              />
              <Caveat>
                Pick the folder this step hands to Meta. It doesn&apos;t have to be the folder an
                earlier step files into — but if it isn&apos;t, this step pushes whatever is in the
                folder you name here.
              </Caveat>
            </div>
          )}

          <div className="space-y-2">
            <SectionLabel>Ad account libraries</SectionLabel>
            <AccountPicker
              selected={data.accountIds}
              onChange={(ids) => onChange(node.id, { ...data, accountIds: ids })}
            />
            <Caveat>
              The upload is simulated — the run records what it would send to each Meta library, but
              nothing is pushed to Meta.
            </Caveat>
            {/* Stated once, here, because it is the one place a user could
                reasonably expect a second push to happen. */}
            <Caveat>
              A creative already synced to one of these accounts is skipped rather than uploaded
              twice, whichever folder it arrived in — the run log names how many were skipped.
            </Caveat>
          </div>
        </div>
      )}

      {/* ---------------- note ---------------- */}
      {data.kind === "note" && (
        <div className="space-y-2">
          <SectionLabel>Note</SectionLabel>
          <Textarea
            value={data.text}
            onChange={(e) => onChange(node.id, { kind: "note", text: e.target.value })}
            placeholder="e.g. Check with Neeraj before syncing the Q4 folder"
            rows={5}
            className="text-[13px]"
          />
          <Caveat>Notes never run and never connect — they only annotate the canvas.</Caveat>
        </div>
      )}
    </aside>
  );
}

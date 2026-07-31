/**
 * RuleBuilder — create/edit modal for an automation rule (iter-2 P4).
 *
 * Scoped down (Maalik, 2026-07-31) to exactly ONE action: "file into folder",
 * pointing at REAL Creative Library folders (`cl_folders`, via
 * `useClFolders()`) — never the module's own synthetic `Board` concept, and
 * never the ad-account sync feature (moved out of Creative Report entirely).
 * There is only one rule type now (`"categorise"`, see model.ts), so the old
 * type toggle and its "launch" branch (pause / queue-in-launch) are gone —
 * every rule this builder creates is implicitly `categorise`.
 *
 * Every value shown while building a rule (the match-count preview) is a
 * live, honest count from the same `evaluateRule` the engine uses to run —
 * never an estimate.
 *
 * VERSION-GATED (v3 only, via `useReportWorkflowsEnabled`): the schedule +
 * auto-run section and the `between` range operator. This one component is
 * mounted by BOTH /reports/creative-v2 and /reports/creative-v3, so the prose
 * branches too — v2's description still says nothing runs on a schedule
 * (true there), v3's says a rule can fire itself inside its date window. An
 * unbranched string would have one of the two versions lying about its own
 * behaviour.
 *
 * One deliberate exception to that gate, about *displaying* data v3 created
 * rather than offering v2 a new capability (rules share one localStorage key
 * across versions, so v2 can be asked to edit a v3 rule): a `between`
 * condition already on the rule keeps its operator label and upper-bound
 * input. Dropping it would be silent data loss on a round-trip.
 *
 * The folder picker itself needs Supabase-backed live data (`useClFolders()`)
 * — it honestly reflects loading / error / zero-folder states rather than
 * ever rendering a bare or broken dropdown, and blocks save when there is
 * nothing real to point the rule at.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { WhyDot } from "@/creative-report/components/WhyDot";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { evaluateRule } from "@/creative-report/automations/engine";
import { createRule, updateRule } from "@/creative-report/automations/rulesStore";
import { useClFolders } from "@/hooks/use-cl-folders";
import { ScheduleEditor } from "@/creative-report/automations/components/ScheduleEditor";
import { useReportWorkflowsEnabled } from "@/creative-report/state/ReportBasePathContext";
import {
  METRIC_CONDITION_FIELDS,
  isMetricField,
  type AddToFolderAction,
  type AutomationRule,
  type ConditionField,
  type Operator,
  type RuleAction,
  type RuleCondition,
  type RuleSchedule,
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

const ATTRIBUTE_FIELDS: ConditionField[] = [
  "bucket",
  "fatiguing",
  "platform",
  "brand",
  "format",
  "messagingAngle",
  "emotion",
];

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
 * `between` is a metric-only operator — attribute fields keep eq/neq, since a
 * range over a bucket key or a brand id is meaningless.
 *
 * `allowBetween` is the v3 gate. It's also forced true when the condition
 * being edited already IS a `between` (see `current`) so v2 renders a v3-made
 * rule's operator with its real label instead of an empty Select trigger —
 * showing the truth about existing data, not offering v2 the new operator.
 */
function operatorsForField(
  field: ConditionField,
  allowBetween: boolean,
  current?: Operator,
): { value: Operator; label: string }[] {
  if (isMetricField(field)) {
    return [
      { value: "gt", label: "is greater than" },
      { value: "gte", label: "is at least" },
      { value: "lt", label: "is less than" },
      { value: "lte", label: "is at most" },
      ...(allowBetween || current === "between"
        ? ([{ value: "between", label: "is between" }] as const)
        : []),
    ];
  }
  return [
    { value: "eq", label: "is" },
    { value: "neq", label: "is not" },
  ];
}

/** True when a `between` condition is missing its upper bound. Such a
 *  condition is dropped outright by the sanitiser in rulesStore.ts, which
 *  would leave a rule that matches everything the remaining conditions allow
 *  — so the builder blocks the save instead of letting it through. */
function isIncompleteRange(c: RuleCondition): boolean {
  if (c.operator !== "between") return false;
  return !(typeof c.value2 === "number" && Number.isFinite(c.value2));
}

/** Stores a range low-to-high so the persisted rule reads the way the user
 *  meant it. `compareNumeric` in @/workflows/core normalises at match time
 *  too, so entering 5 then 2 always *worked* — this keeps the saved data
 *  sane as well, rather than relying on the reader to reorder it forever. */
function normaliseCondition(c: RuleCondition): RuleCondition {
  if (c.operator !== "between" || isIncompleteRange(c)) return c;
  const lo = typeof c.value === "number" ? c.value : Number(c.value);
  const hi = c.value2 as number;
  if (Number.isNaN(lo)) return c;
  return { ...c, value: Math.min(lo, hi), value2: Math.max(lo, hi) };
}

function defaultConditionForField(field: ConditionField): RuleCondition {
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

/** The value editor swaps shape entirely per field — a known-value Select for
 *  every enum-ish attribute, a Yes/No Select for the one boolean, and a plain
 *  number Input for metric fields. No free-text field ever backs a value that
 *  has a closed value-set — typos would silently never match. */
function ConditionValueEditor({
  condition,
  onChange,
  onChangeValue2,
}: {
  condition: RuleCondition;
  onChange: (value: string | number) => void;
  onChangeValue2: (value: number | undefined) => void;
}) {
  const { field, value } = condition;

  if (isMetricField(field)) {
    const isRange = condition.operator === "between";
    const lower = (
      <Input
        type="number"
        value={String(value)}
        aria-label={isRange ? "Range lower bound" : undefined}
        onChange={(e) => {
          const raw = e.target.value;
          const n = Number(raw);
          onChange(raw.trim() === "" || Number.isNaN(n) ? 0 : n);
        }}
        className="h-8 text-[13px]"
      />
    );

    if (!isRange) return lower;

    // The upper bound starts empty and stays empty until the user types a
    // number — it is never defaulted to 0, because a silently-complete range
    // of "between 0 and 0" is a worse lie than a visibly-unfinished one.
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

  switch (field) {
    case "bucket":
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {BUCKETS.map((b) => (
              <SelectItem key={b} value={b}>{BUCKET_LABELS[b]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "fatiguing":
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    case "platform":
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "format":
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FORMATS.map((f) => (
              <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "brand":
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Choose a brand" /></SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "messagingAngle":
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MESSAGING_ANGLES.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "emotion":
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EMOTION_TAGS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return null;
  }
}

interface ConditionRow {
  id: string;
  condition: RuleCondition;
}

export interface RuleBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRule?: AutomationRule;
}

export function RuleBuilder({ open, onOpenChange, existingRule }: RuleBuilderProps) {
  const isEditing = !!existingRule;
  const workflowsEnabled = useReportWorkflowsEnabled();
  const { rollups } = useCreativeData();
  const { data: folderData, isLoading: foldersLoading, isError: foldersError } = useClFolders();
  const folderList = folderData ?? [];

  const [name, setName] = useState("");
  const [rows, setRows] = useState<ConditionRow[]>([]);
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [folderName, setFolderName] = useState<string | undefined>(undefined);
  const [schedule, setSchedule] = useState<RuleSchedule>({});
  const [autoRun, setAutoRun] = useState(true);

  const rowIdRef = useRef(0);
  function nextRowId(): string {
    rowIdRef.current += 1;
    return `row-${rowIdRef.current}`;
  }
  function makeRow(condition: RuleCondition): ConditionRow {
    return { id: nextRowId(), condition };
  }

  // Reset the whole form whenever the dialog opens — either pre-filled from
  // `existingRule` (edit) or to fresh defaults (create). Only runs on open
  // transitions, not on every keystroke.
  useEffect(() => {
    if (!open) return;
    if (existingRule) {
      setName(existingRule.name);
      setRows(existingRule.conditions.map((c) => makeRow(c)));
      const folderAction = existingRule.actions.find(
        (a): a is AddToFolderAction => a.type === "addToFolder",
      );
      setFolderId(folderAction?.folderId);
      setFolderName(folderAction?.folderName);
      setSchedule(existingRule.schedule ?? {});
      // An EXISTING rule's autoRun is honoured exactly as stored, and a
      // missing one reads as false — pre-existing rules predate this field
      // and must not start firing on their own just because the feature
      // shipped (see the MIGRATION HAZARD note in model.ts).
      setAutoRun(existingRule.autoRun === true);
    } else {
      setName("");
      setRows([makeRow(defaultConditionForField("bucket"))]);
      setFolderId(undefined);
      setFolderName(undefined);
      setSchedule({});
      // New rules are the only ones allowed to default to auto-firing.
      setAutoRun(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingRule]);

  // If the pre-filled folder (from an existing rule) no longer exists in the
  // live Creative Library folder list, clear it — same honesty rule the old
  // board-picker applied to deleted boards: force a re-pick rather than
  // silently re-saving a rule that files into nothing, or leaving the Select
  // holding a value that isn't in its own option list (a bare/broken combo).
  // Gated on the folders query having actually settled — while it's still
  // loading there's nothing to check against yet.
  useEffect(() => {
    if (!open || !existingRule || foldersLoading || foldersError) return;
    if (!folderId) return;
    const stillExists = folderList.some((f) => f.id === folderId);
    if (!stillExists) {
      setFolderId(undefined);
      setFolderName(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingRule, foldersLoading, foldersError, folderList]);

  const conditions = useMemo(() => rows.map((r) => r.condition), [rows]);
  const matchCount = useMemo(() => evaluateRule({ conditions }, rollups).length, [conditions, rollups]);

  function addRow() {
    setRows((prev) => [...prev, makeRow(defaultConditionForField("bucket"))]);
  }
  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateField(idx: number, field: ConditionField) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { id: r.id, condition: defaultConditionForField(field) } : r)),
    );
  }
  function updateOperator(idx: number, operator: Operator) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const condition: RuleCondition = { ...r.condition, operator };
        // value2 only means anything for "between" — drop a stale upper bound
        // on the way out so it can't be persisted where nothing reads it.
        if (operator !== "between") delete condition.value2;
        return { ...r, condition };
      }),
    );
  }
  function updateValue(idx: number, value: string | number) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, condition: { ...r.condition, value } } : r)),
    );
  }
  function updateValue2(idx: number, value2: number | undefined) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const condition: RuleCondition = { ...r.condition, value2 };
        if (value2 === undefined) delete condition.value2;
        return { ...r, condition };
      }),
    );
  }

  const incompleteRanges = conditions.filter(isIncompleteRange).length;
  const hasIncompleteRange = incompleteRanges > 0;

  const foldersEmpty = !foldersLoading && !foldersError && folderList.length === 0;
  const folderPickerDisabled = foldersLoading || foldersError || foldersEmpty;
  const folderPickerPlaceholder = foldersLoading
    ? "Loading folders…"
    : foldersError
      ? "Couldn't load folders"
      : foldersEmpty
        ? "No folders yet"
        : "Choose a folder";

  // A folder is the only requirement now — there is nothing else an
  // addToFolder action needs.
  const hasValidAction = !!folderId;
  const canSave = rows.length > 0 && hasValidAction && !hasIncompleteRange;

  function handleSave() {
    if (!canSave || !folderId || !folderName) return;
    const finalActions: RuleAction[] = [{ type: "addToFolder", folderId, folderName }];
    const finalConditions = conditions.map(normaliseCondition);

    if (existingRule) {
      updateRule(existingRule.id, {
        name: name.trim() || existingRule.name,
        conditions: finalConditions,
        actions: finalActions,
        // Only v3 owns these fields. Omitting them on v2 leaves whatever the
        // rule already had untouched, rather than writing back defaults from
        // a form that never showed the user those controls.
        ...(workflowsEnabled ? { schedule, autoRun } : {}),
      });
    } else {
      const id = createRule({
        name,
        type: "categorise",
        conditions: finalConditions,
        actions: finalActions,
        schedule: workflowsEnabled ? schedule : undefined,
      });
      // createRule always stamps autoRun: true (only brand-new rules may).
      // If the user unticked it here, correct it immediately — an autoRun-only
      // patch doesn't clear the runner's edge-trigger marks.
      if (workflowsEnabled && !autoRun) updateRule(id, { autoRun: false });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit rule" : "New rule"}</DialogTitle>
          <DialogDescription>
            {workflowsEnabled
              ? "Rules watch the current dataset — hit Run now on the list to file matches into the folder you pick immediately, or set a date range and let the rule run itself while that window is open."
              : "Rules watch the current dataset — hit Run now on the list to file whatever matches into the folder you pick. Nothing runs on a schedule in this prototype."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="rule-name">Name</Label>
            <Input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fatiguing video ads"
              className="h-9 text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Conditions</Label>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addRow}>
                <Plus className="h-3.5 w-3.5" />
                Add condition
              </Button>
            </div>

            <div className="space-y-2">
              {rows.map((row, idx) => {
                const isRange = row.condition.operator === "between";
                return (
                <div
                  key={row.id}
                  className={cn("flex items-center gap-2", isRange && "flex-wrap")}
                >
                  <Select
                    value={row.condition.field}
                    onValueChange={(v) => updateField(idx, v as ConditionField)}
                  >
                    <SelectTrigger className="h-8 w-[170px] shrink-0 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Attributes</SelectLabel>
                        {ATTRIBUTE_FIELDS.map((f) => (
                          <SelectItem key={f} value={f}>{fieldLabel(f)}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Metrics</SelectLabel>
                        {METRIC_CONDITION_FIELDS.map((f) => (
                          <SelectItem key={f} value={f}>{fieldLabel(f)}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    value={row.condition.operator}
                    onValueChange={(v) => updateOperator(idx, v as Operator)}
                  >
                    <SelectTrigger className="h-8 w-[140px] shrink-0 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorsForField(
                        row.condition.field,
                        workflowsEnabled,
                        row.condition.operator,
                      ).map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* A range needs two inputs plus a separator, which doesn't
                      fit beside the field and operator selects — it takes its
                      own full-width line below them. */}
                  <div className={cn("min-w-0 flex-1", isRange && "order-last basis-full")}>
                    <ConditionValueEditor
                      condition={row.condition}
                      onChange={(v) => updateValue(idx, v)}
                      onChangeValue2={(v) => updateValue2(idx, v)}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                    onClick={() => removeRow(idx)}
                    aria-label="Remove condition"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground">
              All conditions must match (AND) — this engine doesn&apos;t support OR groups.
            </p>
            {conditions.some((c) => c.operator === "between") && (
              <p className="text-[12px] text-muted-foreground">
                Ranges are inclusive — between 2 and 4 includes both ends.
              </p>
            )}
            <p className="flex items-center gap-1 text-xs text-foreground">
              <WhyDot id="automations.rule.match" />
              <span className="font-medium">{matchCount}</span>{" "}
              {matchCount === 1 ? "creative" : "creatives"} currently{" "}
              {matchCount === 1 ? "matches" : "match"} these conditions.
            </p>
            {hasIncompleteRange && (
              <p className="text-[12px] text-destructive">
                {incompleteRanges === 1 ? "A range is" : `${incompleteRanges} ranges are`} missing an
                upper value, so that count isn&apos;t the whole story yet. Fill both ends before
                saving — a range with only a lower value can&apos;t be stored.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>File into folder</Label>
            <Select
              value={folderId ?? ""}
              onValueChange={(v) => {
                const folder = folderList.find((f) => f.id === v);
                setFolderId(v);
                setFolderName(folder?.name ?? "");
              }}
              disabled={folderPickerDisabled}
            >
              <SelectTrigger className="h-8 text-[13px]">
                <SelectValue placeholder={folderPickerPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {folderList.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {foldersError && (
              <p className="text-[11px] text-destructive">
                Couldn&apos;t load Creative Library folders. Try again in a moment.
              </p>
            )}
            {foldersEmpty && (
              <p className="text-[11px] text-muted-foreground">
                No folders yet — create one in Creative Library first.
              </p>
            )}
            {!hasValidAction && !foldersLoading && !foldersError && !foldersEmpty && (
              <p className="text-[11px] text-destructive">
                Pick a folder to file matches into.
              </p>
            )}
          </div>

          {workflowsEnabled && (
            <div className="space-y-2">
              <Label>Schedule</Label>
              <ScheduleEditor value={schedule} onChange={setSchedule} />
              <label className="flex items-center gap-2 text-[13px] text-foreground">
                <Checkbox checked={autoRun} onCheckedChange={(v) => setAutoRun(v === true)} />
                Run automatically when conditions are met
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? "Save changes" : "Create rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

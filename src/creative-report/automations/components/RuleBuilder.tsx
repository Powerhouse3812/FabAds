/**
 * RuleBuilder — create/edit modal for an automation rule (iter-2 P4).
 *
 * One condition-matching form shared by both rule types (Maalik's decision,
 * see model.ts) — the type toggle only swaps which actions are offered.
 * Every value shown while building a rule (the match-count preview) is a
 * live, honest count from the same `evaluateRule` the engine uses to run —
 * never an estimate.
 *
 * Rule `type` can't be changed once a rule exists — `updateRule` in
 * rulesStore.ts deliberately doesn't accept a `type` patch (its valid
 * actions differ per type), so the type toggle is disabled in edit mode
 * rather than pretending a switch is supported.
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
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { evaluateRule } from "@/creative-report/automations/engine";
import { createRule, updateRule } from "@/creative-report/automations/rulesStore";
import { useBoardsStore } from "@/creative-report/automations/boards";
import {
  METRIC_CONDITION_FIELDS,
  RULE_TYPES,
  isMetricField,
  type AddToBoardAction,
  type AutomationRule,
  type ConditionField,
  type Operator,
  type RuleAction,
  type RuleCondition,
  type RuleType,
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

function operatorsForField(field: ConditionField): { value: Operator; label: string }[] {
  if (isMetricField(field)) {
    return [
      { value: "gt", label: "is greater than" },
      { value: "gte", label: "is at least" },
      { value: "lt", label: "is less than" },
      { value: "lte", label: "is at most" },
    ];
  }
  return [
    { value: "eq", label: "is" },
    { value: "neq", label: "is not" },
  ];
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
}: {
  condition: RuleCondition;
  onChange: (value: string | number) => void;
}) {
  const { field, value } = condition;

  if (isMetricField(field)) {
    return (
      <Input
        type="number"
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          const n = Number(raw);
          onChange(raw.trim() === "" || Number.isNaN(n) ? 0 : n);
        }}
        className="h-8 text-[13px]"
      />
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

function ruleTypeLabel(t: RuleType): string {
  return t === "categorise" ? "Categorise" : "Launch";
}

export interface RuleBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRule?: AutomationRule;
}

export function RuleBuilder({ open, onOpenChange, existingRule }: RuleBuilderProps) {
  const isEditing = !!existingRule;
  const { rollups } = useCreativeData();
  const { folders, boards } = useBoardsStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<RuleType>("categorise");
  const [rows, setRows] = useState<ConditionRow[]>([]);
  const [boardId, setBoardId] = useState<string | undefined>(undefined);
  const [pauseChecked, setPauseChecked] = useState(false);
  const [queueChecked, setQueueChecked] = useState(false);

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
      setType(existingRule.type);
      setRows(existingRule.conditions.map((c) => makeRow(c)));
      if (existingRule.type === "categorise") {
        const boardAction = existingRule.actions.find(
          (a): a is AddToBoardAction => a.type === "addToBoard",
        );
        // If the target board was deleted since the rule was saved, don't
        // pre-fill the dead id — leaving it unset forces a re-pick (the
        // "Pick a board" validation below) instead of silently re-saving a
        // rule that files into nothing.
        const boardStillExists = boardAction && boards.some((b) => b.id === boardAction.boardId);
        setBoardId(boardStillExists ? boardAction.boardId : undefined);
        setPauseChecked(false);
        setQueueChecked(false);
      } else {
        setBoardId(undefined);
        setPauseChecked(existingRule.actions.some((a) => a.type === "pause"));
        setQueueChecked(existingRule.actions.some((a) => a.type === "queueInLaunch"));
      }
    } else {
      setName("");
      setType("categorise");
      setRows([makeRow(defaultConditionForField("bucket"))]);
      setBoardId(undefined);
      setPauseChecked(false);
      setQueueChecked(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingRule]);

  const conditions = useMemo(() => rows.map((r) => r.condition), [rows]);
  const matchCount = useMemo(() => evaluateRule({ conditions }, rollups).length, [conditions, rollups]);

  function handleTypeChange(t: RuleType) {
    if (isEditing) return;
    setType(t);
    setBoardId(undefined);
    setPauseChecked(false);
    setQueueChecked(false);
  }

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
      prev.map((r, i) => (i === idx ? { ...r, condition: { ...r.condition, operator } } : r)),
    );
  }
  function updateValue(idx: number, value: string | number) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, condition: { ...r.condition, value } } : r)),
    );
  }

  const hasValidAction = type === "categorise" ? !!boardId : pauseChecked || queueChecked;
  const canSave = rows.length > 0 && hasValidAction;

  function handleSave() {
    if (!canSave) return;
    const finalActions: RuleAction[] =
      type === "categorise"
        ? boardId ? [{ type: "addToBoard", boardId }] : []
        : [
            ...(pauseChecked ? [{ type: "pause" } as const] : []),
            ...(queueChecked ? [{ type: "queueInLaunch" } as const] : []),
          ];

    if (existingRule) {
      updateRule(existingRule.id, {
        name: name.trim() || existingRule.name,
        conditions,
        actions: finalActions,
      });
    } else {
      createRule({ name, type, conditions, actions: finalActions });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit rule" : "New rule"}</DialogTitle>
          <DialogDescription>
            Rules watch the current dataset — hit Run now on the list to file or act on whatever
            matches at that moment. Nothing runs on a schedule in this prototype.
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

          <div className="space-y-1.5">
            <Label>Type</Label>
            <div
              className={cn(
                "inline-flex items-center rounded-md border border-border bg-muted p-0.5",
                isEditing && "opacity-60",
              )}
            >
              {RULE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isEditing}
                  onClick={() => handleTypeChange(t)}
                  className={cn(
                    "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                    type === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                    isEditing && "cursor-not-allowed",
                  )}
                >
                  {ruleTypeLabel(t)}
                </button>
              ))}
            </div>
            {isEditing && (
              <p className="text-[11px] text-muted-foreground">
                Type can&apos;t change after a rule is created — delete and recreate to switch.
              </p>
            )}
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
              {rows.map((row, idx) => (
                <div key={row.id} className="flex items-center gap-2">
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
                      {operatorsForField(row.condition.field).map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="min-w-0 flex-1">
                    <ConditionValueEditor
                      condition={row.condition}
                      onChange={(v) => updateValue(idx, v)}
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
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">
              All conditions must match (AND) — this engine doesn&apos;t support OR groups.
            </p>
            <p className="text-xs text-foreground">
              <span className="font-medium">{matchCount}</span>{" "}
              {matchCount === 1 ? "creative" : "creatives"} currently{" "}
              {matchCount === 1 ? "matches" : "match"} these conditions.
            </p>
          </div>

          <div className="space-y-2">
            <Label>{type === "categorise" ? "File into board" : "Actions"}</Label>
            {type === "categorise" ? (
              <Select value={boardId ?? ""} onValueChange={setBoardId} disabled={boards.length === 0}>
                <SelectTrigger className="h-8 text-[13px]">
                  <SelectValue placeholder={boards.length === 0 ? "No boards yet" : "Choose a board"} />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => {
                    const folderBoards = boards.filter((b) => b.folderId === folder.id);
                    if (folderBoards.length === 0) return null;
                    return (
                      <SelectGroup key={folder.id}>
                        <SelectLabel>{folder.name}</SelectLabel>
                        {folderBoards.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[13px] text-foreground">
                  <Checkbox
                    checked={pauseChecked}
                    onCheckedChange={(v) => setPauseChecked(v === true)}
                  />
                  Pause matching creatives
                </label>
                <label className="flex items-center gap-2 text-[13px] text-foreground">
                  <Checkbox
                    checked={queueChecked}
                    onCheckedChange={(v) => setQueueChecked(v === true)}
                  />
                  Queue matching creatives for relaunch
                </label>
              </div>
            )}
            {!hasValidAction && (
              <p className="text-[11px] text-destructive">
                {type === "categorise"
                  ? "Pick a board to file matches into."
                  : "Choose at least one action."}
              </p>
            )}
          </div>
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

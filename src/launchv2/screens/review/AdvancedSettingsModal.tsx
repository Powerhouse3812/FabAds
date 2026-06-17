/**
 * AdvancedSettingsModal — opens from the edit pane's per-section "Advanced"
 * action. Renders `advancedFields(level, plan)` grouped by section (section
 * order/labels from SETTINGS_REGISTRY[level].sections). Reuses FieldRenderer +
 * the same inherit / override / reset behavior as the inline edit pane.
 *
 * Esc + backdrop close (shadcn Dialog defaults), one primary "Done" action.
 */
import { RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanV2 } from "../../types";
import type { NodeKind } from "./reviewModel";
import {
  SETTINGS_REGISTRY,
  advancedFields,
  planDefaultFor,
  type SettingField,
} from "../../settingsRegistry";
import { isOverridden, resolveNodeValue } from "../../nodeOverrides";
import { FieldRenderer } from "./FieldRenderer";

export function AdvancedSettingsModal({
  open,
  onOpenChange,
  level,
  nodeId,
  plan,
  currency,
  onField,
  onReset,
  onOpenCrop,
  /** Limit to a single section (the action that opened the modal). */
  section,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: NodeKind;
  nodeId: string;
  plan: PlanV2;
  currency: string;
  onField: (field: SettingField, value: unknown) => void;
  onReset: (field: SettingField) => void;
  onOpenCrop: (field: SettingField) => void;
  section?: string;
}) {
  const reg = SETTINGS_REGISTRY[level];
  const all = advancedFields(level, plan);
  const fields = section ? all.filter((f) => f.section === section) : all;

  // Group by section, in registry order.
  const grouped = reg.sections
    .map((s) => ({ section: s, fields: fields.filter((f) => f.section === s.id) }))
    .filter((g) => g.fields.length > 0);

  const sectionLabel = section
    ? reg.sections.find((s) => s.id === section)?.label
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {sectionLabel ? `${sectionLabel} — advanced` : "Advanced settings"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {grouped.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No advanced settings for this section.
            </p>
          )}
          {grouped.map((g) => (
            <div key={g.section.id} className="space-y-3">
              {!section && (
                <h4 className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground/70">
                  {g.section.label}
                </h4>
              )}
              {g.fields.map((field) => (
                <AdvancedField
                  key={field.id}
                  field={field}
                  plan={plan}
                  nodeId={nodeId}
                  currency={currency}
                  onChange={(v) => onField(field, v)}
                  onReset={() => onReset(field)}
                  onOpenCrop={() => onOpenCrop(field)}
                />
              ))}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="h-9">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdvancedField({
  field,
  plan,
  nodeId,
  currency,
  onChange,
  onReset,
  onOpenCrop,
}: {
  field: SettingField;
  plan: PlanV2;
  nodeId: string;
  currency: string;
  onChange: (v: unknown) => void;
  onReset: () => void;
  onOpenCrop: () => void;
}) {
  const overridden = isOverridden(plan, nodeId, field.id);
  const value = resolveNodeValue(plan, nodeId, field.id, planDefaultFor(plan, field));

  return (
    <div
      className={cn(
        "space-y-1.5 pl-2.5",
        overridden ? "border-l-2 border-primary" : "border-l-2 border-transparent",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <label
          className={cn(
            "text-[12px]",
            overridden ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
          )}
        >
          {field.label}
        </label>
        {overridden && (
          <button
            type="button"
            onClick={onReset}
            className="fab-focus inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>
      <FieldRenderer
        field={field}
        value={value}
        currency={currency}
        onChange={onChange}
        onOpenCrop={onOpenCrop}
      />
      {field.help && <p className="text-[10px] text-muted-foreground/70">{field.help}</p>}
    </div>
  );
}

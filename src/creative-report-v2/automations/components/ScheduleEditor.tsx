/**
 * ScheduleEditor — deliberately minimal per Maalik's call: an on/off toggle
 * (already exists elsewhere, not this component's job) plus a start/end
 * DATE range. No hours-of-day, no days-of-week, no invert flag — don't add
 * them here; `src/workflows/core/schedule.ts` documents the same
 * narrow-shape rule for `WorkflowSchedule`/`RuleSchedule`.
 *
 * Honesty requirement: if a schedule is set and "now" falls outside it, this
 * shows the machine-generated `reason` ("Starts 4 Aug" / "Ended 12 Jul") so
 * an enabled rule never *looks* like it's acting when it isn't — the same
 * principle `BoardsPanel.tsx` applies to disabled smart boards (see its
 * ruleDisabled copy). A start date after the end date is called out inline
 * rather than silently accepted as a window that can never open.
 */
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describeSchedule, scheduleState } from "@/workflows/core";
import type { RuleSchedule } from "@/creative-report-v2/automations/model";

interface ScheduleEditorProps {
  value: RuleSchedule;
  onChange: (s: RuleSchedule) => void;
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="h-8 text-[13px]"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-muted-foreground disabled:opacity-40"
          aria-label={`Clear ${label.toLowerCase()}`}
          disabled={!value}
          onClick={() => onChange(undefined)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const invalidRange = !!(value.startDate && value.endDate && value.endDate < value.startDate);
  const state = invalidRange ? undefined : scheduleState(value, new Date());

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <DateField
          label="Start date"
          value={value.startDate}
          onChange={(startDate) => onChange({ ...value, startDate })}
        />
        <DateField
          label="End date"
          value={value.endDate}
          onChange={(endDate) => onChange({ ...value, endDate })}
        />
      </div>

      <p className="text-[12px] text-muted-foreground">{describeSchedule(value)}</p>

      {invalidRange ? (
        <p className="text-[12px] text-destructive">
          End date is before the start date — this window can never open. Fix one of the dates.
        </p>
      ) : (
        state && !state.active && state.reason && (
          <p className="text-[12px] text-muted-foreground">
            {state.reason} — inactive even if the toggle is on.
          </p>
        )
      )}
    </div>
  );
}

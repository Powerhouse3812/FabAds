import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { WriteActionDef, WriteActionRisk } from "@/connector/model";

/**
 * WriteActionRow — one named write action: label, consequence chips, honest
 * one-line description, its toggle, and the dependency block note.
 *
 * WHY THE SWITCH IS NOT `disabled` WHEN THE ACTION IS BLOCKED
 * This is the load-bearing decision in this file. When an action's
 * prerequisites are unmet, the obvious move is to grey the toggle out. That is
 * wrong on both counts that matter:
 *   1. A `disabled` control is SKIPPED by screen-reader form navigation (the
 *      NVDA/JAWS "next form field" key passes straight over it). The user never
 *      learns the action exists, let alone why it is unavailable.
 *   2. A disabled control explains nothing to anyone. It states a refusal with
 *      no reason and no route forward.
 * So a blocked toggle stays fully focusable and clickable — clicking it is
 * precisely HOW the user gets the explanation. The parent refuses the toggle,
 * hands back a `blockNote`, and the note names every consequence and offers to
 * do the whole grant at once. `disabled` is reserved for `readOnly` (revoked
 * connection), where the entire page is genuinely inert and there is nothing
 * to explain per-row.
 *
 * WHY THE NOTE IS INLINE, role="alert", AND UNTRUNCATED
 * The explanation is anchored to its cause: it renders directly beneath THIS
 * row — never a toast (dismisses itself before it is read, and detaches from
 * the control that caused it) and never a modal (blocks the very matrix the
 * user needs to see to judge the consequence). `role="alert"` makes the
 * refusal announced rather than silent, which is the whole point of not using
 * `disabled`. Every line of `summary` is rendered: this is a permission grant,
 * so the user must see EVERY consequence before committing. A "+2 more" would
 * turn an informed grant back into a silent one.
 *
 * WHY THE AMBER FILL IS COMPOSED FROM A TOKEN
 * `--warning-text` is redefined per theme (light `34 100% 26%`, dark
 * `38 83% 46%`). The tinted fill and border are NOT separate tokens, so they
 * are composed as low-alpha derivations of that token (`bg-warning-text/10`,
 * `border-warning-text/30`). A literal pastel hex would look correct in light
 * mode and turn into a glowing smear in dark mode.
 */

interface WriteActionRowProps {
  action: WriteActionDef;
  checked: boolean;
  /** Parent decides whether the toggle is allowed — this only reports intent. */
  onToggle: () => void;
  /** Present ONLY when the parent refused the toggle. */
  blockNote?: {
    /** Every consequence, one per line. Rendered in full, never truncated. */
    summary: string[];
    confirmLabel: string;
    onConfirm: () => void;
    onDismiss: () => void;
  } | null;
  /** Revoked connection — the whole page is inert. */
  readOnly?: boolean;
  className?: string;
}

/** Exactly three chip kinds. `standard` renders nothing — see model.ts. */
const RISK_LABELS: Record<WriteActionRisk, string | null> = {
  standard: null,
  changes_live_ads: "Changes live ads",
  spends_budget: "Spends budget",
  uses_credits: "Uses credits",
};

export function WriteActionRow({
  action,
  checked,
  onToggle,
  blockNote,
  readOnly = false,
  className,
}: WriteActionRowProps) {
  const reactId = React.useId();
  const descriptionId = `write-action-desc-${reactId}`;
  const noteId = `write-action-note-${reactId}`;

  const isBlocked = Boolean(blockNote);
  // While blocked the switch must not appear to have moved — and "did not move"
  // means "still shows the persisted grant", in BOTH directions. `checked` is
  // always the stored value (the parent never applies optimistically), so
  // rendering it verbatim is the whole fix: a refused turn-ON stays off because
  // it was never granted, and a refused turn-OFF stays ON because it was never
  // revoked. Forcing `false` here would be right only for the turn-ON case and
  // would make a refused turn-OFF render as off while the grant is still live —
  // a switch that lies about what the agent is allowed to do.
  const visualChecked = checked;

  const chips = action.risk
    .map((risk) => RISK_LABELS[risk])
    .filter((label): label is string => Boolean(label));

  return (
    <div className={cn("py-3", className)}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        {/* basis-full below sm forces the switch onto its own line:
            name + chips, then description, then switch. */}
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-foreground">{action.label}</span>
            {chips.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-medium leading-4"
              >
                {label}
              </Badge>
            ))}
          </div>
          <p id={descriptionId} className="mt-1 text-xs text-muted-foreground">
            {action.description}
          </p>
        </div>

        <div className="flex w-full shrink-0 justify-start sm:w-auto sm:justify-end sm:pt-0.5">
          <Switch
            checked={visualChecked}
            onCheckedChange={() => onToggle()}
            aria-label={action.label}
            aria-describedby={isBlocked ? `${descriptionId} ${noteId}` : descriptionId}
            // NOT disabled when merely blocked — clicking is how the user gets
            // the explanation. Only a revoked connection disables it.
            disabled={readOnly}
          />
        </div>
      </div>

      {blockNote ? (
        <div
          id={noteId}
          role="alert"
          className={cn(
            "mt-2 rounded-md border border-warning-text/30 bg-warning-text/10 p-3",
            "text-xs text-warning-text",
          )}
        >
          <ul className="space-y-1">
            {blockNote.summary.map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={blockNote.onConfirm} disabled={readOnly}>
              {blockNote.confirmLabel}
            </Button>
            <Button size="sm" variant="ghost" onClick={blockNote.onDismiss} disabled={readOnly}>
              Not now
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

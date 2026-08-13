/**
 * LimitRow — one meter's worth of the "Limits" card on a connector connection.
 *
 * WHY "NO LIMIT" IS A TWO-SEGMENT CHOICE, NEVER AN EMPTY FIELD
 * An empty number input on a cap control is genuinely ambiguous: does blank
 * mean "unset, please fill this in" or "unbounded, let it run"? On the
 * riskiest control in the whole connector feature — the thing standing
 * between an autonomous agent and unlimited spend — that ambiguity is not
 * acceptable. So `rule.enabled` is rendered as an explicit two-segment
 * control, "Limit to" vs "No limit", and picking "No limit" disables the
 * number input WITHOUT zeroing `rule.max`. Flipping back to "Limit to" must
 * restore exactly what the user typed before, so `max` is preserved in state
 * across the toggle rather than cleared.
 *
 * WHY `budget_change` IS VALUE-BASED, NOT A FREQUENCY COUNT
 * The other three meters (`launches`, `live_changes`, `creations`) burn no
 * money by themselves, so a plain count is the only lever available and the
 * only one that matters. Budget changes are different: a pure frequency cap
 * ("6 changes per day") caps how often an agent can act, but says nothing
 * about how much each action moves. Six approved changes are enough for an
 * agent to walk a $100/day adset up to $100,000/day — fully "compliant" with
 * a 6/day rule the entire way. That is why `budget_change` is metered in
 * dollars (`rule.max`) AND carries a second, meter-specific control —
 * `rule.maxSinglePct` — capping how large any ONE change is allowed to be as
 * a percentage of the adset's current budget. Without that second control,
 * the value cap alone still permits one enormous single jump; without the
 * value cap, the per-change percentage alone still permits unlimited changes
 * per window. Both are required, which is why this is the only meter with
 * two rows of controls instead of one.
 *
 * WHY REFUSALS GET THEIR OWN LINE
 * `MeterUsage.blocked` (surfaced here via the optional `blockedCount` prop)
 * counts refusals on this meter in the current window — it is the only
 * signal that distinguishes "this cap has never mattered" from "this cap
 * just stopped the agent." Rendered as "Refused once/N times this
 * {windowLabel}." beneath the used/max/resets line, colored error when the
 * meter is presently `blocked` and warning when it has refused before but
 * has since rolled under its cap. Silent (no element at all) when there is
 * nothing to report.
 */
import * as React from "react";
import { formatDistanceToNowStrict, format } from "date-fns";

import type { LimitMeterId, LimitRule, LimitStatus } from "@/connector/model";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface LimitRowProps {
  meter: LimitMeterId;
  /** "Budget it can change" */
  label: string;
  /** "Total of all increases it makes." */
  description: string;
  unit: "currency" | "count";
  rule: LimitRule;
  /** Computed by the caller. */
  status: LimitStatus;
  /** "day" | "week" | "month" — for copy. */
  windowLabel: string;
  onChange: (patch: Partial<LimitRule>) => void;
  readOnly?: boolean;
  /** True when at least one granted write action feeds this meter. Drives
   *  the "no limit" nudge — we only nag when it actually matters. */
  actionsGranted: boolean;
  /** Refusals on this meter inside the current window. Comes from
   *  `MeterUsage.blocked`. Optional so existing call sites keep compiling. */
  blockedCount?: number;
}

/** Formats a number for display inside the max-value input, currency-aware. */
function formatMaxForInput(max: number, unit: "currency" | "count"): string {
  if (!Number.isFinite(max) || max <= 0) return "";
  return unit === "currency" ? String(max) : String(Math.round(max));
}

/** Parses raw input text into a clamped, non-negative number, or null when the
 *  text is not a valid number at all (rejected — previous value is kept). */
function parseMax(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (cleaned === "") return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, n);
}

function meterStateClasses(state: LimitStatus["state"]): { text: string; fill: string } {
  switch (state) {
    case "near":
      return { text: "text-warning-text", fill: "bg-warning-text/60" };
    case "blocked":
      return { text: "text-error-text", fill: "bg-error-text/70" };
    case "off":
      return { text: "text-muted-foreground", fill: "bg-muted-foreground/30" };
    case "ok":
    default:
      return { text: "text-muted-foreground", fill: "bg-muted-foreground/40" };
  }
}

function formatAmount(n: number, unit: "currency" | "count"): string {
  return unit === "currency" ? `$${Math.round(n).toLocaleString()}` : `${Math.round(n).toLocaleString()}`;
}

/** "Refused once this week." / "Refused 3 times this week." Null when there
 *  is nothing to report — callers must not render anything in that case. */
function formatBlockedLine(blockedCount: number | undefined, windowLabel: string): string | null {
  if (!blockedCount || blockedCount <= 0) return null;
  return blockedCount === 1
    ? `Refused once this ${windowLabel}.`
    : `Refused ${blockedCount} times this ${windowLabel}.`;
}

export const LimitRow: React.FC<LimitRowProps> = ({
  meter,
  label,
  description,
  unit,
  rule,
  status,
  windowLabel,
  onChange,
  readOnly = false,
  actionsGranted,
  blockedCount,
}) => {
  const [maxText, setMaxText] = React.useState(() => formatMaxForInput(rule.max, unit));
  const [pctText, setPctText] = React.useState(() =>
    rule.maxSinglePct && rule.maxSinglePct > 0 ? String(Math.round(rule.maxSinglePct)) : "",
  );

  // Keep local text in sync when the rule changes from outside (e.g. reset,
  // another tab, a different row's cross-effect) without fighting in-flight
  // typing — only resync when not focused would be ideal, but for a
  // controlled-on-blur field it's safe to resync on every external value
  // change since we never overwrite while the user is actively typing this
  // exact field between keystrokes (we only push up on blur/Enter).
  React.useEffect(() => {
    setMaxText(formatMaxForInput(rule.max, unit));
  }, [rule.max, unit]);

  React.useEffect(() => {
    setPctText(rule.maxSinglePct && rule.maxSinglePct > 0 ? String(Math.round(rule.maxSinglePct)) : "");
  }, [rule.maxSinglePct]);

  const commitMax = () => {
    const parsed = parseMax(maxText);
    if (parsed === null) {
      // Reject non-numeric input — restore the last known-good value.
      setMaxText(formatMaxForInput(rule.max, unit));
      return;
    }
    setMaxText(formatMaxForInput(parsed, unit));
    onChange({ max: parsed });
  };

  const commitPct = () => {
    const parsed = parseMax(pctText);
    if (parsed === null) {
      setPctText(rule.maxSinglePct && rule.maxSinglePct > 0 ? String(Math.round(rule.maxSinglePct)) : "");
      return;
    }
    const clamped = Math.min(100, parsed);
    setPctText(clamped > 0 ? String(clamped) : "");
    onChange({ maxSinglePct: clamped });
  };

  const handleEnabledChange = (value: string) => {
    if (readOnly || !value) return;
    onChange({ enabled: value === "limit" });
  };

  const resetsAt = new Date(status.resetsAt);
  const resetsAbsolute = format(resetsAt, "PPpp");
  const resetsRelative = formatDistanceToNowStrict(resetsAt, { addSuffix: false });
  const resetLabel = `resets in ${resetsRelative}`;

  const { text: meterTextClass, fill: meterFillClass } = meterStateClasses(status.state);

  const usedLabel =
    rule.enabled === false
      ? `${formatAmount(status.used, unit)} used · no limit set`
      : unit === "currency"
        ? `${formatAmount(status.used, unit)} of ${formatAmount(status.max, unit)} used · ${resetLabel}`
        : `${Math.round(status.used).toLocaleString()} of ${Math.round(status.max).toLocaleString()} used · ${resetLabel}`;

  const blockedLine = formatBlockedLine(blockedCount, windowLabel);
  const ariaLabel = blockedLine ? `${label}: ${usedLabel} — ${blockedLine}` : `${label}: ${usedLabel}`;
  const pct = rule.enabled === false ? 0 : Math.min(100, Math.max(0, status.pct));

  const showNudge = rule.enabled === false && actionsGranted;
  const nudgeText =
    meter === "budget_change"
      ? "No limit means this connection can change budgets by any amount. Most teams cap this."
      : "No limit means there's no ceiling on this.";

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={rule.enabled ? "limit" : "no-limit"}
              onValueChange={handleEnabledChange}
              disabled={readOnly}
              className="justify-start gap-0 rounded-md border border-input p-0.5"
              aria-label={`${label} limit mode`}
            >
              <ToggleGroupItem
                value="limit"
                size="sm"
                className="h-7 rounded-sm px-2 text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
              >
                Limit to
              </ToggleGroupItem>
              <ToggleGroupItem
                value="no-limit"
                size="sm"
                className="h-7 rounded-sm px-2 text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
              >
                No limit
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="relative w-28">
              {unit === "currency" && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm",
                    rule.enabled ? "text-muted-foreground" : "text-muted-foreground/50",
                  )}
                >
                  $
                </span>
              )}
              <Input
                type="text"
                inputMode="decimal"
                value={maxText}
                disabled={readOnly || !rule.enabled}
                onChange={(e) => setMaxText(e.target.value)}
                onBlur={commitMax}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                aria-label={`${label} maximum ${unit === "currency" ? "amount" : "count"} per ${windowLabel}`}
                className={cn("h-8 text-sm", unit === "currency" && "pl-6")}
              />
            </div>

            <span className="text-xs text-muted-foreground">per {windowLabel}</span>
          </div>
        </div>
      </div>

      {meter === "budget_change" && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>No single change larger than</span>
          <Input
            type="text"
            inputMode="decimal"
            value={pctText}
            disabled={readOnly}
            onChange={(e) => setPctText(e.target.value)}
            onBlur={commitPct}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            aria-label="Maximum single change as a percentage of the current budget"
            className="h-7 w-16 text-center text-sm"
          />
          <span>% of the current budget</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div
          role="progressbar"
          aria-valuenow={Math.round(status.used)}
          aria-valuemin={0}
          aria-valuemax={Math.round(status.max) || 0}
          aria-label={ariaLabel}
          title={`Resets at ${resetsAbsolute}`}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn("h-full rounded-full transition-all", meterFillClass)}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={cn("text-xs", meterTextClass)}
            title={`Resets at ${resetsAbsolute}`}
          >
            <span aria-hidden="true">{usedLabel}</span>
            <span className="sr-only">
              {`${usedLabel} — resets exactly at ${resetsAbsolute}${blockedLine ? ` — ${blockedLine}` : ""}`}
            </span>
          </span>

          {status.state === "blocked" && (
            <span className="inline-flex items-center rounded-full border border-error-text/30 bg-error-text/10 px-2 py-0.5 text-[11px] font-medium text-error-text">
              Limit reached
            </span>
          )}
        </div>

        {blockedLine && (
          <p
            aria-hidden="true"
            className={cn("text-xs", status.state === "blocked" ? "text-error-text" : "text-warning-text")}
          >
            {blockedLine}
          </p>
        )}
      </div>

      {showNudge && <p className="text-xs text-warning-text">{nudgeText}</p>}
    </div>
  );
};

import { useState, type ReactNode } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { ALL, PERIOD_OPTIONS, type PeriodKey, type Scope } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Hint } from "./Hint";
import { TruncatedText } from "./TruncatedText";
import { fmtInt } from "./format";

export interface ScopeOption {
  id: string;
  label: string;
  /** Ads in the current scope for this option. 0 → visible but disabled. */
  count: number;
}

export interface ScopeBarProps {
  scope: Scope;
  onChange: (next: Scope) => void;
  industries: ScopeOption[];
  /** Global A–Z list; the same options in every industry (0-count disabled). */
  categories: ScopeOption[];
  /** Total ads in scope — shown on "All industries" / "All categories". */
  totalCount: number;
  /** Optional per-period counts. When given, periods show counts and 0 is disabled. */
  periodCounts?: Partial<Record<PeriodKey, number>>;
  compact?: boolean;
  rightSlot?: ReactNode;
  /** Discover only. Renders the "My preferences only" switch (off by default, owned by the page). */
  myPrefsToggle?: { checked: boolean; onChange: (checked: boolean) => void; count?: number };
  className?: string;
}

interface PickerOption {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

function Picker({
  caption,
  value,
  valueLabel,
  valueCount,
  isDefault,
  options,
  onPick,
  searchPlaceholder,
  compact,
  width = 280,
}: {
  caption: string;
  value: string;
  valueLabel: string;
  valueCount?: number;
  isDefault: boolean;
  options: PickerOption[];
  onPick: (id: string) => void;
  searchPlaceholder?: string;
  compact?: boolean;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${caption}: ${valueLabel}. Change ${caption.toLowerCase()}`}
          className={cn(
            "group inline-flex min-w-0 max-w-full items-center gap-2 rounded-md px-2.5 text-left transition-colors",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            compact ? "h-8" : "h-10",
            !isDefault && "bg-primary/10",
          )}
        >
          <span className="flex min-w-0 flex-col justify-center leading-tight">
            {!compact && <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{caption}</span>}
            <span className={cn("max-w-[200px] truncate text-sm font-medium", isDefault ? "text-foreground" : "text-primary-text")}>
              {valueLabel}
            </span>
          </span>
          {typeof valueCount === "number" && (
            <span className="shrink-0 rounded-full bg-primary/15 px-1.5 font-mono text-[11px] leading-5 tabular-nums text-primary-text">
              {fmtInt(valueCount)}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0" style={{ width }}>
        <Command
          // Substring match (cmdk's default is fuzzy, which surfaces unrelated categories).
          filter={(value, search, keywords) =>
            `${value} ${(keywords ?? []).join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
          }
        >
          {searchPlaceholder ? (
            <CommandInput placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
          ) : (
            // No visible search, but cmdk needs a focused input for arrow-key navigation.
            <CommandPrimitive.Input aria-label={`${caption} options`} className="sr-only" />
          )}
          <CommandList className="max-h-[320px]">
            <CommandEmpty>No match.</CommandEmpty>
            {options.map((o) => {
              const selected = o.id === value;
              const disabled = !!o.disabled && !selected;
              const item = (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  keywords={[o.label]}
                  disabled={disabled}
                  onSelect={() => {
                    onPick(o.id);
                    setOpen(false);
                  }}
                  className="gap-2 text-sm data-[disabled=true]:pointer-events-auto data-[disabled=true]:cursor-not-allowed"
                >
                  <Check className={cn("h-3.5 w-3.5 shrink-0 text-primary-text", selected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  <TruncatedText text={o.label} className="flex-1" focusable={false} />
                  {typeof o.count === "number" && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 font-mono text-[11px] leading-5 tabular-nums",
                        disabled ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary-text",
                      )}
                    >
                      {fmtInt(o.count)}
                    </span>
                  )}
                  {disabled && <span className="sr-only">No ads in this scope</span>}
                </CommandItem>
              );
              return disabled ? (
                <Hint key={o.id} content="No ads in this scope" side="right">
                  <div>{item}</div>
                </Hint>
              ) : (
                item
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Industry › Category › Period as three connected pickers (breadcrumb, not a form).
 * No tabs for industry/category, ever. Counts everywhere; 0-count = disabled with a tooltip.
 */
export function ScopeBar({
  scope,
  onChange,
  industries,
  categories,
  totalCount,
  periodCounts,
  compact,
  rightSlot,
  myPrefsToggle,
  className,
}: ScopeBarProps) {
  const ind = industries.find((i) => i.id === scope.industry);
  const cat = categories.find((c) => c.id === scope.category);
  const period = PERIOD_OPTIONS.find((p) => p.key === scope.period) ?? PERIOD_OPTIONS[PERIOD_OPTIONS.length - 1];

  const indOptions: PickerOption[] = [
    { id: ALL, label: "All industries", count: totalCount },
    ...industries.map((i) => ({ id: i.id, label: i.label, count: i.count, disabled: i.count === 0 })),
  ];
  const catOptions: PickerOption[] = [
    { id: ALL, label: "All categories", count: totalCount },
    ...categories.map((c) => ({ id: c.id, label: c.label, count: c.count, disabled: c.count === 0 })),
  ];
  const periodOptions: PickerOption[] = PERIOD_OPTIONS.map((p) => {
    const c = periodCounts?.[p.key];
    return { id: p.key, label: p.label, count: c, disabled: c === 0 };
  });

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <nav
        aria-label="Scope: industry, category, period"
        className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-sm"
      >
        <Picker
          caption="Industry"
          value={scope.industry}
          valueLabel={scope.industry === ALL ? "All industries" : ind?.label ?? scope.industry}
          valueCount={scope.industry === ALL ? totalCount : ind?.count}
          isDefault={scope.industry === ALL}
          options={indOptions}
          onPick={(id) => onChange({ ...scope, industry: id })}
          compact={compact}
        />
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Picker
          caption="Category"
          value={scope.category}
          valueLabel={scope.category === ALL ? "All categories" : cat?.label ?? scope.category}
          valueCount={scope.category === ALL ? totalCount : cat?.count}
          isDefault={scope.category === ALL}
          options={catOptions}
          onPick={(id) => onChange({ ...scope, category: id })}
          searchPlaceholder="Search categories…"
          compact={compact}
          width={300}
        />
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Picker
          caption="Period"
          value={scope.period}
          valueLabel={period.label}
          valueCount={periodCounts?.[scope.period]}
          isDefault={scope.period === "all"}
          options={periodOptions}
          onPick={(id) => onChange({ ...scope, period: id as PeriodKey })}
          compact={compact}
          width={220}
        />
      </nav>

      {myPrefsToggle && (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <Switch
            checked={myPrefsToggle.checked}
            onCheckedChange={myPrefsToggle.onChange}
            aria-label="My preferences only"
            className="h-5 w-9 [&>span]:h-4 [&>span]:w-4 data-[state=checked]:[&>span]:translate-x-4"
          />
          <span>My preferences only</span>
          {typeof myPrefsToggle.count === "number" && (
            <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[11px] leading-5 tabular-nums text-primary-text">
              {fmtInt(myPrefsToggle.count)}
            </span>
          )}
        </label>
      )}
      {rightSlot && <div className="ml-auto flex items-center gap-2">{rightSlot}</div>}
    </div>
  );
}

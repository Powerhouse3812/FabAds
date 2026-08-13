import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type {
  EntityLevel,
  EntityStatus,
  LaunchFilterOption,
  LaunchFilterOptions,
  Platform,
} from "@/lib/reports-dummy-data";

// ── Mobile Reports filters ────────────────────────────────────────────
// Bottom sheet covering the same filter surface as ReportsToolbar's chips +
// launch-provenance dropdowns, adapted for touch:
//  - Status / Platform stay as multi-select toggle chips (same shape as the
//    toolbar's `toggleChip`).
//  - The 5 launch-provenance controls (Ads level only) are single/multi
//    selects that live BEHIND desktop <Select> dropdowns today. On a phone,
//    a dropdown-inside-a-bottom-sheet is a nested-overlay trap (can't see
//    both layers, back-gesture ambiguity), so they render as accordion rows
//    that expand INLINE in the same sheet instead — never a second overlay.
//
// Deliberately NOT included:
//  - Group-by: needs nested disclosure (primary + secondary) plus aggregate
//    metric columns to be legible, and the card list mobile gets doesn't
//    have columns to aggregate into. Skipping it also means mobile never
//    sums metrics across grouped rows, so every card's currency values stay
//    a real per-row number instead of a silently-summed total.
//  - Column settings: there are no columns to configure on a card list.

// Sentinel for "no filter" in the single-select provenance rows — mirrors the
// sentinel ReportsToolbar's Radix <Select> controls use (Radix forbids an
// empty-string value) so a parent can drive both surfaces from one filter
// state shape.
export const MOBILE_FILTER_ALL = "__all__";

const ALL_STATUSES: EntityStatus[] = ["Active", "Paused", "Archived"];
const ALL_PLATFORMS: Platform[] = ["Meta", "Google", "TikTok"];

function toggleChip<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export interface MobileFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gates the launch-provenance rows — those only ever apply at the "ad" level. */
  level: EntityLevel;

  statuses: EntityStatus[];
  onStatusesChange: (v: EntityStatus[]) => void;
  platforms: Platform[];
  onPlatformsChange: (v: Platform[]) => void;

  // ── Launch-provenance filters (Ads level only) ─────────────────────
  // Mirrors ReportsToolbar's launch* prop shapes 1:1 so a parent can drive
  // the desktop toolbar and this sheet from the same state.
  launchFilters?: LaunchFilterOptions;
  launchStrategies?: string[];
  onLaunchStrategiesChange?: (v: string[]) => void;
  launchBatchId?: string;
  onLaunchBatchIdChange?: (v: string) => void;
  destinationFbPageId?: string;
  onDestinationFbPageIdChange?: (v: string) => void;
  destinationAdAccountName?: string;
  onDestinationAdAccountNameChange?: (v: string) => void;
  sourceAdName?: string;
  onSourceAdNameChange?: (v: string) => void;

  onClearAll: () => void;
}

/**
 * Pure helper so a parent's trigger button (e.g. `Filters (3)`) can show a
 * badge count without duplicating this sheet's counting logic. Takes the
 * same filter-value props this component receives.
 */
export function getMobileFiltersActiveCount(filters: {
  statuses: EntityStatus[];
  platforms: Platform[];
  launchStrategies?: string[];
  launchBatchId?: string;
  destinationFbPageId?: string;
  destinationAdAccountName?: string;
  sourceAdName?: string;
}): number {
  let count = filters.statuses.length + filters.platforms.length;
  count += filters.launchStrategies?.length ?? 0;
  if (filters.launchBatchId && filters.launchBatchId !== MOBILE_FILTER_ALL) count += 1;
  if (filters.destinationFbPageId && filters.destinationFbPageId !== MOBILE_FILTER_ALL) count += 1;
  if (filters.destinationAdAccountName && filters.destinationAdAccountName !== MOBILE_FILTER_ALL) count += 1;
  if (filters.sourceAdName && filters.sourceAdName !== MOBILE_FILTER_ALL) count += 1;
  return count;
}

interface ChipGroupProps<T extends string> {
  legend: string;
  options: T[];
  selected: T[];
  onChange: (v: T[]) => void;
}

function ChipGroup<T extends string>({ legend, options, selected, onChange }: ChipGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isOn = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={isOn}
              onClick={() => onChange(toggleChip(selected, opt))}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm transition-colors",
                isOn
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

interface ProvenanceRowProps {
  itemValue: string;
  label: string;
  allLabel: string;
  options: LaunchFilterOption[];
  selectedValue: string;
  onSelectedValueChange?: (v: string) => void;
}

function ProvenanceRadioRow({
  itemValue,
  label,
  allLabel,
  options,
  selectedValue,
  onSelectedValueChange,
}: ProvenanceRowProps) {
  const isFiltered = selectedValue !== MOBILE_FILTER_ALL;
  return (
    <AccordionItem value={itemValue} className="border-b border-border px-3 last:border-b-0">
      <AccordionTrigger className="py-3 text-sm hover:no-underline">
        <span className="flex items-center gap-2">
          {label}
          {isFiltered && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              1
            </Badge>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <RadioGroup value={selectedValue} onValueChange={onSelectedValueChange} className="gap-0.5 pb-2">
          <div className="flex min-h-11 items-center gap-3 rounded-md px-1">
            <RadioGroupItem value={MOBILE_FILTER_ALL} id={`${itemValue}-all`} />
            <Label htmlFor={`${itemValue}-all`} className="flex-1 cursor-pointer font-normal">
              {allLabel}
            </Label>
          </div>
          {options.map((o) => (
            <div key={o.value} className="flex min-h-11 items-center gap-3 rounded-md px-1">
              <RadioGroupItem value={o.value} id={`${itemValue}-${o.value}`} />
              <Label htmlFor={`${itemValue}-${o.value}`} className="flex-1 cursor-pointer font-normal">
                {o.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </AccordionContent>
    </AccordionItem>
  );
}

export function MobileFiltersSheet({
  open,
  onOpenChange,
  level,
  statuses,
  onStatusesChange,
  platforms,
  onPlatformsChange,
  launchFilters,
  launchStrategies = [],
  onLaunchStrategiesChange,
  launchBatchId = MOBILE_FILTER_ALL,
  onLaunchBatchIdChange,
  destinationFbPageId = MOBILE_FILTER_ALL,
  onDestinationFbPageIdChange,
  destinationAdAccountName = MOBILE_FILTER_ALL,
  onDestinationAdAccountNameChange,
  sourceAdName = MOBILE_FILTER_ALL,
  onSourceAdNameChange,
  onClearAll,
}: MobileFiltersSheetProps) {
  const showLaunchProvenance = level === "ad" && !!launchFilters;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Built-in X suppressed — the footer's explicit Done/Close is the single
          close control (was two doing the same thing; the built-in one is 16px,
          under the 44px WCAG 2.5.5 floor). */}
      <SheetContent side="bottom" className="flex max-h-[85vh] flex-col gap-0 p-0 [&>button]:hidden">
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3 text-left">
          <SheetTitle>Filters</SheetTitle>
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-auto px-2 text-muted-foreground">
            Clear all
          </Button>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <ChipGroup legend="Status" options={ALL_STATUSES} selected={statuses} onChange={onStatusesChange} />
          <ChipGroup legend="Platform" options={ALL_PLATFORMS} selected={platforms} onChange={onPlatformsChange} />

          {showLaunchProvenance && launchFilters && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-foreground">Launch source</h3>
              <Accordion type="multiple" className="rounded-md border border-border">
                <AccordionItem value="strategy" className="border-b border-border px-3">
                  <AccordionTrigger className="py-3 text-sm hover:no-underline">
                    <span className="flex items-center gap-2">
                      Launch Strategy
                      {launchStrategies.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          {launchStrategies.length}
                        </Badge>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pb-2">
                      {launchFilters.strategies.map((s) => {
                        const isOn = launchStrategies.includes(s.value);
                        return (
                          <button
                            key={s.value}
                            type="button"
                            aria-pressed={isOn}
                            onClick={() => onLaunchStrategiesChange?.(toggleChip(launchStrategies, s.value))}
                            className={cn(
                              "min-h-11 rounded-full border px-4 text-sm transition-colors",
                              isOn
                                ? "border-primary bg-primary font-semibold text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted",
                            )}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <ProvenanceRadioRow
                  itemValue="batch"
                  label="Launch Batch"
                  allLabel="All batches"
                  options={launchFilters.batches}
                  selectedValue={launchBatchId}
                  onSelectedValueChange={onLaunchBatchIdChange}
                />
                <ProvenanceRadioRow
                  itemValue="destPage"
                  label="Destination Page"
                  allLabel="All pages"
                  options={launchFilters.destinationPages}
                  selectedValue={destinationFbPageId}
                  onSelectedValueChange={onDestinationFbPageIdChange}
                />
                <ProvenanceRadioRow
                  itemValue="destAccount"
                  label="Destination Account"
                  allLabel="All accounts"
                  options={launchFilters.destinationAccounts}
                  selectedValue={destinationAdAccountName}
                  onSelectedValueChange={onDestinationAdAccountNameChange}
                />
                <ProvenanceRadioRow
                  itemValue="sourceAd"
                  label="Source Ad"
                  allLabel="All source ads"
                  options={launchFilters.sourceAds}
                  selectedValue={sourceAdName}
                  onSelectedValueChange={onSourceAdNameChange}
                />
              </Accordion>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border px-4 py-3 sm:justify-stretch">
          <SheetClose asChild>
            <Button className="min-h-11 w-full">Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

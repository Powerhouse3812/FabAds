/**
 * My Feeds · toolbar filters: Domain · Page · Status · Running days · Similar ads.
 * Each is a pill with a multi-select popover (several picks = "any of them"; different filters = "all of them").
 * They narrow the whole page like the search does. State lives in the URL (`fdomain`, `fpage`, `fstatus`, `fdays`, `fsimilar`).
 * Counts are the page's ads BEFORE these filters, so a pick never makes its siblings disappear.
 */
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  countFeedFilters,
  type FeedFilterOption,
  type FeedFilterOptions,
  type FeedFilters,
} from "@/lib/insights-v3/selectors";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TruncatedText, fmtInt } from "@/components/insights-v3/shared";

interface PillProps {
  label: string;
  options: FeedFilterOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  searchPlaceholder?: string;
  width?: number;
}

function FilterPill({ label, options, selected, onChange, searchPlaceholder, width = 260 }: PillProps) {
  const [open, setOpen] = useState(false);
  const active = selected.length > 0;
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={active ? `${label} filter, ${selected.length} selected` : `${label} filter`}
          className={cn(
            "group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border pl-3 pr-2 text-[13px] transition-colors max-sm:h-9",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active
              ? "border-primary/40 bg-primary/10 text-primary-text hover:bg-primary/15"
              : "border-input bg-background text-foreground hover:bg-accent",
          )}
        >
          <span className="font-medium">{label}</span>
          {active && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold leading-none tabular-nums text-primary-foreground">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0" style={{ width }}>
        <Command
          // Substring match (cmdk's default is fuzzy and surfaces unrelated names).
          filter={(value, search, keywords) =>
            `${value} ${(keywords ?? []).join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
          }
        >
          {searchPlaceholder && <CommandInput placeholder={searchPlaceholder} aria-label={searchPlaceholder} />}
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No match.</CommandEmpty>
            {options.map((o) => {
              const on = selected.includes(o.id);
              const empty = o.count === 0 && !on;
              return (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  keywords={[o.label]}
                  disabled={empty}
                  onSelect={() => toggle(o.id)}
                  className="gap-2 text-sm data-[disabled=true]:pointer-events-auto data-[disabled=true]:cursor-not-allowed"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                    )}
                  >
                    {on && <Check className="h-3 w-3" />}
                  </span>
                  <TruncatedText text={o.label} className="flex-1" focusable={false} />
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 font-mono text-[11px] leading-5 tabular-nums",
                      empty ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary-text",
                    )}
                  >
                    {fmtInt(o.count)}
                  </span>
                  {on && <span className="sr-only">selected</span>}
                  {empty && <span className="sr-only">No ads in this view</span>}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>
            <span className="font-mono font-medium tabular-nums text-foreground">{selected.length}</span> selected · any of them
          </span>
          {active && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-sm font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface FeedFilterPillsProps {
  options: FeedFilterOptions;
  filters: FeedFilters;
  onChange: (field: keyof FeedFilters, ids: string[]) => void;
  onClearAll: () => void;
}

export function FeedFilterPills({ options, filters, onChange, onClearAll }: FeedFilterPillsProps) {
  const active = countFeedFilters(filters);
  return (
    <>
      <FilterPill label="Domain" options={options.domains} selected={filters.domains} onChange={(ids) => onChange("domains", ids)} searchPlaceholder="Search domains…" width={300} />
      <FilterPill label="Page" options={options.pages} selected={filters.pages} onChange={(ids) => onChange("pages", ids)} searchPlaceholder="Search pages…" width={300} />
      <FilterPill label="Status" options={options.status} selected={filters.status} onChange={(ids) => onChange("status", ids)} width={230} />
      <FilterPill label="Running days" options={options.days} selected={filters.days} onChange={(ids) => onChange("days", ids)} width={230} />
      <FilterPill label="Similar ads" options={options.similar} selected={filters.similar} onChange={(ids) => onChange("similar", ids)} width={240} />
      {active > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="shrink-0 rounded-sm px-1 text-xs font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:min-h-9"
        >
          Clear filters
        </button>
      )}
    </>
  );
}

/**
 * DetailedTargetingPanel — Meta flexible_spec interest/behavior/demographic targeting.
 *
 * Three stacked groups:
 *   1. Include — broad interests + behaviors + demographics (OR within group)
 *   2. Narrow — must also match (AND condition)
 *   3. Exclude — exclusion group
 *
 * Each item shows: name + category chip + mock reach estimate.
 *
 * Special ad category: entire panel is disabled + amber banner.
 *
 * Writes to: targeting.flexibleSpec and targeting.exclusions
 *
 * NOTE: Mock interest/behavior/demographic data only. Real Meta targeting-search
 * API wiring is deferred.
 */

import { useState, useRef, useEffect } from "react";
import { Search, X, AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TargetingGroup, TargetingTermRef } from "../../../types";

interface DetailedTargetingPanelProps {
  flexibleSpec: TargetingGroup[];
  exclusions: TargetingGroup;
  onChangeFlexibleSpec: (spec: TargetingGroup[]) => void;
  onChangeExclusions: (excl: TargetingGroup) => void;
  specialAdCategoryActive?: boolean;
}

type TermCategory = "Interest" | "Behavior" | "Demographic";

interface TermOption {
  id: string;
  name: string;
  category: TermCategory;
  reach: string; // mock reach label
}

const MOCK_TERMS: TermOption[] = [
  // Interests
  { id: "int_001", name: "Online Shopping", category: "Interest", reach: "18.4M–24.7M" },
  { id: "int_002", name: "Fashion & Style", category: "Interest", reach: "9.1M–12.3M" },
  { id: "int_003", name: "Fitness & Wellness", category: "Interest", reach: "6.7M–8.9M" },
  { id: "int_004", name: "Travel", category: "Interest", reach: "11.2M–15.8M" },
  { id: "int_005", name: "Mobile Gaming", category: "Interest", reach: "22.6M–30.1M" },
  { id: "int_006", name: "E-commerce", category: "Interest", reach: "5.4M–7.2M" },
  { id: "int_007", name: "Digital Marketing", category: "Interest", reach: "2.1M–3.4M" },
  { id: "int_008", name: "Entrepreneurship", category: "Interest", reach: "3.8M–5.1M" },
  { id: "int_009", name: "Beauty & Cosmetics", category: "Interest", reach: "7.9M–10.6M" },
  { id: "int_010", name: "Home Decor", category: "Interest", reach: "4.2M–5.9M" },
  { id: "int_011", name: "Food & Cooking", category: "Interest", reach: "13.7M–18.2M" },
  { id: "int_012", name: "Parenting", category: "Interest", reach: "8.3M–11.4M" },
  { id: "int_013", name: "Technology", category: "Interest", reach: "14.6M–19.3M" },
  { id: "int_014", name: "Cricket", category: "Interest", reach: "29.4M–38.7M" },
  { id: "int_015", name: "Bollywood", category: "Interest", reach: "16.8M–22.1M" },
  // Behaviors
  { id: "beh_001", name: "Online Shoppers", category: "Behavior", reach: "21.3M–28.6M" },
  { id: "beh_002", name: "Small Business Owners", category: "Behavior", reach: "1.9M–2.7M" },
  { id: "beh_003", name: "Mobile Device Users", category: "Behavior", reach: "41.2M–54.8M" },
  { id: "beh_004", name: "International Travelers", category: "Behavior", reach: "3.4M–4.8M" },
  { id: "beh_005", name: "Recently Moved", category: "Behavior", reach: "2.6M–3.7M" },
  { id: "beh_006", name: "Engaged Shoppers", category: "Behavior", reach: "7.1M–9.8M" },
  { id: "beh_007", name: "Frequent Travelers", category: "Behavior", reach: "4.9M–6.6M" },
  // Demographics
  { id: "dem_001", name: "College Students", category: "Demographic", reach: "8.7M–11.9M" },
  { id: "dem_002", name: "Homeowners", category: "Demographic", reach: "5.3M–7.4M" },
  { id: "dem_003", name: "Parents of Young Children", category: "Demographic", reach: "6.1M–8.3M" },
  { id: "dem_004", name: "High Net Worth Individuals", category: "Demographic", reach: "0.9M–1.4M" },
  { id: "dem_005", name: "Business Decision Makers", category: "Demographic", reach: "1.6M–2.3M" },
];

const CATEGORY_COLOR: Record<TermCategory, string> = {
  Interest: "text-[#5B7611] dark:text-[#C3E165]",
  Behavior: "text-blue-600 dark:text-blue-400",
  Demographic: "text-purple-600 dark:text-purple-400",
};

function emptyGroup(): TargetingGroup {
  return { interests: [], behaviors: [], demographics: [] };
}

function groupToRefs(group: TargetingGroup): TargetingTermRef[] {
  return [...group.interests, ...group.behaviors, ...group.demographics];
}

function termCategory(id: string): TermCategory {
  const opt = MOCK_TERMS.find((t) => t.id === id);
  return opt?.category ?? "Interest";
}

function addToGroup(group: TargetingGroup, termId: string, name: string): TargetingGroup {
  const cat = termCategory(termId);
  const ref: TargetingTermRef = { id: termId, name };
  if (cat === "Interest") return { ...group, interests: [...group.interests, ref] };
  if (cat === "Behavior") return { ...group, behaviors: [...group.behaviors, ref] };
  return { ...group, demographics: [...group.demographics, ref] };
}

function removeFromGroup(group: TargetingGroup, termId: string): TargetingGroup {
  return {
    interests: group.interests.filter((t) => t.id !== termId),
    behaviors: group.behaviors.filter((t) => t.id !== termId),
    demographics: group.demographics.filter((t) => t.id !== termId),
  };
}

function TermSearchBox({
  group,
  existingIds,
  onAdd,
  onRemove,
  disabled,
}: {
  group: TargetingGroup;
  existingIds: Set<string>;
  onAdd: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = MOCK_TERMS.filter(
    (t) =>
      !existingIds.has(t.id) &&
      t.name.toLowerCase().includes(query.toLowerCase())
  );

  const allRefs = groupToRefs(group);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className={cn("relative", disabled && "pointer-events-none opacity-40")}>
      <div className="flex items-center gap-2 rounded-[28px] border border-border bg-background px-3 py-1.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          disabled={disabled}
          placeholder="Search interests, behaviors, demographics…"
          className="w-full bg-transparent text-[13px] text-foreground placeholder-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-border bg-[#FFFFFF] dark:bg-[#1E1E23] shadow-md">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-[12px] font-mono text-muted-foreground">
              {query ? `No results for "${query}"` : "All terms added"}
            </p>
          ) : (
            (["Interest", "Behavior", "Demographic"] as TermCategory[]).map((cat) => {
              const catTerms = filtered.filter((t) => t.category === cat);
              if (catTerms.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground bg-muted/30">
                    {cat === "Interest" ? "Interests" : cat === "Behavior" ? "Behaviors" : "Demographics"}
                  </div>
                  {catTerms.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onAdd(t.id, t.name);
                        setQuery("");
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted transition-colors"
                    >
                      <span className="truncate text-[13px]">{t.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono tabular-nums text-muted-foreground">{t.reach}</span>
                        <span className={cn("text-[10px] font-mono font-semibold uppercase tracking-wide", CATEGORY_COLOR[t.category])}>
                          {t.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Added chips */}
      {allRefs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {allRefs.map((ref) => {
            const opt = MOCK_TERMS.find((t) => t.id === ref.id);
            const cat = opt?.category ?? "Interest";
            return (
              <div
                key={ref.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm"
              >
                <span className="text-[12px]">{ref.name}</span>
                <span className={cn("text-[10px] font-mono font-semibold uppercase", CATEGORY_COLOR[cat])}>
                  {cat}
                </span>
                {opt?.reach && (
                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground">{opt.reach}</span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(ref.id)}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DetailedTargetingPanel({
  flexibleSpec,
  exclusions,
  onChangeFlexibleSpec,
  onChangeExclusions,
  specialAdCategoryActive,
}: DetailedTargetingPanelProps) {
  const locked = specialAdCategoryActive === true;
  const [showNarrow, setShowNarrow] = useState(false);
  const [showExclude, setShowExclude] = useState(false);

  // Group 0: Include; Group 1: Narrow (optional)
  const includeGroup: TargetingGroup = flexibleSpec[0] ?? emptyGroup();
  const narrowGroup: TargetingGroup = flexibleSpec[1] ?? emptyGroup();

  // Collect all IDs already in include group to prevent double-add in narrow
  const includeIds = new Set(groupToRefs(includeGroup).map((r) => r.id));
  const narrowIds = new Set(groupToRefs(narrowGroup).map((r) => r.id));
  const excludeIds = new Set(groupToRefs(exclusions).map((r) => r.id));

  function updateInclude(updated: TargetingGroup) {
    const next: TargetingGroup[] = [updated];
    if (flexibleSpec.length > 1) next.push(flexibleSpec[1]);
    onChangeFlexibleSpec(next);
  }

  function updateNarrow(updated: TargetingGroup) {
    onChangeFlexibleSpec([includeGroup, updated]);
  }

  return (
    <div className="space-y-4">
      {locked && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            Detailed targeting is restricted for Special Ad Categories. Interests, behaviors, and demographics are unavailable.
          </p>
        </div>
      )}

      {/* Group 1: Include */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
          Include people who match
        </p>
        <TermSearchBox
          group={includeGroup}
          existingIds={includeIds}
          onAdd={(id, name) => updateInclude(addToGroup(includeGroup, id, name))}
          onRemove={(id) => updateInclude(removeFromGroup(includeGroup, id))}
          disabled={locked}
        />
      </div>

      {/* Narrow group toggle */}
      {!locked && (
        <button
          type="button"
          onClick={() => setShowNarrow((p) => !p)}
          className="flex items-center gap-1 text-[12px] font-mono text-[#5B7611] dark:text-[#C3E165] hover:underline underline-offset-2 transition-colors"
        >
          {showNarrow ? "Remove narrow audience" : "+ Narrow audience (must also match)"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showNarrow && "rotate-180")} />
        </button>
      )}

      {/* Group 2: Narrow (AND) */}
      {showNarrow && !locked && (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 px-3 py-3">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            Narrow audience — must also match
          </p>
          <TermSearchBox
            group={narrowGroup}
            existingIds={new Set([...includeIds, ...narrowIds])}
            onAdd={(id, name) => updateNarrow(addToGroup(narrowGroup, id, name))}
            onRemove={(id) => updateNarrow(removeFromGroup(narrowGroup, id))}
            disabled={false}
          />
        </div>
      )}

      {/* Exclude group */}
      {!locked && (
        <button
          type="button"
          onClick={() => setShowExclude((p) => !p)}
          className="text-[12px] font-mono text-[#5B7611] dark:text-[#C3E165] hover:underline underline-offset-2 transition-colors"
        >
          {showExclude ? "Hide excluded people" : "+ Exclude people"}
        </button>
      )}

      {showExclude && !locked && (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 px-3 py-3">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            Exclude people who match
          </p>
          <TermSearchBox
            group={exclusions}
            existingIds={new Set([...includeIds, ...narrowIds, ...excludeIds])}
            onAdd={(id, name) => onChangeExclusions(addToGroup(exclusions, id, name))}
            onRemove={(id) => onChangeExclusions(removeFromGroup(exclusions, id))}
            disabled={false}
          />
        </div>
      )}
    </div>
  );
}

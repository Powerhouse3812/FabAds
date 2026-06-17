/**
 * CustomLookalikeRow — multi-select combobox for custom + lookalike audiences.
 *
 * Shows selected audiences as chips. Exclusions toggle for excluded audiences.
 *
 * Special ad category:
 *   - Lookalike audiences are disabled (greyed out + tooltip)
 *   - Shows amber restriction banner
 *
 * Writes to: targeting.customAudiences and targeting.excludedCustomAudiences
 */

import { useState, useRef, useEffect } from "react";
import { Search, X, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AudienceRef } from "../../../types";

interface CustomLookalikeRowProps {
  customAudiences: AudienceRef[];
  excludedCustomAudiences: AudienceRef[];
  onChangeAudiences: (a: AudienceRef[]) => void;
  onChangeExcluded: (a: AudienceRef[]) => void;
  specialAdCategoryActive?: boolean;
}

type AudienceSubtype = "custom" | "lookalike";

interface AudienceOption {
  id: string;
  name: string;
  subtype: AudienceSubtype;
  estimatedSize?: string;
}

const MOCK_AUDIENCES: AudienceOption[] = [
  // Custom
  { id: "ca_001", name: "Website Visitors (30d)", subtype: "custom", estimatedSize: "84K" },
  { id: "ca_002", name: "Add to Cart (14d)", subtype: "custom", estimatedSize: "31K" },
  { id: "ca_003", name: "Purchase (60d)", subtype: "custom", estimatedSize: "12.4K" },
  { id: "ca_004", name: "Customer List — FY2025", subtype: "custom", estimatedSize: "67K" },
  { id: "ca_005", name: "App Installers (All Time)", subtype: "custom", estimatedSize: "210K" },
  // Lookalike
  { id: "lal_001", name: "LAL — Purchase 1% (IN)", subtype: "lookalike", estimatedSize: "2.1M" },
  { id: "lal_002", name: "LAL — Website Visitors 2% (IN)", subtype: "lookalike", estimatedSize: "4.3M" },
  { id: "lal_003", name: "LAL — Customer List 1% (US)", subtype: "lookalike", estimatedSize: "2.8M" },
];

function AudienceCombobox({
  selected,
  onAdd,
  onRemove,
  specialAdCategoryActive,
  placeholder,
}: {
  selected: AudienceRef[];
  onAdd: (a: AudienceOption) => void;
  onRemove: (id: string) => void;
  specialAdCategoryActive?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const locked = specialAdCategoryActive === true;

  const selectedIds = new Set(selected.map((a) => a.id));

  const filtered = MOCK_AUDIENCES.filter(
    (a) =>
      !selectedIds.has(a.id) &&
      a.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function isDisabled(opt: AudienceOption) {
    return locked && opt.subtype === "lookalike";
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 rounded-[28px] border border-border bg-background px-3 py-1.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Search custom or lookalike audiences…"}
          className="w-full bg-transparent text-[13px] text-foreground placeholder-muted-foreground focus:outline-none"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-border bg-[#FFFFFF] dark:bg-[#1E1E23] shadow-md">
          {filtered.length === 0 && query.length > 0 ? (
            <p className="px-3 py-3 text-[12px] font-mono text-muted-foreground">No matches for "{query}"</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-3 text-[12px] font-mono text-muted-foreground">All audiences added</p>
          ) : (
            <>
              {["custom", "lookalike"].map((subtype) => {
                const group = filtered.filter((a) => a.subtype === subtype);
                if (group.length === 0) return null;
                return (
                  <div key={subtype}>
                    <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground bg-muted/30">
                      {subtype === "custom" ? "Custom Audiences" : "Lookalike Audiences"}
                    </div>
                    {group.map((a) => {
                      const disabled = isDisabled(a);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={disabled}
                          title={disabled ? "Lookalike audiences are not available for Special Ad Categories" : undefined}
                          onClick={() => {
                            if (!disabled) {
                              onAdd(a);
                              setQuery("");
                              setOpen(false);
                            }
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors",
                            disabled
                              ? "cursor-not-allowed opacity-40"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-[13px]">{a.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {a.estimatedSize && (
                              <span className="text-[10px] font-mono text-muted-foreground">{a.estimatedSize}</span>
                            )}
                            <span
                              className={cn(
                                "text-[10px] font-mono font-semibold uppercase tracking-wide",
                                a.subtype === "custom"
                                  ? "text-[#5B7611] dark:text-[#C3E165]"
                                  : "text-blue-600 dark:text-blue-400"
                              )}
                            >
                              {a.subtype === "custom" ? "Custom" : "Lookalike"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((a) => {
            const opt = MOCK_AUDIENCES.find((o) => o.id === a.id);
            const isLal = opt?.subtype === "lookalike";
            return (
              <div
                key={a.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm"
              >
                <span className="text-[12px]">{a.name}</span>
                {opt && (
                  <span
                    className={cn(
                      "text-[10px] font-mono font-semibold uppercase",
                      isLal ? "text-blue-600 dark:text-blue-400" : "text-[#5B7611] dark:text-[#C3E165]"
                    )}
                  >
                    {isLal ? "LAL" : "Custom"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
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

export default function CustomLookalikeRow({
  customAudiences,
  excludedCustomAudiences,
  onChangeAudiences,
  onChangeExcluded,
  specialAdCategoryActive,
}: CustomLookalikeRowProps) {
  const [showExcluded, setShowExcluded] = useState(false);
  const locked = specialAdCategoryActive === true;

  function addAudience(a: AudienceOption) {
    const ref: AudienceRef = { id: a.id, name: a.name, subtype: a.subtype === "lookalike" ? "LOOKALIKE" : "CUSTOM" };
    onChangeAudiences([...customAudiences, ref]);
  }

  function removeAudience(id: string) {
    onChangeAudiences(customAudiences.filter((a) => a.id !== id));
  }

  function addExcluded(a: AudienceOption) {
    const ref: AudienceRef = { id: a.id, name: a.name, subtype: a.subtype === "lookalike" ? "LOOKALIKE" : "CUSTOM" };
    onChangeExcluded([...excludedCustomAudiences, ref]);
  }

  function removeExcluded(id: string) {
    onChangeExcluded(excludedCustomAudiences.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-3">
      {locked && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            Lookalike audiences are not available for Special Ad Categories. Only custom audiences can be used.
          </p>
        </div>
      )}

      <AudienceCombobox
        selected={customAudiences}
        onAdd={addAudience}
        onRemove={removeAudience}
        specialAdCategoryActive={specialAdCategoryActive}
        placeholder="Search custom or lookalike audiences…"
      />

      {/* Exclusions toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowExcluded((p) => !p)}
          className="text-[12px] font-mono text-[#5B7611] dark:text-[#C3E165] underline-offset-2 hover:underline transition-colors"
        >
          {showExcluded ? "Hide excluded audiences" : "+ Exclude audiences"}
        </button>
      </div>

      {showExcluded && (
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-3 space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Excluded audiences</p>
          <AudienceCombobox
            selected={excludedCustomAudiences}
            onAdd={addExcluded}
            onRemove={removeExcluded}
            specialAdCategoryActive={specialAdCategoryActive}
            placeholder="Exclude audiences…"
          />
        </div>
      )}
    </div>
  );
}

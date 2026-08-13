import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileFlowShell } from "../components/MobileFlowShell";
import { MobileInsightsSeedNote } from "../components/MobileInsightsSeedNote";
import { KNOWN_BRANDS } from "../data";
import type { MobileOnboardingStartMode } from "../types";

export interface MobileInsightsBrandsProps {
  onClose: () => void;
  onBack: () => void;
  /** Terminal action of the Insights branch — closes the flow. */
  onFinish: () => void;
  value: string[];
  onChange: (next: string[]) => void;
  startMode: MobileOnboardingStartMode;
  stepIndex: number;
  stepCount: number;
}

/** How many suggestions to show at once — Miller's 7±2, plus the add row. */
const SUGGESTION_LIMIT = 8;

/**
 * Insights step 3 of 3 — Brands. Tab 3 of the web 3-tab picker, on its own
 * screen, and the last screen of the Insights branch.
 *
 * ⚠️  No persistence. Tapping "Finish setup" closes the flow and discards
 *     every pick. `useInsightPreferences().upsert` is NOT imported here.
 *
 * Mobile change from web: web floats the brand suggestions in an
 * `absolute z-10` dropdown over the dialog body. On a phone, a floating list
 * inside an already-full-screen overlay is a nested-overlay trap — it can be
 * scrolled out from under the finger and it fights the keyboard. Here the
 * suggestions render INLINE below the field as ordinary flow content, so
 * there is never a second layer to dismiss. Same pattern
 * `MobileFiltersSheet.tsx` already uses for its provenance rows.
 *
 * Custom brands are allowed (same as web) — the field is a combobox, not a
 * closed list, so a user following a brand outside `KNOWN_BRANDS` is not
 * blocked.
 */
export function MobileInsightsBrands({
  onClose,
  onBack,
  onFinish,
  value,
  onChange,
  startMode,
  stepIndex,
  stepCount,
}: MobileInsightsBrandsProps) {
  const [search, setSearch] = useState("");
  const trimmed = search.trim();

  const suggestions = useMemo(() => {
    const pool = KNOWN_BRANDS.filter((b) => !value.includes(b));
    if (!trimmed) return pool.slice(0, SUGGESTION_LIMIT);
    const q = trimmed.toLowerCase();
    return pool
      .filter((b) => b.toLowerCase().includes(q))
      .slice(0, SUGGESTION_LIMIT);
  }, [trimmed, value]);

  const isExactKnown = KNOWN_BRANDS.some(
    (b) => b.toLowerCase() === trimmed.toLowerCase(),
  );
  const alreadyAdded = value.some(
    (b) => b.toLowerCase() === trimmed.toLowerCase(),
  );
  const canAddCustom = trimmed.length > 0 && !isExactKnown && !alreadyAdded;

  const addBrand = (name: string) => {
    const next = name.trim();
    if (next && !value.includes(next)) onChange([...value, next]);
    setSearch("");
  };

  const removeBrand = (name: string) => {
    onChange(value.filter((b) => b !== name));
  };

  return (
    <MobileFlowShell
      eyebrow="Set up your feed"
      stepIndex={stepIndex}
      stepCount={stepCount}
      stepLabel="Brands"
      title={
        <>
          Follow specific{" "}
          <span className="rounded bg-primary/30 px-1.5">brands</span>
        </>
      }
      subtitle="Follow brands to always see their ads in your feed, whatever else you picked."
      onBack={onBack}
      onClose={onClose}
      primaryLabel="Finish setup"
      onPrimary={onFinish}
      hidePrimaryArrow
      footerNote="Nothing here is saved — this is a walkthrough of the real setup."
    >
      <MobileInsightsSeedNote startMode={startMode} seededCount={value.length} />

      {/* Followed brands — removable chips, each with a 44px remove target. */}
      {value.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Following · {value.length}
          </p>
          <ul className="flex list-none flex-wrap gap-2">
            {value.map((b) => (
              <li
                key={b}
                className="inline-flex min-h-11 max-w-full items-center gap-1 rounded-full border border-primary/50 bg-primary/20 pl-4 pr-1"
              >
                <span className="min-w-0 truncate text-[13px] font-semibold text-foreground">
                  {b}
                </span>
                <button
                  type="button"
                  onClick={() => removeBrand(b)}
                  aria-label={`Unfollow ${b}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors active:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-4 rounded-lg border border-dashed border-border px-3.5 py-3 text-[12px] leading-relaxed text-muted-foreground">
          Not following any brands yet. Search below, or finish — your feed will
          still follow your industries and interests.
        </p>
      )}

      {/* Search / add field */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search or type a brand name…"
          className="h-12 pl-10 text-[15px]"
          aria-label="Search brands"
          autoCapitalize="words"
          autoCorrect="off"
          onKeyDown={(e) => {
            if (e.key === "Enter" && trimmed) {
              e.preventDefault();
              addBrand(trimmed);
            }
          }}
        />
      </div>

      {/* Inline suggestions — never a floating overlay. */}
      <ul className="mt-2.5 flex list-none flex-col gap-1.5">
        {canAddCustom && (
          <li>
            <button
              type="button"
              onClick={() => addBrand(trimmed)}
              className="flex min-h-12 w-full items-center gap-2 rounded-lg border border-primary/40 bg-primary/[0.06] px-3.5 text-left text-[13.5px] font-semibold text-foreground transition-colors active:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 truncate">Add "{trimmed}"</span>
            </button>
          </li>
        )}

        {suggestions.map((b) => (
          <li key={b}>
            <button
              type="button"
              onClick={() => addBrand(b)}
              className="flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 text-left text-[13.5px] text-foreground transition-colors active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 truncate">{b}</span>
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}

        {/* Both zero-result cases, distinguished. */}
        {suggestions.length === 0 && !canAddCustom && (
          <li className="rounded-lg border border-dashed border-border px-3.5 py-3 text-[12px] leading-relaxed text-muted-foreground">
            {trimmed
              ? alreadyAdded
                ? `You're already following "${trimmed}".`
                : `No brands match "${trimmed}".`
              : "You're following every brand we know about."}
          </li>
        )}
      </ul>
    </MobileFlowShell>
  );
}

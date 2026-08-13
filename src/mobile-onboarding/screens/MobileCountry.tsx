import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MobileFlowShell } from "../components/MobileFlowShell";
import { COUNTRIES } from "../data";
import type { MobileCountry as Country } from "../types";

export interface MobileCountryProps {
  onClose: () => void;
  onBack: () => void;
  onContinue: (country: Country) => void;
  /** Pre-selected code, so Back → Continue keeps the earlier pick. */
  selected?: string;
  stepIndex: number;
  stepCount: number;
}

/**
 * Genie step 2 — Country. Copy + market list lifted from
 * `src/onboarding-demo/steps/CountrySelection.tsx`.
 *
 * Mobile changes: a single-column row list instead of web's 4-up grid (flag +
 * name + code stay readable at any name length, including 60+ char ones,
 * because the name gets the full row width and truncates), and a zero-result
 * state that names the query back to the user.
 */
export function MobileCountry({
  onClose,
  onBack,
  onContinue,
  selected,
  stepIndex,
  stepCount,
}: MobileCountryProps) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | undefined>(selected);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  const submit = () => {
    const country = COUNTRIES.find((c) => c.code === picked);
    if (country) onContinue(country);
  };

  return (
    <MobileFlowShell
      eyebrow="Genie setup"
      stepIndex={stepIndex}
      stepCount={stepCount}
      stepLabel="Country"
      title={
        <>
          Where are you <span className="rounded bg-primary/30 px-1.5">based</span>?
        </>
      }
      subtitle="This helps us tailor ad formats, compliance rules, and platform recommendations to your market."
      onBack={onBack}
      onClose={onClose}
      primaryLabel="Continue"
      primaryDisabled={!picked}
      onPrimary={submit}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search country…"
          className="h-12 pl-10 text-[15px]"
          aria-label="Search countries"
          autoComplete="off"
        />
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {filtered.map((c) => {
            const active = c.code === picked;
            return (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => setPicked(c.code)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card active:bg-muted/60",
                  )}
                >
                  <span className="shrink-0 text-[22px] leading-none" aria-hidden>
                    {c.flag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-foreground">
                      {c.name}
                    </span>
                    <span className="block font-mono text-[10px] uppercase text-muted-foreground">
                      {c.code}
                    </span>
                  </span>
                  {active && (
                    <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        /* Zero-result state — names the query, offers the way out. */
        <div className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-[13.5px] font-medium text-foreground">
            No markets match "{query.trim()}"
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Try a country name or its two-letter code.
          </p>
        </div>
      )}
    </MobileFlowShell>
  );
}

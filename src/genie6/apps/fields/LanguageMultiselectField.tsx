import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { TOTAL_LANGUAGES, languageLabel, searchLanguages } from "../../lib/languages";
import { languageCostNote } from "../lib/runPlan";

interface LanguageMultiselectFieldProps {
  value: string[] | undefined;
  onChange: (codes: string[]) => void;
  /** From `app.cost` when `unit === "language-minute"` — shown as the cost
   *  implication under the field (§8: "the whole reason this field is
   *  expensive"). */
  ratePerLanguageMinute?: number;
}

/**
 * Language multi-select — §8: 175 options, MUST be search-driven, not a
 * scroll (Hick's law). Selected languages render as removable Mono pills;
 * the count + cost implication sit below, since 6 credits/language/minute is
 * the reason this single field can dominate the whole cost preview.
 */
export function LanguageMultiselectField({
  value,
  onChange,
  ratePerLanguageMinute,
}: LanguageMultiselectFieldProps) {
  const selected = value ?? [];
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchLanguages(query).filter((l) => !selected.includes(l.code));

  const add = (code: string) => {
    onChange([...selected, code]);
    setQuery("");
  };
  const remove = (code: string) => onChange(selected.filter((c) => c !== code));

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-0.5 pl-2.5 pr-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-primary"
            >
              {languageLabel(code)}
              <button
                type="button"
                aria-label={`Remove ${languageLabel(code)}`}
                onClick={() => remove(code)}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={`Search ${TOTAL_LANGUAGES} languages…`}
          className="rounded-full pl-8 text-[13px]"
        />

        {open && results.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-md">
            {results.slice(0, 40).map((l) => (
              <button
                key={l.code}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(l.code);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px]",
                  "hover:bg-foreground/[0.06]",
                )}
              >
                <span className="text-foreground">{l.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {l.region}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="font-mono text-[11px] text-muted-foreground">
        {languageCostNote(ratePerLanguageMinute, selected.length)}
      </p>
    </div>
  );
}

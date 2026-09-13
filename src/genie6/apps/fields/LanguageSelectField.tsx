import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { TOTAL_LANGUAGES, getLanguage, languageFlag, languageLabel, searchLanguages } from "../../lib/languages";
import { languageCostNote } from "../lib/runPlan";

interface LanguageSelectFieldProps {
  value: string | undefined;
  onChange: (code: string) => void;
  /** From `app.cost` when `unit === "language-minute"` — shown as the cost
   *  implication under the field (§8: "the whole reason this field is
   *  expensive"). */
  ratePerLanguageMinute?: number;
}

/**
 * Language select — §8: 175 options, MUST be search-driven, not a scroll
 * (Hick's law). SINGLE language only (owner ruling 2026-09-09, verbatim:
 * "single language selection only", everywhere a language is picked) —
 * picking a language REPLACES whatever was selected before; there is no
 * "add another". Every option carries a flag (owner ruling: "language
 * selection dropdown me, give flags also instead of just names of the
 * country" / "a flag on every entry, pick the most common country"), via
 * `languageFlag()` in `../../lib/languages`.
 */
export function LanguageSelectField({ value, onChange, ratePerLanguageMinute }: LanguageSelectFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = value ? getLanguage(value) : undefined;
  const results = searchLanguages(query).filter((l) => l.code !== value);

  const pick = (code: string) => {
    onChange(code);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Close on focus LEAVING the whole field, not on the input's own blur.
          A blur timeout on the input closed the list ~150ms after Tab reached
          the first option, so a keyboard user's focus was yanked to <body>
          before they could press Enter — the field was mouse-only. React's
          onBlur is focusout, so it bubbles: if focus landed on something still
          inside this wrapper (an option), the list stays. */}
      <div
        className="relative"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        {open || !selected ? (
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        ) : (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm leading-none"
            aria-hidden="true"
          >
            {languageFlag(selected.code)}
          </span>
        )}
        <Input
          ref={inputRef}
          value={open ? query : selected ? languageLabel(selected.code) : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            // Enter on the input takes the single obvious match, so a keyboard
            // user typing "Japanese" never has to Tab into the list at all.
            if (e.key === "Enter" && open && results.length > 0) {
              e.preventDefault();
              pick(results[0].code);
            }
          }}
          placeholder={`Search ${TOTAL_LANGUAGES} languages…`}
          aria-label="Target language"
          className="rounded-full pl-8 text-[13px]"
        />

        {open && results.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-md">
            {results.slice(0, 40).map((l) => (
              <button
                key={l.code}
                type="button"
                // mousedown only PREVENTS the input's blur (which would close
                // the list before the click lands); the selection itself is on
                // CLICK, because a keyboard Enter/Space on a <button> fires
                // click and never mousedown. Selecting on mousedown made this
                // required field mouse-only — Tab reached the option, Enter did
                // nothing, and the blur timeout then dropped focus to <body>.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(l.code)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px]",
                  "hover:bg-foreground/[0.06]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                )}
              >
                <span className="flex min-w-0 items-center gap-2 text-foreground">
                  <span className="shrink-0 leading-none" aria-hidden="true">
                    {languageFlag(l.code)}
                  </span>
                  <span className="truncate">{l.name}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {l.region}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="font-mono text-[11px] text-muted-foreground">
        {languageCostNote(ratePerLanguageMinute, !!value)}
      </p>
    </div>
  );
}

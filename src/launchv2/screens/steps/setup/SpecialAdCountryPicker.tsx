/**
 * SpecialAdCountryPicker — multi-select country/region picker for special ad category.
 * Decision 10: shown only when specialCategoryActive(plan) is true.
 * Writes to plan.specialAdCountries (string[]).
 */
import { useState } from "react";
import { Check, ChevronsUpDown, Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ---- Country data (mock ~20 countries) ---- */
const COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "EG", name: "Egypt" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "ID", name: "Indonesia" },
  { code: "TH", name: "Thailand" },
];

export default function SpecialAdCountryPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (codes: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedSet = new Set(selected);

  const toggle = (code: string) => {
    if (selectedSet.has(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const remove = (code: string) => onChange(selected.filter((c) => c !== code));

  const filtered = search
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        Special ad category — applicable countries / regions
      </Label>
      <p className="text-[11px] text-muted-foreground">
        Meta requires you to declare the countries where this special ad category applies.
      </p>

      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:border-foreground/30 transition-colors"
          >
            <span className={selected.length > 0 ? "text-foreground font-medium" : ""}>
              {selected.length > 0
                ? `${selected.length} countr${selected.length === 1 ? "y" : "ies"} selected`
                : "Select countries…"}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] rounded-xl border border-border bg-card p-0 shadow-md" align="start" sideOffset={6}>
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>

          {/* List */}
          <div className="max-h-[240px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-xs text-muted-foreground">No countries found.</p>
            ) : (
              filtered.map((country) => {
                const on = selectedSet.has(country.code);
                return (
                  <div
                    key={country.code}
                    role="option"
                    aria-selected={on}
                    onClick={() => toggle(country.code)}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-colors"
                  >
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-all",
                        on ? "border-primary bg-primary" : "border-border",
                      )}
                    >
                      {on && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 text-xs font-medium text-foreground">{country.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">{country.code}</span>
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => {
            const country = COUNTRIES.find((c) => c.code === code);
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-foreground"
              >
                {country?.name ?? code}
                <button
                  type="button"
                  onClick={() => remove(code)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { ArrowRight, Search, Globe, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepNav } from "../components/StepNav";
import { cn } from "@/lib/utils";

interface CountrySelectionProps {
  selected?: string;
  onBack: () => void;
  onContinue: (country: { code: string; name: string; flag: string }) => void;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

/* 20 markets — same set + ordering as the wireframe. */
const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
];

/**
 * Step 2 — Country selection. Common to both e-commerce and affiliate
 * flows. The selected country tailors ad formats, compliance rules,
 * and platform recommendations downstream.
 */
export function CountrySelection({
  selected,
  onBack,
  onContinue,
}: CountrySelectionProps) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | undefined>(selected);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  const submit = () => {
    const c = COUNTRIES.find((x) => x.code === picked) ?? COUNTRIES[0];
    onContinue(c);
  };

  return (
    <div className="bg-background">
      <StepNav active={1} onBack={onBack} backLabel="Back to Quick Start" />
      <div className="max-w-[720px] mx-auto px-6 pt-2 pb-10">
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-wider font-mono mb-3 bg-primary/10 border-primary/30 text-foreground"
        >
          Step 2 · Country
        </Badge>
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-foreground shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Where are you{" "}
              <span className="bg-primary/30 px-1.5 rounded">based</span>?
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1.5">
              This helps us tailor ad formats, compliance rules, and platform
              recommendations to your market.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country…"
            className="h-11 pl-10"
            aria-label="Search countries"
          />
        </div>

        {/* Country grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4">
          {filtered.map((c) => {
            const active = c.code === picked;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setPicked(c.code)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-foreground/30",
                )}
                aria-pressed={active}
              >
                <span className="text-[20px] leading-none shrink-0" aria-hidden>
                  {c.flag}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-foreground truncate">
                    {c.name}
                  </span>
                  <span className="block text-[10px] font-mono uppercase text-muted-foreground">
                    {c.code}
                  </span>
                </span>
                {active && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-[12px] text-muted-foreground mt-6">
            No countries match "{query}".
          </p>
        )}

        <div className="flex items-center justify-between mt-7">
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <Button
            onClick={submit}
            className="gap-1.5"
            disabled={!picked}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  ArrowRight, Zap, Plus, X, Instagram, Music, Youtube, FileText,
  Pin, Mail, Twitter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StepNav } from "../components/StepNav";
import { cn } from "@/lib/utils";

interface AffiliateInputProps {
  onBack: () => void;
  onContinue: (data: {
    category: string;
    industry: string;
    platforms: string[];
    audience: string;
    refUrls: string[];
    affLink: string;
    country?: string;
  }) => void;
}

/* Reused from CountrySelection — keep the two lists in sync if either changes. */
const COUNTRIES: { code: string; name: string; flag: string }[] = [
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

/* Posting platforms (multi-select). Order + icons match the wireframe. */
const PLATFORMS: { id: string; icon: typeof Instagram }[] = [
  { id: "Instagram", icon: Instagram },
  { id: "TikTok", icon: Music },
  { id: "YouTube", icon: Youtube },
  { id: "Blog / Website", icon: FileText },
  { id: "Pinterest", icon: Pin },
  { id: "X / Twitter", icon: Twitter },
  { id: "Email", icon: Mail },
];

const INDUSTRIES = [
  "Insurance",
  "Finance",
  "Health & Wellness",
  "Software / SaaS",
  "Home Services",
  "Education",
  "Travel",
];

/**
 * Step 3 — Affiliate input. Required: Category. Optional: Industry,
 * posting platforms, target audience, reference URLs, affiliate link.
 * Restored the full field set after Maalik's wireframe cross-check
 * (A-12.121 had trimmed everything except Category + URLs).
 */
export function AffiliateInput({ onBack, onContinue }: AffiliateInputProps) {
  const [category, setCategory] = useState("");
  const [industry, setIndustry] = useState("Insurance");
  const [country, setCountry] = useState<string>("");
  const [platforms, setPlatforms] = useState<Set<string>>(
    new Set(["Instagram", "TikTok"]),
  );
  const [audience, setAudience] = useState("");
  const [refUrls, setRefUrls] = useState<string[]>([""]);
  const [affLink, setAffLink] = useState("");

  const togglePlat = (p: string) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const updateUrl = (idx: number, val: string) => {
    setRefUrls((prev) => prev.map((u, i) => (i === idx ? val : u)));
  };

  const removeUrl = (idx: number) => {
    setRefUrls((prev) =>
      prev.length === 1 ? [""] : prev.filter((_, i) => i !== idx),
    );
  };

  const addUrl = () => setRefUrls((prev) => [...prev, ""]);

  const submit = () => {
    onContinue({
      category: category.trim() || "Auto Insurance",
      industry,
      platforms: Array.from(platforms),
      audience: audience.trim(),
      refUrls: refUrls.map((u) => u.trim()).filter(Boolean),
      affLink: affLink.trim(),
      country: country || undefined,
    });
  };

  return (
    <div className="bg-background">
      <StepNav active={2} mode="affiliate" onBack={onBack} backLabel="Back to Mode" />
      <div className="max-w-[720px] mx-auto px-6 pt-2 pb-10">
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-wider font-mono mb-3 bg-primary/10 border-primary/30 text-foreground"
        >
          Step 3 · Input
        </Badge>
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-foreground shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Tell us what you're{" "}
              <span className="bg-primary/30 px-1.5 rounded">promoting</span>
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1.5">
              We'll build a knowledge base for your category and tailor ad
              angles to your audience.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 mt-7 space-y-6">
          {/* Country (optional) — affiliate offers may run globally, so skip is fine */}
          <div>
            <label
              htmlFor="aff-country"
              className="block text-[13px] font-semibold text-foreground mb-2"
            >
              Country{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Select
              value={country || "__none__"}
              onValueChange={(v) => setCountry(v === "__none__" ? "" : v)}
            >
              <SelectTrigger id="aff-country" className="h-10">
                <SelectValue placeholder="Select a country…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No specific country</SelectItem>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Leave blank if your offer runs globally.
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="aff-category"
              className="block text-[13px] font-semibold text-foreground"
            >
              Category name <span className="text-rose-500">*</span>
            </label>
            <Input
              id="aff-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Auto Insurance"
              className="mt-2 h-10"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Type your own or pick from suggestions.
            </p>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              Industry
            </label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platforms — multi-select pills */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              Where will you post?{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                (select all that apply)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const active = platforms.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlat(p.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-colors border",
                      active
                        ? "bg-primary/20 border-primary/50 text-foreground font-semibold"
                        : "bg-background border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {p.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target audience */}
          <div>
            <label
              htmlFor="aff-audience"
              className="block text-[13px] font-semibold text-foreground"
            >
              Target audience{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Input
              id="aff-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g., homeowners 30–55 looking to save on premiums"
              className="mt-2 h-10"
            />
          </div>

          {/* Reference URLs */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              Reference URLs{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                (optional — competitor pages, your content)
              </span>
            </label>
            <div className="space-y-2">
              {refUrls.map((u, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={u}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="https://..."
                    className="h-9 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeUrl(i)}
                    className="h-9 w-9 shrink-0"
                    aria-label="Remove URL"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addUrl}
                className="gap-1 text-[12px] h-7"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another URL
              </Button>
            </div>
          </div>

          {/* Affiliate link */}
          <div>
            <label
              htmlFor="aff-link"
              className="block text-[13px] font-semibold text-foreground"
            >
              Affiliate link{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                (optional — drives the final CTA)
              </span>
            </label>
            <Input
              id="aff-link"
              value={affLink}
              onChange={(e) => setAffLink(e.target.value)}
              placeholder="https://aff.example.com/..."
              className="mt-2 h-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-7">
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <Button onClick={submit} className="gap-1.5">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

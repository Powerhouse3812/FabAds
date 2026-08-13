import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MobileFlowShell } from "../components/MobileFlowShell";
import { AFFILIATE_INDUSTRIES, AFFILIATE_PLATFORMS, COUNTRIES } from "../data";

export interface MobileAffiliateInputPayload {
  category: string;
  industry: string;
  platforms: string[];
  audience: string;
  refUrls: string[];
  affLink: string;
  countryCode?: string;
}

export interface MobileAffiliateInputProps {
  onClose: () => void;
  onBack: () => void;
  onContinue: (data: MobileAffiliateInputPayload) => void;
  stepIndex: number;
  stepCount: number;
}

/** Radix <Select> forbids an empty value — same sentinel the web step uses. */
const NO_COUNTRY = "__none__";
/** Same fallback the web step uses when Category is left blank. */
const FALLBACK_CATEGORY = "Auto Insurance";

/**
 * Genie step 3 (affiliate) — offer details. Full field set + copy lifted
 * from `src/onboarding-demo/steps/AffiliateInput.tsx`: Category (required),
 * Industry, Country (optional), posting platforms, audience, reference URLs,
 * affiliate link.
 *
 * Kept whole rather than split across screens: only Category is required, so
 * the screen is one short required question followed by optional depth the
 * user can scroll past. Splitting it would turn one skippable scroll into
 * five mandatory taps.
 *
 * <Select> is used for Industry / Country. Radix popovers are explicitly
 * exempt from the no-outside-click-dismiss rule (they are menus, not
 * overlays), and they render as native-feeling sheets on touch, which beats a
 * 20-row inline list for a field most users leave alone.
 */
export function MobileAffiliateInput({
  onClose,
  onBack,
  onContinue,
  stepIndex,
  stepCount,
}: MobileAffiliateInputProps) {
  const [category, setCategory] = useState("");
  const [industry, setIndustry] = useState(AFFILIATE_INDUSTRIES[0]);
  const [countryCode, setCountryCode] = useState<string>(NO_COUNTRY);
  const [platforms, setPlatforms] = useState<string[]>(["Instagram", "TikTok"]);
  const [audience, setAudience] = useState("");
  const [refUrls, setRefUrls] = useState<string[]>([""]);
  const [affLink, setAffLink] = useState("");

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const submit = () => {
    onContinue({
      category: category.trim() || FALLBACK_CATEGORY,
      industry,
      platforms,
      audience: audience.trim(),
      refUrls: refUrls.map((u) => u.trim()).filter(Boolean),
      affLink: affLink.trim(),
      countryCode: countryCode === NO_COUNTRY ? undefined : countryCode,
    });
  };

  return (
    <MobileFlowShell
      eyebrow="Genie setup"
      stepIndex={stepIndex}
      stepCount={stepCount}
      stepLabel="Your offer"
      title={
        <>
          Tell us what you're{" "}
          <span className="rounded bg-primary/30 px-1.5">promoting</span>
        </>
      }
      subtitle="We'll build a knowledge base for your category and tailor ad angles to your audience."
      onBack={onBack}
      onClose={onClose}
      primaryLabel="Continue"
      onPrimary={submit}
      footerNote="Only the category is required — everything else can wait."
    >
      <div className="flex flex-col gap-5">
        {/* Category — the only required field, so it leads. */}
        <div>
          <label
            htmlFor="mob-onb-aff-category"
            className="block text-[13px] font-semibold text-foreground"
          >
            Category name
          </label>
          <Input
            id="mob-onb-aff-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Auto Insurance"
            className="mt-2 h-12 text-[15px]"
            aria-describedby="mob-onb-aff-category-hint"
          />
          <p
            id="mob-onb-aff-category-hint"
            className="mt-1.5 text-[11.5px] text-muted-foreground"
          >
            Leave blank to use the sample category,{" "}
            <span className="font-mono text-foreground/80">{FALLBACK_CATEGORY}</span>.
          </p>
        </div>

        {/* Industry */}
        <div>
          <label
            htmlFor="mob-onb-aff-industry"
            className="mb-2 block text-[13px] font-semibold text-foreground"
          >
            Industry
          </label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger id="mob-onb-aff-industry" className="h-12 text-[15px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AFFILIATE_INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind} className="min-h-11">
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country (optional) */}
        <div>
          <label
            htmlFor="mob-onb-aff-country"
            className="mb-2 block text-[13px] font-semibold text-foreground"
          >
            Country{" "}
            <span className="text-[11.5px] font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger id="mob-onb-aff-country" className="h-12 text-[15px]">
              <SelectValue placeholder="Select a country…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_COUNTRY} className="min-h-11">
                No specific country
              </SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code} className="min-h-11">
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">
            Leave blank if your offer runs globally.
          </p>
        </div>

        {/* Platforms — multi-select pills, thumb-sized. */}
        <div>
          <span className="mb-2 block text-[13px] font-semibold text-foreground">
            Where will you post?{" "}
            <span className="text-[11.5px] font-normal text-muted-foreground">
              (select all that apply)
            </span>
          </span>
          <div role="group" aria-label="Posting platforms" className="flex flex-wrap gap-2">
            {AFFILIATE_PLATFORMS.map((p) => {
              const Icon = p.icon;
              const active = platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "border-primary/50 bg-primary/20 font-semibold text-foreground"
                      : "border-border bg-card text-muted-foreground active:bg-muted",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {p.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target audience */}
        <div>
          <label
            htmlFor="mob-onb-aff-audience"
            className="block text-[13px] font-semibold text-foreground"
          >
            Target audience{" "}
            <span className="text-[11.5px] font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <Input
            id="mob-onb-aff-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., homeowners 30–55 saving on premiums"
            className="mt-2 h-12 text-[15px]"
          />
        </div>

        {/* Reference URLs — repeatable rows. */}
        <div>
          <span className="mb-2 block text-[13px] font-semibold text-foreground">
            Reference URLs{" "}
            <span className="text-[11.5px] font-normal text-muted-foreground">
              (optional — competitor pages, your content)
            </span>
          </span>
          <div className="flex flex-col gap-2">
            {refUrls.map((u, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={u}
                  onChange={(e) =>
                    setRefUrls((prev) =>
                      prev.map((v, j) => (j === i ? e.target.value : v)),
                    )
                  }
                  placeholder="https://..."
                  className="h-12 flex-1 text-[15px]"
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label={`Reference URL ${i + 1}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setRefUrls((prev) =>
                      prev.length === 1 ? [""] : prev.filter((_, j) => j !== i),
                    )
                  }
                  className="h-12 w-12 shrink-0 p-0"
                  aria-label={`Remove reference URL ${i + 1}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRefUrls((prev) => [...prev, ""])}
              className="min-h-11 gap-1.5 self-start px-3 text-[13px]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add another URL
            </Button>
          </div>
        </div>

        {/* Affiliate link */}
        <div>
          <label
            htmlFor="mob-onb-aff-link"
            className="block text-[13px] font-semibold text-foreground"
          >
            Affiliate link{" "}
            <span className="text-[11.5px] font-normal text-muted-foreground">
              (optional — drives the final CTA)
            </span>
          </label>
          <Input
            id="mob-onb-aff-link"
            value={affLink}
            onChange={(e) => setAffLink(e.target.value)}
            placeholder="https://aff.example.com/..."
            className="mt-2 h-12 text-[15px]"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>
    </MobileFlowShell>
  );
}

/**
 * AdContent — the shared ad-copy editor (plan.adCopy), now FORMAT-DEPENDENT to
 * match Meta Ads Manager's real field rules:
 *
 *  • Static (single_image / single_video / flexible): primary text, headline,
 *    description, CTA, destination URL, display link. An "Advantage+ creative —
 *    multiple text options" toggle (adCopy.multiTextEnabled) turns primary /
 *    headline / description into multi-text fields (up to 5 each).
 *  • Carousel: ONE shared primary text + a per-card editor (2–10 cards, each with
 *    media / headline / description / link / CTA → plan.carouselCards).
 *  • Collection: cover media + cover primary text + headline; product grid auto-
 *    fills from catalog; NO destination URL (Instant Experience).
 *
 * In wholeAdMode the creative copy is baked into the selected saved ads, so the
 * text fields are hidden — only ad-level settings (CTA / URL / display link / UTM)
 * are shown.
 */
import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdCopy } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import { CTA_OPTIONS } from "./meta";
import MultiTextField from "./MultiTextField";
import CarouselCardEditor from "./CarouselCardEditor";
import CollectionEditor from "./CollectionEditor";

const GENIE_FILL: Partial<AdCopy> = {
  primaryText: "Tired of the same old routine? Meet the upgrade your day's been missing. Free shipping this week only.",
  headline: "Your new daily essential",
  description: "Loved by 12,000+ customers",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function AdContent({ flow, wholeAdMode = false }: { flow: UseFlowV2; wholeAdMode?: boolean }) {
  const { plan } = flow;
  const copy = plan.adCopy;
  const [advanced, setAdvanced] = useState(false);
  // Two-way display-link toggle: seeded from existing value, but fully controllable.
  const [showDisplayLink, setShowDisplayLink] = useState(!!copy.displayLink);

  const hasSavedAds = plan.creatives.some((c) => c.savedAd || c.itemType === "ad");

  const set = (p: Partial<AdCopy>) => flow.patch({ adCopy: { ...copy, ...p } });

  const format = plan.format;
  const isCarousel = format === "carousel";
  const isCollection = format === "collection";
  // "Static" = single image / video / flexible — the standard field set.
  const isStatic = !isCarousel && !isCollection;

  const multiText = !!copy.multiTextEnabled;

  const toggleDisplayLink = (on: boolean) => {
    setShowDisplayLink(on);
    if (!on) set({ displayLink: "" }); // clearing on toggle-off makes it truly two-way
  };

  // ── CTA select (shared) ──────────────────────────────────────────────────
  const ctaField = (
    <Field label="Call to action">
      <Select value={copy.cta} onValueChange={(v) => set({ cta: v })}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CTA_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-sm">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );

  // ── Display link toggle (shared) ─────────────────────────────────────────
  const displayLinkField = (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">Display link</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground/60">Optional</span>
          <Switch checked={showDisplayLink} onCheckedChange={toggleDisplayLink} className="scale-75" />
        </div>
      </div>
      {showDisplayLink && (
        <Input
          value={copy.displayLink}
          onChange={(e) => set({ displayLink: e.target.value })}
          placeholder="e.g. mamaearth.in"
          className="font-mono text-sm"
        />
      )}
    </div>
  );

  const destinationField = (
    <Field label="Destination URL">
      <Input
        value={copy.destinationUrl}
        onChange={(e) => set({ destinationUrl: e.target.value })}
        placeholder="https://brand.com/landing"
        className="font-mono text-sm"
      />
    </Field>
  );

  const utmField = (
    <Field label="UTM template">
      <Input
        value={copy.utmTemplate}
        onChange={(e) => set({ utmTemplate: e.target.value })}
        placeholder="utm_source={{placement}}&utm_campaign={{campaign.name}}"
        className="font-mono text-[11px]"
      />
    </Field>
  );

  return (
    <div className="space-y-3">
      {/* Pre-filled banner — only for individual media mode */}
      {!wholeAdMode && hasSavedAds && (
        <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-[11px] text-foreground">
          <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
          Copy pre-filled from selected ads — you can edit below.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {wholeAdMode ? "Ad settings" : "Ad content"}
        </h3>
        {!wholeAdMode && !isCollection && (
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => set(GENIE_FILL)}>
            <Sparkles className="h-3 w-3" />
            Use Genie
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {wholeAdMode
          ? "Creative copy is part of your selected ads — set ad-level settings below."
          : isCarousel
            ? "One shared primary text, plus a headline / link / CTA per card."
            : isCollection
              ? "A cover creative opens an Instant Experience; the grid fills from your catalog."
              : "One shared copy block applies to every creative below."}
      </p>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* WHOLE-AD MODE — copy is baked in; only ad-level settings.             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {wholeAdMode ? (
        <>
          {ctaField}
          {displayLinkField}
          {destinationField}
          {utmField}
        </>
      ) : isCollection ? (
        /* ════════════════════════════════════════════════════════════════ */
        /* COLLECTION — cover + grid auto-fill, NO destination URL.          */
        /* ════════════════════════════════════════════════════════════════ */
        <>
          <CollectionEditor flow={flow} creatives={plan.creatives} />
          {ctaField}
          {/* Advanced — UTM only (no destination URL for collection) */}
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="flex w-full items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", advanced && "rotate-180")} />
            Advanced — UTM
          </button>
          {advanced && (
            <div className="rounded-2xl border border-border bg-muted/30 p-3">{utmField}</div>
          )}
        </>
      ) : isCarousel ? (
        /* ════════════════════════════════════════════════════════════════ */
        /* CAROUSEL — shared primary text + per-card editor.                 */
        /* ════════════════════════════════════════════════════════════════ */
        <>
          <Field label="Primary text (shared)">
            <Textarea
              rows={3}
              value={copy.primaryText}
              onChange={(e) => set({ primaryText: e.target.value })}
              placeholder="One hook shown above every card…"
              className="resize-none text-sm"
            />
          </Field>

          <CarouselCardEditor
            cards={plan.carouselCards}
            creatives={plan.creatives}
            onChange={(carouselCards) => flow.patch({ carouselCards })}
          />

          {/* Advanced — UTM */}
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="flex w-full items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", advanced && "rotate-180")} />
            Advanced — UTM
          </button>
          {advanced && (
            <div className="rounded-2xl border border-border bg-muted/30 p-3">{utmField}</div>
          )}
        </>
      ) : (
        /* ════════════════════════════════════════════════════════════════ */
        /* STATIC — single image / video / flexible.                        */
        /* ════════════════════════════════════════════════════════════════ */
        <>
          {/* Advantage+ multiple-text toggle */}
          <div className="flex items-start justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-foreground">Advantage+ creative — multiple text options</p>
              <p className="text-[11px] text-muted-foreground">
                Add up to 5 options each for primary text, headline &amp; description. Meta picks the best per person.
              </p>
            </div>
            <Switch
              checked={multiText}
              onCheckedChange={(on) => set({ multiTextEnabled: on })}
              className="mt-0.5 scale-75"
            />
          </div>

          {multiText ? (
            <>
              <MultiTextField
                label="Primary text"
                value={copy.primaryText}
                variations={copy.textVariations ?? []}
                onValueChange={(v) => set({ primaryText: v })}
                onVariationsChange={(textVariations) => set({ textVariations })}
                placeholder="What's the hook? Lead with the benefit…"
                multiline
                rows={3}
              />
              <MultiTextField
                label="Headline"
                value={copy.headline}
                variations={copy.headlineVariations ?? []}
                onValueChange={(v) => set({ headline: v })}
                onVariationsChange={(headlineVariations) => set({ headlineVariations })}
                placeholder="Short, bold promise"
              />
              <MultiTextField
                label="Description"
                value={copy.description}
                variations={copy.descriptionVariations ?? []}
                onValueChange={(v) => set({ description: v })}
                onVariationsChange={(descriptionVariations) => set({ descriptionVariations })}
                placeholder="Supporting detail"
              />
            </>
          ) : (
            <>
              <Field label="Primary text">
                <Textarea
                  rows={3}
                  value={copy.primaryText}
                  onChange={(e) => set({ primaryText: e.target.value })}
                  placeholder="What's the hook? Lead with the benefit…"
                  className="resize-none text-sm"
                />
              </Field>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Field label="Headline">
                  <Input value={copy.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="Short, bold promise" className="text-sm" />
                </Field>
                <Field label="Description">
                  <Input value={copy.description} onChange={(e) => set({ description: e.target.value })} placeholder="Supporting detail" className="text-sm" />
                </Field>
              </div>
            </>
          )}

          {ctaField}
          {displayLinkField}
          {destinationField}

          {/* Advanced — UTM */}
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="flex w-full items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", advanced && "rotate-180")} />
            Advanced — UTM
          </button>
          {advanced && (
            <div className="rounded-2xl border border-border bg-muted/30 p-3">{utmField}</div>
          )}
        </>
      )}
    </div>
  );
}

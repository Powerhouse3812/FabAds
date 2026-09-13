import { useState } from "react";
import { Check, ImageOff, Layers, Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";
import {
  LIBRARY_HEADLINES,
  LIBRARY_MEDIA,
  LIBRARY_PRIMARY_TEXTS,
  type LibraryAdgroup,
  type LibraryAsset,
  type LibrarySource,
} from "@/mocks/shared/library-items";
import { DUMMY_ADS, type InsightAd } from "@/lib/insights-dummy-data";
import { getDataset, type ReportEntity } from "@/lib/reports-dummy-data";
import { FLOW_MODULES } from "../../flows/data/flowRegistry";
import type { FlowModuleKey, FlowSourceRef } from "../../flows/flowTypes";
import { qualityTier, type MediaType, type OutputData } from "../../types/output";

/**
 * AdgroupCard — one pickable AD, in Meta-ad chrome.
 *
 * Chrome (Sponsored header + avatar + body copy + link strip + CTA pill +
 * selection grammar) is lifted from `studio-v4/components/OutputCardHybrid.tsx`
 * so an ad reads identically wherever it appears. Deliberately WITHOUT that
 * card's footer action bar and Repeat2 variation menu: both navigate away,
 * which is wrong inside a picker.
 *
 * What is new here: a source can be a GROUP of 1-3 media, so the media block
 * is a mosaic, not a single thumbnail (see MediaMosaic).
 *
 * The card takes `AdCardData`, not a Creative-Library row, so the SAME card
 * structure serves all four ad universes (Genie outputs / Creative Library /
 * Industry Insights / Reports) per the owner's ruling. Each universe gets an
 * adapter below; every slot a source genuinely lacks arrives as `null` and
 * renders as the card's existing honest gap (em-dash / "No media" / hashed
 * avatar circle) — nothing is ever invented to fill a hole.
 */

/** The card's slots, normalised. A slot that is genuinely unknown is null —
 *  never a fabricated value. */
export interface AdCardData {
  id: string;
  pageName: string | null; // Sponsored header name
  avatarUrl: string | null; // null → the existing hashed-initial circle
  bodyText: string | null; // primary text
  headline: string | null; // link strip
  domain: string | null; // link strip
  cta: string | null; // CTA pill
  media: string[]; // 0-3 urls; drives the existing mosaic
  qualityScore?: number | null;
  competitor?: boolean; // renders the existing warning-toned chip
  typeLabel?: string | null; // e.g. "Carousel" / "Image" / "Video"

  /* ── Footer identity ──
     The Meta chrome above never shows what the PICKER scans by: the ad's own
     name and where it came from. Optional because the required slots above are
     the contract other modules import; a source with neither still renders a
     complete card (both lines fall back to the em-dash grammar). */
  /** The ad's own name / title, e.g. an adgroup name or a Reports row title. */
  name?: string | null;
  /** Footer kicker — provenance or evidence, short enough for ~195px. */
  provenance?: string | null;
  /** Full-length provenance for the kicker's `title` when the short form clips. */
  provenanceTitle?: string | null;
  favourite?: boolean;
  /** Per-media kind, index-aligned with `media`. Drives the video play badge;
   *  absent entries render as an image. */
  mediaKinds?: ("image" | "video")[];
}

// Copy + media live BY REFERENCE on a library adgroup. Same resolution rule as
// `flows/data/flowSources.ts`'s creativeLibraryRef (id → row, unresolvable ids
// dropped), indexed once at module load because a modal grid resolves ~88 × 3.
// Read-only views of the shared arrays — nothing here mutates or forks them.
const MEDIA_BY_ID = new Map(LIBRARY_MEDIA.map((m) => [m.id, m]));
const TEXT_BY_ID = new Map(
  [...LIBRARY_HEADLINES, ...LIBRARY_PRIMARY_TEXTS].map((t) => [t.id, t.text]),
);

const SOURCE_LABEL: Record<LibrarySource, string> = {
  uploaded: "Uploaded",
  generated: "Generated",
  "pinned-insights": "Pinned from Insights",
  reference: "Brand asset",
  imported: "Imported",
};

/** The footer kicker has ~195px at the proven 240px card width, which the full
 *  label overruns. Short form on the card, full form in its `title`. */
const SOURCE_SHORT: Record<LibrarySource, string> = {
  ...SOURCE_LABEL,
  "pinned-insights": "Insights",
};

const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  image: "Image",
  video: "Video",
  "text-only": "Adcopy",
};

const FLOW_FORMAT_LABEL: Record<
  NonNullable<FlowSourceRef["sourceFormat"]>,
  string
> = {
  image: "Image",
  video: "Video",
  carousel: "Carousel",
  flexible: "Flexible",
};

/** The repo's ONE real brand → domain mapping (`mocks/shared/brands.ts`, which
 *  also builds each brand's favicon logo). `library-items.ts` already derives
 *  its adgroups' `display_link` from the same field, so reading it here follows
 *  an existing rule rather than inventing a `{brand}.com` guess. Keyed on a
 *  punctuation-stripped name because the two mock universes disagree on one
 *  entry ("The Derma Co." vs "The Derma Co"). */
const CATALOGUE_BRAND_BY_NAME = new Map(
  brands.map((b) => [normaliseBrandName(b.name), b]),
);

function normaliseBrandName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function catalogueBrand(name: string | undefined) {
  if (!name?.trim()) return undefined;
  return CATALOGUE_BRAND_BY_NAME.get(normaliseBrandName(name));
}

/** Empty and whitespace-only strings are absent data, not content. */
function text(v: string | undefined | null): string | null {
  const t = v?.trim();
  return t ? t : null;
}

function resolveMedia(adgroup: LibraryAdgroup): LibraryAsset[] {
  return adgroup.media_ids
    .map((id) => MEDIA_BY_ID.get(id))
    .filter((m): m is LibraryAsset => !!m);
}

function resolveText(id: string | null): string | undefined {
  return id ? TEXT_BY_ID.get(id) : undefined;
}

/** Creative Library — the richest source. Id-resolution unchanged. */
export function adCardFromAdgroup(a: LibraryAdgroup): AdCardData {
  const media = resolveMedia(a);
  const count = `${media.length} ${media.length === 1 ? "creative" : "creatives"}`;
  return {
    id: a.id,
    pageName: text(a.page_name),
    avatarUrl: text(a.page_avatar_url),
    bodyText: text(resolveText(a.primary_text_id)),
    headline: text(resolveText(a.headline_id)),
    domain: text(a.display_link) ?? hostOf(a.destination_url) ?? null,
    cta: text(a.cta),
    media: media.map((m) => m.thumbnail_url ?? m.url),
    mediaKinds: media.map((m) => (m.file_type === "video" ? "video" : "image")),
    qualityScore: a.quality_score ?? null,
    // §7.2 — `"pinned-insights"` is defined in library-items.ts as "user
    // pinned a competitor ad from Industry Insights", so the ad on this card
    // IS a rival's. The footer kicker already says "Insights" in 10px mono;
    // the chip is what makes it visible at a glance, which is the whole point
    // of the rule. It changes labelling only — the highlight/entity machinery
    // §7.2 owns is untouched (flowSources.ts's `creativeLibraryRef` note).
    competitor: a.source === "pinned-insights",
    typeLabel: text(a.ad_type),
    name: text(a.name),
    provenance: `${count} · ${SOURCE_SHORT[a.source]}`,
    provenanceTitle: `${a.ad_type} · ${count} · ${SOURCE_LABEL[a.source]}`,
    favourite: a.is_favourite,
  };
}

/**
 * A Genie generation. Every slot but the domain is carried INLINE on the
 * output, so nothing is resolved by id here.
 *
 * Domain: an output has no destination URL, so it comes from the catalogue
 * brand record when the brand name resolves there — the same real mapping
 * library adgroups use — and is `null` otherwise. A guessed `{brand}.com` is
 * a fabricated destination and is never emitted.
 */
export function adCardFromOutput(o: OutputData): AdCardData {
  const brand = catalogueBrand(o.brand?.name);
  return {
    id: o.id,
    pageName: text(o.brand?.name),
    avatarUrl: text(o.brand?.logo) ?? text(brand?.logo),
    bodyText: text(o.body),
    headline: text(o.headline),
    domain: text(brand?.domain),
    cta: text(o.cta),
    media: o.thumbnail ? [o.thumbnail] : [],
    mediaKinds: o.thumbnail
      ? [o.mediaType === "video" ? "video" : "image"]
      : [],
    qualityScore: o.qualityScore ?? null,
    typeLabel: text(o.format) ?? MEDIA_TYPE_LABEL[o.mediaType],
    // The output's own name is its PRODUCT when it has one. A brand-level ad
    // genuinely has no name — echoing the brand here would just repeat the
    // Sponsored header.
    name: text(o.product?.name),
    provenance: "Genie output",
  };
}

/** The copy slots, decided PER SOURCE MODULE. A `FlowSourceRef` is a pointer
 *  (module + id) into a module's own rows, and what its `title` means differs
 *  by module: Industry Insights puts the ad's PRIMARY TEXT there, Reports puts
 *  an ad name or — when there is none — the headline, and everyone else puts a
 *  name or a signal title. So the mapping is a per-module branch, never one
 *  blanket rule, and a module with no honest source for a slot leaves it null
 *  for the card's own em-dash / ghost-CTA grammar to render. */
interface RefCopy {
  /** null → the caller falls back to `sourceBrandName`. */
  pageName: string | null;
  avatarUrl: string | null;
  bodyText: string | null;
  headline: string | null;
  domain: string | null;
  cta: string | null;
  /** The ad's own NAME. Null wherever the module's `title` is the ad's COPY
   *  (now shown in the Meta slots above) — reprinting that sentence in the
   *  footer would say the same thing twice. */
  name: string | null;
}

/** Industry Insights rows, indexed on BOTH ids a ref can carry (`resolveLazySource`
 *  in flowSources.ts matches `a.id` or `a.adId`). Lazy + memoised: an
 *  Insights card is the first thing that needs it, and a picker resolves ~6
 *  per open against 800 rows. */
let INSIGHT_AD_BY_ID: Map<string, InsightAd> | null = null;
function insightAd(id: string): InsightAd | undefined {
  if (!INSIGHT_AD_BY_ID) {
    INSIGHT_AD_BY_ID = new Map();
    for (const ad of DUMMY_ADS) {
      INSIGHT_AD_BY_ID.set(ad.id, ad);
      INSIGHT_AD_BY_ID.set(ad.adId, ad);
    }
  }
  return INSIGHT_AD_BY_ID.get(id);
}

/** Reports ad rows, same treatment. `getDataset(0)` is itself cached per seed
 *  in reports-dummy-data.ts, so this only indexes what is already built. */
let REPORT_AD_BY_ID: Map<string, ReportEntity> | null = null;
function reportAd(id: string): ReportEntity | undefined {
  if (!REPORT_AD_BY_ID) {
    REPORT_AD_BY_ID = new Map(
      getDataset(0)
        .filter((e) => e.level === "ad" && !!e.creative)
        .map((e) => [e.id, e]),
    );
  }
  return REPORT_AD_BY_ID.get(id);
}

/** §7.2 is a MODULE-level fact (`FlowModule.competitorOwned`), so the registry
 *  — not a caller — is what decides whether a ref's card is a rival's ad. */
const COMPETITOR_MODULES = new Set<FlowModuleKey>(
  FLOW_MODULES.filter((m) => m.competitorOwned).map((m) => m.key),
);

function refCopy(r: FlowSourceRef): RefCopy {
  const empty: RefCopy = {
    pageName: null,
    avatarUrl: null,
    bodyText: null,
    headline: null,
    domain: null,
    cta: null,
    name: null,
  };

  if (r.module === "industry-insights") {
    // The ref's `title` IS this ad's primary text (flowSources.ts's
    // `insightsRef`), so throwing it away rendered the body slot as "—" while
    // the real copy sat in the footer. The row itself carries the three slots
    // the ref never had — headline, CTA and the ad's own destination domain.
    // Reading THAT domain is the opposite of the mistake §7.2 warns about:
    // the danger is resolving a rival's name against OUR catalogue records,
    // not showing the rival's ad as the rival's ad (which the Competitor chip
    // states outright).
    const ad = insightAd(r.id);
    if (!ad) {
      // Row gone (a hand-edited ref id): still the ad's own copy, just the
      // single line the ref preserved.
      return { ...empty, bodyText: text(r.title) };
    }
    return {
      pageName: text(ad.pageName),
      avatarUrl: text(ad.pageAvatar),
      bodyText: text(ad.primaryText),
      headline: text(ad.headline),
      domain: text(ad.domain),
      cta: text(ad.cta),
      // An Ad-Library ad has no name of its own; its identity is its copy.
      name: null,
    };
  }

  if (r.module === "reports") {
    const e = reportAd(r.id);
    const c = e?.creative;
    if (!c) return { ...empty, name: text(r.title) };
    return {
      // A Reports creative has no page, no CTA and no destination URL at all
      // (`CreativeData` in reports-dummy-data.ts) — and its advertiser is an
      // AD ACCOUNT, which is exactly what `sourceBrandName` already carries,
      // so the caller's fallback is the honest page line here.
      pageName: null,
      avatarUrl: null,
      bodyText: text(c.primaryText),
      headline: text(c.headline),
      domain: null,
      cta: null,
      // Only a launch-distributed ad genuinely has a name; on every other row
      // the ref's `title` fell back to the headline, which is now in the link
      // strip where it belongs.
      name: text(e?.sourceAdName),
    };
  }

  // Video Sage / Trends / Dashboard / Campaign URLs / Creative Library refs:
  // `title` is a name or a signal headline and `subtitle` is evidence ABOUT
  // the ad, never its copy. Presenting either as primary text would put words
  // in the ad's mouth, so the copy slots stay empty.
  return { ...empty, name: text(r.title) };
}

/**
 * A reference the user picked inside another module (Industry Insights,
 * Reports, Dashboard, Video Sage…). The ref itself is thin — a title, an
 * evidence subtitle, one thumbnail and the owning brand — but it names its
 * module and its row, so the copy slots are filled from that row wherever the
 * module genuinely holds copy (`refCopy` above). Nothing is invented: a slot
 * with no honest source stays null and renders as the card's existing gap.
 */
export function adCardFromFlowRef(r: FlowSourceRef): AdCardData {
  const metrics = r.metrics?.map((m) => `${m.label} ${m.value}`).join(" · ");
  const subtitle = text(r.subtitle);
  const copy = refCopy(r);
  return {
    id: r.id,
    pageName: copy.pageName ?? text(r.sourceBrandName),
    avatarUrl: copy.avatarUrl,
    bodyText: copy.bodyText,
    headline: copy.headline,
    domain: copy.domain,
    cta: copy.cta,
    media: r.thumbnail ? [r.thumbnail] : [],
    mediaKinds: r.thumbnail
      ? [r.sourceFormat === "video" ? "video" : "image"]
      : [],
    qualityScore: null,
    // Derived, not caller-supplied: Industry Insights marks competitor
    // ownership at MODULE level, so reading `r.competitorOwned` alone dropped
    // the §7.2 chip from every card in that universe unless a caller
    // remembered to force it back on.
    competitor: Boolean(r.competitorOwned) || COMPETITOR_MODULES.has(r.module),
    typeLabel: r.sourceFormat ? FLOW_FORMAT_LABEL[r.sourceFormat] : null,
    name: copy.name,
    provenance: subtitle,
    provenanceTitle: [subtitle, metrics].filter(Boolean).join(" · ") || null,
  };
}

export interface AdgroupCardProps {
  data: AdCardData;
  selected?: boolean;
  onToggleSelect?: () => void;
  onClick?: () => void;
  className?: string;
}

export function AdgroupCard({
  data,
  selected,
  onToggleSelect,
  onClick,
  className,
}: AdgroupCardProps) {
  const [avatarBroken, setAvatarBroken] = useState(false);

  const { media, pageName, headline, bodyText, cta, domain } = data;
  const tier = qualityTier(data.qualityScore ?? undefined);
  const showAvatarImg = !!data.avatarUrl && !avatarBroken;
  const initial = pageName?.charAt(0).toUpperCase();
  const label = data.name ?? pageName ?? "this ad";

  const face = (
    <>
      {/* Sponsored header — avatar + page name */}
      <div className="flex items-center gap-2 border-b border-g6-border-secondary px-3 py-1.5">
        {showAvatarImg ? (
          <img
            src={data.avatarUrl ?? undefined}
            alt=""
            loading="lazy"
            onError={() => setAvatarBroken(true)}
            className="h-6 w-6 shrink-0 rounded-g6-pill object-cover"
          />
        ) : initial ? (
          <span
            aria-hidden="true"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-g6-pill font-g6-sans text-[9px] font-bold text-white"
            style={{ backgroundColor: stringToHsl(pageName ?? "") }}
          >
            {initial}
          </span>
        ) : (
          // No page name at all — an empty neutral circle, not a fabricated
          // initial from some other field.
          <span
            aria-hidden="true"
            className="h-6 w-6 shrink-0 rounded-g6-pill border border-g6-border bg-g6-bg-muted"
          />
        )}
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate font-g6-sans text-[12px] font-semibold leading-4",
              pageName ? "text-g6-text" : "text-g6-text-tertiary",
            )}
          >
            {pageName ?? "—"}
          </span>
          <span className="block font-g6-sans text-[10px] leading-4 text-g6-text-tertiary">
            Sponsored
          </span>
        </span>
      </div>

      {/* Primary text — 2 lines, then clamp */}
      <div className="px-3 py-1.5">
        <p
          className={cn(
            "line-clamp-2 min-h-[32px] font-g6-sans text-[11px] leading-4",
            bodyText ? "text-g6-text" : "text-g6-text-tertiary",
          )}
        >
          {bodyText ?? "—"}
        </p>
      </div>

      {/* Media mosaic + overlays */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-g6-bg-muted">
        <MediaMosaic media={media} kinds={data.mediaKinds} />
        {/* Stacked, not both at left-2 top-2: at 240px a quality badge and a
            competitor chip cannot share the same corner. */}
        {(tier || data.competitor) && (
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {tier && data.qualityScore != null && (
              <span
                className={cn(
                  "rounded-g6-pill border border-g6-border bg-g6-bg-container px-1.5 py-0.5 font-g6-mono text-[10px] font-bold uppercase tracking-wider",
                  tier === "success" && "text-g6-success",
                  tier === "warning" && "text-g6-warning",
                  tier === "error" && "text-g6-error",
                )}
                title={`Quality score: ${data.qualityScore}`}
              >
                Q-{data.qualityScore}
              </span>
            )}
            {/* §7.2 — a rival's ad must be visibly marked ON the card, not only
                in the picker's chip row. Same warning tone as that chip. */}
            {data.competitor && (
              <span
                // Warning tone like the picker's chip, but on the OPAQUE
                // container fill the quality badge uses: that chip's 10%
                // wash sits on a page background, here it sits on a photo
                // and stops being readable.
                className="rounded-g6-pill border border-warning-text/40 bg-g6-bg-container px-1.5 py-0.5 font-g6-mono text-[10px] font-bold uppercase tracking-wider text-warning-text"
                title="Competitor ad — variations are built for your own brand"
              >
                Competitor
              </span>
            )}
          </div>
        )}
        {/* Accent AT REST — on single-media cards too. Suppressed at zero media
            so it can't announce "Carousel" over a "No media" placeholder. */}
        {media.length > 0 && (
          // Bottom-left, not top-right: at 240px the quality badge and a
          // "3 creatives" chip cannot share the top row without colliding.
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-1.5 py-0.5 font-g6-mono text-[10px] font-bold uppercase tracking-wider text-g6-primary-active">
            {media.length > 1 && <Layers className="h-3 w-3" aria-hidden="true" />}
            {media.length > 1
              ? `${media.length} creatives`
              : (data.typeLabel ?? "1 creative")}
          </span>
        )}
      </div>

      {/* Link strip — headline + domain */}
      <div className="border-t border-g6-border-secondary bg-g6-bg-muted px-3 py-1.5">
        <p
          className={cn(
            "truncate font-g6-sans text-[11px] font-semibold leading-4",
            headline ? "text-g6-text" : "text-g6-text-tertiary",
          )}
        >
          {headline ?? "—"}
        </p>
        <p className="mt-0.5 truncate font-g6-mono text-[10px] uppercase leading-4 tracking-wider text-g6-text-tertiary">
          {domain ?? "—"}
        </p>
      </div>

      {/* CTA pill — lime at rest, matching a real Meta CTA button. The ROW is
          unconditional even when the source has no CTA (every FlowSourceRef),
          so the card's height is identical across all four universes and a
          modal grid stays aligned; the absent pill uses the same em-dash
          grammar as the copy slots rather than inventing a button label. */}
      <div className="flex justify-end border-t border-g6-border-secondary px-3 py-1.5">
        {cta ? (
          // `border-transparent` is load-bearing, not decoration: it matches the
          // 1px the absent-CTA pill below spends on its dashed border, so a
          // card with a CTA and one without are the same height to the pixel.
          <span className="inline-flex items-center rounded-g6-sm border border-transparent bg-g6-primary px-3 py-1 font-g6-sans text-[10px] font-bold leading-4 text-g6-text-on-accent">
            {cta}
          </span>
        ) : (
          <span
            className="inline-flex items-center rounded-g6-sm border border-dashed border-g6-border px-3 py-1 font-g6-sans text-[10px] font-bold leading-4 text-g6-text-tertiary"
            title="This source carries no call-to-action"
          >
            —
          </span>
        )}
      </div>

      {/* Identity — the ad's own name, which the Meta chrome above never shows,
          plus its provenance. This is what a picker scans by. */}
      <div className="flex items-start gap-1.5 border-t border-g6-border-secondary px-3 py-2">
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate font-g6-sans text-[12px] font-medium leading-5",
              data.name ? "text-g6-text" : "text-g6-text-tertiary",
            )}
          >
            {data.name ?? "—"}
          </span>
          <span
            title={data.provenanceTitle ?? data.provenance ?? undefined}
            className="block truncate font-g6-mono text-[10px] uppercase leading-4 tracking-wider text-g6-text-tertiary"
          >
            {data.provenance ?? "—"}
          </span>
        </span>
        {data.favourite && (
          <Star
            className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-g6-primary text-g6-primary"
            aria-label="Favourite"
          />
        )}
      </div>
    </>
  );

  const faceClass = cn(
    "flex w-full flex-col overflow-hidden rounded-g6-card border bg-g6-bg-container text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
    selected
      ? "border-g6-primary-border shadow-g6-md ring-2 ring-g6-primary-border"
      : "border-g6-border-secondary hover:shadow-g6-md",
  );

  return (
    <div className={cn("group relative", className)}>
      {onClick ? (
        <button type="button" onClick={onClick} className={faceClass}>
          {face}
        </button>
      ) : (
        <div className={faceClass}>{face}</div>
      )}

      {/* Selection checkbox — sibling of the face, never nested inside it, so
          both stay real focusable buttons. Same reveal grammar as
          OutputCardHybrid: hidden until hover unless selected. */}
      {onToggleSelect && (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-pressed={!!selected}
          aria-label={selected ? `Deselect ${label}` : `Select ${label}`}
          className={cn(
            "absolute right-2 top-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-g6-xs border transition-opacity focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-g6-primary-border",
            selected
              ? "border-g6-primary-border bg-g6-primary text-g6-text-on-accent opacity-100"
              : "border-g6-border bg-g6-bg-container opacity-0 group-hover:opacity-100",
          )}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
      )}
    </div>
  );
}

/**
 * MediaMosaic — the group-specific part.
 *
 * 1 media renders full-bleed (identical to OutputCardHybrid). 2 and 3 render as
 * a mosaic inside the SAME aspect-[4/5] box — halves for 2, hero-over-pair for
 * 3 — chosen over a peeking carousel strip because every creative stays fully
 * visible and countable at a glance, and over a thumbnail rail because the box
 * height never changes with N, so a modal grid stays aligned. `object-cover`
 * throughout: media crops, it never stretches.
 */
function MediaMosaic({
  media,
  kinds,
}: {
  media: string[];
  kinds?: ("image" | "video")[];
}) {
  const tile = (i: number, overlay?: string) => (
    <MediaTile src={media[i]} kind={kinds?.[i]} overlay={overlay} />
  );

  if (media.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-g6-text-tertiary">
        <ImageOff className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
        <span className="font-g6-mono text-[10px] uppercase tracking-wider">
          No media
        </span>
      </div>
    );
  }

  if (media.length === 1) {
    return tile(0);
  }

  if (media.length === 2) {
    return (
      <div className="flex h-full w-full flex-col gap-0.5">
        <div className="min-h-0 flex-1">{tile(0)}</div>
        <div className="min-h-0 flex-1">{tile(1)}</div>
      </div>
    );
  }

  // 3+ — hero over a pair. media caps at 3 today; a 4th+ collapses into a
  // "+N" badge rather than shrinking the mosaic further.
  const extra = media.length - 3;
  return (
    <div className="flex h-full w-full flex-col gap-0.5">
      <div className="min-h-0 flex-[3]">{tile(0)}</div>
      <div className="flex min-h-0 flex-[2] gap-0.5">
        <div className="min-w-0 flex-1">{tile(1)}</div>
        <div className="min-w-0 flex-1">
          {tile(2, extra > 0 ? `+${extra}` : undefined)}
        </div>
      </div>
    </div>
  );
}

function MediaTile({
  src,
  kind,
  overlay,
}: {
  src: string;
  kind?: "image" | "video";
  overlay?: string;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-g6-bg-muted">
      {broken ? (
        <div className="flex h-full w-full items-center justify-center text-g6-text-tertiary">
          <ImageOff className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </div>
      ) : (
        // Decorative: the card's own name / copy lines already carry the ad's
        // meaning, and a normalised source has no per-file caption to quote.
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      )}
      {kind === "video" && (
        <span className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-g6-pill border border-g6-border bg-g6-bg-container text-g6-text">
          <Play className="h-2.5 w-2.5 fill-current" aria-label="Video" />
        </span>
      )}
      {overlay && (
        <span className="absolute inset-0 flex items-center justify-center bg-g6-bg-container font-g6-mono text-[13px] font-bold text-g6-text">
          {overlay}
        </span>
      )}
    </div>
  );
}

/** Deterministic HSL from a string — same avatar colour every render.
 *  Copied from OutputCardHybrid so a page's fallback circle matches there. */
function stringToHsl(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 45%)`;
}

/** Display domain when `display_link` is absent — never render a raw URL. */
function hostOf(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

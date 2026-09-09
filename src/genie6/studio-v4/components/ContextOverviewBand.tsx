import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ImageOff,
  Link2,
  PanelRight,
  Sparkles,
  Tag as TagIcon,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shortUrl } from "@/mocks/shared";
import type { UseWizardReturn } from "../state/useWizard";
import type { AlphaMode } from "../screens/StudioHome";
import { useStudioContextSummary } from "../state/useContextSummary";
import { Chip, KbMetricPill } from "./ContextRail";

/**
 * ContextOverviewBand — the SECOND presentation of the wizard's Overview.
 *
 * `ContextRail` is the 300px right-hand aside. This is the same information,
 * re-laid-out as a full-width horizontal band that sits ABOVE the step content
 * so the step's own column can widen into the freed space. It is a
 * re-presentation, NOT a new feature: every value below comes from
 * `useStudioContextSummary()` (the one place that derives brand / product /
 * category / readiness / KB counts) or straight off `wizard.state`. Nothing is
 * re-derived here — that duplication is exactly the defect the shared hook
 * exists to prevent, and the rail and the band must never be able to disagree
 * about whether a run is ready.
 *
 * Anatomy (adapted from the owner's two reference screenshots):
 *   1. Identity row   — avatars + "Brand / Product" + mono entity line, with
 *                       the readiness pill and the "switch to rail" control
 *                       right-aligned.
 *   2. Stat strip     — divided columns, each a tiny uppercase mono label over
 *                       a larger value (Ad type · Mode · Format · Angle ·
 *                       Concepts · Outputs, plus co-stars when there are any).
 *   3. KB strip       — Instructions / Winner Ads / References, horizontal,
 *                       with the reference chips inline.
 *   4. More details   — optional, explicitly toggled disclosure holding the
 *                       Brand / Product / Angle detail as a horizontal grid.
 *
 * Owns no page-level positioning: it fills whatever column mounts it. Desktop
 * chrome — dark mode and mobile are explicit non-goals for this release, so
 * there is no viewport branching in here.
 */
interface ContextOverviewBandProps {
  wizard: UseWizardReturn;
  studioMode?: AlphaMode;
  /** Renders the "Switch to rail" control. Optional so a surface that owns its
   *  own variant switching can mount the band without a second one. */
  onSwitchToRail?: () => void;
}

export function ContextOverviewBand({
  wizard,
  studioMode,
  onSwitchToRail,
}: ContextOverviewBandProps) {
  const { state } = wizard;
  const s = useStudioContextSummary(wizard, studioMode);

  // Local, not URL-backed on purpose. The rail's disclosure already owns
  // `?more=` with "absent = open"; the band wants "absent = closed" (an
  // open-by-default band is tall, which defeats the point of freeing the
  // step's column). Two opposite defaults on one param is a trap, so the band
  // keeps its own state. It is an explicit control either way — app-wide rule:
  // disclosures never close on outside click.
  const [moreOpen, setMoreOpen] = useState(false);

  const conceptCount = state.selectedConceptIds.length;
  const coStarCount = state.bulkProductIds.length;

  return (
    <section
      aria-label="Run overview"
      className="v3-glass w-full rounded-3xl px-4 py-3.5"
    >
      {/* ── 1 · Identity row ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <IdentityAvatars
          brandName={s.brand?.name ?? null}
          brandLogo={s.brand?.logo ?? null}
          productName={s.selectedProduct?.name ?? null}
          productThumb={s.selectedProduct?.thumbnail ?? null}
          hasUploadedImage={s.hasUploadedImage}
          uploadedImageUrl={s.uploadedImageUrl}
        />

        <div className="min-w-0 flex-1">
          {/* 60+ char product names are normal in the catalogue — one line,
              truncated, full text on hover. Never let the identity row set
              the band's height. */}
          <p
            title={s.titleText}
            className="truncate text-[15px] font-bold leading-tight text-foreground"
          >
            {s.titleText}
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            {/* Reference A's mono ID line. The KB entity is the honest analog:
                it is what every instruction / winner / reference below is
                actually keyed on. */}
            <span className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              {s.entity
                ? `${s.entity.type} · ${s.entity.id}`
                : "No entity selected yet"}
            </span>
            {s.category && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground">
                <TagIcon className="h-2 w-2" />
                <span className="max-w-[140px] truncate">{s.category.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right-aligned status + actions — Reference A's identity row. */}
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
              s.readinessTone === "ready"
                ? "border-border/50 bg-foreground/[0.06] text-foreground"
                : "border-warning-text/30 bg-warning-text/10 text-warning-text",
            )}
          >
            {s.readinessTone === "ready" && (
              <Check className="h-3 w-3" strokeWidth={3} />
            )}
            {s.readinessCaption}
          </span>
          {onSwitchToRail && (
            <button
              type="button"
              onClick={onSwitchToRail}
              aria-label="Switch overview to the side rail"
              title="Switch overview to the side rail"
              className="group inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 ease-out hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <PanelRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 2 · Stat strip ─────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap overflow-hidden rounded-2xl border border-border/50 bg-card/50">
        {/* §5 — the ad type is the Step-2 tab the user is on, never the Mode.
            The hook resolves it; both surfaces read the same answer. */}
        <StatCell label="Ad type" value={s.adTypeLabel} placeholder="Pending" accent />
        {/* Explicitly labelled in the rail for the same reason it is a separate
            column here: an unlabelled Mode reading "Product Ad" next to the
            Category tab was the original misread. */}
        <StatCell label="Mode" value={s.modeText} placeholder="Pending" />
        <StatCell label="Format" value={s.formatText} placeholder="Pending" />
        {/* Angle always carries a real answer — an explicit pick or the Auto
            default — so it is never a dashed placeholder. */}
        <StatCell
          label="Angle"
          value={s.angleText ?? "Auto"}
          muted={s.isAngleAuto}
        />
        <StatCell
          label="Concepts"
          value={conceptCount > 0 ? String(conceptCount) : "Auto"}
          muted={conceptCount === 0}
        />
        {/* §5 — the stepper owns `count`; the band only mirrors it. */}
        <StatCell label="Outputs" value={String(state.count)} />
        {/* §9 — co-stars: one ad with N products, not N ads. Only a column
            when there actually are some. */}
        {coStarCount > 0 && (
          <StatCell
            label="Also in ad"
            value={`+${coStarCount} product${coStarCount > 1 ? "s" : ""}`}
            accent
          />
        )}
      </div>

      {/* ── 3 · Knowledge-base strip ───────────────────────────────────── */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <BlockLabel>Knowledge base</BlockLabel>
        <div className="flex items-center gap-1.5">
          <KbMetricPill icon={BookOpen} count={s.instructionsCount} label="Instr." />
          <KbMetricPill icon={Trophy} count={s.winners.length} label="Winners" />
          <KbMetricPill icon={Link2} count={s.refs.length} label="Refs" />
        </div>

        {s.refs.length > 0 && (
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {s.refs.slice(0, 4).map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                title={r.label}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card px-1.5 py-0.5 text-[9px] font-medium text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:text-foreground"
              >
                <span className="max-w-[120px] truncate">{shortUrl(r.url)}</span>
                <ExternalLink className="h-2 w-2 shrink-0" />
              </a>
            ))}
            {s.refs.length > 4 && (
              <span className="inline-flex items-center rounded-full bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                +{s.refs.length - 4}
              </span>
            )}
          </div>
        )}

        {!s.entity && (
          <span className="text-[11px] italic text-muted-foreground">
            Pick a brand / product / category to surface KB context.
          </span>
        )}

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/40 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-foreground/[0.04]"
        >
          More details
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform duration-300",
              moreOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* ── 4 · More details — horizontal grid, explicit toggle only ───── */}
      {moreOpen && (
        <div className="mt-2.5 space-y-2.5 border-t border-border/40 pt-2.5">
          <div className="grid grid-cols-3 gap-2.5">
            <BrandBlock brand={s.brand} />
            <ProductBlock
              product={s.selectedProduct}
              category={s.category}
              hasUploadedImage={s.hasUploadedImage}
              uploadedImageUrl={s.uploadedImageUrl}
            />
            <AngleBlock isAuto={s.isAngleAuto} label={s.angleText} />
          </div>

          {s.otherProducts.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-border/50 bg-background/40 p-2.5">
              <BlockLabel>Related products · {s.otherProducts.length}</BlockLabel>
              <div className="flex flex-wrap gap-1.5">
                {s.otherProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => wizard.set("productId", p.id)}
                    title={`Switch to ${p.name}`}
                    className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-border/50 bg-card py-0.5 pl-0.5 pr-2 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                  >
                    {p.thumbnail ? (
                      <img
                        src={p.thumbnail}
                        alt=""
                        className="h-5 w-5 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] text-muted-foreground">
                        —
                      </span>
                    )}
                    <span className="truncate text-[10px] font-medium text-foreground">
                      {p.name}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
                      {p.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ContextOverviewBand;

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function BlockLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * One divided column of the stat strip: tiny uppercase mono micro-label above
 * its value. `placeholder` is what a not-yet-answered column says — it stays a
 * full-height column so the strip never turns into a ragged row of gaps in the
 * zero-data state.
 */
function StatCell({
  label,
  value,
  placeholder,
  accent,
  muted,
}: {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  /** Answered values that matter most to the run read in the primary accent. */
  accent?: boolean;
  /** A real but defaulted answer (Auto) — present, just not chosen. */
  muted?: boolean;
}) {
  const pending = !value;
  const shown = value ?? placeholder ?? "—";
  return (
    <div className="min-w-[104px] flex-1 border-l border-border/50 px-3 py-2 first:border-l-0">
      <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span
        title={shown}
        className={cn(
          "mt-0.5 block truncate text-[13px] font-semibold leading-tight",
          pending
            ? "text-muted-foreground/60"
            : accent
              ? "text-primary"
              : muted
                ? "text-muted-foreground"
                : "text-foreground",
        )}
      >
        {shown}
      </span>
    </div>
  );
}

/**
 * Brand circle + product thumb, overlapped to spend less of the band's width
 * than the rail's side-by-side pair. Same fallback ladder as the rail:
 * product thumbnail → resolved uploaded image → an honest "needs re-upload"
 * tile when the token no longer resolves → em-dash tile. A broken <img src>
 * is never rendered.
 */
function IdentityAvatars({
  brandName,
  brandLogo,
  productName,
  productThumb,
  hasUploadedImage,
  uploadedImageUrl,
}: {
  brandName: string | null;
  brandLogo: string | null;
  productName: string | null;
  productThumb: string | null;
  hasUploadedImage: boolean;
  uploadedImageUrl?: string;
}) {
  return (
    <div className="flex shrink-0 items-center">
      {brandLogo ? (
        <img
          src={brandLogo}
          alt={brandName ?? "Brand"}
          className="h-10 w-10 rounded-full border border-border/50 bg-card object-contain"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card text-sm font-bold text-foreground">
          {brandName?.charAt(0) ?? "—"}
        </div>
      )}
      {productThumb ? (
        <img
          src={productThumb}
          alt={productName ?? "Product"}
          className="-ml-2.5 h-10 w-10 rounded-lg border border-border/50 object-cover ring-2 ring-background"
        />
      ) : uploadedImageUrl ? (
        <img
          src={uploadedImageUrl}
          alt="Uploaded product"
          className="-ml-2.5 h-10 w-10 rounded-lg border border-border/50 object-cover ring-2 ring-background"
        />
      ) : hasUploadedImage ? (
        <div
          className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-warning-text/40 bg-muted text-muted-foreground ring-2 ring-background"
          title="Uploaded image needs re-uploading"
        >
          <ImageOff className="h-4 w-4" />
        </div>
      ) : (
        <div className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-muted text-xs text-muted-foreground ring-2 ring-background">
          —
        </div>
      )}
    </div>
  );
}

/* ── More details · Brand ───────────────────────────────── */

function BrandBlock({
  brand,
}: {
  brand: ReturnType<typeof useStudioContextSummary>["brand"];
}) {
  if (!brand) {
    return (
      <EmptyBlock label="Brand" copy="Pick a brand to fill this in." />
    );
  }
  return (
    <Link
      to={`/catalogue/brands/${brand.id}`}
      className="group block rounded-xl border border-border/50 bg-background/40 p-2.5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2.5">
        {brand.logo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            className="h-8 w-8 shrink-0 rounded-lg border border-border/40 bg-card object-contain p-0.5"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card text-[11px] font-bold text-foreground">
            {brand.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-foreground">
            {brand.name}
          </p>
          <p className="truncate font-mono text-[9px] text-muted-foreground">
            {brand.domain}
          </p>
        </div>
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
      </div>

      {brand.colors.length > 0 && (
        <div className="mb-2 flex items-center gap-1">
          {brand.colors.slice(0, 5).map((c) => (
            <span
              key={c}
              title={c}
              className="inline-block h-3.5 w-3.5 rounded-full border border-border/40"
              /* Brand palette is DATA, not a design token — the swatch has to
                 paint the brand's own colour, same as the rail does. */
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {brand.tone && (
          <Chip filled accent>
            {brand.tone.length > 40 ? `${brand.tone.slice(0, 40)}…` : brand.tone}
          </Chip>
        )}
        {brand.usps.slice(0, 3).map((u) => (
          <Chip key={u} filled>
            {u}
          </Chip>
        ))}
      </div>
    </Link>
  );
}

/* ── More details · Product ─────────────────────────────── */

function ProductBlock({
  product,
  category,
  hasUploadedImage,
  uploadedImageUrl,
}: {
  product: ReturnType<typeof useStudioContextSummary>["selectedProduct"];
  category: ReturnType<typeof useStudioContextSummary>["category"];
  hasUploadedImage: boolean;
  uploadedImageUrl?: string;
}) {
  if (!product) {
    // §21.2's third route — brand + one uploaded image, no catalogue product.
    if (hasUploadedImage) {
      return (
        <div className="rounded-xl border border-border/50 bg-background/40 p-2.5">
          <div className="flex items-start gap-2.5">
            {uploadedImageUrl ? (
              <img
                src={uploadedImageUrl}
                alt="Uploaded product"
                className="h-10 w-10 shrink-0 rounded-lg border border-border/40 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-warning-text/40 bg-muted text-muted-foreground">
                <ImageOff className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <BlockLabel>Product</BlockLabel>
              <p className="mt-0.5 text-[11px] font-medium text-foreground">
                {uploadedImageUrl ? "Uploaded image" : "Image needs re-uploading"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {uploadedImageUrl
                  ? "Not in the Catalogue — brand + image only."
                  : "This session's upload didn't survive the reload."}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return <EmptyBlock label="Product" copy="Pick a product to fill this in." />;
  }
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-2.5">
      <div className="mb-2 flex items-start gap-2.5">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="h-10 w-10 shrink-0 rounded-lg border border-border/40 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted text-[11px] text-muted-foreground">
            —
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            title={product.name}
            className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground"
          >
            {product.name}
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <span className="inline-flex shrink-0 items-center rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground">
              {product.price}
            </span>
            {category && (
              <Link
                to={`/catalogue/categories/${category.id}`}
                className="inline-flex min-w-0 items-center gap-0.5 rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground hover:bg-primary/15 hover:text-primary"
              >
                <TagIcon className="h-2 w-2 shrink-0" />
                <span className="truncate">{category.name}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {product.benefits.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {product.benefits.slice(0, 3).map((b) => (
            <Chip key={b} filled>
              {b}
            </Chip>
          ))}
          {product.benefits.length > 3 && (
            <Chip filled>+{product.benefits.length - 3}</Chip>
          )}
        </div>
      )}

      {product.promo && (
        <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[10px] text-primary">
          <Sparkles className="h-2.5 w-2.5 shrink-0" />
          <span className="line-clamp-1 italic">{product.promo}</span>
        </div>
      )}
    </div>
  );
}

/* ── More details · Angle + Concept ─────────────────────── */

/** Read-only. Angle/Concept are edited on Configure — the band mirrors the
 *  run, it is not a second editor for it. */
function AngleBlock({ isAuto, label }: { isAuto: boolean; label: string | null }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <BlockLabel>Angle + Concept</BlockLabel>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
            isAuto
              ? "border border-border/50 bg-card text-muted-foreground"
              : "border border-primary/30 bg-primary/15 text-primary",
          )}
        >
          {isAuto ? "Auto" : "Set"}
        </span>
      </div>
      <p className="truncate text-[11px] font-medium text-foreground">
        {label ?? "Auto"}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {isAuto
          ? "Genie picks the strongest angle for this ad — pick one on Configure to lock it in."
          : "Locked in for this generation — change it any time on Configure."}
      </p>
    </div>
  );
}

/** Zero-data block. Dashed, deliberate, same height rhythm as a filled one —
 *  an un-picked entity must read as "not yet", never as a rendering failure. */
function EmptyBlock({ label, copy }: { label: string; copy: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/50 bg-background/30 px-3 py-2.5">
      <BlockLabel>{label}</BlockLabel>
      <p className="mt-1 text-[11px] italic text-muted-foreground">{copy}</p>
    </div>
  );
}

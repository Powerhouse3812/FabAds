import type { ElementType, ReactNode } from "react";
import {
  Check,
  ExternalLink,
  Palette,
  Sparkles,
  Tag,
  Target,
  Type as TypeIcon,
  Users,
} from "lucide-react";
import { MobileFlowShell } from "../components/MobileFlowShell";
import {
  AFFILIATE_SUMMARY,
  ECOM_SUMMARY,
  brandNameFromHost,
  hostnameOf,
  initialsFromName,
} from "../data";
import type { MobileGenieMode } from "../types";

export interface MobileDoneProps {
  onClose: () => void;
  onBack: () => void;
  onStart: () => void;
  mode: MobileGenieMode;
  brandUrl?: string;
  category?: string;
  stepIndex: number;
  stepCount: number;
}

/**
 * Genie step 5 — "Brand Ready" / "Category Ready". Copy + sample values
 * lifted from `src/onboarding-demo/steps/Done.tsx`.
 *
 * Two deliberate reductions from web:
 *
 *  1. Single column. Web packs this into a 2-col grid tuned to fit a desktop
 *     modal without scrolling; at phone width that grid produces 3-word
 *     columns. Here it is a stacked read-down, which is also why the summary
 *     is worth showing at all rather than being skipped on mobile.
 *
 *  2. Read-only. Web makes every value inline-editable (`EditableText` /
 *     `EditablePillRow`). Those are click-to-edit affordances with no visible
 *     control — undiscoverable on touch, and doubly pointless here since
 *     NOTHING PERSISTS. The values render as a summary; the footnote points at
 *     the real place to edit them.
 */

function SummaryCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function PillRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px] text-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CompetitorList({
  items,
}: {
  items: { name: string; desc: string }[];
}) {
  return (
    <ul className="flex list-none flex-col gap-2.5">
      {items.map((c) => (
        <li key={c.name} className="flex items-center gap-2.5">
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono text-[11px] font-bold text-foreground"
            aria-hidden
          >
            {c.name.charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-semibold text-foreground">
              {c.name}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {c.desc}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MobileDone({
  onClose,
  onBack,
  onStart,
  mode,
  brandUrl,
  category,
  stepIndex,
  stepCount,
}: MobileDoneProps) {
  const isEcom = mode === "ecom";
  const host = hostnameOf(brandUrl, "aurora-apparel.com");
  const brandName = brandNameFromHost(host);
  const categoryName = category?.trim() || "Auto Insurance";

  return (
    <MobileFlowShell
      eyebrow="Genie setup"
      stepIndex={stepIndex}
      stepCount={stepCount}
      stepLabel="Ready"
      title={
        <>
          {isEcom ? "Brand" : "Category"}{" "}
          <span className="rounded bg-primary/30 px-1.5">Ready!</span>
        </>
      }
      subtitle="Here's what we pulled together. This walkthrough doesn't save anything — edit the real values from Catalogue when you're ready."
      onBack={onBack}
      onClose={onClose}
      primaryLabel="Start Creating"
      onPrimary={onStart}
      hidePrimaryArrow
    >
      {/* Success marker */}
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-hidden
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
        <p className="text-[12.5px] text-muted-foreground">
          Analyzed and ready to generate.
        </p>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-3.5">
        <div className="flex items-start gap-3">
          {isEcom ? (
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-primary/15 font-mono text-[14px] font-bold text-foreground"
              aria-hidden
            >
              {initialsFromName(brandName)}
            </span>
          ) : (
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-primary/15 text-foreground"
              aria-hidden
            >
              <Target className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-[16px] font-bold leading-tight text-foreground">
              {isEcom ? brandName : categoryName}
            </h2>
            {isEcom ? (
              <p className="mt-0.5 inline-flex min-w-0 items-center gap-1 text-[11.5px] text-muted-foreground">
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate font-mono">{host}</span>
              </p>
            ) : (
              <p className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Affiliate
                </span>
                <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground">
                  {AFFILIATE_SUMMARY.niche}
                </span>
              </p>
            )}
          </div>
        </div>
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground">
          {isEcom ? ECOM_SUMMARY.description : AFFILIATE_SUMMARY.description}
        </p>
      </div>

      {/* Detail cards — stacked, one per row. */}
      <div className="mt-2.5 flex flex-col gap-2.5">
        {isEcom ? (
          <>
            <SummaryCard title="Brand voice" icon={Sparkles}>
              <p className="text-[12.5px] leading-snug text-foreground">
                {ECOM_SUMMARY.voice}
              </p>
            </SummaryCard>

            <SummaryCard title="Typography" icon={TypeIcon}>
              <div className="flex flex-col gap-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Display
                  </p>
                  <p className="text-[14px] font-semibold leading-tight text-foreground">
                    {ECOM_SUMMARY.typographyDisplay}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Body
                  </p>
                  <p className="text-[12.5px] leading-tight text-foreground">
                    {ECOM_SUMMARY.typographyBody}
                  </p>
                </div>
              </div>
            </SummaryCard>

            <SummaryCard title="Colors" icon={Palette}>
              <ul className="flex list-none flex-wrap gap-2.5">
                {ECOM_SUMMARY.colors.map((c) => (
                  <li key={c.hex} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-6 w-6 shrink-0 rounded-md border border-border"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden
                    />
                    <span className="text-[11.5px] text-foreground">
                      {c.name}
                      {/* Hex in text, not colour alone — colour-blind safe. */}
                      <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                        {c.hex}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </SummaryCard>

            <SummaryCard title="Target audiences" icon={Users}>
              <p className="text-[12.5px] leading-snug text-foreground">
                {ECOM_SUMMARY.audiences}
              </p>
            </SummaryCard>

            <SummaryCard title="Competitors" icon={Target}>
              <CompetitorList items={ECOM_SUMMARY.competitors} />
            </SummaryCard>
          </>
        ) : (
          <>
            <SummaryCard title="Target audience" icon={Users}>
              <p className="text-[12.5px] leading-snug text-foreground">
                {AFFILIATE_SUMMARY.audience}
              </p>
            </SummaryCard>

            <SummaryCard
              title={`Angles · ${AFFILIATE_SUMMARY.angles.length}`}
              icon={Sparkles}
            >
              <PillRow items={AFFILIATE_SUMMARY.angles} />
            </SummaryCard>

            <SummaryCard
              title={`Keywords · ${AFFILIATE_SUMMARY.keywords.length}`}
              icon={Tag}
            >
              <PillRow items={AFFILIATE_SUMMARY.keywords} />
            </SummaryCard>

            <SummaryCard title="Competitors" icon={Target}>
              <CompetitorList items={AFFILIATE_SUMMARY.competitors} />
            </SummaryCard>
          </>
        )}
      </div>
    </MobileFlowShell>
  );
}

import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Wand2,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { angles as ALL_ANGLES } from "@/mocks/shared/angles";

/**
 * AnglePlaybookPreview — shareable comparison page for the 4 candidate UI
 * variants (A / B / C / D) of the new "Angle Playbook" KB sub-section.
 *
 * Maalik picks one of these to ship into Brand / Product / Category KB.
 * All four use the same dummy state (Mamaearth · 12 of 52 filled · mix of
 * manual + AI-drafted + empty) so the only thing that differs is the
 * surface treatment.
 *
 * Visible at /iq/genie6/angle-playbook-preview after deploy.
 */

// ── Dummy data ──────────────────────────────────────────────────────────

/**
 * Map angles to one of 10 semantic categories based on the comment groupings
 * in mocks/shared/angles.ts. Compact 10-category surface for Variant B.
 */
const ANGLE_CATEGORY: Record<string, string> = {
  // Emotional / aspirational
  "ang-asp-lifestyle": "Emotional", "ang-emotional-story": "Emotional",
  "ang-nostalgia": "Emotional", "ang-empowerment": "Emotional", "ang-belonging": "Emotional",
  // Pressure
  "ang-fomo": "Pressure", "ang-urgency": "Pressure",
  "ang-scarcity": "Pressure", "ang-launch": "Pressure",
  // Comparison / proof
  "ang-comparison": "Comparison", "ang-before-after": "Comparison",
  "ang-reviews-led": "Comparison", "ang-social-proof": "Comparison",
  "ang-celeb-endorsed": "Comparison", "ang-expert-led": "Comparison",
  // Authority
  "ang-authority": "Authority", "ang-clinical": "Authority",
  "ang-heritage": "Authority", "ang-certification": "Authority",
  // Value
  "ang-bundle": "Value", "ang-discount": "Value", "ang-bogo": "Value",
  "ang-free-shipping": "Value", "ang-cashback": "Value", "ang-emi": "Value",
  "ang-free-trial": "Value",
  // Problem-solution
  "ang-problem-solution": "Problem-Solution", "ang-objection-buster": "Problem-Solution",
  "ang-myth-busting": "Problem-Solution", "ang-roi-led": "Problem-Solution",
  // Lifestyle
  "ang-routine-led": "Lifestyle", "ang-gifting": "Lifestyle",
  "ang-self-care": "Lifestyle", "ang-sustainability": "Lifestyle",
  // Behavioral
  "ang-personalized": "Behavioral", "ang-segment-specific": "Behavioral",
  "ang-retargeting": "Behavioral", "ang-cart-recovery": "Behavioral",
  "ang-winback": "Behavioral", "ang-loyalty-tier": "Behavioral",
  // Educational
  "ang-how-to": "Educational", "ang-ingredient-deep-dive": "Educational",
  "ang-myth-vs-fact": "Educational", "ang-explainer": "Educational",
  // Reactive + Trust + Founder bundled into "Contextual" for the demo
  "ang-trend-jacking": "Contextual", "ang-seasonal": "Contextual",
  "ang-city-specific": "Contextual", "ang-news-jacking": "Contextual",
  "ang-risk-reversal": "Contextual", "ang-warranty": "Contextual",
  "ang-transparency": "Contextual",
  "ang-founder-story": "Contextual", "ang-mission-led": "Contextual",
};

const CATEGORY_ORDER: string[] = [
  "Emotional", "Pressure", "Comparison", "Authority", "Value",
  "Problem-Solution", "Lifestyle", "Behavioral", "Educational", "Contextual",
];

type Status = "manual" | "ai-drafted" | "empty";

const SAMPLE_CONTENT: Record<string, { content: string; status: Status }> = {
  "ang-asp-lifestyle": { status: "manual",
    content: "Lead with the bottle silhouette against a sunrise gradient — no model. The transformation is the customer becoming the kind of person who chooses Mamaearth." },
  "ang-empowerment": { status: "manual",
    content: "Headline frames women as decision-makers. Avoid 'gentle / soft' positioning — favor 'made for the way you actually live.'" },
  "ang-fomo": { status: "ai-drafted",
    content: "Limited Diwali bundle drop — show a counter ticking down. Use 'Closing in 48 hours' overlay. Festive copper-and-cream palette." },
  "ang-urgency": { status: "manual",
    content: "Today-only banner: 30% off Onion Shampoo. Frame for Reels 9:16. Bold CTA — 'Add to cart in 2 taps.'" },
  "ang-comparison": { status: "manual",
    content: "Side-by-side: Mamaearth Onion vs market leader. Tick-box overlay highlighting sulfate-free + plant-based. No competitor logos." },
  "ang-before-after": { status: "manual",
    content: "6-week before/after photo grid. Real customer, not a model. Show the clinical 47% reduction badge in the corner." },
  "ang-social-proof": { status: "ai-drafted",
    content: "Two real-customer quote overlays on close-up product shot. 4.6-star rating bar at top. Reduce background contrast." },
  "ang-clinical": { status: "manual",
    content: "Lead with the AIIMS-test certification. Studio shot, clinical white background. Mono callouts for 6-week data points." },
  "ang-heritage": { status: "manual",
    content: "Plant-based pioneers since 2017. Founder photo + ingredient sourcing story. Earthy tones, hand-drawn type." },
  "ang-bundle": { status: "manual",
    content: "Onion Shampoo + Conditioner combo at ₹599 (save ₹100). Show both bottles side-by-side with the savings tag." },
  "ang-problem-solution": { status: "manual",
    content: "Pain frame: 'Hair fall is real.' Solution frame: 'This is not.' Two-panel split with the product as the answer." },
  "ang-routine-led": { status: "ai-drafted",
    content: "Morning shampoo routine — 3-step storyboard. Bathroom shelf aesthetic. Soft natural light. UGC handheld style." },
  "ang-how-to": { status: "manual",
    content: "30-second tutorial format. Hands-only shots. On-screen captions, no voiceover. Reel-ready for Insta + YT Shorts." },
  // ai-drafted spread
  "ang-ingredient-deep-dive": { status: "ai-drafted",
    content: "AI-drafted: Why 1% onion extract beats 0.5% — pull a real ingredient diagram. Lab aesthetic, glass beakers." },
  "ang-trend-jacking": { status: "ai-drafted",
    content: "AI-drafted: hook into the #HairTok trend. UGC creator with Mamaearth in a 'get ready with me' format." },
  // empties for everything else — handled by lookup miss
};

function getStatus(angleId: string): Status {
  return SAMPLE_CONTENT[angleId]?.status ?? "empty";
}

function getContent(angleId: string): string {
  return SAMPLE_CONTENT[angleId]?.content ?? "";
}

const FILLED_COUNT = Object.keys(SAMPLE_CONTENT).length;
const TOTAL_COUNT = ALL_ANGLES.length;

const EMPTY_COUNT = TOTAL_COUNT - FILLED_COUNT;
const BULK_COST = Math.ceil(EMPTY_COUNT * 0.6);

// ── Page ────────────────────────────────────────────────────────────────

export function AnglePlaybookPreview() {
  return (
    // A-12.58 (Maalik): /iq/genie6/* routes get `overflow-hidden` from
    // AppLayout (Studio Alpha needs its own internal scroll regions).
    // This page has no internal scroll, so we own the scroll here.
    <div className="v3-page-mesh h-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pt-8 pb-24">
        {/* Page hero */}
        <header className="space-y-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Pick a variant
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Angle Playbook · 4 candidate UIs</h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Same dummy state across all four (Mamaearth · {FILLED_COUNT}/{TOTAL_COUNT} filled
            · mix of manual + AI-drafted). Only the surface treatment differs.
            Pick A, B, C, or D and tell Claude — that's the one we ship into
            the Brand / Product / Category Knowledge Base.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-wider">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.10] px-2 py-0.5 text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> manual
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-400">
              <Sparkles className="h-2.5 w-2.5" /> AI-drafted
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/50" /> empty
            </span>
          </div>
        </header>

        <VariantWrap title="A" label="Dense Grid + Drawer" pros="All 52 glanceable. Big bulk-fill button always visible." cons="Cards tiny — labels truncate. Every edit is a drawer round-trip.">
          <VariantA />
        </VariantWrap>

        <VariantWrap title="B" label="Category Accordion" pros="Hierarchical (10 categories). Per-category bulk-fill button. Most compact baseline." cons="Two-click to edit (expand → click). Less glanceable than A.">
          <VariantB />
        </VariantWrap>

        <VariantWrap title="C" label="Master-Detail (2-column)" pros="Editor always visible — no opening surfaces. Single-click to edit. Desktop-app native." cons="Section gets tall (~520px). Uses horizontal width.">
          <VariantC />
        </VariantWrap>

        <VariantWrap title="D" label="Horizontal Strip + Inline Editor" pros="Mirrors Step 4 Trending strip pattern. Inline editing — no drawer/modal. Very narrow vertically." cons="~10 chips visible at once. Harder to scan completion at a glance.">
          <VariantD />
        </VariantWrap>

        <footer className="border-t border-border/40 pt-6 text-[11px] text-muted-foreground">
          Done? Tell Claude — "Pick variant <span className="font-mono">[A|B|C|D]</span>" — and the chosen one
          ships into <code className="font-mono text-foreground/80">KnowledgeBaseSection</code> across
          all three (Brand / Product / Category) detail pages.
        </footer>
      </div>
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────

function VariantWrap({
  title,
  label,
  pros,
  cons,
  children,
}: {
  title: string;
  label: string;
  pros: string;
  cons: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/40 bg-card/60 p-6 shadow-sm backdrop-blur-sm">
      <header className="flex flex-wrap items-end gap-3 border-b border-border/40 pb-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
          {title}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">{label}</h2>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            <span className="text-foreground/80">+ {pros}</span>
            <span className="mx-2 text-muted-foreground/40">·</span>
            <span>− {cons}</span>
          </p>
        </div>
      </header>
      <div className="pt-2">{children}</div>
    </section>
  );
}

// ── Shared bits ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: Status }) {
  if (status === "manual") return <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />;
  if (status === "ai-drafted") return <Sparkles className="h-2.5 w-2.5 text-amber-500" />;
  return <span className="inline-block h-1.5 w-1.5 rounded-full border border-muted-foreground/50" />;
}

function SectionHeaderStrip({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-foreground">
        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
        Angle Playbook
      </h3>
      <span className="inline-flex items-center rounded-full bg-foreground/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-foreground">
        {filled}/{total} filled
      </span>
      <button
        type="button"
        className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
      >
        <Sparkles className="h-3 w-3" />
        Fill all empties · {BULK_COST} credits
      </button>
    </div>
  );
}

function MergedEditor({
  angleId,
  onSave,
  onClose,
}: {
  angleId: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const angle = ALL_ANGLES.find((a) => a.id === angleId);
  const [content, setContent] = useState(getContent(angleId));
  const status = getStatus(angleId);

  if (!angle) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border/40 bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-[14px] font-semibold tracking-tight">{angle.label}</h4>
          {angle.description && (
            <p className="mt-0.5 text-[11px] italic text-muted-foreground">{angle.description}</p>
          )}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder={`Describe how Genie should generate ${angle.label} for Mamaearth. Or click ✨ to draft with AI.`}
          className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2.5 pr-20 text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/40"
        />
        <button
          type="button"
          title="AI fill — 1 credit"
          className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Wand2 className="h-2.5 w-2.5" />
          AI · 1c
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {status === "manual" ? "source: manual" : status === "ai-drafted" ? "source: ai-generated (edit me)" : "empty"}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            className="rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:scale-[1.02]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Variant A — Dense Grid + Drawer ─────────────────────────────────────

function VariantA() {
  const [activeId, setActiveId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <SectionHeaderStrip filled={FILLED_COUNT} total={TOTAL_COUNT} />
      <div className="flex gap-4">
        <ul className="grid flex-1 grid-cols-7 gap-1.5 sm:grid-cols-8">
          {ALL_ANGLES.map((a) => {
            const status = getStatus(a.id);
            const active = activeId === a.id;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(a.id)}
                  title={a.label}
                  className={cn(
                    "flex h-14 w-full flex-col items-start justify-between rounded-lg border px-1.5 py-1 text-left transition-all",
                    active && "border-primary ring-2 ring-primary/30",
                    !active && status === "manual" && "border-primary/30 bg-primary/[0.06]",
                    !active && status === "ai-drafted" && "border-amber-500/30 bg-amber-500/[0.06]",
                    !active && status === "empty" && "border-border/60 bg-background/50 hover:border-foreground/30",
                  )}
                >
                  <StatusDot status={status} />
                  <span className="line-clamp-2 text-[9px] font-medium leading-[1.1] text-foreground/80">
                    {a.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {activeId && (
          <aside className="w-[340px] shrink-0 rounded-xl border border-border/40 bg-card p-1">
            <MergedEditor angleId={activeId} onClose={() => setActiveId(null)} />
          </aside>
        )}
      </div>
      {!activeId && (
        <p className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          ↑ click any cell to open the editor in a side drawer
        </p>
      )}
    </div>
  );
}

// ── Variant B — Category Accordion ──────────────────────────────────────

function VariantB() {
  const [openCategory, setOpenCategory] = useState<string>("Comparison");
  const [activeId, setActiveId] = useState<string | null>("ang-before-after");

  const grouped = useMemo(() => {
    const map: Record<string, typeof ALL_ANGLES> = {};
    for (const a of ALL_ANGLES) {
      const cat = ANGLE_CATEGORY[a.id] ?? "Contextual";
      (map[cat] ??= []).push(a);
    }
    return map;
  }, []);

  return (
    <div className="space-y-3">
      <SectionHeaderStrip filled={FILLED_COUNT} total={TOTAL_COUNT} />
      <ul className="space-y-1.5">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat] ?? [];
          const filled = items.filter((a) => getStatus(a.id) !== "empty").length;
          const open = openCategory === cat;
          return (
            <li key={cat} className="overflow-hidden rounded-xl border border-border/40 bg-background/40">
              <button
                type="button"
                onClick={() => setOpenCategory(open ? "" : cat)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-foreground/[0.04]"
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-300",
                    open && "rotate-90",
                  )}
                />
                <span className="text-[12px] font-semibold text-foreground">{cat}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  · {filled} / {items.length}
                </span>
                <button
                  type="button"
                  className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-primary hover:bg-primary/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Sparkles className="h-2.5 w-2.5" /> fill {items.length - filled}
                </button>
              </button>
              {open && (
                <div className="space-y-1 border-t border-border/40 bg-background/30 px-2 py-2">
                  {items.map((a) => {
                    const status = getStatus(a.id);
                    const active = activeId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setActiveId(active ? null : a.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors",
                          active && "bg-primary/10",
                          !active && "hover:bg-foreground/[0.04]",
                        )}
                      >
                        <StatusDot status={status} />
                        <span className="font-medium text-foreground">{a.label}</span>
                        {status !== "empty" && (
                          <span className="ml-2 line-clamp-1 max-w-[420px] text-muted-foreground">
                            {getContent(a.id)}
                          </span>
                        )}
                        {status === "empty" && (
                          <span className="ml-2 italic text-muted-foreground/60">— empty —</span>
                        )}
                        <Sparkles className="ml-auto h-3 w-3 text-muted-foreground/40" />
                      </button>
                    );
                  })}
                  {activeId && items.find((a) => a.id === activeId) && (
                    <div className="pt-2">
                      <MergedEditor angleId={activeId} onClose={() => setActiveId(null)} />
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Variant C — Master-Detail (2-column) ────────────────────────────────

function VariantC() {
  const [activeId, setActiveId] = useState<string>("ang-before-after");

  const grouped = useMemo(() => {
    const map: Record<string, typeof ALL_ANGLES> = {};
    for (const a of ALL_ANGLES) {
      const cat = ANGLE_CATEGORY[a.id] ?? "Contextual";
      (map[cat] ??= []).push(a);
    }
    return map;
  }, []);

  return (
    <div className="space-y-3">
      <SectionHeaderStrip filled={FILLED_COUNT} total={TOTAL_COUNT} />
      <div className="flex h-[520px] gap-3 rounded-xl border border-border/40 bg-background/40">
        {/* Left list */}
        <ul className="w-[260px] shrink-0 overflow-y-auto border-r border-border/40 p-2">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped[cat] ?? [];
            return (
              <div key={cat} className="mb-3">
                <p className="px-2 pb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {cat}
                </p>
                <div className="space-y-0.5">
                  {items.map((a) => {
                    const status = getStatus(a.id);
                    const active = activeId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setActiveId(a.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[11px] transition-colors",
                          active && "bg-primary/10",
                          !active && "hover:bg-foreground/[0.04]",
                        )}
                      >
                        <StatusDot status={status} />
                        <span className={cn("truncate", active ? "font-semibold text-primary" : "text-foreground/85")}>
                          {a.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </ul>
        {/* Right editor */}
        <div className="flex-1 overflow-y-auto p-3">
          <MergedEditor angleId={activeId} />
        </div>
      </div>
    </div>
  );
}

// ── Variant D — Horizontal Strip + Inline Editor ────────────────────────

function VariantD() {
  const [activeId, setActiveId] = useState<string>("ang-fomo");
  const stripRef = useRef<HTMLUListElement | null>(null);

  return (
    <div className="space-y-3">
      <SectionHeaderStrip filled={FILLED_COUNT} total={TOTAL_COUNT} />
      <ul
        ref={stripRef}
        className="-mx-2 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_94%,transparent)]"
      >
        {ALL_ANGLES.map((a) => {
          const status = getStatus(a.id);
          const active = activeId === a.id;
          return (
            <li key={a.id} className="snap-start shrink-0">
              <button
                type="button"
                onClick={() => setActiveId(a.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                  active && "border-primary bg-primary/10 text-primary",
                  !active && status === "manual" && "border-primary/30 bg-primary/[0.06] text-foreground/80",
                  !active && status === "ai-drafted" && "border-amber-500/30 bg-amber-500/[0.06] text-foreground/80",
                  !active && status === "empty" && "border-border/60 bg-background/50 text-muted-foreground hover:border-foreground/30",
                )}
              >
                <StatusDot status={status} />
                {a.label}
              </button>
            </li>
          );
        })}
      </ul>
      <MergedEditor angleId={activeId} />
    </div>
  );
}

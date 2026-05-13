import { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Camera,
  Sparkles,
  Info,
  CircleDashed,
  CheckCircle2,
  Plus,
  Wand2,
  ShoppingBag,
  Layers,
  Settings2,
  Star,
  Zap,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AngleMockup } from "@/genie6/generate-v3/forms/components/AngleMockup";

/**
 * StudioV3Lab — design lab (A-11.22).
 *
 * Two purposes:
 *   1. Header variants — 4 methods to choose from. Single live header per
 *      block so Maalik can scan and pick.
 *   2. Glass / gradient / animation system — shows the proposed visual
 *      language applied across angle / audience / concept surfaces so the
 *      effect on the picker mockups + form chrome is visible BEFORE we
 *      propagate.
 *
 * Once Maalik signs off, the chosen header variant + the glass system
 * propagate to FormSkeleton + ProductShootForm + ProductFocusedAdForm.
 */

export function StudioV3Lab() {
  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Page-wide ambient background — gradient mesh + dot grid */}
      <BackgroundMesh />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 space-y-12">
        <PageHeader />

        {/* Block 1 — Header variants */}
        <Section
          tag="A"
          title="Header — 4 methods"
          sub="Each block is a real header component. Pick the one that reads cleanest for a generation form. Body slot below is just visual context."
        >
          <HeaderVariantBlock
            label="V1 · Compact glass cmd-bar"
            note="One-line. Title only. Mode chip on right + actions slot. Densest."
          >
            <V1CompactCmdBar />
          </HeaderVariantBlock>

          <HeaderVariantBlock
            label="V2 · Hero glass with sub-mode quick-switch"
            note="Title + 1-line sub. Sub-mode switcher on right (jump to Brand-focused / Product Shoot without going back to picker)."
          >
            <V2HeroQuickSwitch />
          </HeaderVariantBlock>

          <HeaderVariantBlock
            label="V3 · Split — icon disc + actions cluster"
            note="Mode glyph on left, title centred, actions cluster (info / save preset / shortcut overlay) on right. Most useful, slightly taller."
          >
            <V3SplitDisc />
          </HeaderVariantBlock>

          <HeaderVariantBlock
            label="V4 · Mono with progress sheen"
            note="Mono uppercase title, lime sheen progress bar showing form completeness. Operator/keyboard-first energy."
          >
            <V4MonoProgress />
          </HeaderVariantBlock>
        </Section>

        {/* Block 2 — Glass / gradient / animation system */}
        <Section
          tag="B"
          title="Glass + gradient + animation across the picker mockups"
          sub="Same tokens used everywhere — applied here to angle / audience / concept surfaces so you can see the effect on the visual mockups too. Hover any card."
        >
          <SystemRow label="Angle tiles" sub="select 1-2 to see the lime ring + sheen sweep">
            <AngleTilesPanel />
          </SystemRow>

          <SystemRow label="Audience cards" sub="glass card · gradient edge · hover lift">
            <AudienceCardsPanel />
          </SystemRow>

          <SystemRow label="Concept cards" sub="lift + selected ring + check pop-in">
            <ConceptCardsPanel />
          </SystemRow>

          <SystemRow label="Background ambience (full-bleed mesh)" sub="this whole page is using it — note the soft lime + amber + sky mesh behind">
            <AmbiencePanel />
          </SystemRow>
        </Section>

        <p className="text-center text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70 pt-6">
          Studio v3 · Design Lab · A-11.22 · Pick a header to propagate
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  Background mesh — page ambience
 * ───────────────────────────────────────────────────────── */
function BackgroundMesh() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Lime glow top-left */}
      <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-lime-300/30 blur-[120px]" />
      {/* Amber bottom-right */}
      <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-amber-300/20 blur-[140px]" />
      {/* Sky middle */}
      <div className="absolute top-1/3 right-1/4 h-[340px] w-[340px] rounded-full bg-sky-300/15 blur-[120px]" />
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  Page header
 * ───────────────────────────────────────────────────────── */
function PageHeader() {
  return (
    <header className="space-y-2">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/60 px-2.5 py-1 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-v3-pulse-ring" />
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Studio v3 · Design Lab
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        Header methods + glass system
      </h1>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Scan the four header variants. Pick what reads cleanest. Below them,
        the same glass + gradient + animation system applied to angle /
        audience / concept surfaces so you can see the effect on the mockups
        themselves.
      </p>
    </header>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  Section + variant wrappers
 * ───────────────────────────────────────────────────────── */
function Section({
  tag,
  title,
  sub,
  children,
}: {
  tag: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="rounded bg-foreground text-background font-mono text-[10px] font-bold px-1.5 py-0.5 tracking-wider">
          {tag}
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-1 max-w-2xl">{sub}</p>
      <div className="space-y-5 pt-2">{children}</div>
    </section>
  );
}

function HeaderVariantBlock({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground max-w-md text-right">
          {note}
        </p>
      </div>
      <div className="rounded-2xl border border-foreground/10 bg-background/50 backdrop-blur-md overflow-hidden ring-1 ring-foreground/[0.04] shadow-[0_4px_30px_-12px_rgba(0,0,0,0.12)]">
        {children}
        <FauxBody />
      </div>
    </div>
  );
}

function FauxBody() {
  return (
    <div className="px-4 py-4 sm:px-6 space-y-2 bg-background/30">
      <div className="h-2.5 w-32 rounded-full bg-muted/60" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-muted/40 ring-1 ring-foreground/5"
          />
        ))}
      </div>
    </div>
  );
}

function SystemRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
          {label}
        </h3>
        {sub && <p className="text-[10px] text-muted-foreground">· {sub}</p>}
      </div>
      <div className="rounded-2xl border border-foreground/10 bg-background/50 backdrop-blur-md p-4 ring-1 ring-foreground/[0.04]">
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  V1 — Compact glass cmd-bar
 * ───────────────────────────────────────────────────────── */
function V1CompactCmdBar() {
  return (
    <header className="relative flex h-12 items-center gap-3 px-4 sm:px-5 bg-background/55 backdrop-blur-xl backdrop-saturate-150 border-b border-foreground/8">
      {/* Lime gradient accent (subtle, left edge) */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-primary/30 to-transparent"
      />
      <button
        type="button"
        className="relative inline-flex items-center gap-1 h-7 rounded-md border border-foreground/10 bg-background/70 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Picker
      </button>
      <h1 className="relative text-sm font-semibold tracking-tight text-foreground">
        Product-focused brand ad
      </h1>
      <span className="relative inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
        <Sparkles className="h-2.5 w-2.5" />
        Brand
      </span>
      <div className="relative ml-auto flex items-center gap-1">
        <ActionIcon icon={Info} aria-label="Mode info" />
        <ActionIcon icon={Star} aria-label="Save preset" />
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  V2 — Hero glass with sub-mode quick-switch
 * ───────────────────────────────────────────────────────── */
function V2HeroQuickSwitch() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative bg-background/55 backdrop-blur-xl backdrop-saturate-150 border-b border-foreground/8 px-4 sm:px-6 py-3.5">
      {/* Animated gradient sheen sweep on mount */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-2xl"
      >
        <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent animate-v3-sheen" />
      </span>

      <div className="relative flex items-start gap-3">
        <button
          type="button"
          className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md border border-foreground/10 bg-background/70 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          {/* Pill breadcrumb */}
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.16em]">
            <BreadPill>Studio v3</BreadPill>
            <span className="text-muted-foreground/50">/</span>
            <BreadPill>Brand</BreadPill>
            <span className="text-muted-foreground/50">/</span>
            <BreadPill active>Product-focused</BreadPill>
          </div>
          <h1 className="text-base font-semibold tracking-tight text-foreground leading-tight">
            Product-focused brand ad
          </h1>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Product-led ad anchored to your brand. Pick concept + audience + angle.
          </p>
        </div>
        {/* Sub-mode quick-switch */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 h-8 rounded-md border border-foreground/10 bg-background/70 px-2.5 text-[11px] font-medium text-foreground hover:border-primary/40 transition-colors"
            aria-expanded={open}
          >
            <Wand2 className="h-3 w-3 text-primary" />
            Switch sub-mode
            <ChevronDown
              className={cn(
                "h-3 w-3 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
          {open && (
            <div className="absolute right-0 top-9 z-10 w-56 rounded-lg border border-foreground/10 bg-background/85 backdrop-blur-xl ring-1 ring-foreground/[0.04] shadow-lg p-1 animate-v3-pop-in">
              {[
                { id: "brand-focused", label: "Brand-focused", icon: Sparkles },
                { id: "product-shoot", label: "Product Shoot", icon: Camera },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-foreground hover:bg-primary/10 transition-colors"
                >
                  <s.icon className="h-3 w-3 text-muted-foreground" />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function BreadPill({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 transition-colors",
        active
          ? "bg-primary/15 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
      )}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  V3 — Split icon-disc + actions cluster
 * ───────────────────────────────────────────────────────── */
function V3SplitDisc() {
  return (
    <header className="relative bg-background/55 backdrop-blur-xl backdrop-saturate-150 border-b border-foreground/8 px-4 sm:px-6 py-3.5">
      {/* Subtle radial gradient anchored to disc */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-4 -top-6 h-32 w-32 rounded-full bg-primary/15 blur-[40px]"
      />
      <div className="relative flex items-center gap-3">
        <button
          type="button"
          className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md border border-foreground/10 bg-background/70 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Mode disc — gradient + animated lime ring */}
        <div className="relative shrink-0">
          <span
            aria-hidden
            className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/40 via-primary/10 to-transparent blur-sm"
          />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-gradient-to-br from-lime-200/70 via-lime-300/40 to-lime-400/30 text-foreground shadow-[inset_0_-8px_16px_-8px_rgba(0,0,0,0.15)]">
            <ShoppingBag className="h-4 w-4" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            Brand · Product-focused
          </p>
          <h1 className="text-base font-semibold tracking-tight text-foreground leading-tight">
            Product-focused brand ad
          </h1>
        </div>

        {/* Actions cluster */}
        <div className="flex items-center gap-1">
          <ActionIcon icon={Info} aria-label="Mode info" />
          <ActionIcon icon={Star} aria-label="Save preset" />
          <ActionIcon icon={Zap} aria-label="Shortcuts" />
          <span className="mx-1 h-5 w-px bg-foreground/10" />
          <button
            type="button"
            className="inline-flex items-center gap-1 h-7 rounded-md bg-primary px-2.5 text-[11px] font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  V4 — Mono with progress sheen
 * ───────────────────────────────────────────────────────── */
function V4MonoProgress() {
  // Mock: 4/7 sections filled
  const filled = 4;
  const total = 7;
  return (
    <header className="relative bg-background/55 backdrop-blur-xl backdrop-saturate-150 border-b border-foreground/8 px-4 sm:px-6 py-2.5">
      <div className="relative flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-1 h-7 rounded-md border border-foreground/10 bg-background/70 px-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          ESC
        </button>
        <h1 className="font-mono text-[12px] uppercase tracking-[0.22em] text-foreground">
          Product-focused · Brand
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-3 rounded-full transition-colors",
                  i < filled ? "bg-primary" : "bg-muted-foreground/20",
                )}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {filled}/{total}
          </span>
        </div>
      </div>
      {/* Lime sheen progress underline */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        style={{
          width: `${(filled / total) * 100}%`,
          backgroundSize: "200% 100%",
          animation: "v3-shimmer 2.4s linear infinite",
        }}
      />
    </header>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  Action icon — used by V1 + V3
 * ───────────────────────────────────────────────────────── */
function ActionIcon({
  icon: Icon,
  ...rest
}: {
  icon: typeof Info;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      {...rest}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  Block B — system effect on picker mockups
 * ───────────────────────────────────────────────────────── */

function AngleTilesPanel() {
  const [selected, setSelected] = useState<string[]>(["fomo", "social-proof"]);
  const angles = [
    { id: "fomo", label: "FOMO", variant: "fomo" as const },
    { id: "founder-quote", label: "Founder quote", variant: "founder-quote" as const },
    { id: "lifestyle", label: "Lifestyle", variant: "lifestyle" as const },
    { id: "social-proof", label: "Social proof", variant: "social-proof" as const },
  ];
  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {angles.map((a) => {
        const isSelected = selected.includes(a.id);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl border bg-card text-left transition-all",
              "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.18)]",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "border-primary ring-2 ring-primary/30"
                : "border-foreground/10 hover:border-primary/40",
            )}
          >
            {/* Animated lime sheen sweeps on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-v3-sheen" />
            </span>
            <AngleMockup variant={a.variant} selected={isSelected} />
            <div className="px-2 py-1.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-foreground">
                {a.label}
              </p>
              {isSelected && (
                <CheckCircle2 className="h-3 w-3 text-primary animate-v3-pop-in" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AudienceCardsPanel() {
  const [selected, setSelected] = useState<string[]>(["a"]);
  const audiences = [
    {
      id: "a",
      name: "Young urban mums",
      meta: "28–40 · IN · metro",
      tags: ["health-led", "premium", "social-buyer"],
    },
    {
      id: "b",
      name: "D2C founders",
      meta: "28–45 · IN · B2B",
      tags: ["ROI-led", "premium", "early-adopter"],
    },
    {
      id: "c",
      name: "Tier-2 aspirational men",
      meta: "25–38 · IN · salaried",
      tags: ["aspirational", "value-led"],
    },
  ];
  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {audiences.map((a) => {
        const isSel = selected.includes(a.id);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a.id)}
            className={cn(
              "group relative shrink-0 w-[220px] overflow-hidden rounded-xl border text-left p-3 transition-all",
              "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.18)]",
              isSel
                ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                : "border-foreground/10 bg-background/60 backdrop-blur-md hover:border-primary/40",
            )}
          >
            {/* Gradient edge on hover/select */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent transition-opacity",
                isSel ? "opacity-100" : "opacity-0 group-hover:opacity-60",
              )}
            />
            <div className="relative space-y-2">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold text-foreground">
                  {a.name}
                </p>
                {isSel && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary animate-v3-pop-in" />
                )}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {a.meta}
              </p>
              <div className="flex flex-wrap gap-1">
                {a.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-foreground"
                  >
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ConceptCardsPanel() {
  const [selected, setSelected] = useState<string | null>("c1");
  const concepts = [
    {
      id: "c1",
      name: "FOMO launch",
      gist: "Founder + 3-pack + scarcity stamp.",
      angle: "FOMO",
      audience: "Mums",
    },
    {
      id: "c2",
      name: "Founder story",
      gist: "Talking-head intro with reveal at 0:12.",
      angle: "Founder",
      audience: "Aspirational",
    },
    {
      id: "c3",
      name: "Bundle carousel",
      gist: "5-SKU carousel · price overlay · CTA tile.",
      angle: "Bundle",
      audience: "Value",
    },
  ];
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {concepts.map((c) => {
        const isSel = selected === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(isSel ? null : c.id)}
            className={cn(
              "group relative shrink-0 w-[220px] overflow-hidden rounded-xl border text-left p-3 transition-all space-y-1.5",
              "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.18)]",
              isSel
                ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                : "border-foreground/10 bg-background/60 backdrop-blur-md hover:border-primary/40",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/10 to-transparent transition-opacity",
                isSel ? "opacity-100" : "opacity-0 group-hover:opacity-50",
              )}
            />
            <div className="relative flex items-start justify-between gap-1">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {c.name}
              </p>
              {isSel && (
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground animate-v3-pop-in">
                  <Check className="h-2 w-2" strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="relative line-clamp-2 text-[10px] text-muted-foreground leading-snug">
              {c.gist}
            </p>
            <div className="relative flex flex-wrap gap-1 pt-0.5">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-foreground">
                {c.angle}
              </span>
              <span className="inline-flex items-center rounded-full bg-muted/70 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {c.audience}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AmbiencePanel() {
  return (
    <div className="grid grid-cols-3 gap-3 text-[10px] text-muted-foreground">
      {[
        { label: "Lime glow", classes: "bg-lime-300/30" },
        { label: "Amber accent", classes: "bg-amber-300/20" },
        { label: "Sky depth", classes: "bg-sky-300/15" },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-foreground/10 bg-background/40 backdrop-blur-md p-3 space-y-2"
        >
          <div className={cn("h-16 w-full rounded blur-[16px] -translate-x-2 -translate-y-2 saturate-150", s.classes)} />
          <p className="font-mono uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export default StudioV3Lab;

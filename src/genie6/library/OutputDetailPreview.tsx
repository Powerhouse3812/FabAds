import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Copy,
  Download,
  MoreHorizontal,
  RefreshCw,
  Rocket,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OutputDetailPreview — A-12.72 (Maalik). Shareable comparison page
 * for the 4 candidate Output Detail Drawer layouts. Maalik picks one,
 * we extract into the real <OutputDetailDrawer/> next iteration.
 *
 * Visible at /iq/genie6/output-detail-preview after deploy.
 */

// ── Dummy data ──────────────────────────────────────────────────────────

const SAMPLE_OUTPUT = {
  id: "var_4a2k7q9",
  mediaType: "image" as const,
  mode: "product-ad" as const,
  generatedAt: new Date("2026-05-10T14:23:00"),
  thumbnail:
    "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=600&q=75",
  headline: "Hair fall is real. This is not.",
  body: "Mamaearth Onion Shampoo — clinically tested for visible reduction in 6 weeks.",
  cta: "Shop ₹699",
  brand: { name: "Mamaearth" },
  product: { name: "Onion Shampoo" },
  qualityScore: 87,
  parentWinnerId: undefined as string | undefined,
  generationForm: {
    prompt:
      "Lead with a hero shot of the onion shampoo bottle on a clean white surface. Emphasise the 'no toxins' badge.",
    angleId: "hero",
    angleLabel: "Hero",
    audienceId: "aud-skincare-25-34",
    audienceLabel: "Skincare F · 25-34",
    visualDirection:
      "Studio-lit product close-up, soft natural shadow, plant ingredient overlay on the right.",
    researchSources: ["reddit", "reviews"] as string[],
    count: 4,
    modelId: "genie-1.0",
    aspectRatio: "1:1" as const,
    videoResolution: undefined as string | undefined,
    format: "image" as const,
    selectedConceptIds: ["cat-c-hero-shot"],
    brandId: "mamaearth",
    productId: "mamaearth-onion-shampoo",
    categoryId: undefined as string | undefined,
    useBrandGuidelines: true,
    useKnowledgeBase: true,
    credits: 4,
  },
};

// ── Page wrapper ────────────────────────────────────────────────────────

export function OutputDetailPreview() {
  return (
    <div className="v3-page-mesh h-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pt-8 pb-24">
        <header className="space-y-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Pick a variant
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Output Detail Drawer · 4 candidate layouts
          </h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Same dummy output across all four. Each variant shows the
            rendered ad + a full echo of the generation form data + the
            three actions (Regenerate / Copy prompt / Copy JSON) plus
            Save / Launch / Download. Pick A, B, C, or D and tell Claude
            — that's the one we extract into the real
            &lt;OutputDetailDrawer/&gt;.
          </p>
        </header>

        <VariantWrap
          title="A"
          label="Tabbed"
          pros="Single drawer, organized into Preview / Form / Metadata tabs. Compact at rest."
          cons="2 clicks to see the form data — buried under a tab."
        >
          <VariantA />
        </VariantWrap>

        <VariantWrap
          title="B"
          label="Stacked (preview top, form below)"
          pros="Form data visible immediately on scroll — no clicks needed."
          cons="Drawer gets tall; full-height scroll inside the drawer."
        >
          <VariantB />
        </VariantWrap>

        <VariantWrap
          title="C"
          label="Split (preview left, form right)"
          pros="Both halves visible simultaneously. Eye flows side-by-side. Widest variant."
          cons="Needs 720px drawer width — eats more of the library grid."
        >
          <VariantC />
        </VariantWrap>

        <VariantWrap
          title="D"
          label="Accordion (preview pinned, sections collapse)"
          pros="Most compact baseline. User expands only what they need. Activity timeline as a 3rd section."
          cons="Hidden by default — extra click for metadata / activity."
        >
          <VariantD />
        </VariantWrap>

        <footer className="border-t border-border/40 pt-6 text-[11px] text-muted-foreground">
          Done? Tell Claude — &quot;Pick variant{" "}
          <span className="font-mono">[A|B|C|D]</span>&quot; — and the chosen
          one becomes the real OutputDetailDrawer wired to the library
          + Step 5 results.
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
    <section className="space-y-4 rounded-2xl border border-border/40 bg-card/60 p-6 shadow-sm backdrop-blur-sm">
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
      <div className="flex justify-center pt-3">{children}</div>
    </section>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────

function DrawerFrame({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg"
      style={{ width }}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border/40 px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Output detail
          </p>
          <h3 className="truncate text-sm font-semibold text-foreground">
            {SAMPLE_OUTPUT.brand.name} · {SAMPLE_OUTPUT.product.name}
          </h3>
        </div>
        <button
          type="button"
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>
      {children}
    </div>
  );
}

function AdPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        <img
          src={SAMPLE_OUTPUT.thumbnail}
          alt=""
          className="h-full w-full object-cover"
        />
        <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
          {SAMPLE_OUTPUT.brand.name}
        </span>
        <span className="absolute right-1.5 top-1.5 rounded-full bg-primary/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary-foreground backdrop-blur">
          {SAMPLE_OUTPUT.qualityScore} · q
        </span>
      </div>
      <div className={cn("space-y-1.5", compact ? "p-2.5" : "p-3")}>
        <p className="text-[13px] font-bold leading-tight text-foreground">
          {SAMPLE_OUTPUT.headline}
        </p>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {SAMPLE_OUTPUT.body}
        </p>
        <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
          {SAMPLE_OUTPUT.cta}
        </span>
      </div>
    </div>
  );
}

function FormRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/30 py-2 last:border-b-0">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <div className="text-[12px] leading-relaxed text-foreground">
        {value ?? <span className="italic text-muted-foreground/60">—</span>}
      </div>
    </div>
  );
}

function FormEcho() {
  const f = SAMPLE_OUTPUT.generationForm;
  return (
    <div className="space-y-0">
      <FormRow label="Prompt" value={f.prompt} />
      <FormRow label="Angle" value={<Pill>{f.angleLabel}</Pill>} />
      <FormRow label="Audience" value={<Pill>{f.audienceLabel}</Pill>} />
      <FormRow label="Visual direction" value={f.visualDirection} />
      <FormRow
        label="Research sources"
        value={
          f.researchSources.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {f.researchSources.map((s) => (
                <Pill key={s}>{s}</Pill>
              ))}
            </div>
          ) : null
        }
      />
      <FormRow
        label="Selected concepts"
        value={
          f.selectedConceptIds.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {f.selectedConceptIds.map((c) => (
                <Pill key={c}>{c}</Pill>
              ))}
            </div>
          ) : null
        }
      />
      <FormRow
        label="Format · Ratio · Count"
        value={`${f.format} · ${f.aspectRatio} · ${f.count}`}
      />
      <FormRow label="Model" value={<Pill>{f.modelId}</Pill>} />
      {f.videoResolution && (
        <FormRow label="Video resolution" value={<Pill>{f.videoResolution}</Pill>} />
      )}
      <FormRow
        label="Toggles"
        value={
          <div className="flex flex-wrap gap-1">
            <Pill on={f.useBrandGuidelines}>Brand guidelines</Pill>
            <Pill on={f.useKnowledgeBase}>Knowledge base</Pill>
          </div>
        }
      />
      <FormRow
        label="Credits"
        value={
          <span className="font-mono text-[11px] text-foreground">
            {f.credits} credits
          </span>
        }
      />
    </div>
  );
}

function MetadataEcho() {
  return (
    <div className="space-y-0">
      <FormRow
        label="Output ID"
        value={<span className="font-mono text-[11px]">{SAMPLE_OUTPUT.id}</span>}
      />
      <FormRow
        label="Mode · Media"
        value={`${SAMPLE_OUTPUT.mode} · ${SAMPLE_OUTPUT.mediaType}`}
      />
      <FormRow
        label="Quality score"
        value={
          <span className="font-mono text-[11px] font-bold text-primary">
            {SAMPLE_OUTPUT.qualityScore} / 100
          </span>
        }
      />
      <FormRow
        label="Generated at"
        value={SAMPLE_OUTPUT.generatedAt.toLocaleString()}
      />
      <FormRow
        label="Lineage"
        value={
          SAMPLE_OUTPUT.parentWinnerId ? (
            <span className="font-mono text-[11px]">
              forked from {SAMPLE_OUTPUT.parentWinnerId}
            </span>
          ) : (
            <span className="italic text-muted-foreground/60">original</span>
          )
        }
      />
    </div>
  );
}

function Pill({
  children,
  on = true,
}: {
  children: React.ReactNode;
  on?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[10px]",
        on
          ? "bg-primary/[0.10] text-primary"
          : "bg-muted/50 text-muted-foreground line-through",
      )}
    >
      {children}
    </span>
  );
}

function ActionFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="flex shrink-0 items-center gap-1.5 border-t border-border/40 bg-card/80 px-3 py-2.5">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
      >
        <RefreshCw className="h-3 w-3" />
        Regenerate
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Copy className="h-3 w-3" />
        Copy prompt
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Copy className="h-3 w-3" />
        Copy JSON
      </button>
      {compact ? (
        <button
          type="button"
          aria-label="More"
          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      ) : (
        <>
          <span className="mx-1 h-4 w-px bg-border/50" />
          <button
            type="button"
            title="Save"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Save className="h-3 w-3" />
          </button>
          <button
            type="button"
            title="Launch"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Rocket className="h-3 w-3" />
          </button>
          <button
            type="button"
            title="Download"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Download className="h-3 w-3" />
          </button>
        </>
      )}
    </footer>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

// ── Variant A — Tabbed ──────────────────────────────────────────────────

function VariantA() {
  const [tab, setTab] = useState<"preview" | "form" | "meta">("preview");
  return (
    <DrawerFrame width={480}>
      {/* Tab strip */}
      <div className="shrink-0 flex border-b border-border/40 bg-background/40 px-2 pt-2">
        {(["preview", "form", "meta"] as const).map((t) => {
          const labels = { preview: "Preview", form: "Form", meta: "Metadata" };
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "border-b-2 px-3 py-1.5 text-[11px] font-semibold transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3" style={{ maxHeight: 460 }}>
        {tab === "preview" && <AdPreview />}
        {tab === "form" && <FormEcho />}
        {tab === "meta" && <MetadataEcho />}
      </div>
      <ActionFooter />
    </DrawerFrame>
  );
}

// ── Variant B — Stacked ─────────────────────────────────────────────────

function VariantB() {
  return (
    <DrawerFrame width={480}>
      <div
        className="min-h-0 flex-1 overflow-y-auto p-3"
        style={{ maxHeight: 560 }}
      >
        <SectionLabel icon={Sparkles}>Preview</SectionLabel>
        <AdPreview />
        <div className="my-3 h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]" />
        <SectionLabel icon={BookOpen}>Generation inputs</SectionLabel>
        <FormEcho />
        <div className="my-3 h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]" />
        <SectionLabel icon={ChevronRight}>Output metadata</SectionLabel>
        <MetadataEcho />
      </div>
      <ActionFooter />
    </DrawerFrame>
  );
}

// ── Variant C — Split ───────────────────────────────────────────────────

function VariantC() {
  return (
    <DrawerFrame width={720}>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-1/2 min-h-0 flex-col border-r border-border/40">
          <div
            className="min-h-0 flex-1 overflow-y-auto p-3"
            style={{ maxHeight: 520 }}
          >
            <SectionLabel icon={Sparkles}>Preview</SectionLabel>
            <AdPreview />
            <div className="my-3 h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]" />
            <SectionLabel icon={ChevronRight}>Metadata</SectionLabel>
            <MetadataEcho />
          </div>
        </div>
        <div className="flex w-1/2 min-h-0 flex-col">
          <div
            className="min-h-0 flex-1 overflow-y-auto p-3"
            style={{ maxHeight: 520 }}
          >
            <SectionLabel icon={BookOpen}>Generation inputs</SectionLabel>
            <FormEcho />
          </div>
        </div>
      </div>
      <ActionFooter />
    </DrawerFrame>
  );
}

// ── Variant D — Accordion ───────────────────────────────────────────────

function VariantD() {
  const [open, setOpen] = useState<{ inputs: boolean; meta: boolean; activity: boolean }>({
    inputs: true,
    meta: false,
    activity: false,
  });
  return (
    <DrawerFrame width={480}>
      <div
        className="min-h-0 flex-1 overflow-y-auto p-3"
        style={{ maxHeight: 520 }}
      >
        {/* Preview always pinned */}
        <AdPreview />
        <div className="my-3 h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]" />

        {/* Accordion sections */}
        <AccordionRow
          icon={BookOpen}
          label="Generation inputs"
          open={open.inputs}
          onToggle={() => setOpen((o) => ({ ...o, inputs: !o.inputs }))}
        >
          <FormEcho />
        </AccordionRow>
        <AccordionRow
          icon={Sparkles}
          label="Output metadata"
          open={open.meta}
          onToggle={() => setOpen((o) => ({ ...o, meta: !o.meta }))}
        >
          <MetadataEcho />
        </AccordionRow>
        <AccordionRow
          icon={RefreshCw}
          label="Activity"
          open={open.activity}
          onToggle={() => setOpen((o) => ({ ...o, activity: !o.activity }))}
        >
          <ul className="space-y-2 pt-1">
            <li className="flex items-start gap-2 text-[11px]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <div>
                <p className="font-medium text-foreground">Generated</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {SAMPLE_OUTPUT.generatedAt.toLocaleString()} · 4 credits
                </p>
              </div>
            </li>
          </ul>
        </AccordionRow>
      </div>
      <ActionFooter compact />
    </DrawerFrame>
  );
}

function AccordionRow({
  icon: Icon,
  label,
  open,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-2 text-left transition-colors hover:bg-foreground/[0.03]"
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-90",
          )}
        />
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
          {label}
        </span>
      </button>
      {open && <div className="pb-2 pl-5">{children}</div>}
    </div>
  );
}

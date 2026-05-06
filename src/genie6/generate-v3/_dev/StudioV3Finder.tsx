import { useState, type ReactNode } from "react";
import {
  X,
  Search,
  Globe,
  Building2,
  ChevronDown,
  Check,
  Sparkles,
  Image as ImageIcon,
  Video,
  Layers,
  Users,
  Wand2,
  Lightbulb,
  Paperclip,
  Trophy,
  Plus,
  RefreshCw,
  Upload,
  Settings2,
  ChevronLeft,
  Box,
  FileText,
  Mic,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AngleMockup, type AngleVariant } from "@/genie6/generate-v3/forms/components/AngleMockup";

/**
 * StudioV3Finder — A-11.24 wireframe.
 *
 * Maalik's vision (from notebook wireframe + chat):
 *   - Form column on the LEFT — compact summary rows (no big inline pickers).
 *   - Right-side drawer (Finder column-view pattern) opens on demand when
 *     user clicks a picker trigger. Form shrinks 100% → 58%, drawer fills
 *     the rest. Closing returns form to full width.
 *   - Goal: zero (or minimum) vertical scroll. White space on the right
 *     becomes the working surface.
 *   - Setup loses its "Setup" title. Output + Aspect + Use AI model live in
 *     ONE horizontal row. Audience / Angle / Concepts / References all
 *     trigger the drawer.
 *   - Templates removed from Brand sub-modes. (Lives in Ad mode only — not
 *     shown here since this wireframe represents Brand → Product-focused.)
 *   - "UGC" renamed to "Use AI model" — toggle reveals an inline integrated
 *     card with thumbnail + name + tone chips visible at once. Not a
 *     drawer, not a separated row.
 *
 * This file is wireframe-only. Real implementation follows after sign-off.
 */

type DrawerKind = "audience" | "angle" | "concepts" | "references" | null;

export function StudioV3Finder() {
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [output, setOutput] = useState<"image" | "video">("video");
  const [useAiModel, setUseAiModel] = useState(true);

  // Mock-only selections so the chips have content
  const [audiences] = useState(["Young urban mums", "D2C founders"]);
  const [angles] = useState(["FOMO", "Lifestyle"]);
  const [concepts] = useState(["FOMO launch"]);
  const [refsCount] = useState(5);

  return (
    <div className="v3-page-mesh flex h-[100dvh] flex-col bg-transparent">
      {/* Glass header (V2 reproduced statically) */}
      <FauxHeader />

      {/* Two-column main with on-demand drawer */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_auto] overflow-hidden">
        {/* FORM COLUMN */}
        <div className="min-w-0 overflow-y-auto">
          <div
            className={cn(
              "mx-auto px-4 sm:px-6 py-5 space-y-4 transition-all",
              drawer ? "max-w-2xl" : "max-w-3xl",
            )}
          >
            <WireframeNotice drawerOpen={!!drawer} />

            {/* SETUP — no title, just rows */}
            <SetupRow icon={ImageIcon} label="Product" required>
              <ProductPickerStub />
              <ProductImageryRowStub />
            </SetupRow>

            {/* Combined Output + Aspect + AI model row */}
            <SetupRow icon={Settings2} label="Output">
              <CombinedOutputRow
                output={output}
                onOutputChange={setOutput}
                useAiModel={useAiModel}
                onUseAiModelChange={setUseAiModel}
              />
            </SetupRow>

            {/* AI model integrated card — only when video + toggle on */}
            {output === "video" && useAiModel && (
              <SetupRow icon={Sparkles} label="AI model">
                <AiModelIntegratedCard />
              </SetupRow>
            )}

            {/* Script (video only) */}
            {output === "video" && (
              <SetupRow icon={FileText} label="Script" sub="optional · AI drafts by default">
                <div className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card/60 px-2 text-[11px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  AI default
                  <ChevronDown className="ml-1 h-3 w-3" />
                </div>
              </SetupRow>
            )}

            {/* Audience — summary + Edit drawer trigger */}
            <SetupRow icon={Users} label="Audience">
              <SummaryTrigger
                pills={audiences}
                onClick={() => setDrawer("audience")}
                active={drawer === "audience"}
                emptyHint="Pick audiences →"
              />
            </SetupRow>

            {/* Angle — summary + Edit drawer trigger */}
            <SetupRow icon={Wand2} label="Angle">
              <SummaryTrigger
                pills={angles}
                onClick={() => setDrawer("angle")}
                active={drawer === "angle"}
                emptyHint="Pick angles →"
              />
            </SetupRow>

            {/* Concepts — summary + Edit drawer trigger */}
            <SetupRow icon={Lightbulb} label="Concepts" sub="empty = let AI decide">
              <SummaryTrigger
                pills={concepts}
                onClick={() => setDrawer("concepts")}
                active={drawer === "concepts"}
                emptyHint="Browse concepts →"
              />
            </SetupRow>

            {/* Winner ads */}
            <SetupRow icon={Trophy} label="Winner ads">
              <InlineToggleRow label="Include winner ads as references" />
            </SetupRow>

            {/* References — count + Edit drawer trigger */}
            <SetupRow icon={Paperclip} label="References">
              <ReferencesSummary
                count={refsCount}
                onClick={() => setDrawer("references")}
                active={drawer === "references"}
              />
            </SetupRow>

            {/* Advanced collapsible (video only) */}
            {output === "video" && (
              <details className="rounded-xl border border-border bg-card/40 overflow-hidden">
                <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs font-medium uppercase tracking-wider text-muted-foreground hover:bg-muted/40">
                  <Settings2 className="h-3 w-3" />
                  Advanced (video)
                  <ChevronDown className="ml-auto h-3 w-3" />
                </summary>
                <div className="px-3 py-3 text-[11px] text-muted-foreground italic">
                  Collapsible · all 8 video fields live here
                </div>
              </details>
            )}
          </div>

          {/* Form-column footer = prompt bar (glass) */}
          <div className="sticky bottom-0 border-t border-foreground/8 bg-transparent px-3 py-2.5 sm:px-6">
            <div className="mx-auto max-w-3xl rounded-2xl v3-glass overflow-hidden p-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Prompt bar (glass)</span>
              <button className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                <Sparkles className="h-3 w-3" />
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* DRAWER COLUMN */}
        {drawer && (
          <aside
            className={cn(
              "w-full lg:w-[420px] xl:w-[480px] shrink-0 border-l border-foreground/8 v3-glass",
              "flex flex-col overflow-hidden animate-v3-pop-in",
            )}
            aria-label={`${drawer} drawer`}
          >
            <DrawerHeader drawer={drawer} onClose={() => setDrawer(null)} />
            <div className="flex-1 overflow-y-auto p-3">
              {drawer === "audience" && <AudienceDrawer />}
              {drawer === "angle" && <AngleDrawer />}
              {drawer === "concepts" && <ConceptsDrawer />}
              {drawer === "references" && <ReferencesDrawer />}
            </div>
            <DrawerFooter onClose={() => setDrawer(null)} />
          </aside>
        )}
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Header (V2 reproduced for the wireframe — static)
 * ────────────────────────────────────────────────────────────── */

function FauxHeader() {
  return (
    <header className="shrink-0 v3-glass rounded-none border-x-0 border-t-0 px-4 sm:px-6 py-3.5">
      <div className="flex items-start gap-3">
        <button className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 bg-background/70 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <nav className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.16em]">
            <span className="rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              Studio v3
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span className="rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              Brand
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-foreground">
              Product-focused
            </span>
          </nav>
          <h1 className="text-base font-semibold tracking-tight text-foreground leading-tight">
            Product-focused brand ad
          </h1>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Wireframe · click any picker on the right column trigger →
          </p>
        </div>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-foreground/10 bg-background/70 px-2.5 text-[11px] font-medium text-foreground hover:border-primary/40 transition-colors">
          <Wand2 className="h-3 w-3 text-primary" />
          Switch sub-mode
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Wireframe banner — explains the pattern at the top
 * ────────────────────────────────────────────────────────────── */

function WireframeNotice({ drawerOpen }: { drawerOpen: boolean }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold">
        wireframe
      </span>
      <p className="text-[11px] text-foreground">
        {drawerOpen
          ? "Drawer is open · form shrunk to 58%. Click X (top-right) to close."
          : "Click any 'Edit' / picker trigger on the right of a row to open its drawer."}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Setup row scaffold
 * ────────────────────────────────────────────────────────────── */

function SetupRow({
  icon: Icon,
  label,
  sub,
  required,
  children,
}: {
  icon: typeof ImageIcon;
  label: string;
  sub?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] sm:items-start gap-2 sm:gap-5 pt-3 first:pt-0">
      <div className="flex items-start gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground mt-0.5">
          <Icon className="h-3 w-3" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="flex items-center gap-1 text-xs font-medium text-foreground">
            {label}
            {required && (
              <span className="text-destructive" aria-label="required">
                ·
              </span>
            )}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground leading-snug">{sub}</p>}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Product picker stub — same as live, abbreviated
 * ────────────────────────────────────────────────────────────── */

function ProductPickerStub() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
          <Search className="h-3.5 w-3.5" />
        </button>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2.5 text-[11px] font-medium text-foreground">
          <Building2 className="h-3 w-3" />
          Mamaearth
          <ChevronDown className="h-3 w-3" />
        </button>
        <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
          <Globe className="h-3.5 w-3.5" />
        </button>
        <p className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          12<span className="text-muted-foreground/60">/47</span>
        </p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "shrink-0 h-[88px] w-[88px] rounded-md border bg-muted/60",
              i === 1 ? "border-primary ring-2 ring-primary/30" : "border-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ProductImageryRowStub() {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 flex items-center gap-3">
      <span className="relative shrink-0 h-5 w-9 rounded-full bg-primary">
        <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-card shadow translate-x-4" />
      </span>
      <div className="min-w-0 flex-1 flex items-baseline gap-2">
        <Box className="h-3 w-3 text-muted-foreground" />
        <p className="text-xs font-medium text-foreground">Auto-attach product imagery</p>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          · 3/3 attached
        </span>
      </div>
      <button className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
        Manage
        <ChevronDown className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Combined Output + Aspect + AI model row
 * ────────────────────────────────────────────────────────────── */

function CombinedOutputRow({
  output,
  onOutputChange,
  useAiModel,
  onUseAiModelChange,
}: {
  output: "image" | "video";
  onOutputChange: (v: "image" | "video") => void;
  useAiModel: boolean;
  onUseAiModelChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Output toggle */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          format
        </span>
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {(["image", "video"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onOutputChange(v)}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                output === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "image" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
              {v === "image" ? "Image" : "Video"}
            </button>
          ))}
        </div>
      </div>
      {/* Aspect */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          aspect
        </span>
        <div className="flex items-center gap-1">
          {["1:1", "9:16", "16:9", "4:5"].map((r) => (
            <button
              key={r}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-mono font-medium transition-colors border",
                r === "1:1"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {/* Use AI model — only when video */}
      {output === "video" && (
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => onUseAiModelChange(!useAiModel)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
              useAiModel
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "relative h-3.5 w-6 rounded-full transition-colors",
                useAiModel ? "bg-primary" : "bg-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-2.5 w-2.5 rounded-full bg-card shadow transition-transform",
                  useAiModel && "translate-x-2.5",
                )}
              />
            </span>
            <Sparkles className="h-3 w-3 text-primary" />
            Use AI model
          </button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  AI model integrated card — thumb + name + tone chips inline
 * ────────────────────────────────────────────────────────────── */

function AiModelIntegratedCard() {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-2.5 space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-amber-200/60 via-amber-300/40 to-amber-400/30 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-amber-700" />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">Aanya · 25 · Pro</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Indian · F · warm
          </p>
        </div>
        <button className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
          Pick model
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-primary/15">
        <Mic className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
          tone
        </span>
        <div className="flex flex-wrap gap-1">
          {["Warm", "Friendly", "Bold", "Professional", "Playful", "Premium"].map((t, i) => (
            <button
              key={t}
              className={cn(
                "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] transition-colors",
                i === 0
                  ? "bg-primary text-primary-foreground font-medium"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Summary triggers — Audience / Angle / Concepts
 * ────────────────────────────────────────────────────────────── */

function SummaryTrigger({
  pills,
  onClick,
  active,
  emptyHint,
}: {
  pills: string[];
  onClick: () => void;
  active: boolean;
  emptyHint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
        {pills.length === 0 ? (
          <span className="text-[11px] text-muted-foreground italic">{emptyHint}</span>
        ) : (
          <>
            {pills.slice(0, 3).map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-foreground"
              >
                <span className="h-1 w-1 rounded-full bg-primary" />
                {p}
              </span>
            ))}
            {pills.length > 3 && (
              <span className="font-mono text-[10px] text-muted-foreground">
                +{pills.length - 3} more
              </span>
            )}
          </>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {active ? "Editing" : "Edit"}
        <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}

function ReferencesSummary({
  count,
  onClick,
  active,
}: {
  count: number;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
          {count} attached
        </span>
        <div className="flex -space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-5 w-5 rounded-full border-2 border-card bg-muted/60"
            />
          ))}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {active ? "Editing" : "Edit"}
        <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}

function InlineToggleRow({ label }: { label: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => setOn(!on)}
      className="w-full flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-left hover:border-primary/40 transition-colors"
    >
      <span
        className={cn(
          "relative h-4 w-7 rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-card shadow transition-transform",
            on && "translate-x-3",
          )}
        />
      </span>
      <span className="text-[11px] text-foreground">{label}</span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Drawer header + footer
 * ────────────────────────────────────────────────────────────── */

function DrawerHeader({
  drawer,
  onClose,
}: {
  drawer: Exclude<DrawerKind, null>;
  onClose: () => void;
}) {
  const map: Record<Exclude<DrawerKind, null>, { title: string; sub: string; icon: typeof ImageIcon }> = {
    audience: {
      title: "Browse audiences",
      sub: "Pick personas · multi-select",
      icon: Users,
    },
    angle: {
      title: "Choose angles",
      sub: "Visual ad pattern · multi-select",
      icon: Wand2,
    },
    concepts: {
      title: "Browse concepts",
      sub: "Saved + new · multi-select · empty = AI decides",
      icon: Lightbulb,
    },
    references: {
      title: "Manage references",
      sub: "Uploads · Pinterest auto-fetched",
      icon: Paperclip,
    },
  };
  const m = map[drawer];
  const Icon = m.icon;

  return (
    <div className="shrink-0 border-b border-foreground/8 px-3 py-2.5 flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary mt-0.5">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground leading-tight">{m.title}</h3>
        <p className="text-[10px] text-muted-foreground leading-snug">{m.sub}</p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close drawer"
        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function DrawerFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="shrink-0 border-t border-foreground/8 px-3 py-2 flex items-center justify-between gap-2">
      <p className="text-[10px] text-muted-foreground italic">Selections persist when you close.</p>
      <button
        onClick={onClose}
        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <Check className="h-3 w-3" />
        Done
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Drawer A — Audience
 * ────────────────────────────────────────────────────────────── */

function AudienceDrawer() {
  return (
    <div className="space-y-3">
      <div className="inline-flex h-8 w-full items-center gap-2 rounded-md border border-border bg-card px-2.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          placeholder="Search audiences…"
          className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["All", "India", "US", "Female", "Male", "Mums", "Founders"].map((f, i) => (
          <button
            key={f}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors border",
              i === 0
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {[
          { name: "Young urban mums", meta: "28–40 · IN · F · mum", tags: ["metro", "premium", "health-led"], selected: true },
          { name: "D2C founders", meta: "28–45 · IN · founder", tags: ["B2B-buyer", "premium", "ROI-led"], selected: true },
          { name: "Tier-2 aspirational men", meta: "25–38 · IN · salaried", tags: ["aspirational", "value-led"], selected: false },
          { name: "Fitness enthusiasts", meta: "22–38 · IN · active", tags: ["health-led", "premium"], selected: false },
          { name: "Festive gifters", meta: "26–50 · IN · gifter", tags: ["seasonal", "family-led"], selected: false },
        ].map((a) => (
          <button
            key={a.name}
            className={cn(
              "rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
              a.selected
                ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-foreground">{a.name}</p>
              {a.selected && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              {a.meta}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
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
          </button>
        ))}
        <button className="w-full rounded-xl border-2 border-dashed border-border bg-card/40 px-3 py-2 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center justify-center gap-1">
          <Plus className="h-3 w-3" />
          Create custom audience
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Drawer B — Angle
 * ────────────────────────────────────────────────────────────── */

function AngleDrawer() {
  const angles: { id: string; label: string; description: string; variant: AngleVariant }[] = [
    { id: "fomo", label: "FOMO", description: "Scarcity, countdown", variant: "fomo" },
    { id: "founder-quote", label: "Founder quote", description: "Talking-head + on-screen quote", variant: "founder-quote" },
    { id: "lifestyle", label: "Lifestyle", description: "In-context use, mood-led", variant: "lifestyle" },
    { id: "problem-solution", label: "Problem → solution", description: "Pain to fix", variant: "problem-solution" },
    { id: "social-proof", label: "Social proof", description: "Reviews, ratings, customers", variant: "social-proof" },
    { id: "before-after", label: "Before / after", description: "Split-screen transformation", variant: "before-after" },
  ];
  const selected = new Set(["fomo", "lifestyle"]);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {angles.map((a) => {
          const sel = selected.has(a.id);
          return (
            <button
              key={a.id}
              className={cn(
                "flex flex-col rounded-xl border bg-card text-left overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md",
                sel
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40",
              )}
            >
              <AngleMockup variant={a.variant} selected={sel} />
              <div className="px-2 py-1.5 space-y-0.5">
                <p className="truncate text-[11px] font-semibold text-foreground">{a.label}</p>
                <p className="line-clamp-1 text-[10px] text-muted-foreground">{a.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Drawer C — Concepts
 * ────────────────────────────────────────────────────────────── */

function ConceptsDrawer() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-border bg-card p-0.5">
          {(["saved", "new"] as const).map((s, i) => (
            <button
              key={s}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" />
          Regenerate
        </button>
      </div>
      <div className="space-y-2">
        {[
          { name: "FOMO launch", gist: "Founder + 3-pack + scarcity stamp.", angle: "FOMO", aud: "Mums", selected: true },
          { name: "Founder story", gist: "Talking-head intro with reveal at 0:12.", angle: "Founder", aud: "Aspirational", selected: false },
          { name: "Bundle carousel", gist: "5-SKU carousel · price overlay · CTA tile.", angle: "Bundle", aud: "Value", selected: false },
          { name: "Before / After", gist: "Split-screen claim · transition wipe.", angle: "Transformation", aud: "Health-led", selected: false },
        ].map((c) => (
          <button
            key={c.name}
            className={cn(
              "w-full rounded-xl border bg-card p-3 text-left space-y-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md",
              c.selected
                ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-1">
              <p className="text-xs font-semibold text-foreground">{c.name}</p>
              {c.selected && <Check className="h-3.5 w-3.5 text-primary" />}
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">{c.gist}</p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-foreground">
                {c.angle}
              </span>
              <span className="inline-flex items-center rounded-full bg-muted/70 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {c.aud}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── *
 *  Drawer D — References (tabs: Uploads | Pinterest)
 *  (Templates absent here — Brand mode wireframe.
 *   In Ad mode this would be [Templates | Uploads | Pinterest].)
 * ────────────────────────────────────────────────────────────── */

function ReferencesDrawer() {
  const [tab, setTab] = useState<"uploads" | "pinterest">("uploads");
  return (
    <div className="space-y-3">
      <div role="tablist" className="inline-flex rounded-md border border-border bg-card p-0.5">
        {(["uploads", "pinterest"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "uploads" ? <Upload className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
            {t === "uploads" ? "Uploads" : "Pinterest"}
          </button>
        ))}
        <p className="pl-2 self-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Brand mode · no templates
        </p>
      </div>

      {tab === "uploads" ? (
        <div className="space-y-2">
          {/* Compact upload row — text + button side-by-side per Maalik */}
          <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-card/40 p-2">
            <Upload className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-foreground leading-tight">
                Upload local files
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Drag-drop or browse · png · jpg · mp4
              </p>
            </div>
            <button className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-foreground hover:border-primary/40 transition-colors">
              <Upload className="h-3 w-3" />
              Browse
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-lg border bg-muted/60",
                  i === 0 || i === 2
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border/60",
                )}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Click thumb to attach/detach · selected = lime ring
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Auto-fetched · biased on video · brand · 2 angles · 1 concept
            </p>
            <button className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 transition-colors">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}
          >
            {Array.from({ length: 9 }).map((_, i) => {
              const aspectClass =
                i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3]";
              const sel = i === 1 || i === 4;
              return (
                <div
                  key={i}
                  className={cn(
                    "relative overflow-hidden rounded-lg border bg-muted/60",
                    aspectClass,
                    sel
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border/60",
                  )}
                >
                  {sel && (
                    <span className="absolute top-1 right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudioV3Finder;

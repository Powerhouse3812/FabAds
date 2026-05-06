import { useState } from "react";
import { ChevronDown, Sparkles, Upload, Wand2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { WizardCard } from "../components/WizardCard";
import type { Method, QuickMode, UseWizardReturn } from "../state/useWizard";

interface Step3Props {
  wizard: UseWizardReturn;
  onGenerate: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  asset: "Asset",
  ad: "Ad",
  social: "Social",
};
const FORMAT_LABEL: Record<string, string> = {
  image: "Image",
  video: "Video",
};

const METHODS: {
  id: Method;
  emoji: string;
  title: string;
  badge?: string;
  bullets: string[];
}[] = [
  {
    id: "scratch",
    emoji: "✨",
    title: "From Scratch",
    badge: "Recommended",
    bullets: [
      "Write a prompt describing what you want",
      "Pick a strategy / angle",
      "Choose vibes + variations",
    ],
  },
  {
    id: "iterate",
    emoji: "🔄",
    title: "Iterate / Reference",
    bullets: [
      "Upload or pick from library",
      "Choose what to keep (layout / colors / copy)",
      "Adjust variation intensity",
    ],
  },
];

const QUICK_MODES: { id: QuickMode; emoji: string; label: string }[] = [
  { id: "ugc-video", emoji: "🎬", label: "UGC Video" },
  { id: "image-to-video", emoji: "🖼️", label: "Image-to-Video" },
  { id: "broll", emoji: "🎥", label: "B-Roll" },
  { id: "variations", emoji: "🔄", label: "Variations" },
  { id: "bg-remover", emoji: "✂️", label: "BG Remover" },
  { id: "resize", emoji: "📐", label: "Resize" },
];

const MODELS: {
  id: string;
  emoji: string;
  name: string;
  hint?: string;
}[] = [
  { id: "genie-1.0", emoji: "✨", name: "Genie 1.0", hint: "Fast" },
  { id: "genie-2.0-pro", emoji: "🚀", name: "Genie 2.0 Pro", hint: "Higher quality" },
  { id: "genie-flash", emoji: "⚡", name: "Genie Flash", hint: "Ultra-fast" },
  { id: "genie-video", emoji: "🎬", name: "Genie Video" },
  { id: "genie-labs", emoji: "🧪", name: "Genie Labs", hint: "Experimental" },
];

const ANGLES: { id: string; emoji: string; label: string; desc: string }[] = [
  { id: "hero", emoji: "🎯", label: "Hero Shot", desc: "Clean, centered product on minimal background." },
  { id: "lifestyle", emoji: "🌅", label: "Lifestyle", desc: "Product in a real-world context with mood." },
  { id: "social-proof", emoji: "💬", label: "Social Proof", desc: "Testimonials & reviews framed as visuals." },
  { id: "urgency", emoji: "🔥", label: "Urgency/Sale", desc: "Limited-time, deal-driven framing." },
  { id: "comparison", emoji: "⚖️", label: "Comparison", desc: "Side-by-side comparison vs alternatives." },
  { id: "ugc-style", emoji: "📱", label: "UGC Style", desc: "Authentic, phone-shot creator look." },
  { id: "unboxing", emoji: "📦", label: "Unboxing", desc: "First-impression reveal & detail shots." },
  { id: "infographic", emoji: "📊", label: "Infographic", desc: "Data-driven, label-heavy explainer." },
];

type Tab = "upload" | "library" | "templates" | "brand" | "url";
const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: "upload", emoji: "📤", label: "Upload" },
  { id: "library", emoji: "🖼️", label: "Library" },
  { id: "templates", emoji: "📋", label: "Templates" },
  { id: "brand", emoji: "🏷️", label: "Brand Kit" },
  { id: "url", emoji: "🔗", label: "URL" },
];

const LIBRARY_ITEMS = [
  { id: "lib-1", emoji: "👕", name: "Summer Tee", uses: 24 },
  { id: "lib-2", emoji: "👟", name: "Sneaker Hero", uses: 18 },
  { id: "lib-3", emoji: "💄", name: "Lip Gloss", uses: 12 },
  { id: "lib-4", emoji: "📱", name: "Phone Case", uses: 9 },
  { id: "lib-5", emoji: "⌚", name: "Watch Hero", uses: 7 },
  { id: "lib-6", emoji: "👜", name: "Tote Bag", uses: 6 },
  { id: "lib-7", emoji: "☕", name: "Mug", uses: 5 },
  { id: "lib-8", emoji: "🎧", name: "Headphones", uses: 4 },
  { id: "lib-9", emoji: "💼", name: "Briefcase", uses: 3 },
];

const TEMPLATES = [
  { id: "t-1", emoji: "🦸", name: "Product Hero" },
  { id: "t-2", emoji: "💬", name: "Social Proof" },
  { id: "t-3", emoji: "🔁", name: "Before/After" },
  { id: "t-4", emoji: "📖", name: "Brand Story" },
  { id: "t-5", emoji: "⚡", name: "Flash Sale" },
  { id: "t-6", emoji: "🏷️", name: "Offer Highlight" },
];

const BRAND_COLORS = ["#0F172A", "#84CC16", "#F97316", "#EC4899", "#06B6D4"];
const LOGO_VARIANTS = ["Primary", "Mono", "Inverse", "Icon"];

export function Step3Create({ wizard, onGenerate }: Step3Props) {
  const [tab, setTab] = useState<Tab>("upload");
  const [modelOpen, setModelOpen] = useState(false);

  const categoryLabel = wizard.state.category
    ? CATEGORY_LABEL[wizard.state.category]
    : "—";
  const formatLabel = wizard.state.format ? FORMAT_LABEL[wizard.state.format] : "—";
  const productLabel = wizard.state.productId ?? "—";

  const activeModel = MODELS.find((m) => m.id === wizard.state.modelId) ?? MODELS[0];
  const activeAngle = ANGLES.find((a) => a.id === wizard.state.angleId);

  const toggleLibrary = (id: string) => {
    const cur = wizard.state.selectedLibraryIds;
    wizard.set(
      "selectedLibraryIds",
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };
  const toggleTemplate = (id: string) => {
    const cur = wizard.state.selectedTemplateIds;
    wizard.set(
      "selectedTemplateIds",
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold">How do you want to create?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{categoryLabel}</span>
          {" · "}
          <span className="font-semibold text-foreground">{formatLabel}</span>
          {" · "}
          <span className="font-semibold text-foreground">{productLabel}</span>
        </p>
      </header>

      {/* A0. Prompt + Model + Count — the generation form core */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Wand2 className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Prompt
          </h2>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {wizard.state.prompt.length} chars
          </span>
        </div>
        <textarea
          value={wizard.state.prompt}
          onChange={(e) => wizard.set("prompt", e.target.value)}
          placeholder="Describe what you want to generate. e.g. Hero shot of Mamaearth Vitamin C serum on a marble surface, soft morning light, fresh flowers in background…"
          rows={4}
          className="block w-full resize-none rounded-lg border border-border bg-background p-3 text-sm leading-relaxed outline-none transition-colors focus:border-primary"
        />

        {/* Inline toolbar — AI Model + Output count */}
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3">
          {/* AI Model */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Model
            </span>
            <Popover open={modelOpen} onOpenChange={setModelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium hover:border-primary/40"
                >
                  <span>{activeModel.emoji}</span>
                  <span>{activeModel.name}</span>
                  {activeModel.hint && (
                    <span className="text-[10px] text-muted-foreground">
                      · {activeModel.hint}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-1">
                {MODELS.map((m) => {
                  const active = wizard.state.modelId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        wizard.set("modelId", m.id);
                        setModelOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                        active ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span className="font-medium">{m.name}</span>
                      {m.hint && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {m.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>

          {/* Output count */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Outputs
            </span>
            <div className="inline-flex rounded-full border border-border bg-background p-0.5">
              {[1, 2, 4, 8].map((n) => {
                const active = wizard.state.count === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => wizard.set("count", n)}
                    className={cn(
                      "inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 font-mono text-xs font-semibold transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
            <span>⚡</span>
            <span className="font-mono">{wizard.state.credits}</span>
            <span className="text-muted-foreground">credits</span>
          </span>
        </div>
      </section>

      {/* A. Method cards */}
      <section>
        <div className="grid grid-cols-2 gap-4">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => wizard.set("method", m.id)}
              className={cn(
                "group relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                wizard.state.method === m.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40",
              )}
            >
              {m.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {m.badge}
                </span>
              )}
              <span className="text-3xl leading-none">{m.emoji}</span>
              <h3 className="text-base font-bold text-foreground">{m.title}</h3>
              <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </section>

      {/* B. Quick Modes */}
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Quick Modes
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_MODES.map((q) => {
            const active = wizard.state.quickMode === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() =>
                  wizard.set("quickMode", active ? null : q.id)
                }
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border bg-card px-3 text-[11px] transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:border-primary/40",
                )}
              >
                <span>{q.emoji}</span>
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* D. Angle pills */}
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Angle
        </h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {ANGLES.map((a) => {
            const active = wizard.state.angleId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => wizard.set("angleId", active ? null : a.id)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40",
                )}
              >
                <span>{a.emoji}</span>
                <span>{a.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* E. Concepts / Asset input — tabbed */}
      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 pt-3">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {tab === "upload" && (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background py-12 text-center transition-colors hover:border-primary/40">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm font-medium">Drop files here or click to browse</div>
              <div className="text-xs text-muted-foreground">
                PNG, JPG, MP4, PDF — up to 25 MB
              </div>
              <input type="file" className="hidden" multiple />
            </label>
          )}

          {tab === "library" && (
            <div className="grid grid-cols-3 gap-3">
              {LIBRARY_ITEMS.map((it) => {
                const selected = wizard.state.selectedLibraryIds.includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggleLibrary(it.id)}
                    className={cn(
                      "group relative flex flex-col gap-2 rounded-xl border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border",
                    )}
                  >
                    <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-3xl">
                      {it.emoji}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium">{it.name}</div>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        used {it.uses}×
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {tab === "templates" && (
            <div className="grid grid-cols-6 gap-3">
              {TEMPLATES.map((t) => {
                const selected = wizard.state.selectedTemplateIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border bg-background p-3 transition-all",
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-3xl">
                      {t.emoji}
                    </div>
                    <div className="text-xs font-medium">{t.name}</div>
                    <button
                      type="button"
                      onClick={() => toggleTemplate(t.id)}
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-bold transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary hover:bg-primary/20",
                      )}
                    >
                      {selected ? "Added" : "Use"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "brand" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  🎨 Brand Colors
                </h3>
                <div className="flex items-center gap-2">
                  {BRAND_COLORS.map((c) => (
                    <span
                      key={c}
                      title={c}
                      className="h-8 w-8 rounded-full border border-border"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  🔤 Typography
                </h3>
                <p className="text-sm">Inter · DM Sans</p>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  📄 Brand Guidelines PDF
                </h3>
                <a className="text-sm text-primary hover:underline" href="#">
                  brand-guidelines.pdf — preview
                </a>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  🖼️ Logo Assets
                </h3>
                <div className="flex items-center gap-3">
                  {LOGO_VARIANTS.map((v) => (
                    <div
                      key={v}
                      className="flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-background text-[10px] text-muted-foreground"
                    >
                      <div className="text-base">🅻</div>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "url" && (
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="Paste a reference URL"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                Fetch
              </button>
            </div>
          )}
        </div>
      </section>

      {/* F. Active angle preview + Generate */}
      <section className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex min-h-[2rem] flex-1 items-center text-sm text-muted-foreground">
          {activeAngle ? (
            <span>
              <span className="mr-1">{activeAngle.emoji}</span>
              <span className="font-semibold text-foreground">
                {activeAngle.label}
              </span>
              {" — "}
              <span>{activeAngle.desc}</span>
            </span>
          ) : (
            <span className="italic">Pick an angle to see a one-line description.</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" />
            Generate
            <span className="font-mono text-[11px] opacity-80">
              · {wizard.state.count}× · {wizard.state.credits} cr
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

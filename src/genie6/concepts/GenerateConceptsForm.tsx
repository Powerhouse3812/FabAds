import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  Globe,
  Instagram,
  MessageCircle,
  Music2,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  Twitter,
  Users,
  Wand2,
  X,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { angles as ALL_ANGLES } from "@/mocks/shared/angles";
import { audiences as ALL_AUDIENCES } from "@/mocks/shared/audiences";
import { sampleOutputs } from "@/genie6/mocks/sample-outputs";
import type {
  EntityType,
  EntityId,
  KbConcept,
  ResearchSource,
} from "@/mocks/shared";
import { addConcept as savedAddConcept } from "@/genie6/concepts/saved-store";

/**
 * GenerateConceptsForm — shared structured-AI form mounted in 3 surfaces:
 *   - "modal": inside KbCreateModal's AI tab (compact, no hero)
 *   - "page":  standalone /iq/genie6/concepts/generate (full hero)
 *   - "rail":  Step 4 Configure's right-rail picker (narrow padding)
 *
 * 4 required inputs (prompt · angle · audience · visual direction) +
 * an optional multi-select research sources row. Output count picked
 * via a 4-pill quick row (default 1). Mock AI generation lives here too.
 *
 * URL-backed state when surface !== "modal".
 */

export interface GenerateConceptsFormProps {
  surface: "modal" | "page" | "rail";
  entityContext?: {
    type: EntityType;
    id: EntityId;
    label: string;
  };
  /** Called after the user clicks Use on a generated concept card. */
  onConceptSaved?: (concept: KbConcept) => void;
  onClose?: () => void;
}

const SOURCES: { id: ResearchSource; label: string; Icon: React.ElementType }[] = [
  { id: "reddit",    label: "Reddit",            Icon: MessageCircle },
  { id: "youtube",   label: "YouTube",           Icon: Youtube },
  { id: "instagram", label: "Instagram",         Icon: Instagram },
  { id: "tiktok",    label: "TikTok",            Icon: Music2 },
  { id: "x",         label: "X / Twitter",       Icon: Twitter },
  { id: "threads",   label: "Threads",           Icon: MessageCircle },
  { id: "web",       label: "Web search",        Icon: Globe },
  { id: "reviews",   label: "Customer reviews",  Icon: Star },
  { id: "insights",  label: "Industry Insights", Icon: Sparkles },
];

const COUNT_OPTIONS = [1, 3, 6, 10] as const;
type CountOption = (typeof COUNT_OPTIONS)[number];

// ── Mock AI generation ──────────────────────────────────────────────────

const TONES = ["Confident", "Playful", "Premium", "Honest", "Bold", "Warm"];
const NAME_TEMPLATES = [
  "%angle% — %audience% story",
  "%audience% in a %angle% frame",
  "%angle% × %visual%",
  "%audience% wakes up to %angle%",
  "Quiet %angle% for %audience%",
  "Loud %angle% for %audience%",
  "%angle% — UGC angle",
  "%angle% — clinical angle",
  "%angle% — Reels-first cut",
  "%angle% — hero shot",
];

function mockGenerateConcepts(
  inputs: {
    prompt: string;
    angleId: string;
    audienceId: string;
    visualDirection: string;
    researchSources: ResearchSource[];
    count: CountOption;
  },
  entityContext?: { type: EntityType; id: EntityId; label: string },
): KbConcept[] {
  const angle = ALL_ANGLES.find((a) => a.id === inputs.angleId);
  const audience = ALL_AUDIENCES.find((a) => a.id === inputs.audienceId);
  const visualWord = inputs.visualDirection.split(/\s+/).slice(0, 3).join(" ") || "vivid";
  const now = new Date();

  // Pick `count` thumbnails from sample outputs.
  const thumbs = sampleOutputs
    .map((o) => o.thumbnail)
    .filter((t): t is string => Boolean(t));

  const out: KbConcept[] = [];
  for (let i = 0; i < inputs.count; i++) {
    const tone = TONES[i % TONES.length];
    const nameTemplate = NAME_TEMPLATES[i % NAME_TEMPLATES.length];
    const name = nameTemplate
      .replace("%angle%", angle?.label ?? "Hero")
      .replace("%audience%", audience?.label ?? "Audience")
      .replace("%visual%", visualWord);
    const sourceLine =
      inputs.researchSources.length > 0
        ? ` Grounded in ${inputs.researchSources.slice(0, 3).join(" · ")}.`
        : "";
    const description = `${inputs.prompt.trim() || `${name}.`}${sourceLine}`;
    out.push({
      id: `aigen-${Date.now()}-${i}`,
      entityType: entityContext?.type ?? "brand",
      entityId: (entityContext?.id ?? "mamaearth") as EntityId,
      source: "saved-from-genie",
      name,
      description,
      visualDirection: inputs.visualDirection.trim() || (angle?.description ?? "Clean shot, soft natural light."),
      tone,
      thumbnail: thumbs[(i * 3) % thumbs.length],
      capturedAt: now,
      angle: angle?.label,
      audience: audience?.label,
      researchSources: inputs.researchSources,
      prompt: inputs.prompt,
      generatedAt: now,
    });
  }
  return out;
}

// ── Component ───────────────────────────────────────────────────────────

export function GenerateConceptsForm({
  surface,
  entityContext,
  onConceptSaved,
  onClose,
}: GenerateConceptsFormProps) {
  // URL params (only for non-modal surfaces). Modal keeps state local.
  const [searchParams, setSearchParams] = useSearchParams();
  const isUrlBacked = surface !== "modal";

  const readUrl = (k: string) =>
    isUrlBacked ? (searchParams.get(k) ?? "") : "";
  const writeUrl = (patch: Record<string, string | null>) => {
    if (!isUrlBacked) return;
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === null || v === "") sp.delete(k);
          else sp.set(k, v);
        }
        return sp;
      },
      { replace: true },
    );
  };

  const [prompt, setPrompt] = useState(readUrl("prompt"));
  const [angleId, setAngleId] = useState(readUrl("angle"));
  const [audienceId, setAudienceId] = useState(readUrl("audience"));
  const [visualDirection, setVisualDirection] = useState(readUrl("visual"));
  const initialSources = readUrl("sources")
    .split(",")
    .filter(Boolean)
    .filter((s): s is ResearchSource =>
      SOURCES.some((src) => src.id === s),
    );
  const [researchSources, setResearchSources] =
    useState<ResearchSource[]>(initialSources);
  const initialCount = (() => {
    const n = parseInt(readUrl("count"), 10);
    return (COUNT_OPTIONS as readonly number[]).includes(n)
      ? (n as CountOption)
      : 1;
  })();
  const [count, setCount] = useState<CountOption>(initialCount);

  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<KbConcept[]>([]);

  const updatePrompt = (v: string) => {
    setPrompt(v);
    writeUrl({ prompt: v });
  };
  const updateAngle = (v: string) => {
    setAngleId(v);
    writeUrl({ angle: v });
  };
  const updateAudience = (v: string) => {
    setAudienceId(v);
    writeUrl({ audience: v });
  };
  const updateVisual = (v: string) => {
    setVisualDirection(v);
    writeUrl({ visual: v });
  };
  const toggleSource = (id: ResearchSource) => {
    setResearchSources((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      writeUrl({ sources: next.length ? next.join(",") : null });
      return next;
    });
  };
  const updateCount = (n: CountOption) => {
    setCount(n);
    writeUrl({ count: n === 1 ? null : String(n) });
  };

  const allRequiredFilled =
    prompt.trim() && angleId && audienceId && visualDirection.trim();

  const selectedAngle = useMemo(
    () => ALL_ANGLES.find((a) => a.id === angleId),
    [angleId],
  );
  const selectedAudience = useMemo(
    () => ALL_AUDIENCES.find((a) => a.id === audienceId),
    [audienceId],
  );

  const handleGenerate = async () => {
    if (!allRequiredFilled || generating) return;
    setGenerating(true);
    setResults([]);
    await new Promise((r) => setTimeout(r, 800));
    setResults(
      mockGenerateConcepts(
        {
          prompt,
          angleId,
          audienceId,
          visualDirection,
          researchSources,
          count,
        },
        entityContext,
      ),
    );
    setGenerating(false);
  };

  const handleUse = (concept: KbConcept) => {
    savedAddConcept(concept);
    onConceptSaved?.(concept);
  };

  const handleDiscard = (id: string) => {
    setResults((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReRun = () => {
    setResults([]);
  };

  // Surface-specific paddings
  const wrapperPad =
    surface === "page" ? "p-0" : surface === "rail" ? "p-3" : "p-4";

  return (
    <div className={cn("flex w-full flex-col gap-4 text-foreground", wrapperPad)}>
      {/* Surface-specific hero */}
      {surface === "page" && (
        <header className="space-y-1">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Generate with AI
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Structured concept generation
          </h1>
          <p className="max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
            Prompt + angle + audience + visual direction. Optionally pick
            research sources to ground the model in real signals from
            Reddit, YouTube, Customer reviews, and more.
          </p>
        </header>
      )}

      {results.length === 0 ? (
        <>
          {/* Form mode */}
          <FieldLabel>Prompt</FieldLabel>
          <textarea
            value={prompt}
            onChange={(e) => updatePrompt(e.target.value)}
            rows={surface === "rail" ? 3 : 4}
            placeholder="Describe the concept you want — what's the message, what's the hook?"
            className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2.5 text-[12px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40"
          />

          <div
            className={cn(
              "grid gap-3",
              surface === "rail" ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            <div>
              <FieldLabel>Angle</FieldLabel>
              <PickerTrigger
                icon={Target}
                value={selectedAngle?.label ?? null}
                placeholder="Pick an angle"
                content={
                  <PickerListAngles
                    selectedId={angleId}
                    onPick={(id) => updateAngle(id)}
                  />
                }
              />
            </div>
            <div>
              <FieldLabel>Audience</FieldLabel>
              <PickerTrigger
                icon={Users}
                value={selectedAudience?.label ?? null}
                placeholder="Pick an audience"
                content={
                  <PickerListAudiences
                    selectedId={audienceId}
                    onPick={(id) => updateAudience(id)}
                  />
                }
              />
            </div>
          </div>

          <div>
            <FieldLabel>Visual direction</FieldLabel>
            <textarea
              value={visualDirection}
              onChange={(e) => updateVisual(e.target.value)}
              rows={surface === "rail" ? 2 : 3}
              placeholder="White cyclorama, clean macro shots, soft natural light…"
              className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2.5 text-[12px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40"
            />
          </div>

          <div>
            <FieldLabel>
              Research <span className="font-normal text-muted-foreground/60">(optional)</span>
            </FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {SOURCES.map(({ id, label, Icon }) => {
                const active = researchSources.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleSource(id)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      active
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 bg-background/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div
            aria-hidden
            className="h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]"
          />

          {/* Count + Generate */}
          <div className="flex flex-wrap items-center gap-3">
            <FieldLabel className="mb-0">Output</FieldLabel>
            <div className="inline-flex gap-1 rounded-full border border-border/60 bg-background/40 p-0.5">
              {COUNT_OPTIONS.map((n) => {
                const active = count === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateCount(n)}
                    className={cn(
                      "inline-flex h-7 min-w-[34px] items-center justify-center rounded-full px-2 font-mono text-[11px] font-bold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!allRequiredFilled || generating}
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition-transform",
                allRequiredFilled && !generating
                  ? "bg-primary text-primary-foreground hover:scale-[1.02]"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
              title={
                !allRequiredFilled
                  ? "Fill prompt + angle + audience + visual direction to enable"
                  : `Generate ${count} concept${count === 1 ? "" : "s"}`
              }
            >
              {generating ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Generate · {count} credit{count === 1 ? "" : "s"}
                </>
              )}
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="-mt-1 inline-flex w-max items-center gap-1 self-start font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" /> Close
            </button>
          )}
        </>
      ) : (
        <>
          {/* Results mode — form collapses to a summary row */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-[11px]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Inputs:
            </span>
            <span className="text-foreground/80">{selectedAngle?.label}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-foreground/80">{selectedAudience?.label}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-foreground/80">
              {results.length} result{results.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={handleReRun}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Re-run
            </button>
          </div>

          <div
            className={cn(
              "grid gap-3",
              surface === "rail"
                ? "grid-cols-1"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
            )}
          >
            {results.map((c) => (
              <ResultCard
                key={c.id}
                concept={c}
                onUse={() => handleUse(c)}
                onDiscard={() => handleDiscard(c.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Bits ────────────────────────────────────────────────────────────────

function FieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </label>
  );
}

function PickerTrigger({
  icon: Icon,
  value,
  placeholder,
  content,
}: {
  icon: React.ElementType;
  value: string | null;
  placeholder: string;
  content: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-lg border border-border/60 bg-background px-3 text-left text-[12px] transition-colors hover:border-foreground/30",
            !value && "text-muted-foreground/70",
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{value ?? placeholder}</span>
          <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[300px] max-h-[380px] overflow-y-auto rounded-xl border bg-card p-2"
      >
        <div onClick={() => setOpen(false)}>{content}</div>
      </PopoverContent>
    </Popover>
  );
}

function PickerListAngles({
  selectedId,
  onPick,
}: {
  selectedId: string;
  onPick: (id: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {ALL_ANGLES.map((a) => {
        const active = selectedId === a.id;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onPick(a.id)}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
                active && "bg-primary/10",
                !active && "hover:bg-foreground/[0.04]",
              )}
            >
              <span
                className={cn(
                  "text-[12px] font-medium",
                  active ? "text-primary" : "text-foreground",
                )}
              >
                {a.label}
              </span>
              {a.description && (
                <span className="line-clamp-1 text-[10px] text-muted-foreground">
                  {a.description}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PickerListAudiences({
  selectedId,
  onPick,
}: {
  selectedId: string;
  onPick: (id: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {ALL_AUDIENCES.slice(0, 40).map((a) => {
        const active = selectedId === a.id;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onPick(a.id)}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
                active && "bg-primary/10",
                !active && "hover:bg-foreground/[0.04]",
              )}
            >
              <span
                className={cn(
                  "text-[12px] font-medium",
                  active ? "text-primary" : "text-foreground",
                )}
              >
                {a.label}
              </span>
              <span className="line-clamp-1 text-[10px] text-muted-foreground">
                {a.segment}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ResultCard({
  concept,
  onUse,
  onDiscard,
}: {
  concept: KbConcept;
  onUse: () => void;
  onDiscard: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {concept.thumbnail ? (
          <img
            src={concept.thumbnail}
            alt={concept.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">
          <Sparkles className="h-2.5 w-2.5" />
          AI
        </span>
      </div>
      <div className="space-y-2 p-2.5">
        <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
          {concept.name}
        </p>
        <p className="line-clamp-3 text-[10px] leading-relaxed text-muted-foreground">
          {concept.description}
        </p>
        <div className="flex flex-wrap gap-1 pt-0.5">
          {concept.tone && (
            <span className="inline-flex items-center rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground/70">
              {concept.tone}
            </span>
          )}
          {concept.angle && (
            <span className="inline-flex items-center rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground/70">
              {concept.angle}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 pt-1">
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 rounded-full border border-border/60 bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onUse}
            className="flex-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Use
          </button>
        </div>
      </div>
    </article>
  );
}

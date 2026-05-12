import { useRef, useState } from "react";
import { Bookmark, Check, Copy, Mic, RefreshCw, Sparkles, Type, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GenerateConceptsForm } from "@/genie6/concepts/GenerateConceptsForm";
import type {
  EntityType,
  EntityId,
  KbInstruction,
  WinnerAd,
  KbConcept,
} from "@/mocks/shared";

export type KbCreateKind = "instruction" | "winner-ad" | "concept";

type SavedItem =
  | { kind: "instruction"; item: KbInstruction }
  | { kind: "winner-ad"; item: WinnerAd }
  | { kind: "concept"; item: KbConcept };

interface KbCreateModalProps {
  kind: KbCreateKind;
  entityType: EntityType;
  entityId: EntityId;
  entityName: string;
  onSave: (saved: SavedItem) => void;
  onClose: () => void;
}

type Tab = "enter" | "upload" | "ai";

const KIND_CONFIG: Record<KbCreateKind, { title: string; eyebrow: string; aiPromptHint: string }> = {
  instruction: {
    title: "Add instruction",
    eyebrow: "KNOWLEDGE BASE · INSTRUCTIONS",
    aiPromptHint: "What kind of instruction? E.g. 'Tone for festive campaigns'",
  },
  "winner-ad": {
    title: "Add winner ad",
    eyebrow: "KNOWLEDGE BASE · WINNER ADS",
    aiPromptHint: "Describe the winning ad concept (headline, format, what works)",
  },
  concept: {
    title: "Save concept",
    eyebrow: "KNOWLEDGE BASE · CONCEPTS",
    aiPromptHint: "Describe the creative concept (angle, tone, visual direction)",
  },
};

const MOCK_AI_INSTRUCTIONS = [
  "Lead with the most-frustrating problem the customer has. Show before/after where compliant. Cite verified review counts.",
  "Open with a 5-star review quote overlay. Mention exact customer count (e.g. 12,000+ reviews). Show real customer photo if possible.",
  "Speak in first-person UGC tone. Mention what surprised you. 1 light cut every 2 seconds. End with 'link in bio'.",
  "Use 3 icon rows with 1-line benefit each. Brand colors only. No prose copy. Ingredient callouts as flat-lay.",
];

const MOCK_AI_CONCEPTS = [
  { name: "Hero packshot", description: "Clean centered bottle, 45° lighting, brand colors.", tone: "Premium", visualDirection: "Soft shadows, neutral bg" },
  { name: "Social proof grid", description: "4-cell grid of customer photos + 5-star quotes.", tone: "Trust", visualDirection: "Real photos, not staged" },
  { name: "Before / after split", description: "Vertical split, day-0 vs day-28 timestamps.", tone: "Proof-led", visualDirection: "Same lighting both sides" },
  { name: "Ingredient flat-lay", description: "Bottle + 3 hero ingredients as flat-lay.", tone: "Educational", visualDirection: "Top-down, brand-tinted bg" },
];

export function KbCreateModal({ kind, entityType, entityId, entityName, onSave, onClose }: KbCreateModalProps) {
  const cfg = KIND_CONFIG[kind];
  const [tab, setTab] = useState<Tab>("enter");

  // Enter tab — fields
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("");
  const [visual, setVisual] = useState("");

  // Upload tab
  const [uploadedText, setUploadedText] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI tab
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiOutputs, setAiOutputs] = useState<{ id: string; text: string; idx: number }[]>([]);
  const [generating, setGenerating] = useState(false);

  const buildInstruction = (overrides: Partial<KbInstruction> = {}): KbInstruction => ({
    id: `ki-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    entityType,
    entityId,
    kind: "custom",
    anglesCovered: [],
    name: overrides.name ?? name ?? "Untitled instruction",
    description: overrides.description ?? `Custom instruction for ${entityName}`,
    content: overrides.content ?? content,
    source: overrides.source ?? "manual",
    createdAt: new Date(),
    ...overrides,
  });

  const buildWinnerAd = (overrides: Partial<WinnerAd> = {}): WinnerAd => ({
    id: `wa-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    entityType,
    entityId,
    source: overrides.source ?? "uploaded",
    format: overrides.format ?? "image",
    headline: overrides.headline ?? name ?? "Winner ad",
    description: overrides.description ?? content,
    capturedAt: new Date(),
    ...overrides,
  });

  const buildConcept = (overrides: Partial<KbConcept> = {}): KbConcept => ({
    id: `kc-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    entityType,
    entityId,
    source: overrides.source ?? "saved-from-genie",
    name: overrides.name ?? name ?? "Untitled concept",
    description: overrides.description ?? content,
    tone: overrides.tone ?? tone ?? "Custom",
    visualDirection: overrides.visualDirection ?? visual ?? "—",
    capturedAt: new Date(),
    ...overrides,
  });

  const handleSaveEnter = () => {
    if (!name.trim() && !content.trim()) return;
    if (kind === "instruction") {
      onSave({ kind: "instruction", item: buildInstruction() });
    } else if (kind === "winner-ad") {
      onSave({ kind: "winner-ad", item: buildWinnerAd() });
    } else {
      onSave({ kind: "concept", item: buildConcept() });
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 50_000) {
      alert("File too large (50KB max)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedText(String(reader.result));
      setUploadedFilename(f.name);
    };
    reader.readAsText(f);
  };

  const handleSaveUpload = () => {
    if (!uploadedText) return;
    if (kind === "instruction") {
      onSave({
        kind: "instruction",
        item: buildInstruction({
          name: uploadedFilename ?? "Uploaded instruction",
          content: uploadedText,
          source: "uploaded",
        }),
      });
    } else if (kind === "winner-ad") {
      onSave({
        kind: "winner-ad",
        item: buildWinnerAd({
          headline: uploadedFilename ?? "Uploaded winner",
          description: uploadedText.slice(0, 200),
          source: "uploaded",
        }),
      });
    } else {
      onSave({
        kind: "concept",
        item: buildConcept({
          name: uploadedFilename ?? "Uploaded concept",
          description: uploadedText.slice(0, 200),
        }),
      });
    }
  };

  const handleGenerate = () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const idx = aiOutputs.length;
      const text =
        kind === "concept"
          ? `${MOCK_AI_CONCEPTS[idx % MOCK_AI_CONCEPTS.length].name} — ${MOCK_AI_CONCEPTS[idx % MOCK_AI_CONCEPTS.length].description}`
          : MOCK_AI_INSTRUCTIONS[idx % MOCK_AI_INSTRUCTIONS.length];
      setAiOutputs((prev) => [...prev, { id: `gen-${Date.now()}`, text, idx }]);
      setGenerating(false);
    }, 700);
  };

  const handleRegenerate = (id: string) => {
    setAiOutputs((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const list = kind === "concept" ? MOCK_AI_CONCEPTS.map((c) => `${c.name} — ${c.description}`) : MOCK_AI_INSTRUCTIONS;
        const next = (o.idx + 1) % list.length;
        return { ...o, text: list[next], idx: next };
      }),
    );
  };

  const handleUseAi = (output: { text: string; idx: number }) => {
    if (kind === "instruction") {
      onSave({
        kind: "instruction",
        item: buildInstruction({
          name: aiPrompt.slice(0, 60) || "AI-generated instruction",
          content: output.text,
          source: "ai-generated",
        }),
      });
    } else if (kind === "winner-ad") {
      onSave({
        kind: "winner-ad",
        item: buildWinnerAd({
          headline: aiPrompt.slice(0, 60) || "AI-generated winner",
          description: output.text,
          source: "saved-from-genie",
        }),
      });
    } else {
      const c = MOCK_AI_CONCEPTS[output.idx % MOCK_AI_CONCEPTS.length];
      onSave({
        kind: "concept",
        item: buildConcept({
          name: c.name,
          description: c.description,
          tone: c.tone,
          visualDirection: c.visualDirection,
          source: "saved-from-genie",
        }),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl max-h-[80vh]">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {cfg.eyebrow} · FOR {entityName.toUpperCase()}
            </p>
            <h3 className="text-sm font-semibold text-foreground">{cfg.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Tab strip */}
        <div className="flex shrink-0 border-b border-border bg-muted/20 px-2 py-1">
          <TabBtn active={tab === "enter"} onClick={() => setTab("enter")} icon={Type}>Enter</TabBtn>
          <TabBtn active={tab === "upload"} onClick={() => setTab("upload")} icon={Upload}>Upload</TabBtn>
          <TabBtn active={tab === "ai"} onClick={() => setTab("ai")} icon={Sparkles}>AI Chat</TabBtn>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "enter" && (
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name…"
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-foreground/30"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  kind === "winner-ad"
                    ? "Headline / description…"
                    : kind === "concept"
                      ? "Description…"
                      : "Instruction body…"
                }
                rows={6}
                className="block w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm leading-relaxed outline-none focus:border-foreground/30"
              />
              {kind === "concept" && (
                <>
                  <input
                    type="text"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="Tone (e.g. Premium, Authentic, Bold)…"
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-foreground/30"
                  />
                  <input
                    type="text"
                    value={visual}
                    onChange={(e) => setVisual(e.target.value)}
                    placeholder="Visual direction…"
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-foreground/30"
                  />
                </>
              )}
            </div>
          )}

          {tab === "upload" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-card/40 p-8 text-center transition-colors hover:border-foreground/30 hover:bg-card/60"
              >
                <Upload className="h-7 w-7 text-muted-foreground/60" />
                <p className="text-[13px] font-semibold text-foreground">Drop a file or click to browse</p>
                <p className="text-[11px] text-muted-foreground">.txt or .md, up to 50 KB</p>
              </button>
              <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFile} className="hidden" />
              {uploadedText && (
                <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {uploadedFilename}
                  </p>
                  <pre className="max-h-[180px] overflow-y-auto whitespace-pre-wrap text-[11px] text-foreground/80">
                    {uploadedText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {tab === "ai" && kind === "concept" && (
            // A-12.60 (Maalik): structured AI form for concepts — replaces
            // the old free-text prompt with prompt + angle + audience +
            // visual + research sources. Same form is also mounted at
            // /iq/genie6/concepts/generate (page) and in Step 4's right
            // rail (rail surface).
            <GenerateConceptsForm
              surface="modal"
              entityContext={{ type: entityType, id: entityId, label: entityName }}
              onConceptSaved={(c) => {
                onSave({ kind: "concept", item: c });
              }}
              onClose={onClose}
            />
          )}
          {tab === "ai" && kind !== "concept" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGenerate();
                  }}
                  placeholder={cfg.aiPromptHint}
                  className="flex-1 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm outline-none focus:border-foreground/30"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!aiPrompt.trim() || generating}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  {generating ? "…" : "Generate"}
                </button>
              </div>
              {aiOutputs.length === 0 && !generating && (
                <p className="py-12 text-center text-[12px] text-muted-foreground">
                  Type a prompt and Generate. Each output you can copy, regenerate, save, or use.
                </p>
              )}
              {aiOutputs.map((o, idx) => (
                <div key={o.id} className="rounded-xl border border-border/40 bg-card/60 p-3 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      v{idx + 1}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-foreground">{o.text}</p>
                  <div className="mt-3 flex items-center gap-1 border-t border-border/40 pt-2">
                    <ActionBtn icon={Copy} label="Copy" onClick={() => navigator.clipboard.writeText(o.text)} />
                    <ActionBtn icon={RefreshCw} label="Regenerate" onClick={() => handleRegenerate(o.id)} />
                    <ActionBtn icon={Bookmark} label="Save" onClick={() => console.log("[KbCreateModal] save", o.id)} />
                    <button
                      type="button"
                      onClick={() => handleUseAi(o)}
                      className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground hover:opacity-90"
                    >
                      <Check className="h-3 w-3" />
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          {tab === "enter" && (
            <button
              type="button"
              onClick={handleSaveEnter}
              disabled={!name.trim() && !content.trim()}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {kind === "winner-ad" ? "Save winner ad" : kind === "concept" ? "Save concept" : "Save instruction"}
            </button>
          )}
          {tab === "upload" && (
            <button
              type="button"
              onClick={handleSaveUpload}
              disabled={!uploadedText}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              Save uploaded
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
    >
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

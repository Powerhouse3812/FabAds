import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  Copy,
  FileText,
  RefreshCw,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KbInstruction } from "../data/kbInstructions";

interface KbInstructionRailProps {
  /** The angle the user wants to cover (null if not angle-specific). */
  targetAngle: string | null;
  /** Friendly angle label, e.g. "FOMO", "Urgency". For headings + AI prompts. */
  targetAngleLabel: string;
  /** Called when user finalises a new instruction. */
  onSave: (instruction: KbInstruction) => void;
  onClose: () => void;
}

type Tab = "enter" | "upload" | "ai";

interface Generation {
  id: string;
  text: string;
}

/**
 * Pre-canned mock KB instructions cycled through on Generate / Regenerate.
 * Tone is "do X, don't do Y" — instructional, not narrative (vs ScriptRail's
 * narrative scripts).
 */
const MOCK_INSTRUCTIONS = [
  "DO: Lead with the urgency hook in the first 2 seconds.\nDO: Use a real countdown overlay (not stock animation).\nDO: Highlight scarcity with exact numbers (\"only 47 left\").\n\nDON'T: Use generic \"limited time\" copy without proof.\nDON'T: Stack multiple offers — one clear deal beats three.\nDON'T: Hide the CTA below the fold.",
  "DO: Open with the side-by-side frame within the first second.\nDO: Use identical lighting for both sides (fairness).\nDO: Label \"ours\" and \"theirs\" with neutral typography.\n\nDON'T: Mock the competitor visually — let the data win.\nDON'T: Compress the comparison into <3 seconds.\nDON'T: Skip the unit price callout.",
  "DO: Show the box closed before any unboxing motion.\nDO: Capture hand-on-product reveal in slow motion.\nDO: Keep ASMR sound design audible (paper, foil, click).\n\nDON'T: Cut away from the reveal — single-take only.\nDON'T: Over-light — keep shadows for tactile depth.\nDON'T: Talk over the unboxing audio.",
  "DO: Anchor the script in a real customer quote (verified review).\nDO: Use a single-product framing — no mosaic.\nDO: End with a soft CTA (\"see why\", not \"buy now\").\n\nDON'T: Fabricate testimonials or compose composite reviews.\nDON'T: Use stock customer photos — feels off.\nDON'T: Over-design the quote card — keep it text-first.",
];

const MAX_UPLOAD_BYTES = 50 * 1024; // 50 KB

/** Slug-safe id from a label, e.g. "FOMO" → "fomo", "Social Proof" → "social-proof". */
function slug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function makeId(prefix: string, label: string): string {
  return `ki-${prefix}-${slug(label)}-${Date.now().toString(36)}`;
}

/**
 * KbInstructionRail — modal picker for creating a new KB instruction.
 *
 * Mirrors ScriptRail exactly:
 *   - Three tabs: Enter / Upload / AI
 *   - AI output cards each support Copy / Regenerate / Save / Use
 *
 * The output is a NEW `KbInstruction` object that gets pushed into
 * `wizard.state.customKbInstructions`. The instruction's `anglesCovered`
 * is set from `targetAngle` so the warning state resolves immediately.
 */
export function KbInstructionRail({
  targetAngle,
  targetAngleLabel,
  onSave,
  onClose,
}: KbInstructionRailProps) {
  const [tab, setTab] = useState<Tab>("enter");

  // Enter tab
  const [enteredText, setEnteredText] = useState<string>("");
  const [enteredName, setEnteredName] = useState<string>(
    `${targetAngleLabel} instruction`,
  );

  // Upload tab
  const [uploadedText, setUploadedText] = useState<string>("");
  const [uploadedFilename, setUploadedFilename] = useState<string>("");
  const [uploadedName, setUploadedName] = useState<string>(
    `${targetAngleLabel} instruction`,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI tab
  const initialAiPrompt = `Write a Knowledge Base instruction for "${targetAngleLabel}" angle ad creatives`;
  const [aiPrompt, setAiPrompt] = useState<string>(initialAiPrompt);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generations, setGenerations] = useState<Generation[]>([]);

  // Keep auto-name + AI prompt in sync if the angle label changes mid-session.
  useEffect(() => {
    setEnteredName((prev) =>
      prev.endsWith("instruction") ? `${targetAngleLabel} instruction` : prev,
    );
    setUploadedName((prev) =>
      prev.endsWith("instruction") ? `${targetAngleLabel} instruction` : prev,
    );
    setAiPrompt(initialAiPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetAngleLabel]);

  const wordCount = useMemo(
    () => (enteredText.trim() ? enteredText.trim().split(/\s+/).length : 0),
    [enteredText],
  );

  const copyToClipboard = (text: string) => {
    void navigator.clipboard?.writeText(text);
  };

  const handleGenerate = () => {
    if (!aiPrompt.trim() || generating) return;
    setGenerating(true);
    window.setTimeout(() => {
      const next =
        MOCK_INSTRUCTIONS[generations.length % MOCK_INSTRUCTIONS.length];
      setGenerations((prev) => [
        ...prev,
        { id: `gen-${Date.now()}`, text: next },
      ]);
      setGenerating(false);
    }, 800);
  };

  const regenerate = (id: string) => {
    setGenerations((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const idx = MOCK_INSTRUCTIONS.indexOf(g.text);
        const nextIdx = (idx + 1) % MOCK_INSTRUCTIONS.length;
        return { ...g, text: MOCK_INSTRUCTIONS[nextIdx] };
      }),
    );
  };

  const saveToLibrary = (id: string) => {
    // Stub — would persist to a saved-instructions library later.
    console.log("[KbInstructionRail] save to library", id);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadError(null);
    if (f.size > MAX_UPLOAD_BYTES) {
      setUploadError("File too large — max 50 KB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedText(String(reader.result ?? ""));
      setUploadedFilename(f.name);
    };
    reader.onerror = () => setUploadError("Could not read file.");
    reader.readAsText(f);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const anglesCoveredFor = (): string[] =>
    targetAngle ? [targetAngle] : [];

  const useEntered = () => {
    if (!enteredText.trim()) return;
    onSave({
      id: makeId("manual", enteredName || targetAngleLabel),
      name: enteredName.trim() || `${targetAngleLabel} instruction`,
      description: `Manually entered instruction for ${targetAngleLabel}.`,
      anglesCovered: anglesCoveredFor(),
      content: enteredText,
      source: "manual",
    });
  };

  const useUploaded = () => {
    if (!uploadedText.trim()) return;
    onSave({
      id: makeId("upload", uploadedName || targetAngleLabel),
      name: uploadedName.trim() || `${targetAngleLabel} instruction`,
      description: uploadedFilename
        ? `Uploaded from ${uploadedFilename}.`
        : `Uploaded instruction for ${targetAngleLabel}.`,
      anglesCovered: anglesCoveredFor(),
      content: uploadedText,
      source: "uploaded",
    });
  };

  const useGeneration = (gen: Generation, idx: number) => {
    onSave({
      id: makeId("ai", targetAngleLabel),
      name: `${targetAngleLabel} instruction · v${idx + 1}`,
      description: `AI-generated instruction for ${targetAngleLabel} ad creatives.`,
      anglesCovered: anglesCoveredFor(),
      content: gen.text,
      source: "ai-generated",
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between border-b border-border/40 px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Knowledge Base · For {targetAngleLabel}
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Create instruction
          </h3>
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

      {/* Tabs row */}
      <div className="shrink-0 flex border-b border-border/40 bg-muted/20 px-2 py-1">
        <TabBtn active={tab === "enter"} onClick={() => setTab("enter")} icon={Type}>
          Enter
        </TabBtn>
        <TabBtn
          active={tab === "upload"}
          onClick={() => setTab("upload")}
          icon={FileText}
        >
          Upload
        </TabBtn>
        <TabBtn active={tab === "ai"} onClick={() => setTab("ai")} icon={Sparkles}>
          AI
        </TabBtn>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "enter" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Instruction name
              </label>
              <input
                type="text"
                value={enteredName}
                onChange={(e) => setEnteredName(e.target.value)}
                placeholder={`${targetAngleLabel} instruction`}
                className="w-full rounded-full border border-border/40 bg-background/60 px-4 py-2 text-sm outline-none focus:border-foreground/20"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Instruction content
              </label>
              <textarea
                rows={10}
                placeholder={`Write the rules for "${targetAngleLabel}" creatives. E.g. DO: Lead with urgency hook. DON'T: Use generic copy.`}
                value={enteredText}
                onChange={(e) => setEnteredText(e.target.value)}
                className="w-full rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-3 text-sm leading-relaxed outline-none focus:border-foreground/20"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">
                {enteredText.length} chars · {wordCount}{" "}
                {wordCount === 1 ? "word" : "words"}
              </span>
              <button
                type="button"
                onClick={useEntered}
                disabled={!enteredText.trim()}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use this instruction
              </button>
            </div>
          </div>
        )}

        {tab === "upload" && (
          <div>
            <div className="rounded-2xl border-2 border-dashed border-border/60 bg-card/40 p-8 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-[13px] font-semibold text-foreground">
                Drop your instruction file here
              </p>
              <p className="text-[11px] text-muted-foreground">
                .txt or .md, up to 50 KB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium transition-colors hover:border-foreground/30"
              >
                Browse files
              </button>
              {uploadError && (
                <p className="mt-3 text-[11px] text-destructive">{uploadError}</p>
              )}
            </div>

            {uploadedText && (
              <div className="mt-3 space-y-2 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {uploadedFilename}
                </p>
                <input
                  type="text"
                  value={uploadedName}
                  onChange={(e) => setUploadedName(e.target.value)}
                  placeholder={`${targetAngleLabel} instruction`}
                  className="w-full rounded-full border border-border/40 bg-background/60 px-4 py-1.5 text-xs outline-none focus:border-foreground/20"
                />
                <pre className="max-h-[180px] overflow-y-auto whitespace-pre-wrap text-[11px] text-foreground/80">
                  {uploadedText}
                </pre>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={useUploaded}
                    disabled={!uploadedText.trim()}
                    className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Use this instruction
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "ai" && (
          <div className="space-y-3">
            {/* Prompt input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Write a Knowledge Base instruction for "${targetAngleLabel}" angle ad creatives`}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                className="flex-1 rounded-full border border-border/40 bg-background/60 px-4 py-2 text-sm outline-none focus:border-foreground/20"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!aiPrompt.trim() || generating}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? "…" : "Generate"}
              </button>
            </div>

            {/* Generated output cards */}
            {generations.length === 0 && !generating && (
              <p className="py-12 text-center text-[12px] text-muted-foreground">
                AI will draft "do X, don't do Y" instructions for {" "}
                {targetAngleLabel}. Each output you can copy, regenerate, save,
                or use.
              </p>
            )}

            {generations.map((gen, idx) => (
              <div
                key={gen.id}
                className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-3"
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Instruction · v{idx + 1}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">
                  {gen.text}
                </p>
                {/* Action row */}
                <div className="mt-3 flex items-center gap-1 border-t border-border/40 pt-2">
                  <ActionBtn
                    icon={Copy}
                    label="Copy"
                    onClick={() => copyToClipboard(gen.text)}
                  />
                  <ActionBtn
                    icon={RefreshCw}
                    label="Regenerate"
                    onClick={() => regenerate(gen.id)}
                  />
                  <ActionBtn
                    icon={Bookmark}
                    label="Save"
                    onClick={() => saveToLibrary(gen.id)}
                  />
                  <button
                    type="button"
                    onClick={() => useGeneration(gen, idx)}
                    className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
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
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  TabBtn — tab pill, mirrors ScriptRail's pattern.
 * ────────────────────────────────────────────────────────── */
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
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  ActionBtn — small icon+label button used in AI output cards.
 * ────────────────────────────────────────────────────────── */
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

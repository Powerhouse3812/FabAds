import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

interface ScriptRailProps {
  currentScript: string | null;
  onSave: (script: string) => void;
  onClose: () => void;
}

type Tab = "enter" | "upload" | "ai";

interface Generation {
  id: string;
  /** Index into MOCK_SCRIPTS — keeps state URL-encodable + deterministic. */
  scriptIdx: number;
}

/** Pre-canned mock scripts cycled through on Generate / Regenerate. */
const MOCK_SCRIPTS = [
  "POV: You've been struggling with hair fall for months.\n\nProduct hand-in shot: Mamaearth Onion Hair Oil.\n\n\"I tried it for 4 weeks. Look at this growth.\"\n\nClose-up: hair clumps gone from comb.\n\nCTA: \"Get yours — link in bio. 30% off today.\"",
  "Hook: \"Your face cream is making you break out.\"\n\nProblem reveal: heavy formulas clog pores.\n\nSolution: lightweight gel formula. Cuts to product texture shot.\n\nProof: \"3,000+ verified reviews. 4.6 stars.\"\n\nCTA: \"Tap to try risk-free for 30 days.\"",
  "Open: Person yawning in office.\n\n\"Caffeine crashes ruining your day?\"\n\nCut to product: clean energy shot.\n\nIngredient flash: \"L-theanine. No jitter. No crash.\"\n\nUser testimonial overlay: \"Switched from coffee. Never going back.\"\n\nCTA: \"Order before midnight — first sip free.\"",
  "Quick cuts: morning routine fail.\n\n\"This is why your skin's tired.\"\n\nReveal: Vitamin C serum.\n\n\"Brightens in 14 days. We measured.\"\n\nBefore/after split.\n\nCTA: \"Bundle with cleanser for 25% off.\"",
];

const MAX_UPLOAD_BYTES = 50 * 1024; // 50 KB

/* ── URL param keys ─────────────────────────────────────────
 * Encoded into the parent route's query string so the modal
 * is hard-refresh / deep-link safe. Pattern matches the rest
 * of Genie 6.0 (per feedback_sync_discipline).
 *
 *   ?scriptTab=ai           → reopen on AI tab
 *   ?scriptPrompt=<text>    → seed AI prompt input
 *   ?scriptGen=0,1,2        → reconstruct generation cards from
 *                             positional indices into MOCK_SCRIPTS
 * ────────────────────────────────────────────────────────── */
const URL_KEYS = {
  tab: "scriptTab",
  prompt: "scriptPrompt",
  gen: "scriptGen",
} as const;

const ALL_KEYS = [URL_KEYS.tab, URL_KEYS.prompt, URL_KEYS.gen] as const;

/** Parse `?scriptGen=0,1,2` → [0,1,2]. Drops out-of-range or non-int. */
function parseGenIndices(raw: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < MOCK_SCRIPTS.length);
}

/**
 * ScriptRail — modal picker for setting `wizard.state.script`.
 *
 * Three tabs:
 *   - Enter: paste/type a script in a textarea.
 *   - Upload: drop a .txt or .md file, preview, confirm.
 *   - AI: prompt-based generation. Each output card supports
 *         Copy / Regenerate / Save / Use.
 *
 * Default state of `script` is null (Auto). Calling `onSave(text)`
 * sets it to a string. Closing without saving leaves it untouched.
 *
 * URL state:
 *   AI tab is the one Maalik flagged for refresh-loss — prompt + generated
 *   cards now persist via the parent's `?scriptTab/scriptPrompt/scriptGen`
 *   query params. Hard refresh / share-link returns to the same view.
 *   Enter + Upload tabs deliberately stay local (textarea content / file
 *   contents would balloon the URL and aren't share-worthy).
 *   On close (`onClose` from parent) we strip all three keys.
 */
export function ScriptRail({
  currentScript,
  onSave,
  onClose,
}: ScriptRailProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── URL → initial state ── */
  const initialTab: Tab = useMemo(() => {
    const t = searchParams.get(URL_KEYS.tab);
    return t === "ai" || t === "upload" || t === "enter" ? t : "enter";
  }, []); // intentional: mount-only hydration; subsequent changes go state → URL
  const initialPrompt = useMemo(
    () => searchParams.get(URL_KEYS.prompt) ?? "",
    [],
  );
  const initialGenerations = useMemo<Generation[]>(() => {
    const idxs = parseGenIndices(searchParams.get(URL_KEYS.gen));
    return idxs.map((scriptIdx, i) => ({
      id: `gen-${i}`,
      scriptIdx,
    }));
  }, []);

  const [tab, setTabState] = useState<Tab>(initialTab);

  // Enter tab
  const [enteredText, setEnteredText] = useState<string>(currentScript ?? "");

  // Upload tab
  const [uploadedText, setUploadedText] = useState<string>("");
  const [uploadedFilename, setUploadedFilename] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI tab
  const [aiPrompt, setAiPrompt] = useState<string>(initialPrompt);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generations, setGenerations] =
    useState<Generation[]>(initialGenerations);

  const wordCount = useMemo(
    () => (enteredText.trim() ? enteredText.trim().split(/\s+/).length : 0),
    [enteredText],
  );

  /* ── URL writers ─────────────────────────────────────────── */
  const writeUrl = useCallback(
    (
      patch: Partial<Record<(typeof ALL_KEYS)[number], string | null>>,
    ) => {
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
    },
    [setSearchParams],
  );

  const setTab = useCallback(
    (next: Tab) => {
      setTabState(next);
      // Only persist non-default tabs so back-button history is clean.
      writeUrl({ [URL_KEYS.tab]: next === "enter" ? null : next });
    },
    [writeUrl],
  );

  /** Serialize the current generations into the URL. */
  const persistGenerations = useCallback(
    (next: Generation[]) => {
      writeUrl({
        [URL_KEYS.gen]:
          next.length === 0 ? null : next.map((g) => g.scriptIdx).join(","),
      });
    },
    [writeUrl],
  );

  /* ── Close paths ──
        All close paths (X click, backdrop, "Use", browser Back) flow
        through the parent's `setRailMode(null)`, which strips both
        `picker` AND the rail-owned URL keys (`scriptTab/Prompt/Gen`).
        So ScriptRail doesn't need to clean up its own keys here. */

  const copyToClipboard = (text: string) => {
    void navigator.clipboard?.writeText(text);
  };

  const handleGenerate = () => {
    if (!aiPrompt.trim() || generating) return;
    setGenerating(true);
    // Persist the prompt at generate-time (not on every keystroke — keeps
    // browser history clean + avoids URL churn while typing).
    writeUrl({ [URL_KEYS.prompt]: aiPrompt.trim() });
    window.setTimeout(() => {
      setGenerations((prev) => {
        const nextIdx = prev.length % MOCK_SCRIPTS.length;
        const next: Generation[] = [
          ...prev,
          { id: `gen-${Date.now()}`, scriptIdx: nextIdx },
        ];
        persistGenerations(next);
        return next;
      });
      setGenerating(false);
    }, 800);
  };

  const regenerate = (id: string) => {
    setGenerations((prev) => {
      const next = prev.map((g) =>
        g.id === id
          ? { ...g, scriptIdx: (g.scriptIdx + 1) % MOCK_SCRIPTS.length }
          : g,
      );
      persistGenerations(next);
      return next;
    });
  };

  const saveToLibrary = (id: string) => {
    // Stub — would persist to a saved-scripts library later.
    console.log("[ScriptRail] save to library", id);
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between border-b border-border/40 px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Prompt
          </p>
          <h3 className="text-sm font-semibold text-foreground">Script</h3>
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
          <div>
            <textarea
              rows={10}
              placeholder="Paste or type your script here…"
              value={enteredText}
              onChange={(e) => setEnteredText(e.target.value)}
              className="w-full rounded-xl border border-border/40 bg-card p-3 text-sm leading-relaxed outline-none focus:border-foreground/20"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">
                {enteredText.length} chars · {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
              <button
                type="button"
                onClick={() => onSave(enteredText)}
                disabled={!enteredText.trim()}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use this script
              </button>
            </div>
          </div>
        )}

        {tab === "upload" && (
          <div>
            <div className="rounded-2xl border-2 border-dashed border-border/60 bg-card/40 p-8 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-[13px] font-semibold text-foreground">
                Drop your script file here
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
              <div className="mt-3 rounded-xl border border-border/40 bg-card p-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {uploadedFilename}
                </p>
                <pre className="max-h-[180px] overflow-y-auto whitespace-pre-wrap text-[11px] text-foreground/80">
                  {uploadedText}
                </pre>
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onSave(uploadedText)}
                    className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Use this script
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
                placeholder="What kind of script? E.g. '15-second UGC for a hair serum, problem-solution'"
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
                AI will write scripts based on your prompt. Each output you can copy,
                regenerate, save, or use.
              </p>
            )}

            {generations.map((gen, idx) => (
              <div
                key={gen.id}
                className="rounded-xl border border-border/40 bg-card p-3"
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Script · v{idx + 1}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">
                  {MOCK_SCRIPTS[gen.scriptIdx]}
                </p>
                {/* Action row */}
                <div className="mt-3 flex items-center gap-1 border-t border-border/40 pt-2">
                  <ActionBtn
                    icon={Copy}
                    label="Copy"
                    onClick={() => copyToClipboard(MOCK_SCRIPTS[gen.scriptIdx])}
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
                    onClick={() => onSave(MOCK_SCRIPTS[gen.scriptIdx])}
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
 *  TabBtn — tab pill, mirrors AvatarVoiceRail's pattern.
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

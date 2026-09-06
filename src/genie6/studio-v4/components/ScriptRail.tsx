import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bookmark,
  Check,
  Copy,
  FileText,
  Pencil,
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
  /**
   * §21.2 "Script becomes a gated pre-step" — true only for script-led
   * approaches (decided by the caller). When true, saving a script from any
   * tab moves into a review→approve phase instead of closing immediately;
   * when false, Save behaves exactly as it always has (save + close).
   */
  gated: boolean;
  scriptApproved: boolean;
  skipScriptReview: boolean;
  onApprove: () => void;
  /** Sets the persistent power-user escape — once true, future saves on
   *  this wizard never re-enter the review phase. */
  onSkipReview: () => void;
  /** Seeds the AI tab's prompt when a gated approach opens this rail with no
   *  script yet — one click turns "Auto" into a reviewable draft instead of
   *  leaving the gate with nothing to actually approve. */
  promptSeed?: string;
}

type Tab = "enter" | "upload" | "ai";
type Phase = "compose" | "review";

interface Generation {
  id: string;
  /** Index into MOCK_SCRIPTS — keeps state URL-encodable + deterministic. */
  scriptIdx: number;
  /**
   * §14 "regenerate with an option to edit or add instructions" — optional
   * free-text note applied at regenerate time. Deliberately NOT persisted to
   * the URL (same call as the Enter/Upload tab content — "aren't share-worthy"),
   * only scriptIdx is.
   */
  instruction?: string;
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
 * Three compose tabs:
 *   - Enter: paste/type a script in a textarea.
 *   - Upload: drop a .txt or .md file, preview, confirm.
 *   - AI: prompt-based generation. Each output card supports
 *         Copy / Regenerate (+ optional instructions) / Save / Use.
 *
 * §21.2 "Script becomes a gated pre-step": for a script-led approach
 * (`gated=true`), saving from ANY tab doesn't close the rail — it moves to a
 * REVIEW phase (script shown read-only + Approve / Edit / an explicit "skip
 * review" escape). Generate stays disabled elsewhere until Approve is hit or
 * skip is set. `gated=false` (a non-script approach) behaves exactly as
 * before: save closes immediately, no review step.
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
  gated,
  scriptApproved,
  skipScriptReview,
  onApprove,
  onSkipReview,
  promptSeed,
}: ScriptRailProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // §21.2 — reopening a gated rail that already has an unapproved script
  // should show the REVIEW screen directly (that's the point of the gate),
  // not restart composing. Fresh/ungated opens start in compose, unchanged.
  const startsInReview =
    gated &&
    !skipScriptReview &&
    !scriptApproved &&
    !!currentScript &&
    currentScript.trim().length > 0;
  const [phase, setPhase] = useState<Phase>(startsInReview ? "review" : "compose");

  /* ── URL → initial state ── */
  const initialTab: Tab = useMemo(() => {
    const t = searchParams.get(URL_KEYS.tab);
    if (t === "ai" || t === "upload" || t === "enter") return t;
    // A gated approach with no script yet has nothing to review — default to
    // AI so one click turns "Auto" into a reviewable draft.
    return gated && !currentScript ? "ai" : "enter";
  }, []); // intentional: mount-only hydration; subsequent changes go state → URL
  const initialPrompt = useMemo(
    () =>
      searchParams.get(URL_KEYS.prompt) ??
      (gated && !currentScript ? promptSeed?.trim() ?? "" : ""),
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
  // §14 "regenerate with an option to edit or add instructions" — per-card
  // reveal + draft text. Local only (see the `instruction` field's own note).
  const [instructionOpenFor, setInstructionOpenFor] = useState<Record<string, boolean>>({});
  const [instructionDrafts, setInstructionDrafts] = useState<Record<string, string>>({});

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

  /** The text actually shown/copied/used for a generation — the base mock
   *  script, prefixed with the applied instruction when one was given. */
  const displayScript = (gen: Generation) => {
    const base = MOCK_SCRIPTS[gen.scriptIdx];
    return gen.instruction ? `[Instruction: ${gen.instruction}]\n\n${base}` : base;
  };

  /**
   * §21.2 gate — routes every "Use this script" / "Use" action through one
   * place: save, then either drop into review (gated, first time) or close
   * exactly as before (ungated, or the user already opted to skip review).
   */
  const commitScript = (text: string) => {
    onSave(text);
    if (gated && !skipScriptReview) {
      setPhase("review");
    } else {
      onClose();
    }
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

  const regenerate = (id: string, instruction?: string) => {
    setGenerations((prev) => {
      const next = prev.map((g) =>
        g.id === id
          ? {
              ...g,
              scriptIdx: (g.scriptIdx + 1) % MOCK_SCRIPTS.length,
              instruction: instruction?.trim() || undefined,
            }
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
            {phase === "review" ? "Before you generate" : "Prompt"}
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            {phase === "review" ? "Review your script" : "Script"}
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

      {phase === "review" ? (
        /* §21.2 "Script becomes a gated pre-step": generate → review → edit
           → approve → then generate the ad. At 30-40 minutes per video, an
           unseen auto-script is an expensive mistake — so Approve is the
           only way past the gate besides the explicit Skip escape. */
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
              Review before generating
            </span>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-3">
            <pre className="max-h-[260px] overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">
              {currentScript}
            </pre>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            At 30–40 minutes per video, an unseen auto-script is an expensive
            mistake. Approve it to generate, or edit it first.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onApprove();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Check className="h-3 w-3" />
              Approve script
            </button>
            <button
              type="button"
              onClick={() => setPhase("compose")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground/30"
            >
              <Pencil className="h-3 w-3" />
              Edit script
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              onSkipReview();
              onClose();
            }}
            className="mt-3 inline-flex items-center text-[11px] font-medium text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
          >
            Skip review from now on — generate without approving
          </button>
        </div>
      ) : (
        <>
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
                    onClick={() => commitScript(enteredText)}
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
                        onClick={() => commitScript(uploadedText)}
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
                      {displayScript(gen)}
                    </p>
                    {/* Action row */}
                    <div className="mt-3 flex items-center gap-1 border-t border-border/40 pt-2">
                      <ActionBtn
                        icon={Copy}
                        label="Copy"
                        onClick={() => copyToClipboard(displayScript(gen))}
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
                        onClick={() => commitScript(displayScript(gen))}
                        className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <Check className="h-3 w-3" />
                        Use
                      </button>
                    </div>
                    {/* §14 "regenerate with an option to edit or add instructions" */}
                    <div className="mt-2 border-t border-border/40 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setInstructionOpenFor((prev) => ({
                            ...prev,
                            [gen.id]: !prev[gen.id],
                          }))
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        {instructionOpenFor[gen.id]
                          ? "Hide instructions"
                          : "Add instructions & regenerate"}
                      </button>
                      {instructionOpenFor[gen.id] && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={instructionDrafts[gen.id] ?? ""}
                            onChange={(e) =>
                              setInstructionDrafts((prev) => ({
                                ...prev,
                                [gen.id]: e.target.value,
                              }))
                            }
                            placeholder="E.g. 'make the hook punchier', 'add a price callout'"
                            className="flex-1 rounded-full border border-border/40 bg-background/60 px-3 py-1 text-[11px] outline-none focus:border-foreground/20"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              regenerate(gen.id, instructionDrafts[gen.id]);
                              setInstructionOpenFor((prev) => ({ ...prev, [gen.id]: false }));
                            }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[10px] font-semibold text-foreground transition-colors hover:bg-foreground/20"
                          >
                            <RefreshCw className="h-2.5 w-2.5" />
                            Regenerate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
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

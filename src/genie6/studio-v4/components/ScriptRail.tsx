import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bookmark,
  Check,
  Copy,
  FileText,
  Library,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAssetType } from "@/catalogue/assetTypes";
import type { ScriptAsset } from "@/mocks/shared/scripts";
import { brands } from "@/mocks/shared/brands";

interface ScriptRailProps {
  currentScript: string | null;
  onSave: (script: string) => void;
  onClose: () => void;
  /**
   * §21.2 / §6 "Script becomes a gated pre-step" — true only for script-led
   * approaches (decided by the caller via `isScriptLedState`, useWizard.ts —
   * UGC Video, or Product Shoot). When true, saving a script from any tab
   * moves into a review→approve phase instead of closing immediately; when
   * false, Save behaves exactly as it always has (save + close).
   */
  gated: boolean;
  scriptApproved: boolean;
  skipScriptReview: boolean;
  /** Module label when this text is exactly what a flow hand-off carried in
   *  (e.g. "Video Sage") — wins over the `scriptOrigin` badge below, since
   *  "same script from X" is more specific and more true than "Auto-written".
   *  Was previously shown by a Configure-page card that has since been
   *  removed; surfaced here instead so the signal isn't silently dropped. */
  carriedFrom?: string | null;
  onApprove: () => void;
  /** Sets the persistent power-user escape — once true, future saves on
   *  this wizard never re-enter the review phase. */
  onSkipReview: () => void;
  /** Seeds the AI tab's prompt when a gated approach opens this rail with no
   *  script yet. Rarely needed now that useWizard's background effect
   *  auto-fills `script` before the rail is ever opened (§6) — kept as a
   *  fallback for the case there isn't enough entity context yet. */
  promptSeed?: string;
  /**
   * §6 — true while useWizard's background effect is producing the script
   * (an ~800ms simulated generation, same feel as this rail's own manual AI
   * tab). Drives the waiting/shimmer view below so opening the rail before
   * the script exists yet is never a dead end — the user can wait, write it
   * themselves, or skip review, right away.
   */
  scriptGenerating?: boolean;
  /**
   * §6 "Product Shoot has this too" — swaps "script" language for "what's
   * about to be made" language (Product Shoot's sub-step is a shot plan, not
   * dialogue). Plumbing (save / approve / skip / regenerate) is identical.
   */
  isProductShoot?: boolean;
  /** Provenance of `currentScript` — purely cosmetic here (a small "auto" vs
   *  "your edit" caption), the actual logic lives in useWizard.ts. */
  scriptOrigin?: "auto" | "user" | null;
  /**
   * Optional — requests a fresh auto-generated script/plan for the CURRENT
   * inputs, discarding whatever text is showing now. Typically wired to
   * `wizard.patch(scriptResetPatch())` (useWizard.ts). Hidden when omitted,
   * so this rail still works unchanged against a caller that hasn't wired it.
   */
  onRegenerate?: () => void;
}

type Tab = "enter" | "upload" | "ai" | "saved";
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

/* ── Saved tab data ──────────────────────────────────────────
 * The "Saved" tab is NOT a fourth source of truth — it reads the exact
 * store the "Genie Assets → Scripts" page lists, through the catalogue's
 * own registry (`getAssetType("scripts").resolve()`), so session adds /
 * renames / deletes made there show up here with no extra plumbing.
 * `resolve()` is synchronous + local — there is nothing to await.
 * ────────────────────────────────────────────────────────── */

/** Reviewed, reusable scripts from the Assets library. Empty array (never a
 *  throw) if the registry ever stops carrying the `scripts` type. */
function resolveSavedScripts(): ScriptAsset[] {
  const def = getAssetType("scripts");
  if (!def) return [];
  return def.resolve() as ScriptAsset[];
}

/** Display-only brand label. Same `brands.find` lookup the rest of genie6
 *  uses; an unknown/absent brandId simply renders no brand chip. */
function brandLabel(brandId: string | undefined): string | null {
  if (!brandId) return null;
  return brands.find((b) => b.id === brandId)?.name ?? null;
}

/** Collapse the script body to a single flowing line so `line-clamp` gives a
 *  clean 3-line preview — a raw multi-line body clamps unpredictably. */
function previewText(body: string): string {
  return body.replace(/\s+/g, " ").trim();
}

/** Free-text filter across the fields a user would actually recall: title,
 *  framework, tags, brand name. */
function matchesQuery(s: ScriptAsset, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    s.title,
    s.framework,
    brandLabel(s.brandId) ?? "",
    ...(s.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

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
 * Four compose tabs:
 *   - Enter: paste/type a script in a textarea.
 *   - Upload: drop a .txt or .md file, preview, confirm.
 *   - AI: prompt-based generation. Each output card supports
 *         Copy / Regenerate (+ optional instructions) / Save / Use.
 *   - Saved: pick an already-reviewed script out of the Assets library
 *         (`getAssetType("scripts").resolve()` — the same store the
 *         "Genie Assets → Scripts" page lists). Its "Use" goes through
 *         `commitScript`, exactly like the other three tabs.
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
  carriedFrom = null,
  onApprove,
  onSkipReview,
  promptSeed,
  scriptGenerating = false,
  isProductShoot = false,
  scriptOrigin = null,
  onRegenerate,
}: ScriptRailProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const hasScript = !!currentScript && currentScript.trim().length > 0;

  // §21.2 — reopening a gated rail that already has an unapproved script
  // should show the REVIEW screen directly (that's the point of the gate),
  // not restart composing. Fresh/ungated opens start in compose, unchanged.
  const startsInReview = gated && !skipScriptReview && !scriptApproved && hasScript;
  const [phase, setPhase] = useState<Phase>(startsInReview ? "review" : "compose");

  // §6 — the rail can be opened WHILE useWizard's background effect is still
  // writing the first script (no script yet, `scriptGenerating` true). Rather
  // than a dead compose tab, show a real waiting view — with the escape
  // hatches (write it myself / skip review) visible immediately, so the rail
  // never traps the user even before there's anything to review.
  const [bypassWaiting, setBypassWaiting] = useState(false);
  const showWaiting = gated && !hasScript && scriptGenerating && !bypassWaiting;

  // The moment the background fill lands (hasScript flips true) while the
  // waiting view was showing, jump straight to review — that's the whole
  // point of §6 ("arrives generated... from there they can edit it, or go
  // straight to generate"). Never fires once the user chose "write it myself"
  // (bypassWaiting) — they're mid-composing, an auto-fill landing behind
  // their back shouldn't yank them anywhere.
  useEffect(() => {
    if (
      gated &&
      !bypassWaiting &&
      hasScript &&
      !skipScriptReview &&
      !scriptApproved &&
      phase !== "review"
    ) {
      setPhase("review");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasScript]);

  /* ── URL → initial state ── */
  const initialTab: Tab = useMemo(() => {
    const t = searchParams.get(URL_KEYS.tab);
    if (t === "ai" || t === "upload" || t === "enter" || t === "saved") return t;
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

  // Saved tab — reads the Assets library once per open. `resolve()` is a
  // synchronous local read, so there's no fetch/loading state to model; the
  // only real state is "the library is empty", handled inside the tab.
  const savedScripts = useMemo<ScriptAsset[]>(() => resolveSavedScripts(), []);
  const [savedQuery, setSavedQuery] = useState("");

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

  const noun = isProductShoot ? "shot plan" : "script";
  const headerKicker = showWaiting
    ? "Before you generate"
    : phase === "review"
      ? "Before you generate"
      : "Prompt";
  const headerTitle = showWaiting
    ? isProductShoot
      ? "Planning the shoot"
      : "Writing your script"
    : phase === "review"
      ? isProductShoot
        ? "Review the shot plan"
        : "Review your script"
      : isProductShoot
        ? "Shot plan"
        : "Script";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between border-b border-border/40 px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {headerKicker}
          </p>
          <h3 className="text-sm font-semibold text-foreground">{headerTitle}</h3>
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

      {showWaiting ? (
        /* §6 — the script/plan hasn't landed yet (useWizard's background
           effect is still producing it). Real dimension-matched shimmer, not
           a spinner — and BOTH escapes ("write it myself" / "skip review")
           are already reachable here, not only once text exists. */
        <ScriptRailWaiting
          isProductShoot={isProductShoot}
          onWriteMyself={() => setBypassWaiting(true)}
        />
      ) : phase === "review" ? (
        /* §6 "Script as a pre-step": arrives generated → review → edit OR
           approve straight through. At 30-40 minutes per video (or a full
           re-shoot for Product Shoot), an unseen script/plan is an expensive
           mistake — Approve is the fast path, Edit the other, and the
           persistent "skip review" footer below is the explicit escape. */
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                Review before generating
              </span>
            </div>
            {carriedFrom ? (
              <span
                className="font-mono text-[10px] uppercase tracking-wider text-primary"
                title={`Same script that arrived from ${carriedFrom} — not a fresh Auto draft.`}
              >
                Same script · {carriedFrom}
              </span>
            ) : (
              scriptOrigin && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {scriptOrigin === "user" ? "Edited by you" : "Auto-written"}
                </span>
              )
            )}
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-3">
            <pre className="max-h-[260px] overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">
              {currentScript}
            </pre>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {isProductShoot
              ? "An unreviewed shot plan risks a full re-shoot. Approve it to generate, or edit it first."
              : "At 30–40 minutes per video, an unseen auto-script is an expensive mistake. Approve it to generate, or edit it first."}
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
              {isProductShoot ? "Approve plan" : "Approve script"}
            </button>
            <button
              type="button"
              onClick={() => setPhase("compose")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground/30"
            >
              <Pencil className="h-3 w-3" />
              {isProductShoot ? "Edit plan" : "Edit script"}
            </button>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                title={`Regenerate this ${noun} from the current brand, product, angle and concept`}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            )}
          </div>
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
            <TabBtn
              active={tab === "saved"}
              onClick={() => setTab("saved")}
              icon={Library}
            >
              Saved
            </TabBtn>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "enter" && (
              <div>
                <textarea
                  rows={10}
                  placeholder={
                    isProductShoot
                      ? "Describe the shots you want — e.g. hero shot, detail macro, lifestyle insert…"
                      : "Paste or type your script here…"
                  }
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
                    {isProductShoot ? "Use this plan" : "Use this script"}
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
                        {isProductShoot ? "Use this plan" : "Use this script"}
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
                    placeholder={
                      isProductShoot
                        ? "What's the shoot? E.g. 'Hero + macro shots for a hair serum, clean studio look'"
                        : "What kind of script? E.g. '15-second UGC for a hair serum, problem-solution'"
                    }
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
                    {isProductShoot
                      ? "AI will draft a shot plan based on your prompt. Each output you can copy, regenerate, save, or use."
                      : "AI will write scripts based on your prompt. Each output you can copy, regenerate, save, or use."}
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
                        {isProductShoot ? "Plan" : "Script"} · v{idx + 1}
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

            {tab === "saved" && (
              <SavedScriptsTab
                scripts={savedScripts}
                query={savedQuery}
                onQueryChange={setSavedQuery}
                onUse={commitScript}
                onWriteInstead={() => setTab("enter")}
                onDraftWithAi={() => setTab("ai")}
                isProductShoot={isProductShoot}
              />
            )}
          </div>
        </>
      )}

      {/*
       * §6 "A review opportunity, not a hard gate" — the persistent escape.
       * Previously this only rendered inside the review phase, reachable
       * only once the user had already produced script text themselves. It
       * now lives OUTSIDE the phase branches so it's visible no matter which
       * one is showing — waiting, review, or compose (e.g. after "Edit
       * script" / "Write it myself") — the rail can never strand the user
       * without this escape in view.
       */}
      {gated && (
        <footer className="shrink-0 border-t border-border/40 px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              onSkipReview();
              onClose();
            }}
            className="inline-flex items-center text-[11px] font-medium text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
          >
            Skip review from now on — generate without approving
          </button>
        </footer>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  SavedScriptsTab — the fourth compose tab. Picks an already-reviewed
 *  script out of the Assets library (Genie Assets → Scripts) instead of
 *  writing or generating a new one.
 *
 *  "Use" routes through the SAME `commitScript` the Enter tab's Save button
 *  calls (passed in as `onUse`), so the §21.2 gate — save, then review or
 *  close — behaves identically no matter which tab the script came from.
 *  There is deliberately no second write path here.
 *
 *  No brand-first ordering: ScriptRail is not handed the run's brand id and
 *  widening its prop contract for an ordering preference isn't worth it.
 *  The filter covers brand recall instead (type "Mamaearth").
 * ────────────────────────────────────────────────────────── */
function SavedScriptsTab({
  scripts,
  query,
  onQueryChange,
  onUse,
  onWriteInstead,
  onDraftWithAi,
  isProductShoot,
}: {
  scripts: ScriptAsset[];
  query: string;
  onQueryChange: (q: string) => void;
  onUse: (text: string) => void;
  onWriteInstead: () => void;
  onDraftWithAi: () => void;
  isProductShoot: boolean;
}) {
  const visible = useMemo(
    () => scripts.filter((s) => matchesQuery(s, query)),
    [scripts, query],
  );

  /* Zero-data — the library itself is empty. Never a bare "No scripts":
     say what this tab is for, and point at the two tabs that can make one. */
  if (scripts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <Library className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-[13px] font-semibold text-foreground">
          No saved scripts yet
        </p>
        <p className="mx-auto mt-1 max-w-[36ch] text-[11px] leading-relaxed text-muted-foreground">
          Scripts you approve land in your Assets library and show up here,
          ready to reuse on any ad without rewriting them.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onWriteInstead}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <Type className="h-3 w-3" />
            {isProductShoot ? "Write a plan" : "Write one"}
          </button>
          <button
            type="button"
            onClick={onDraftWithAi}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <Sparkles className="h-3 w-3" />
            Draft with AI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Provenance + filter. The caption names where these come from so a
          script showing up here is never a mystery. */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Filter by title, brand, framework or tag…"
            aria-label="Filter saved scripts"
            className="w-full rounded-full border border-border/40 bg-background/60 py-2 pl-8 pr-3 text-sm outline-none focus:border-foreground/20"
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {visible.length}/{scripts.length}
        </span>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        From your Assets library · Scripts
      </p>

      {/* Partial — the library has scripts, this filter matches none. */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-6 text-center">
          <p className="text-[12px] font-semibold text-foreground">
            Nothing matches “{query.trim()}”
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {scripts.length} saved{" "}
            {scripts.length === 1 ? "script" : "scripts"} in the library — try a
            brand name, a framework (PAS, AIDA, BAB, FAB) or a tag.
          </p>
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="mt-3 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            Clear filter
          </button>
        </div>
      ) : (
        visible.map((s) => (
          <SavedScriptRow key={s.id} script={s} onUse={() => onUse(s.body)} />
        ))
      )}
    </div>
  );
}

/** One saved script. Card chrome matches the AI tab's output cards; the body
 *  is clamped to 3 lines so a 60-second script can't dominate the list, and
 *  the title truncates so a 90-character one can't break the row. */
function SavedScriptRow({
  script,
  onUse,
}: {
  script: ScriptAsset;
  onUse: () => void;
}) {
  const brand = brandLabel(script.brandId);
  // The framework already has its own badge — don't print it twice.
  const tags = (script.tags ?? []).filter(
    (t) => t.toLowerCase() !== script.framework.toLowerCase(),
  );
  const shownTags = tags.slice(0, 3);
  const overflow = tags.length - shownTags.length;

  return (
    <div className="rounded-xl border border-border/40 bg-card p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[12px] font-semibold text-foreground"
            title={script.title}
          >
            {script.title}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {[brand, `${script.framework}`, `${script.durationSec}s`, `Used ${script.usageCount}×`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={onUse}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          <Check className="h-3 w-3" />
          Use
        </button>
      </div>

      <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
        {previewText(script.body)}
      </p>

      {shownTags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {shownTags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-foreground/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {t}
            </span>
          ))}
          {overflow > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              +{overflow}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  ScriptRailWaiting — shown while useWizard's background effect is still
 *  producing the script/plan (§6). A real shimmer skeleton sized to match
 *  the review layout's dimensions (Fabfunnel DS: 2.4s shimmer, lime
 *  mid-band, never a spinner or bare "Loading…"), plus both escapes
 *  ("write it myself" / handled by the persistent skip footer) visible
 *  immediately — the rail is never a dead end while text is in flight.
 * ────────────────────────────────────────────────────────── */
function ScriptRailWaiting({
  isProductShoot,
  onWriteMyself,
}: {
  isProductShoot: boolean;
  onWriteMyself: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
          {isProductShoot ? "Planning the shots" : "Writing the script"}
        </span>
      </div>

      {/* Skeleton — matches the review card's real dimensions (rounded-xl
          card, ~260px max body) so it reads as "this is loading", not a
          generic placeholder. */}
      <div className="rounded-xl border border-border/40 bg-card p-3">
        <div className="space-y-2.5">
          <ShimmerLine className="h-3 w-5/6" />
          <ShimmerLine className="h-3 w-full" />
          <ShimmerLine className="h-3 w-2/3" />
          <div className="h-2" />
          <ShimmerLine className="h-3 w-4/5" />
          <ShimmerLine className="h-3 w-3/5" />
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {isProductShoot
          ? "Genie is putting together what's about to be made — brand, product, angle, and concept all feed into it."
          : "Genie is writing this from your brand, product, angle, and concept — takes a moment."}
      </p>

      <button
        type="button"
        onClick={onWriteMyself}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground/30"
      >
        <Pencil className="h-3 w-3" />
        Write it myself instead
      </button>
    </div>
  );
}

/** One shimmer line — lime mid-band sweeping over a neutral track, 2.4s
 *  linear infinite (`v3-shimmer`, tailwind.config.ts), same recipe used by
 *  the queue progress bar's ShimmerOverlay and the generate-v3 lab's
 *  lime-sheen underline. `bg-muted` sets the resting/track color so the
 *  block reads correctly even between shimmer sweeps. */
function ShimmerLine({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", className)}>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent bg-[length:200%_100%] animate-v3-shimmer"
      />
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

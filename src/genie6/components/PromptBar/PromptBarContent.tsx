import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Paperclip,
  Coins,
  Minus,
  Plus,
  X,
  ImagePlus,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig } from "../../generate/modeConfigs";
import { brands } from "../../mocks/brands";
import { useUserBrands } from "../../stores/userBrandsStore";
import { tryChipsFor, REFINE_CHIPS } from "./suggestionChips";
import { modelsFor, defaultModelFor } from "./aiModels";
import { BrandLogo } from "../BrandLogo";

/**
 * PromptBarContent — shared content rows for the per-variant PromptBar
 * (Q-2, ports G5 BottomBar).
 *
 * 3 rows:
 *   1. Refs popover + suggestion chips (Try / Refine)
 *   2. Auto-grow prompt textarea
 *   3. Context pills (Mode · Brand) + AI model picker + count stepper
 *      + credit estimate + Test / Generate buttons
 *
 * Each variant wraps this with its own outer chrome (Studio elevated card,
 * Canvas glass-blur floating, Command flat ops bar, Modular > module
 * frame). Content is identical across variants.
 *
 * `density` prop tweaks padding/gaps — Canvas/Modular get tighter density.
 */

interface PromptBarContentProps {
  /** Tighter spacing for floating / glass variants. */
  density?: "default" | "tight";
  /** Custom Generate button label. */
  generateLabel?: string;
  /** Has the user already generated once? Toggles "Try:" -> "Refine:" chips. */
  hasGenerated?: boolean;
}

export function PromptBarContent({
  density = "default",
  generateLabel = "Generate",
  hasGenerated = false,
}: PromptBarContentProps) {
  const navigate = useNavigate();
  const { draft, dispatch } = useDraft();
  const userBrands = useUserBrands();
  const allBrands = [...userBrands, ...brands];
  const brand = draft.brandId ? allBrands.find((b) => b.id === draft.brandId) : null;
  const config = draft.mode ? getModeConfig(draft.mode) : null;

  const tryChips = tryChipsFor(draft.mode);
  const chips = hasGenerated ? REFINE_CHIPS : tryChips;
  const chipPrefix = hasGenerated ? "Refine:" : "Try:";

  const models = modelsFor(draft.outputType ?? config?.defaultOutputType);
  const activeModel =
    models.find((m) => m.id === draft.aiModelId) ??
    defaultModelFor(draft.outputType ?? config?.defaultOutputType);

  // Auto-grow textarea
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft.prompt]);

  const generate = (testFirst = false) => {
    if (!draft.mode) return;
    const count = testFirst ? Math.min(4, draft.count) : draft.count;
    navigate(
      `/iq/genie6/generate/${draft.mode}/progress/demo-batch-${Date.now()}?count=${count}&testFirst=${testFirst}`
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      generate(false);
    }
  };

  const gap = density === "tight" ? "gap-1.5" : "gap-2";
  const py = density === "tight" ? "py-2" : "py-2.5";

  return (
    <div className={cn("space-y-2", py)}>
      {/* Row 1 — refs + chips */}
      <div className={cn("flex min-w-0 items-center", gap)}>
        <RefsPopover />
        {chips.length > 0 && (
          <div className="scrollbar-none flex min-w-0 items-center gap-1.5 overflow-x-auto">
            <span className="font-g6-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary shrink-0">
              {chipPrefix}
            </span>
            {chips.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_PROMPT",
                    prompt: draft.prompt ? `${draft.prompt} ${c}` : c,
                  })
                }
                className="shrink-0 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-2.5 py-0.5 text-[11px] font-medium text-g6-text-secondary transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Row 2 — textarea */}
      <textarea
        ref={taRef}
        value={draft.prompt}
        onChange={(e) =>
          dispatch({ type: "SET_PROMPT", prompt: e.target.value })
        }
        onKeyDown={onKeyDown}
        placeholder={
          config
            ? `Describe what you want to ${config.label.toLowerCase()}…  (Cmd+Enter to generate)`
            : "Describe what you want to generate…  (Cmd+Enter)"
        }
        rows={1}
        className="w-full resize-none rounded-g6-base bg-transparent px-1 py-1 text-g6-sm text-g6-text placeholder:text-g6-text-disabled focus:outline-none"
        style={{ minHeight: 32, maxHeight: 120 }}
      />

      {/* Row 3 — controls */}
      <div className={cn("flex flex-wrap items-center justify-between", gap)}>
        <div className={cn("flex min-w-0 flex-wrap items-center", gap)}>
          {/* Context pills */}
          {config && (
            <span className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-2 py-0.5 text-[11px] font-medium text-g6-text-secondary">
              {config.label}
            </span>
          )}
          {brand && (
            <span className="inline-flex items-center gap-1.5 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-1.5 py-0.5 text-[11px] font-medium text-g6-text-secondary">
              <BrandLogo
                name={brand.name}
                src={brand.logo}
                size="h-3.5 w-3.5"
                rounded="rounded-full"
              />
              {brand.name}
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_BRAND", brandId: null })}
                className="text-g6-text-tertiary hover:text-g6-text"
                aria-label="Clear brand"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}

          {/* AI model picker */}
          <select
            value={activeModel.id}
            onChange={(e) =>
              dispatch({ type: "SET_AI_MODEL", aiModelId: e.target.value })
            }
            className="h-7 max-w-[140px] truncate rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-2 text-[11px] font-medium text-g6-text-secondary focus:border-g6-primary-border focus:outline-none"
            title={`${activeModel.vendor} · ${activeModel.tag}`}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Count stepper */}
          <CountStepper />
        </div>

        <div className={cn("flex items-center", gap)}>
          {/* Credit estimate */}
          <span className="inline-flex items-center gap-1 font-g6-mono text-[11px] text-g6-text-tertiary">
            <Coins className="h-3 w-3" />~{draft.count} cr
          </span>

          <button
            type="button"
            onClick={() => generate(true)}
            disabled={!draft.mode}
            className="h-8 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-3 text-[11px] font-medium text-g6-text-secondary hover:border-g6-border hover:text-g6-text disabled:opacity-40"
          >
            Test 4
          </button>

          <button
            type="button"
            onClick={() => generate(false)}
            disabled={!draft.mode}
            className="inline-flex h-8 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-4 text-g6-sm font-bold text-g6-text-on-accent shadow-g6-primary-btn transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generateLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function CountStepper() {
  const { draft, dispatch } = useDraft();
  const set = (n: number) => {
    const c = Math.max(1, Math.min(50, Math.round(n) || 1));
    dispatch({ type: "SET_COUNT", count: c });
  };
  return (
    <div className="inline-flex h-7 items-center gap-0 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container">
      <button
        type="button"
        onClick={() => set(draft.count - 1)}
        disabled={draft.count <= 1}
        aria-label="Fewer"
        className="flex h-7 w-7 items-center justify-center rounded-l-g6-pill text-g6-text-secondary hover:text-g6-text disabled:opacity-40"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="number"
        min={1}
        max={50}
        value={draft.count}
        onChange={(e) => set(Number(e.target.value))}
        className="h-7 w-9 bg-transparent text-center font-g6-mono text-[12px] font-bold tabular-nums text-g6-text focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => set(draft.count + 1)}
        disabled={draft.count >= 50}
        aria-label="More"
        className="flex h-7 w-7 items-center justify-center rounded-r-g6-pill text-g6-text-secondary hover:text-g6-text disabled:opacity-40"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function RefsPopover() {
  const { draft, dispatch } = useDraft();
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const refs = draft.references;

  const addUrl = () => {
    const v = urlInput.trim();
    if (!v) return;
    dispatch({ type: "ADD_REFERENCE", url: v });
    setUrlInput("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-g6-pill border border-dashed border-g6-border-secondary text-g6-text-tertiary transition-colors hover:border-g6-primary-border hover:text-g6-text",
            refs.length > 0 && "border-solid border-g6-primary-border text-g6-primary-active"
          )}
          aria-label="Add references"
        >
          <Paperclip className="h-3.5 w-3.5" />
          {refs.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-g6-primary px-1 font-g6-mono text-[9px] font-bold text-g6-text-on-accent">
              {refs.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="g6-root w-72 border-g6-border bg-g6-bg-elevated p-3 text-g6-text"
      >
        <p className="font-g6-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary mb-2">
          Reference media
        </p>
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-g6-base border border-dashed border-g6-border-secondary bg-g6-bg-container px-2.5 py-1.5 text-g6-xs text-g6-text-secondary hover:border-g6-border hover:text-g6-text"
            onClick={() => alert("Upload wiring lands with the assets-storage backend.")}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Upload from device
          </button>
          <div className="flex items-center gap-1.5">
            <LinkIcon className="h-3 w-3 text-g6-text-tertiary" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
              placeholder="Paste a reference URL"
              className="h-7 flex-1 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-2 text-g6-xs text-g6-text placeholder:text-g6-text-disabled focus:border-g6-primary-border focus:outline-none"
            />
            <button
              type="button"
              onClick={addUrl}
              disabled={!urlInput.trim()}
              className="rounded-g6-pill bg-g6-primary px-2.5 py-1 text-[10px] font-bold text-g6-text-on-accent disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {refs.length > 0 && (
            <ul className="space-y-1">
              {refs.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center gap-1.5 rounded-g6-base bg-g6-bg-container px-2 py-1 font-g6-mono text-[10px] text-g6-text-secondary"
                >
                  <span className="flex-1 truncate">{r}</span>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: "REMOVE_REFERENCE", index: i })
                    }
                    className="text-g6-text-tertiary hover:text-g6-error"
                    aria-label="Remove"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

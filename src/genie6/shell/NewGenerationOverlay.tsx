import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { HeroPromptInput } from "../components/HeroPromptInput";
import { MicroMotif } from "../components/MicroMotif";
import { modeConfigs } from "../generate/modeConfigs";
import { categorizeUrl, looksLikeUrl } from "../lib/urlCategorize";
import {
  type PrefillContext,
  hasPrefill,
} from "../lib/prefillContext";
import { brands } from "../mocks/brands";
import { products } from "../mocks/products";
import { concepts, hooks, angles } from "../mocks/library";
import type { ModeId } from "../types/output";

/* ─────────────────────────────────────────────────────────
   Context provider
   ───────────────────────────────────────────────────────── */

type OverlayCtx = {
  isOpen: boolean;
  prefill: PrefillContext | null;
  open: (ctx?: PrefillContext) => void;
  close: () => void;
};

const Ctx = createContext<OverlayCtx | null>(null);

export function NewGenerationOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<PrefillContext | null>(null);

  const open = useCallback((ctx?: PrefillContext) => {
    setPrefill(ctx ?? null);
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    setPrefill(null);
  }, []);

  return (
    <Ctx.Provider value={{ isOpen, prefill, open, close }}>
      {children}
      <NewGenerationOverlayDialog isOpen={isOpen} prefill={prefill} onClose={close} />
    </Ctx.Provider>
  );
}

export function useNewGenerationOverlay() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useNewGenerationOverlay must be used inside <NewGenerationOverlayProvider />");
  }
  return ctx;
}

/* ─────────────────────────────────────────────────────────
   Dialog body
   ───────────────────────────────────────────────────────── */

function NewGenerationOverlayDialog({
  isOpen,
  prefill,
  onClose,
}: {
  isOpen: boolean;
  prefill: PrefillContext | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const buildSearchParams = (extra?: Record<string, string>): string => {
    const params = new URLSearchParams();
    if (prefill?.brandId) params.set("brandId", prefill.brandId);
    if (prefill?.productId) params.set("productId", prefill.productId);
    if (prefill?.conceptId) params.set("conceptId", prefill.conceptId);
    if (prefill?.hookId) params.set("hookId", prefill.hookId);
    if (prefill?.angleId) params.set("angleId", prefill.angleId);
    if (prefill?.pastedUrl) params.set("sourceUrl", prefill.pastedUrl);
    if (extra) for (const [k, v] of Object.entries(extra)) params.set(k, v);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const goMode = (mode: ModeId) => {
    onClose();
    setPrompt("");
    navigate(`/iq/genie6/generate/${mode}${buildSearchParams()}`);
  };

  const handleSubmit = () => {
    const value = prompt.trim();
    if (!value) return;

    if (looksLikeUrl(value)) {
      const result = categorizeUrl(value);
      if (result.mode) {
        const mode = result.mode;
        onClose();
        setPrompt("");
        navigate(`/iq/genie6/generate/${mode}${buildSearchParams({ sourceUrl: result.url })}`);
        return;
      }
      // URL didn't categorize — fall through to ModePicker
    }

    onClose();
    setPrompt("");
    navigate(`/iq/genie6/generate${buildSearchParams({ q: value })}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent
        className="g6-root max-w-2xl border-g6-border bg-g6-bg-elevated p-0 text-g6-text [&>button.absolute]:hidden"
      >
        <div className="g6-dot-grid-bg relative">
          {/* Header */}
          <DialogHeader className="relative z-10 flex flex-row items-center justify-between gap-3 border-b border-g6-border-secondary px-5 py-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 text-g6-primary" aria-hidden />
              <DialogTitle className="font-g6-sans text-g6-base font-semibold tracking-tight text-g6-text">
                New generation
              </DialogTitle>
              {hasPrefill(prefill) && <PrefillChip prefill={prefill!} />}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-7 w-7 items-center justify-center rounded-g6-base text-g6-text-tertiary transition-colors hover:bg-g6-bg-spotlight hover:text-g6-text"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>

          {/* Body */}
          <div className="relative z-10 flex flex-col gap-5 p-5">
            <HeroPromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSubmit}
              placeholder="describe what to generate or paste a product / brand URL"
            />

            {/* 7 compact mode cards */}
            <div className="space-y-2">
              <p className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary">
                Or pick a mode
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {modeConfigs.map((cfg) => (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => goMode(cfg.id)}
                    className="g6-lift group flex flex-col items-start gap-2 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-3 text-left transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg"
                  >
                    <MicroMotif mode={cfg.id} size={20} />
                    <span className="text-g6-sm font-semibold text-g6-text">{cfg.label}</span>
                    <span className="text-g6-xs text-g6-text-tertiary line-clamp-2">{cfg.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────
   Pre-fill summary chip
   ───────────────────────────────────────────────────────── */

function PrefillChip({ prefill }: { prefill: PrefillContext }) {
  const label = describePrefill(prefill);
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-2 py-0.5",
        "font-g6-mono text-g6-xs text-g6-text-secondary"
      )}
    >
      <Sparkles className="h-3 w-3 text-g6-primary" aria-hidden />
      pre-filled · {label}
    </span>
  );
}

function describePrefill(p: PrefillContext): string {
  if (p.brandId && p.productId) {
    const brand = brands.find((b) => b.id === p.brandId);
    const product = products.find((pr) => pr.id === p.productId);
    return [brand?.name, product?.name].filter(Boolean).join(" · ") || "brand + product";
  }
  if (p.brandId) {
    const brand = brands.find((b) => b.id === p.brandId);
    return brand?.name ?? "brand";
  }
  if (p.conceptId) {
    const concept = concepts.find((c) => c.id === p.conceptId);
    return concept ? `concept: ${concept.name}` : "concept";
  }
  if (p.hookId) {
    const hook = hooks.find((h) => h.id === p.hookId);
    return hook ? `hook: ${hook.text.slice(0, 32)}…` : "hook";
  }
  if (p.angleId) {
    const angle = angles.find((a) => a.id === p.angleId);
    return angle ? `angle: ${angle.label}` : "angle";
  }
  if (p.pastedUrl) return "from URL";
  return "";
}

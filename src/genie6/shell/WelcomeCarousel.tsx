import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Welcome carousel — 3 slides, dismissible-forever, replayable from Help icon.
 *
 * Auto-open is NOT inside the provider — it's triggered from Genie6Bridge so it only
 * fires on /iq/genie6/* routes (the provider lives at AppLayout level so HelpIcon in
 * the FabAds topbar can call open() too).
 *
 * Phase D: switch storage key to per-user once Supabase user ID is reachable here.
 */

const STORAGE_KEY = "genie6-welcome-seen";

interface Slide {
  badge: string;
  title: string;
  body: string;
  cta?: string;
}

const SLIDES: Slide[] = [
  {
    badge: "what is genie 6.0",
    title: "Winner-first AI ad generator.",
    body: "7 modes — Brand, Product, Affiliate, UGC, Forge, Image-to-Adcopy, Image-to-Video. Built for paid social teams who scale ads daily.",
  },
  {
    badge: "your first generation",
    title: "Variants in under 60 seconds.",
    body: "Paste a URL or pick a mode, fill four chips, hit Generate. Test First gives you 4 variants free. CSV export on every batch.",
  },
  {
    badge: "the winner-first loop",
    title: "Feedback compounds. Forever.",
    body: "Save winners. Forge 10 more from any one. Every variant tracks lineage to its parent. Your library gets smarter with every batch.",
    cta: "Get started",
  },
];

/* ─────────────────────────────────────────────────────────
   Provider + hook
   ───────────────────────────────────────────────────────── */

type CarouselCtx = {
  isOpen: boolean;
  /** Open carousel. If wasSeen=true and we want a replay, that's still allowed. */
  open: () => void;
  close: () => void;
  /** True when localStorage flag exists — caller can decide whether to auto-open. */
  hasBeenSeen: () => boolean;
};

const Ctx = createContext<CarouselCtx | null>(null);

export function WelcomeCarouselProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);

  const hasBeenSeen = useCallback(() => {
    if (typeof window === "undefined") return true;
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => {
    setOpen(false);
    window.localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  return (
    <Ctx.Provider value={{ isOpen, open, close, hasBeenSeen }}>
      {children}
      <WelcomeCarouselDialog isOpen={isOpen} onClose={close} />
    </Ctx.Provider>
  );
}

export function useWelcomeCarousel() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useWelcomeCarousel must be used inside <WelcomeCarouselProvider />");
  }
  return ctx;
}

/* ─────────────────────────────────────────────────────────
   Dialog
   ───────────────────────────────────────────────────────── */

function WelcomeCarouselDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (isOpen) setSlideIdx(0);
  }, [isOpen]);

  const slide = SLIDES[slideIdx];
  const isLast = slideIdx === SLIDES.length - 1;

  const next = () => {
    if (isLast) onClose();
    else setSlideIdx((i) => i + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(nextOpen) => (nextOpen ? null : onClose())}>
      <DialogContent
        className="g6-root max-w-xl border-g6-border bg-g6-bg-elevated p-0 text-g6-text"
        showCloseButton={false}
      >
        <div className="g6-dot-grid-bg relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip welcome"
            className="absolute right-3 top-3 z-20 inline-flex h-7 w-7 items-center justify-center rounded-g6-base text-g6-text-tertiary transition-colors hover:bg-g6-bg-spotlight hover:text-g6-text"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative z-10 flex flex-col gap-6 p-8 pt-10">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-2.5 py-1">
              <Sparkles className="h-3 w-3 text-g6-primary" aria-hidden />
              <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-secondary">
                {slide.badge}
              </span>
            </div>

            <h2 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
              {slide.title}
            </h2>

            <p className="text-g6-base text-g6-text-secondary leading-relaxed max-w-md">
              {slide.body}
            </p>

            <div className="flex items-center justify-between border-t border-g6-border-secondary pt-5">
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === slideIdx
                        ? "w-6 bg-g6-primary"
                        : i < slideIdx
                        ? "w-1.5 bg-g6-primary opacity-50"
                        : "w-1.5 bg-g6-border"
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-g6-pill px-3 py-1.5 text-g6-sm font-medium text-g6-text-tertiary transition-colors hover:text-g6-text"
                >
                  Skip forever
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-g6-pill bg-g6-primary px-4 py-1.5 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-colors hover:bg-g6-primary-hover"
                >
                  {isLast ? slide.cta ?? "Done" : "Next"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

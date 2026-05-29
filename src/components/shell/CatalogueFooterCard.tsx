import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CatalogueFooterCard — footer-pinned card for the Catalogue sub-nav,
 * which previously had no footer card and left empty bottom space.
 *
 * Design grammar (Maalik — SETUP CHECKLIST + PROGRESS):
 *  - Distinct from the other four footer cards (radial meter / big-number
 *    ROI / illustration / comparison). This one owns the LIST / CHECKLIST
 *    genre — a "catalog completeness" tracker.
 *  - Hero is a progress line ("2 of 3 ready") + a thin lime progress bar,
 *    followed by the signature 3-item checklist (Brands ✓ / Products ✓ /
 *    Categories ○). Utility first, with a gentle nudge — not a paywall.
 *  - CTA drives usage from the existing catalog (generate ads), rather
 *    than selling a tier. Catalogue is free on every plan.
 *  - Lime is reserved for the progress fill, the done-check discs, and
 *    the CTA chip — never floods.
 *
 * Gating: none — Catalogue is free on every plan, so this always shows
 * unless the user has dismissed it.
 *
 * State: checklist + progress are deterministic mocks (Brands done,
 * Products done, Categories pending → 67%). Real wiring lands later.
 */

const STORAGE_KEY = "genie6:catalogue:footer-card-dismissed";

/** Hardcoded checklist mock — Brands ✓, Products ✓, Categories ○. */
const CHECKLIST: ReadonlyArray<{ label: string; done: boolean }> = [
  { label: "Brands", done: true },
  { label: "Products", done: true },
  { label: "Categories", done: false },
];

const DONE_COUNT = CHECKLIST.filter((item) => item.done).length;
const TOTAL_COUNT = CHECKLIST.length;
const PROGRESS_PCT = Math.round((DONE_COUNT / TOTAL_COUNT) * 100); // 67

function useDismissed(): [boolean, () => void] {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue === "1") {
        setDismissed(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Silent fail.
    }
    setDismissed(true);
  }, []);

  return [dismissed, dismiss];
}

export function CatalogueFooterCard() {
  const navigate = useNavigate();
  const [dismissed, dismiss] = useDismissed();

  // Not plan-gated — Catalogue is free on every plan.
  if (dismissed) return null;

  return (
    <div className="shrink-0 px-2 py-2">
      <div
        className={cn(
          "group relative flex flex-col gap-2 rounded-md px-2.5 py-2",
          "border border-foreground/[0.06] bg-foreground/[0.03]",
          "transition-[transform,border-color,background-color] duration-200 ease-out",
          "hover:-translate-y-[1px] hover:border-primary/30 hover:bg-foreground/[0.045]",
          "focus-within:border-primary/40",
        )}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss catalog setup card"
          title="Dismiss"
          className={cn(
            "absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full",
            "text-foreground/45 opacity-0 transition-opacity duration-150",
            "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          )}
        >
          <X className="h-3 w-3" strokeWidth={2.25} />
        </button>

        <div className="flex items-center gap-1.5 pr-5">
          <Boxes
            className="h-3.5 w-3.5 shrink-0 text-foreground/55"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-foreground/55">
            Catalog Setup
          </span>
        </div>

        {/* Hero progress line + thin lime bar. */}
        <div className="flex flex-col gap-1">
          <p className="text-[11px] leading-none text-muted-foreground">
            <span className="font-mono text-xs font-bold text-foreground">
              {DONE_COUNT}
            </span>{" "}
            of {TOTAL_COUNT} ready
          </p>
          <div
            className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10"
            role="progressbar"
            aria-valuenow={PROGRESS_PCT}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Catalog setup progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${PROGRESS_PCT}%` }}
            />
          </div>
        </div>

        {/* Signature 3-item checklist. */}
        <ul className="flex flex-col gap-0.5">
          {CHECKLIST.map((item) => (
            <li
              key={item.label}
              className="flex h-[22px] items-center gap-1.5"
            >
              {item.done ? (
                <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check
                    className="h-2.5 w-2.5 text-primary"
                    strokeWidth={3}
                    aria-hidden
                  />
                </span>
              ) : (
                <Circle
                  className="h-3.5 w-3.5 shrink-0 text-foreground/30"
                  strokeWidth={1.75}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "text-[11px] leading-none",
                  item.done ? "text-foreground/70" : "text-foreground",
                )}
              >
                {item.label}
              </span>
              {!item.done && (
                <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                  Add
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Contextual CTA — drives usage from the catalog, not a paywall. */}
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/generate")}
          className={cn(
            "mt-0.5 inline-flex w-fit items-center gap-1 rounded-sm px-1.5 py-[3px]",
            "bg-primary text-[11px] font-medium tracking-tight text-primary-foreground",
            "transition-colors duration-150 hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          <span>Generate ads from catalog</span>
          <span
            aria-hidden
            className="inline-block transition-transform duration-150 group-hover:translate-x-[1px]"
          >
            →
          </span>
        </button>
      </div>
    </div>
  );
}

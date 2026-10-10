import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { fmtInt } from "./format";
import { Hint } from "./Hint";
import { usePageTab } from "./url";

export interface PageTabItem<T extends string> {
  key: T;
  label: string;
  /** Count for the current scope. Shown as a lime pill. */
  count?: number;
}

export interface PageTabsProps<T extends string> {
  tabs: PageTabItem<T>[];
  /** Controlled value. Omit to let PageTabs read/write the `tab` URL param itself. */
  value?: T;
  /** Called on change when controlled. Uncontrolled mode writes the URL (replace). */
  onChange?: (next: T) => void;
  /** First tab by default. */
  fallback?: T;
  "aria-label"?: string;
  className?: string;
}

/** Tabs with a count each. URL-backed through `usePageTab` (`tab=<key>`). Arrow/Home/End keys move focus (skipping disabled 0-count tabs). */
export function PageTabs<T extends string>({ tabs, value, onChange, fallback, className, ...rest }: PageTabsProps<T>) {
  const keys = tabs.map((t) => t.key);
  const [urlValue, setUrlValue] = usePageTab<T>(keys, fallback ?? keys[0]);
  const current = value ?? urlValue;
  const set = onChange ?? setUrlValue;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  // 0-count tabs stay visible but disabled — unless it is the CURRENT tab (never auto-jump away).
  const isDisabled = (t: PageTabItem<T>) => t.count === 0 && t.key !== current;
  const enabledIdx = tabs.map((t, i) => (isDisabled(t) ? -1 : i)).filter((i) => i >= 0);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const pos = enabledIdx.indexOf(i);
    let next = -1;
    if (e.key === "ArrowRight") next = enabledIdx[(pos + 1) % enabledIdx.length];
    else if (e.key === "ArrowLeft") next = enabledIdx[(pos - 1 + enabledIdx.length) % enabledIdx.length];
    else if (e.key === "Home") next = enabledIdx[0];
    else if (e.key === "End") next = enabledIdx[enabledIdx.length - 1];
    if (next === undefined || next < 0) return;
    e.preventDefault();
    const k = tabs[next].key;
    refs.current[k]?.focus();
    set(k);
  };

  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"] ?? "Sections"}
      className={cn("flex max-w-full gap-1 overflow-x-auto border-b border-border", className)}
    >
      {tabs.map((t, i) => {
        const on = t.key === current;
        const disabled = isDisabled(t);
        const btn = (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[t.key] = el;
            }}
            type="button"
            role="tab"
            aria-selected={on}
            aria-disabled={disabled || undefined}
            tabIndex={on ? 0 : -1}
            onClick={() => {
              if (!disabled) set(t.key);
            }}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "-mb-px inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-t-md",
              disabled
                ? "cursor-not-allowed border-transparent text-muted-foreground opacity-60"
                : on
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 font-mono text-[11px] leading-5 tabular-nums",
                  disabled
                    ? "bg-muted text-muted-foreground"
                    : on
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/15 text-primary-text",
                )}
              >
                {fmtInt(t.count)}
              </span>
            )}
            {disabled && <span className="sr-only"> — nothing in this scope</span>}
          </button>
        );
        return disabled ? (
          <Hint key={t.key} content="Nothing in this scope">
            {btn}
          </Hint>
        ) : (
          btn
        );
      })}
    </div>
  );
}

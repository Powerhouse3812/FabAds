import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { fmtInt } from "./format";
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

/** Tabs with a count each. URL-backed through `usePageTab` (`tab=<key>`). Arrow/Home/End keys move focus. */
export function PageTabs<T extends string>({ tabs, value, onChange, fallback, className, ...rest }: PageTabsProps<T>) {
  const keys = tabs.map((t) => t.key);
  const [urlValue, setUrlValue] = usePageTab<T>(keys, fallback ?? keys[0]);
  const current = value ?? urlValue;
  const set = onChange ?? setUrlValue;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
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
        return (
          <button
            key={t.key}
            ref={(el) => (refs.current[t.key] = el)}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => set(t.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "-mb-px inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-t-md",
              on
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 font-mono text-[11px] leading-5 tabular-nums",
                  on ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary-text",
                )}
              >
                {fmtInt(t.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

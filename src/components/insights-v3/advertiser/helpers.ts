/** Small pure helpers + hooks for the Advertiser page and overlays. */
import { useCallback, useEffect, useState } from "react";

/** "Lead Gen · Auto Insurance" style join that never explodes on long lists. */
export function joinTop(items: { label: string }[], n = 3): string {
  const shown = items.slice(0, n).map((i) => i.label);
  const rest = items.length - shown.length;
  return shown.join(" · ") + (rest > 0 ? ` · +${rest}` : "");
}

/** "https://x.com/a/b?q=1" → "x.com/a/b". */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/$/, "");
}

export const PAGE_TEXT_MISSING = "Page text wasn't captured for this landing page.";

/** Sentence-ish lines: split on newlines and sentence ends. */
export function splitPageText(text: string): string[] {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export const PAGE_SIZE = 40;

/** Visible-row window that resets when the list identity changes. */
export function useShowMore(total: number, resetKey: string, pageSize = PAGE_SIZE) {
  const [visible, setVisible] = useState(pageSize);
  useEffect(() => setVisible(pageSize), [resetKey, pageSize]);
  const more = useCallback(() => setVisible((v) => v + pageSize), [pageSize]);
  return { visible: Math.min(visible, total), remaining: Math.max(0, total - visible), more };
}


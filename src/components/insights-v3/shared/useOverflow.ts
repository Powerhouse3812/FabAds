import { useLayoutEffect, useRef, useState } from "react";

function isOverflowing(el: HTMLElement | null): boolean {
  if (!el) return false;
  return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
}

/**
 * Tracks whether an element's content is clipped (ellipsis / line-clamp).
 * Re-measures on resize and whenever `dep` changes.
 */
export function useOverflow<T extends HTMLElement>(dep?: unknown) {
  const ref = useRef<T | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflowing(isOverflowing(el));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dep]);
  return { ref, overflowing };
}

/** A boolean kept in localStorage (guarded), for the My Feeds panels that default to collapsed. */
import { useCallback, useState } from "react";

export const FEED_FILTERS_KEY = "fabads:insights-v3:feeds:filters-open";
export const FEED_OVERVIEW_KEY = "fabads:insights-v3:feeds:overview-open";

function read(key: string, fallback: boolean): boolean {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}

function write(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* storage blocked: the choice just won't persist */
  }
}

export function usePersistedFlag(key: string, fallback: boolean): [boolean, (next: boolean) => void] {
  const [value, setValue] = useState(() => read(key, fallback));
  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      write(key, next);
    },
    [key],
  );
  return [value, set];
}

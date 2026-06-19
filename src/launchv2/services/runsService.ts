import type { LaunchRunV2 } from "../types";

const KEY = "fabads:launchv2:runs:v1";
const MAX = 50;

function load(): LaunchRunV2[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LaunchRunV2[];
  } catch {
    return [];
  }
}

function save(runs: LaunchRunV2[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(runs));
  } catch {
    // ignore quota errors
  }
}

/** Upsert a run by id (replace if exists, prepend if new). Trims to MAX. */
export function saveRun(run: LaunchRunV2): void {
  const runs = load();
  const idx = runs.findIndex((r) => r.id === run.id);
  if (idx !== -1) {
    runs[idx] = run;
  } else {
    runs.unshift(run);
  }
  save(runs.slice(0, MAX));
}

/** Load all persisted runs sorted by createdAt desc. */
export function loadRuns(): LaunchRunV2[] {
  return load().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Remove all history. */
export function clearAllRuns(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

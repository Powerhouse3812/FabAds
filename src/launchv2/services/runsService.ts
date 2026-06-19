import type { LaunchRunV2 } from "../types";
import { SEED_RUNS } from "./seedRuns";

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

/** Seeds localStorage with realistic dummy runs if the store is currently empty. */
export function seedRunsIfEmpty(): void {
  const existing = load();
  if (existing.length > 0) return;
  const seeded = SEED_RUNS.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(seeded));
  } catch {
    // ignore quota errors
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

/** Load all persisted runs sorted by createdAt desc. Auto-seeds with dummy data on first call if empty. */
export function loadRuns(): LaunchRunV2[] {
  seedRunsIfEmpty();
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

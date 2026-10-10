/**
 * Competitor marks: domains + pages. Marked items feed My Feeds.
 * Marking changes where an advertiser shows, not what it shows.
 */
import { useSyncExternalStore } from "react";
import { seedCompetitors } from "./seed";
import type { CompetitorsState } from "./seed";
import { STORAGE_KEYS, createPersistentStore, isStringArray } from "./storage";

export type CompetitorKind = "domain" | "page";

const isCompetitors = (v: unknown): v is CompetitorsState =>
  !!v && typeof v === "object" && isStringArray((v as CompetitorsState).domains) && isStringArray((v as CompetitorsState).pages);

export const competitorsStore = createPersistentStore<CompetitorsState>(STORAGE_KEYS.competitors, () => seedCompetitors(), isCompetitors);

const listKey = (kind: CompetitorKind): keyof CompetitorsState => (kind === "domain" ? "domains" : "pages");

export const getCompetitors = (): CompetitorsState => competitorsStore.get();
export const isCompetitor = (kind: CompetitorKind, id: string): boolean => competitorsStore.get()[listKey(kind)].includes(id);

/** Returns the new state (true = now marked). */
export function toggleCompetitor(kind: CompetitorKind, id: string): boolean {
  const k = listKey(kind);
  competitorsStore.set((s) => ({ ...s, [k]: s[k].includes(id) ? s[k].filter((x) => x !== id) : [...s[k], id] }));
  return isCompetitor(kind, id);
}
export function markCompetitor(kind: CompetitorKind, id: string): void {
  if (!isCompetitor(kind, id)) toggleCompetitor(kind, id);
}
export function unmarkCompetitor(kind: CompetitorKind, id: string): void {
  if (isCompetitor(kind, id)) toggleCompetitor(kind, id);
}

export function useCompetitors(): CompetitorsState {
  return useSyncExternalStore(competitorsStore.subscribe, competitorsStore.get, competitorsStore.get);
}
export function useCompetitorDomainIds(): string[] {
  const get = () => competitorsStore.get().domains;
  return useSyncExternalStore(competitorsStore.subscribe, get, get);
}
export function useCompetitorPageIds(): string[] {
  const get = () => competitorsStore.get().pages;
  return useSyncExternalStore(competitorsStore.subscribe, get, get);
}
export function useIsCompetitor(kind: CompetitorKind, id: string): boolean {
  const get = () => isCompetitor(kind, id);
  return useSyncExternalStore(competitorsStore.subscribe, get, get);
}

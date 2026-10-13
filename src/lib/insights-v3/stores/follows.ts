/**
 * Follows: pages (Brand = Page) and industries. Feed My Feeds + Discover's
 * "My preferences only" toggle.
 */
import { useSyncExternalStore } from "react";
import type { IndustryId } from "../types";
import { seedFollows } from "./seed";
import type { FollowsState } from "./seed";
import { STORAGE_KEYS, createPersistentStore, isStringArray } from "./storage";

const isFollows = (v: unknown): v is FollowsState =>
  !!v && typeof v === "object" && isStringArray((v as FollowsState).pages) && isStringArray((v as FollowsState).industries);

export const followsStore = createPersistentStore<FollowsState>(STORAGE_KEYS.follows, () => seedFollows(), isFollows);

const toggleIn = (list: string[], id: string): string[] => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const getFollows = (): FollowsState => followsStore.get();
export const isPageFollowed = (pageId: string): boolean => followsStore.get().pages.includes(pageId);
export const isIndustryFollowed = (industryId: IndustryId): boolean => followsStore.get().industries.includes(industryId);

/** Returns the new state (true = now followed). */
export function toggleFollowPage(pageId: string): boolean {
  followsStore.set((s) => ({ ...s, pages: toggleIn(s.pages, pageId) }));
  return isPageFollowed(pageId);
}
export function followPage(pageId: string): void {
  if (!isPageFollowed(pageId)) toggleFollowPage(pageId);
}
export function unfollowPage(pageId: string): void {
  if (isPageFollowed(pageId)) toggleFollowPage(pageId);
}
export function toggleFollowIndustry(industryId: IndustryId): boolean {
  followsStore.set((s) => ({ ...s, industries: toggleIn(s.industries, industryId) }));
  return isIndustryFollowed(industryId);
}

export function useFollows(): FollowsState {
  return useSyncExternalStore(followsStore.subscribe, followsStore.get, followsStore.get);
}
export function useFollowedPageIds(): string[] {
  const get = () => followsStore.get().pages;
  return useSyncExternalStore(followsStore.subscribe, get, get);
}
export function useFollowedIndustryIds(): IndustryId[] {
  const get = () => followsStore.get().industries;
  return useSyncExternalStore(followsStore.subscribe, get, get);
}
export function useIsPageFollowed(pageId: string): boolean {
  const get = () => followsStore.get().pages.includes(pageId);
  return useSyncExternalStore(followsStore.subscribe, get, get);
}
export function useIsIndustryFollowed(industryId: IndustryId): boolean {
  const get = () => followsStore.get().industries.includes(industryId);
  return useSyncExternalStore(followsStore.subscribe, get, get);
}

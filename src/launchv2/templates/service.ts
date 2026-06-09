/**
 * Launch v2 — Templates service (localStorage-backed mock).
 *
 * Single store, two collections (setup + distribution). Hydrated on first
 * call; persisted on every write. Stable storage key: `fabads:launchv2:templates:v1`.
 *
 * v1 has no per-workspace filtering — every template uses DEFAULT_WORKSPACE_ID.
 * The workspaceId field is preserved on the entities for future filtering.
 */

import { seedTemplatesIfEmpty } from "./seed";
import {
  DEFAULT_WORKSPACE_ID,
  type DistributionTemplate,
  type DistributionTemplatePayload,
  type SetupTemplate,
  type SetupTemplatePayload,
  type TemplateKind,
  type TemplateStoreV1,
} from "./types";

const STORAGE_KEY = "fabads:launchv2:templates:v1";

function emptyStore(): TemplateStoreV1 {
  return { setup: [], distribution: [] };
}

function readStore(): TemplateStoreV1 {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<TemplateStoreV1>;
    return {
      setup: Array.isArray(parsed.setup) ? parsed.setup : [],
      distribution: Array.isArray(parsed.distribution) ? parsed.distribution : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: TemplateStoreV1): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota / privacy errors */
  }
}

let hydrated = false;
function hydrate(): TemplateStoreV1 {
  const store = readStore();
  if (!hydrated) {
    const seeded = seedTemplatesIfEmpty(store);
    if (seeded !== store) writeStore(seeded);
    hydrated = true;
    return seeded;
  }
  return store;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const templatesService = {
  /** Force a re-hydration on next read (test hook). */
  _reset(): void {
    hydrated = false;
  },

  listSetup(): SetupTemplate[] {
    const store = hydrate();
    return [...store.setup].sort((a, b) => b.updatedAt - a.updatedAt);
  },

  listDistribution(): DistributionTemplate[] {
    const store = hydrate();
    return [...store.distribution].sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getSetup(id: string): SetupTemplate | null {
    const store = hydrate();
    return store.setup.find((t) => t.id === id) ?? null;
  },

  getDistribution(id: string): DistributionTemplate | null {
    const store = hydrate();
    return store.distribution.find((t) => t.id === id) ?? null;
  },

  saveSetup(name: string, payload: SetupTemplatePayload): SetupTemplate {
    const store = hydrate();
    const now = Date.now();
    const tpl: SetupTemplate = {
      id: genId("setupTpl"),
      name: name.trim() || "Untitled setup",
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: now,
      updatedAt: now,
      payload,
    };
    const next: TemplateStoreV1 = { ...store, setup: [...store.setup, tpl] };
    writeStore(next);
    return tpl;
  },

  saveDistribution(name: string, payload: DistributionTemplatePayload): DistributionTemplate {
    const store = hydrate();
    const now = Date.now();
    const tpl: DistributionTemplate = {
      id: genId("distTpl"),
      name: name.trim() || "Untitled distribution",
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: now,
      updatedAt: now,
      payload,
    };
    const next: TemplateStoreV1 = { ...store, distribution: [...store.distribution, tpl] };
    writeStore(next);
    return tpl;
  },

  rename(kind: TemplateKind, id: string, newName: string): void {
    const store = hydrate();
    const now = Date.now();
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (kind === "setup") {
      const next: TemplateStoreV1 = {
        ...store,
        setup: store.setup.map((t) => (t.id === id ? { ...t, name: trimmed, updatedAt: now } : t)),
      };
      writeStore(next);
    } else {
      const next: TemplateStoreV1 = {
        ...store,
        distribution: store.distribution.map((t) =>
          t.id === id ? { ...t, name: trimmed, updatedAt: now } : t,
        ),
      };
      writeStore(next);
    }
  },

  remove(kind: TemplateKind, id: string): void {
    const store = hydrate();
    if (kind === "setup") {
      writeStore({ ...store, setup: store.setup.filter((t) => t.id !== id) });
    } else {
      writeStore({ ...store, distribution: store.distribution.filter((t) => t.id !== id) });
    }
  },
};

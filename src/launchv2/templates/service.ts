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
  type AudiencePlacementPayload,
  type AudiencePlacementTemplate,
  type DistributionTemplate,
  type DistributionTemplatePayload,
  type SetupTemplate,
  type SetupTemplatePayload,
  type TemplateKind,
  type TemplateStoreV1,
} from "./types";

const STORAGE_KEY = "fabads:launchv2:templates:v2";

function emptyStore(): TemplateStoreV1 {
  return { setup: [], distribution: [], audiencePlacement: [] };
}

function readStore(): TemplateStoreV1 {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<TemplateStoreV1>;
    return {
      setup: Array.isArray(parsed.setup) ? parsed.setup : [],
      distribution: Array.isArray(parsed.distribution) ? parsed.distribution : [],
      audiencePlacement: Array.isArray(parsed.audiencePlacement) ? parsed.audiencePlacement : [],
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

/* ── AP seed data ── */
const DAY = 86_400_000;
const NOW = Date.now();

function emptyManualPlacements() {
  return {
    fbFeed: false, fbStories: false, fbReels: false, fbMarketplace: false,
    fbRightColumn: false, fbVideoFeeds: false, fbSearch: false,
    igFeed: false, igStories: false, igReels: false, igExplore: false, igSearch: false,
    anNative: false, anRewarded: false,
    msInbox: false, msStories: false,
  };
}

function seedAPTemplates(): AudiencePlacementTemplate[] {
  return [
    {
      id: "aptpl_india_metro_2545",
      name: "India Metro — 25–45 All Gender",
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: NOW - DAY * 14,
      updatedAt: NOW - DAY * 2,
      payload: {
        ageMin: 25, ageMax: 45, gender: "all",
        locations: [
          { key: "IN", name: "India", type: "country" },
          { key: "IN:Delhi", name: "Delhi", type: "city" },
          { key: "IN:Mumbai", name: "Mumbai", type: "city" },
        ],
        languages: ["en", "hi"],
        detailedTargeting: [],
        customAudiences: [],
        exclusions: [],
        advantageAudience: true,
        placementMode: "advantage",
        manualPlacements: emptyManualPlacements(),
        optimizationGoal: "OFFSITE_CONVERSIONS",
        attributionClickWindow: 7,
        attributionViewWindow: 1,
        specialAdCategories: [],
      },
    },
    {
      id: "aptpl_in_women_2235_beauty",
      name: "IN Women 22–35 Beauty",
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: NOW - DAY * 10,
      updatedAt: NOW - DAY * 3,
      payload: {
        ageMin: 22, ageMax: 35, gender: "women",
        locations: [{ key: "IN", name: "India", type: "country" }],
        languages: ["en", "hi"],
        detailedTargeting: [
          { id: "i1", name: "Skincare", type: "interest" },
          { id: "i2", name: "Beauty Products", type: "interest" },
        ],
        customAudiences: [],
        exclusions: [],
        advantageAudience: false,
        placementMode: "manual",
        manualPlacements: {
          ...emptyManualPlacements(),
          igFeed: true, igStories: true, igReels: true, fbFeed: true,
        },
        optimizationGoal: "LINK_CLICKS",
        attributionClickWindow: 7,
        attributionViewWindow: 1,
        specialAdCategories: [],
      },
    },
    {
      id: "aptpl_in_men_2540_tech",
      name: "IN Men 25–40 Tech",
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: NOW - DAY * 8,
      updatedAt: NOW - DAY * 1,
      payload: {
        ageMin: 25, ageMax: 40, gender: "men",
        locations: [{ key: "IN", name: "India", type: "country" }],
        languages: ["en"],
        detailedTargeting: [
          { id: "i3", name: "Consumer Electronics", type: "interest" },
          { id: "i4", name: "Technology", type: "interest" },
        ],
        customAudiences: [],
        exclusions: [],
        advantageAudience: true,
        placementMode: "advantage",
        manualPlacements: emptyManualPlacements(),
        optimizationGoal: "OFFSITE_CONVERSIONS",
        attributionClickWindow: 7,
        attributionViewWindow: 1,
        specialAdCategories: [],
      },
    },
    {
      id: "aptpl_broad_india_test",
      name: "Broad India — Test Budget",
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: NOW - DAY * 6,
      updatedAt: NOW - DAY * 6,
      payload: {
        ageMin: 18, ageMax: 65, gender: "all",
        locations: [{ key: "IN", name: "India", type: "country" }],
        languages: [],
        detailedTargeting: [],
        customAudiences: [],
        exclusions: [],
        advantageAudience: false,
        placementMode: "advantage",
        manualPlacements: emptyManualPlacements(),
        optimizationGoal: "REACH",
        attributionClickWindow: 1,
        attributionViewWindow: 0,
        specialAdCategories: [],
      },
    },
    {
      id: "aptpl_usa_interest_broad",
      name: "USA Interest Broad",
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: NOW - DAY * 5,
      updatedAt: NOW - DAY * 4,
      payload: {
        ageMin: 25, ageMax: 54, gender: "all",
        locations: [{ key: "US", name: "United States", type: "country" }],
        languages: ["en"],
        detailedTargeting: [
          { id: "i5", name: "Online Shopping", type: "behavior" },
          { id: "i6", name: "Engaged Shoppers", type: "behavior" },
        ],
        customAudiences: [],
        exclusions: [],
        advantageAudience: true,
        placementMode: "advantage",
        manualPlacements: emptyManualPlacements(),
        optimizationGoal: "VALUE",
        attributionClickWindow: 7,
        attributionViewWindow: 1,
        specialAdCategories: [],
      },
    },
    {
      id: "aptpl_in_tier2_women",
      name: "IN Tier-2 Cities Women",
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: NOW - DAY * 3,
      updatedAt: NOW - DAY * 0,
      payload: {
        ageMin: 22, ageMax: 38, gender: "women",
        locations: [
          { key: "IN:Pune", name: "Pune", type: "city" },
          { key: "IN:Ahmedabad", name: "Ahmedabad", type: "city" },
          { key: "IN:Jaipur", name: "Jaipur", type: "city" },
          { key: "IN:Surat", name: "Surat", type: "city" },
        ],
        languages: ["hi", "en"],
        detailedTargeting: [],
        customAudiences: [],
        exclusions: [],
        advantageAudience: false,
        placementMode: "manual",
        manualPlacements: {
          ...emptyManualPlacements(),
          fbFeed: true, fbStories: true, igFeed: true, igStories: true,
        },
        optimizationGoal: "OFFSITE_CONVERSIONS",
        attributionClickWindow: 7,
        attributionViewWindow: 1,
        specialAdCategories: [],
      },
    },
  ];
}

let hydrated = false;
function hydrate(): TemplateStoreV1 {
  const store = readStore();
  if (!hydrated) {
    const seeded = seedTemplatesIfEmpty(store);
    // Seed AP templates if empty
    const apSeeded: TemplateStoreV1 =
      seeded.audiencePlacement.length === 0
        ? { ...seeded, audiencePlacement: seedAPTemplates() }
        : seeded;
    if (apSeeded !== store) writeStore(apSeeded);
    hydrated = true;
    return apSeeded;
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
    } else if (kind === "distribution") {
      writeStore({ ...store, distribution: store.distribution.filter((t) => t.id !== id) });
    } else {
      writeStore({ ...store, audiencePlacement: store.audiencePlacement.filter((t) => t.id !== id) });
    }
  },

  listAudiencePlacement(): AudiencePlacementTemplate[] {
    const store = hydrate();
    return [...store.audiencePlacement].sort((a, b) => b.updatedAt - a.updatedAt);
  },

  saveAudiencePlacement(name: string, payload: AudiencePlacementPayload): AudiencePlacementTemplate {
    const store = hydrate();
    const now = Date.now();
    const tpl: AudiencePlacementTemplate = {
      id: genId("aptpl"),
      name: name.trim() || "Untitled audience template",
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: now,
      updatedAt: now,
      payload,
    };
    const next: TemplateStoreV1 = { ...store, audiencePlacement: [...store.audiencePlacement, tpl] };
    writeStore(next);
    return tpl;
  },

  updateAudiencePlacement(id: string, patch: Partial<AudiencePlacementPayload>): void {
    const store = hydrate();
    const now = Date.now();
    const next: TemplateStoreV1 = {
      ...store,
      audiencePlacement: store.audiencePlacement.map((t) =>
        t.id === id ? { ...t, payload: { ...t.payload, ...patch }, updatedAt: now } : t
      ),
    };
    writeStore(next);
  },

  renameAudiencePlacement(id: string, newName: string): void {
    const store = hydrate();
    const now = Date.now();
    const trimmed = newName.trim();
    if (!trimmed) return;
    writeStore({
      ...store,
      audiencePlacement: store.audiencePlacement.map((t) =>
        t.id === id ? { ...t, name: trimmed, updatedAt: now } : t,
      ),
    });
  },

  removeAudiencePlacement(id: string): void {
    const store = hydrate();
    writeStore({ ...store, audiencePlacement: store.audiencePlacement.filter((t) => t.id !== id) });
  },
};

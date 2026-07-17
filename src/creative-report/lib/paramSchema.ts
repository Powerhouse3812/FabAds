/**
 * Creative Report 2.0 — URL search-param schema.
 *
 * Single source of truth for every param the module reads/writes.
 * Filter params persist across sub-routes (via PreserveParamsLink);
 * view params are scoped to one screen and dropped on route change.
 */

/* ------------------------------------------------------------------ */
/*  Dimension enums                                                    */
/* ------------------------------------------------------------------ */

export const PLATFORMS = ["meta", "tiktok", "newsbreak"] as const;
export type Platform = (typeof PLATFORMS)[number];
export const PLATFORM_LABELS: Record<Platform, string> = {
  meta: "Meta",
  tiktok: "TikTok",
  newsbreak: "NewsBreak",
};

export const FORMATS = ["static", "video", "carousel"] as const;
export type CreativeFormat = (typeof FORMATS)[number];
export const FORMAT_LABELS: Record<CreativeFormat, string> = {
  static: "Static",
  video: "Video",
  carousel: "Carousel",
};

export const AD_STATUSES = ["active", "paused", "archived"] as const;
export type AdStatus = (typeof AD_STATUSES)[number];
export const STATUS_LABELS: Record<AdStatus, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export const BUCKETS = ["winners", "scaling", "fatiguing", "new", "losers"] as const;
export type BucketKey = (typeof BUCKETS)[number];
export const BUCKET_LABELS: Record<BucketKey, string> = {
  winners: "Winners",
  scaling: "Scaling",
  fatiguing: "Fatiguing",
  new: "New",
  losers: "Losers",
};

export const COMPONENT_TABS = [
  "hooks",
  "headlines",
  "primary-text",
  "ctas",
  "visual-styles",
] as const;
export type ComponentTab = (typeof COMPONENT_TABS)[number];
export const COMPONENT_TAB_LABELS: Record<ComponentTab, string> = {
  hooks: "Hooks",
  headlines: "Headlines",
  "primary-text": "Primary text",
  ctas: "CTAs",
  "visual-styles": "Visual styles",
};

export const COMPARE_MODES = ["creatives", "contexts"] as const;
export type CompareMode = (typeof COMPARE_MODES)[number];

export const GROUP_BYS = ["none", "concept", "angle"] as const;
export type GroupBy = (typeof GROUP_BYS)[number];

export const SORT_FIELDS = ["spend", "roas", "cpa", "ctr", "fatigue", "recency"] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDir = "asc" | "desc";
export interface SortSpec {
  field: SortField;
  dir: SortDir;
}
export const DEFAULT_SORT: SortSpec = { field: "spend", dir: "desc" };

/** Dev-only forced data states (§8) — the rest of §8 states are exemplar
 *  navigations handled by the StatesSwitcher, not data-status overrides. */
export const FORCED_STATES = [
  "empty",
  "loading",
  "error",
  "filtered-empty",
  "low-data",
] as const;
export type ForcedState = (typeof FORCED_STATES)[number];

/* ------------------------------------------------------------------ */
/*  Advanced filter option pools (also consumed by the data generator   */
/*  so filters and data always agree)                                   */
/* ------------------------------------------------------------------ */

export const GEO_OPTIONS = ["US", "UK", "CA", "AU", "DE", "IN"] as const;
export const DEVICE_OPTIONS = ["mobile", "desktop", "tablet"] as const;
export const OBJECTIVE_OPTIONS = ["conversions", "traffic", "awareness"] as const;
export const AGE_OPTIONS = ["18-24", "25-34", "35-44", "45-54", "55+"] as const;
export const GENDER_OPTIONS = ["all", "female", "male"] as const;
export const PLACEMENT_OPTIONS = [
  "feed",
  "stories",
  "reels",
  "audience-network",
  "search",
] as const;

export interface AdvancedFilterDef {
  key: string;
  label: string;
  options: readonly string[];
}
export const ADVANCED_FILTERS: AdvancedFilterDef[] = [
  { key: "geo", label: "Geo", options: GEO_OPTIONS },
  { key: "device", label: "Device", options: DEVICE_OPTIONS },
  { key: "objective", label: "Objective", options: OBJECTIVE_OPTIONS },
  { key: "age", label: "Age", options: AGE_OPTIONS },
  { key: "gender", label: "Gender", options: GENDER_OPTIONS },
  { key: "placement", label: "Placement", options: PLACEMENT_OPTIONS },
];

/* ------------------------------------------------------------------ */
/*  Param keys                                                         */
/* ------------------------------------------------------------------ */

export const P = {
  from: "from",
  to: "to",
  compare: "compare",
  accounts: "accounts",
  status: "status",
  platform: "platform",
  format: "format",
  geo: "geo",
  device: "device",
  objective: "objective",
  age: "age",
  gender: "gender",
  placement: "placement",
  q: "q",
  sort: "sort",
  group: "group",
  bucket: "bucket",
  creative: "creative",
  tab: "tab",
  ids: "ids",
  mode: "mode",
  state: "state",
} as const;
export type ParamKey = (typeof P)[keyof typeof P];

/** Daily filters — persist across every sub-route. `state` (dev) rides along
 *  so a forced state survives navigation and is screenshot-able via URL. */
export const FILTER_PARAM_KEYS: ParamKey[] = [
  P.from,
  P.to,
  P.compare,
  P.accounts,
  P.status,
  P.platform,
  P.format,
  P.geo,
  P.device,
  P.objective,
  P.age,
  P.gender,
  P.placement,
  P.state,
];

/** View-scoped params — dropped when navigating to a different sub-route. */
export const VIEW_PARAM_KEYS: ParamKey[] = [
  P.q,
  P.sort,
  P.group,
  P.bucket,
  P.creative,
  P.tab,
  P.ids,
  P.mode,
];

/* ------------------------------------------------------------------ */
/*  Encode / decode helpers                                            */
/* ------------------------------------------------------------------ */

/** Parse a CSV param against an allow-list; unknown values are dropped. */
export function parseCsv<T extends string>(
  raw: string | null,
  allowed: readonly T[],
): T[] {
  if (!raw) return [];
  const set = new Set<string>(allowed);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => set.has(s));
}

/** Parse a free CSV param (ids, accounts) with no allow-list. */
export function parseCsvFree(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Encode values as CSV; returns null when empty so the param is removed. */
export function toCsv(values: readonly string[]): string | null {
  return values.length > 0 ? values.join(",") : null;
}

export function parseSort(raw: string | null): SortSpec {
  if (!raw) return DEFAULT_SORT;
  const [field, dir] = raw.split(".");
  if (!(SORT_FIELDS as readonly string[]).includes(field)) return DEFAULT_SORT;
  return { field: field as SortField, dir: dir === "asc" ? "asc" : "desc" };
}

export function encodeSort(sort: SortSpec): string | null {
  if (sort.field === DEFAULT_SORT.field && sort.dir === DEFAULT_SORT.dir) return null;
  return `${sort.field}.${sort.dir}`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** yyyy-MM-dd in local time — the module's canonical date-param format. */
export function toDateParam(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDateParam(raw: string | null): Date | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Default range: last 30 days ending today. */
export function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: toDateParam(from), to: toDateParam(to) };
}

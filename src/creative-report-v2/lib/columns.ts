/**
 * Creative Report 2.0 — the metric-column registry + saveable presets
 * (iter-2 W4, Motion's "Custom picker → Save as preset" pattern).
 *
 * A single source of truth for every metric column the Table view (and the
 * card metric picker) can show, so both surfaces stay in sync with the same
 * formatting rules.
 */
import { useCallback, useSyncExternalStore } from "react";
import {
  fmtCompactCurrency,
  fmtCurrency,
  fmtMultiple,
  fmtNumber,
  fmtPct,
  NA_NO_VIDEO,
} from "@/creative-report-v2/lib/format";
import type { FoldedMetrics } from "@/creative-report-v2/lib/selectors";

export type MetricKey =
  | "spend"
  | "revenue"
  | "roas"
  | "cpa"
  | "ctr"
  | "outboundCtr"
  | "cvr"
  | "cpm"
  | "cpc"
  | "hookRate"
  | "holdRate"
  | "frequency"
  | "purchases";

export interface ColumnDef {
  key: MetricKey;
  label: string;
  format: (m: FoldedMetrics) => string;
  /** true = higher is better (used for future sort-direction defaults). */
  higherIsBetter: boolean;
}

export const COLUMN_DEFS: ColumnDef[] = [
  { key: "spend", label: "Spend", format: (m) => fmtCompactCurrency(m.spend), higherIsBetter: true },
  { key: "revenue", label: "Revenue", format: (m) => fmtCompactCurrency(m.revenue), higherIsBetter: true },
  { key: "roas", label: "ROAS", format: (m) => fmtMultiple(m.roas), higherIsBetter: true },
  { key: "cpa", label: "CPA", format: (m) => (m.cpa === null ? "—" : fmtCurrency(m.cpa, { decimals: 2 })), higherIsBetter: false },
  { key: "ctr", label: "CTR", format: (m) => fmtPct(m.ctr), higherIsBetter: true },
  { key: "outboundCtr", label: "Outbound CTR", format: (m) => fmtPct(m.outboundCtr), higherIsBetter: true },
  { key: "cvr", label: "CVR", format: (m) => fmtPct(m.cvr), higherIsBetter: true },
  { key: "cpm", label: "CPM", format: (m) => fmtCurrency(m.cpm, { decimals: 2 }), higherIsBetter: false },
  { key: "cpc", label: "CPC", format: (m) => (m.cpc === null ? "—" : fmtCurrency(m.cpc, { decimals: 2 })), higherIsBetter: false },
  { key: "hookRate", label: "Hook rate", format: (m) => (m.hookRate === null ? NA_NO_VIDEO : fmtPct(m.hookRate)), higherIsBetter: true },
  { key: "holdRate", label: "Hold rate", format: (m) => (m.holdRate === null ? NA_NO_VIDEO : fmtPct(m.holdRate)), higherIsBetter: true },
  { key: "frequency", label: "Frequency", format: (m) => m.frequency.toFixed(1), higherIsBetter: false },
  { key: "purchases", label: "Purchases", format: (m) => fmtNumber(m.purchases), higherIsBetter: true },
];

export const COLUMN_BY_KEY: Record<MetricKey, ColumnDef> = COLUMN_DEFS.reduce(
  (acc, c) => ({ ...acc, [c.key]: c }),
  {} as Record<MetricKey, ColumnDef>,
);

/* ------------------------------------------------------------------ */
/*  Presets — built-in + user-saved, localStorage-backed                */
/* ------------------------------------------------------------------ */

export interface ColumnPreset {
  id: string;
  name: string;
  columns: MetricKey[];
  /** Built-ins can't be renamed/deleted — only used as a starting point. */
  builtIn?: boolean;
}

export const BUILT_IN_PRESETS: ColumnPreset[] = [
  { id: "ecom", name: "E-com", columns: ["spend", "roas", "cpa", "ctr", "cvr", "purchases"], builtIn: true },
  { id: "video", name: "Video", columns: ["spend", "roas", "hookRate", "holdRate", "frequency", "ctr"], builtIn: true },
  { id: "post-engagement", name: "Post-engagement", columns: ["spend", "ctr", "outboundCtr", "cvr", "frequency", "purchases"], builtIn: true },
];

const KEY = "creative-report-v2-column-presets";
const ACTIVE_KEY = "creative-report-v2-active-preset";

const VALID_METRIC_KEYS = new Set<string>(COLUMN_DEFS.map((c) => c.key));

/** Validate localStorage payloads — stale/unknown metric keys (e.g. after a
 *  registry rename) would otherwise reach `COLUMN_BY_KEY[key].format` and
 *  crash the table. Presets left with zero valid columns are dropped. */
function sanitizePresets(raw: unknown): ColumnPreset[] {
  if (!Array.isArray(raw)) return [];
  const out: ColumnPreset[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const { id, name, columns } = p as Partial<ColumnPreset>;
    if (typeof id !== "string" || typeof name !== "string" || !Array.isArray(columns)) continue;
    const cols = columns.filter(
      (c): c is MetricKey => typeof c === "string" && VALID_METRIC_KEYS.has(c),
    );
    if (cols.length === 0) continue;
    out.push({ id, name, columns: cols });
  }
  return out;
}

function readCustom(): ColumnPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitizePresets(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function readActiveId(): string {
  if (typeof window === "undefined") return BUILT_IN_PRESETS[0].id;
  return window.localStorage.getItem(ACTIVE_KEY) ?? BUILT_IN_PRESETS[0].id;
}

let customPresets = readCustom();
let activeId = readActiveId();
// useSyncExternalStore requires a stable reference when nothing changed —
// recomputing a fresh array on every getSnapshot() call caused an infinite
// render loop. Cache it and only rebuild when customPresets actually changes.
let cachedAllPresets: ColumnPreset[] = [...BUILT_IN_PRESETS, ...customPresets];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persistCustom() {
  cachedAllPresets = [...BUILT_IN_PRESETS, ...customPresets];
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(customPresets));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function allPresetsSnapshot(): ColumnPreset[] {
  return cachedAllPresets;
}
function activeIdSnapshot(): string {
  return activeId;
}

export function setActivePreset(id: string) {
  activeId = id;
  if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_KEY, id);
  emit();
}

function makeId(): string {
  let n = customPresets.length + 1;
  while (customPresets.some((p) => p.id === `custom-${n}`)) n++;
  return `custom-${n}`;
}

export function saveCustomPreset(name: string, columns: MetricKey[]): string {
  const id = makeId();
  customPresets = [...customPresets, { id, name: name.trim() || "Untitled preset", columns }];
  persistCustom();
  setActivePreset(id);
  return id;
}

export function renameCustomPreset(id: string, name: string) {
  customPresets = customPresets.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
  persistCustom();
}

export function deleteCustomPreset(id: string) {
  customPresets = customPresets.filter((p) => p.id !== id);
  persistCustom();
  if (activeId === id) setActivePreset(BUILT_IN_PRESETS[0].id);
}

export function useColumnPresets() {
  const presets = useSyncExternalStore(subscribe, allPresetsSnapshot, () => BUILT_IN_PRESETS);
  const activePresetId = useSyncExternalStore(subscribe, activeIdSnapshot, () => BUILT_IN_PRESETS[0].id);
  const active = presets.find((p) => p.id === activePresetId) ?? presets[0];

  const setActiveColumns = useCallback((columns: MetricKey[]) => {
    if (active.builtIn) {
      // Editing a built-in's columns forks it into a new custom preset —
      // built-ins themselves stay pristine reference points.
      saveCustomPreset(`${active.name} (custom)`, columns);
    } else {
      customPresets = customPresets.map((p) => (p.id === active.id ? { ...p, columns } : p));
      persistCustom();
    }
  }, [active]);

  return { presets, active, setActivePresetId: setActivePreset, setActiveColumns };
}

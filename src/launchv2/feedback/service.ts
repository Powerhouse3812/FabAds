/**
 * Local-only feedback store (no Supabase, no backend).
 *
 * Persists everything to localStorage. Each browser/device is its own
 * silo — perfect for "abhi kaam chalau" mode while we figure out the
 * proper centralized backend later. The API surface is identical to the
 * old Supabase-backed service, so FeedbackSheet and FeedbackPanel work
 * without any changes.
 *
 * Storage keys:
 *   lv2_feedback_log    Array<FeedbackRecord>   — every submitted report
 *   lv2_tester_log      Array<TesterRecord>     — every identity that opened the link
 *
 * Cap: 200 most recent reports. Old ones get evicted FIFO so a chatty tester
 * never bloats localStorage past the 5MB browser limit.
 */

import type {
  FeedbackDraft,
  FeedbackFilters,
  FeedbackRecord,
  FeedbackStatus,
  TesterRecord,
} from "./types";
import { gatherTelemetry } from "./telemetry";
import { getIdentity } from "./identity";

const FEEDBACK_KEY = "lv2_feedback_log";
const TESTER_KEY = "lv2_tester_log";
const MAX_ENTRIES = 200;

/* ── tiny localStorage JSON helpers ────────────────────────────────────── */

function readJsonArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, arr: T[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
    return true;
  } catch (e) {
    // QuotaExceededError — try evicting half then retry once.
    try {
      const trimmed = arr.slice(-Math.floor(arr.length / 2));
      localStorage.setItem(key, JSON.stringify(trimmed));
      return true;
    } catch {
      // eslint-disable-next-line no-console
      console.error(`[feedback] localStorage write failed for ${key}:`, e);
      return false;
    }
  }
}

/** Generate a stable id without relying on crypto.randomUUID (older browsers). */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/* ── public API ────────────────────────────────────────────────────────── */

export interface SubmitResult {
  ok: boolean;
  via: "local";
  error?: string;
  id?: string;
}

/** Gather telemetry + identity, then append to the local log. Always succeeds. */
export async function submitFeedback(draft: FeedbackDraft): Promise<SubmitResult> {
  try {
    const tel = await gatherTelemetry();
    const identity = getIdentity();

    const record: FeedbackRecord = {
      ...draft,
      id: newId(),
      created_at: new Date().toISOString(),
      status: "new",
      tester_name: identity?.name ?? null,
      tester_email: identity?.email ?? null,
      ...tel,
      email: identity?.email ?? tel.email,
    };

    const log = readJsonArray<FeedbackRecord>(FEEDBACK_KEY);
    log.push(record);
    // FIFO cap to avoid quota blowups
    const capped = log.length > MAX_ENTRIES ? log.slice(-MAX_ENTRIES) : log;
    const ok = writeJsonArray(FEEDBACK_KEY, capped);

    if (!ok) {
      return {
        ok: false,
        via: "local",
        error: "localStorage write failed (quota exceeded or disabled)",
      };
    }
    return { ok: true, via: "local", id: record.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    // eslint-disable-next-line no-console
    console.error("[feedback] submit threw:", e);
    return { ok: false, via: "local", error: msg };
  }
}

/** Dashboard read — supports the same filters as before. */
export async function fetchFeedback(
  filters?: FeedbackFilters,
): Promise<FeedbackRecord[]> {
  let rows = readJsonArray<FeedbackRecord>(FEEDBACK_KEY);
  // Newest first
  rows = rows.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  if (filters?.category && filters.category !== "all") {
    rows = rows.filter((r) => r.category === filters.category);
  }
  if (filters?.status && filters.status !== "all") {
    rows = rows.filter((r) => r.status === filters.status);
  }
  if (filters?.visitorId) {
    rows = rows.filter((r) => r.visitor_id === filters.visitorId);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.message?.toLowerCase().includes(s) ||
        r.screen_path?.toLowerCase().includes(s) ||
        r.tester_name?.toLowerCase().includes(s) ||
        r.tester_email?.toLowerCase().includes(s) ||
        r.geo?.city?.toLowerCase().includes(s),
    );
  }
  return rows;
}

/** Roster — pulled from the tester log (one row per opened-the-link identity). */
export async function fetchTesters(): Promise<TesterRecord[]> {
  const rows = readJsonArray<TesterRecord>(TESTER_KEY);
  return rows.slice().sort((a, b) => (a.last_seen < b.last_seen ? 1 : -1));
}

/** Triage update from the dashboard. */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<boolean> {
  const rows = readJsonArray<FeedbackRecord>(FEEDBACK_KEY);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  rows[idx] = { ...rows[idx], status };
  return writeJsonArray(FEEDBACK_KEY, rows);
}

/* ── utilities for the dashboard's export/import buttons ───────────────── */

/** Used by identity.ts to record the tester roster locally. */
export function upsertTesterLocal(rec: TesterRecord): void {
  const rows = readJsonArray<TesterRecord>(TESTER_KEY);
  const idx = rows.findIndex((r) => r.visitor_id === rec.visitor_id);
  if (idx === -1) rows.push(rec);
  else rows[idx] = { ...rows[idx], ...rec };
  writeJsonArray(TESTER_KEY, rows);
}

/** Returns everything as one JSON blob — for "Export" button on the dashboard. */
export function exportAllAsJson(): string {
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      feedback: readJsonArray<FeedbackRecord>(FEEDBACK_KEY),
      testers: readJsonArray<TesterRecord>(TESTER_KEY),
    },
    null,
    2,
  );
}

/** Merge a previously-exported JSON blob into the local store. */
export function importJson(json: string): { feedback: number; testers: number } {
  try {
    const parsed = JSON.parse(json);
    const fbIn: FeedbackRecord[] = Array.isArray(parsed?.feedback) ? parsed.feedback : [];
    const tsIn: TesterRecord[] = Array.isArray(parsed?.testers) ? parsed.testers : [];

    const fbCurrent = readJsonArray<FeedbackRecord>(FEEDBACK_KEY);
    const fbIds = new Set(fbCurrent.map((r) => r.id));
    const fbMerged = [...fbCurrent, ...fbIn.filter((r) => !fbIds.has(r.id))];
    writeJsonArray(FEEDBACK_KEY, fbMerged.slice(-MAX_ENTRIES));

    const tsCurrent = readJsonArray<TesterRecord>(TESTER_KEY);
    const tsMap = new Map(tsCurrent.map((r) => [r.visitor_id, r]));
    for (const t of tsIn) tsMap.set(t.visitor_id, t);
    writeJsonArray(TESTER_KEY, Array.from(tsMap.values()));

    return { feedback: fbIn.length, testers: tsIn.length };
  } catch {
    return { feedback: 0, testers: 0 };
  }
}

/** Wipe everything (useful for testing). */
export function clearAll(): void {
  try {
    localStorage.removeItem(FEEDBACK_KEY);
    localStorage.removeItem(TESTER_KEY);
  } catch {
    /* ignore */
  }
}

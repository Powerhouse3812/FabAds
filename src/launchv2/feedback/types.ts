/**
 * Launch v2 — Feedback / bug-report subsystem types.
 *
 * Internal-testing tool: a floating widget on every /launchv2 screen lets
 * testers file a Bug / Problem / Suggestion / Praise with an auto-captured
 * screenshot. Telemetry (device, IP+geo, session time, exact deep-link state)
 * is gathered silently — no name is ever asked. All testers share one
 * auto-login identity (Rahul), so `visitor_id` (a generated, localStorage-
 * persisted id) + IP + device are what actually distinguish testers.
 *
 * Mirrors the `public.launchv2_feedback` Supabase table 1:1.
 */

export type FeedbackCategory = "bug" | "problem" | "suggestion" | "praise";

/** Only meaningful for bugs; null otherwise. */
export type FeedbackSeverity = "blocker" | "major" | "minor" | null;

/** Dashboard triage states. */
export type FeedbackStatus = "new" | "triaged" | "resolved" | "wontfix";

/** IP + approximate geo (from ipapi.co, client-side; or x-forwarded-for server-side). */
export interface GeoInfo {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
  lat?: number;
  lng?: number;
}

/** Parsed from navigator + screen — never asked. */
export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: "desktop" | "tablet" | "mobile";
  screen: string; // "1920×1080"
  viewport: string; // "1440×900"
  dpr: number;
  cores?: number;
  memory?: number; // GB (navigator.deviceMemory, Chrome-only)
  touch: boolean;
  languages: string[];
}

/** Structured MCQ / multi-select answers, keyed by question id. */
export interface FeedbackAnswers {
  [questionId: string]: string | string[];
}

/** What the user actually fills in the widget. */
export interface FeedbackDraft {
  category: FeedbackCategory;
  severity?: FeedbackSeverity;
  answers: FeedbackAnswers;
  message: string;
  /** Compressed JPEG data URL, or null if capture failed / removed. */
  screenshot: string | null;
}

/** Auto-gathered context attached at submit time. */
export interface TelemetrySnapshot {
  visitor_id: string;
  email: string | null;
  screen_path: string;
  deep_link: string;
  step: string | null;
  variant: string | null;
  ip: string | null;
  geo: GeoInfo | null;
  device: DeviceInfo;
  user_agent: string;
  timezone: string;
  language: string;
  session_seconds: number;
  page_seconds: number;
}

/** A full row as stored / read back from Supabase. */
export interface FeedbackRecord extends FeedbackDraft, TelemetrySnapshot {
  id: string;
  created_at: string;
  status: FeedbackStatus;
  /** Real tester identity (from the link/popup) — the reliable "who". */
  tester_name: string | null;
  tester_email: string | null;
}

/** A roster row — one per tester who opened the link (even before any feedback). */
export interface TesterRecord {
  visitor_id: string;
  name: string | null;
  email: string | null;
  source: string | null;
  first_seen: string;
  last_seen: string;
}

/** Dashboard filter shape. */
export interface FeedbackFilters {
  category?: FeedbackCategory | "all";
  status?: FeedbackStatus | "all";
  visitorId?: string;
  search?: string;
}

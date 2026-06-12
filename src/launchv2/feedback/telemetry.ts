/**
 * Telemetry capture for the Launch v2 feedback subsystem.
 *
 * Everything here is gathered SILENTLY — the tester is never asked for any of
 * it. Hard limits we honour (no hallucination):
 *   • The user's real NAME cannot be read from the browser or IP — not captured.
 *   • EMAIL is read from the auth session, but every tester auto-logs-in as the
 *     same Rahul account, so it does NOT distinguish testers. `visitor_id`
 *     (generated + localStorage-persisted) + IP + device do that job.
 */

import { supabase } from "@/integrations/supabase/client";
import type { DeviceInfo, GeoInfo, TelemetrySnapshot } from "./types";

const VISITOR_KEY = "lv2_visitor_id";
const APP_LOAD_KEY = "lv2_app_load_ts";

/* ── Visitor id (persistent per browser) ─────────────────────────────────── */

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "v_unknown";
  }
}

/* ── Session + page timers ───────────────────────────────────────────────── */

/** Call once when the launchv2 shell mounts. Idempotent within a tab session. */
export function markAppLoad(): void {
  try {
    if (!sessionStorage.getItem(APP_LOAD_KEY)) {
      sessionStorage.setItem(APP_LOAD_KEY, String(Date.now()));
    }
  } catch {
    /* ignore */
  }
}

export function getSessionSeconds(): number {
  try {
    const raw = sessionStorage.getItem(APP_LOAD_KEY);
    if (!raw) return 0;
    return Math.max(0, Math.round((Date.now() - Number(raw)) / 1000));
  } catch {
    return 0;
  }
}

let pageViewTs = Date.now();
/** Call on every route change inside launchv2. */
export function markPageView(): void {
  pageViewTs = Date.now();
}
export function getPageSeconds(): number {
  return Math.max(0, Math.round((Date.now() - pageViewTs) / 1000));
}

/* ── Device / browser / OS (parsed from UA + screen) ─────────────────────── */

function parseBrowser(ua: string): { browser: string; browserVersion: string } {
  const tests: [string, RegExp][] = [
    ["Edge", /Edg\/([\d.]+)/],
    ["Opera", /OPR\/([\d.]+)/],
    ["Chrome", /Chrome\/([\d.]+)/],
    ["Firefox", /Firefox\/([\d.]+)/],
    ["Safari", /Version\/([\d.]+).*Safari/],
  ];
  for (const [name, re] of tests) {
    const m = ua.match(re);
    if (m) return { browser: name, browserVersion: m[1] ?? "" };
  }
  return { browser: "Unknown", browserVersion: "" };
}

function parseOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return "Windows 10/11";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X ([\d_]+)/.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_]+)/);
    return `macOS ${m ? m[1].replace(/_/g, ".") : ""}`.trim();
  }
  if (/Android ([\d.]+)/.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/);
    return `Android ${m ? m[1] : ""}`.trim();
  }
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}

function deviceType(ua: string): DeviceInfo["deviceType"] {
  if (/iPad|Tablet/.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/.test(ua)) return "mobile";
  return "desktop";
}

export function getDeviceInfo(): DeviceInfo {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const { browser, browserVersion } = parseBrowser(ua);
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    browser,
    browserVersion,
    os: parseOS(ua),
    deviceType: deviceType(ua),
    screen: `${window.screen?.width ?? 0}×${window.screen?.height ?? 0}`,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    dpr: window.devicePixelRatio ?? 1,
    cores: navigator.hardwareConcurrency,
    memory: nav.deviceMemory,
    touch: (navigator.maxTouchPoints ?? 0) > 0,
    languages: Array.from(navigator.languages ?? [navigator.language]),
  };
}

/* ── IP + geo (ipapi.co, client-side; the server-side x-forwarded-for path is
 *    handled by the submit-feedback edge function when deployed) ──────────── */

export async function getGeo(): Promise<GeoInfo | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      ip: d.ip,
      city: d.city,
      region: d.region,
      country: d.country_name,
      isp: d.org,
      lat: typeof d.latitude === "number" ? d.latitude : undefined,
      lng: typeof d.longitude === "number" ? d.longitude : undefined,
    };
  } catch {
    return null;
  }
}

/* ── Deep-link / screen context ──────────────────────────────────────────── */

function decodeDeepLink(): { step: string | null; variant: string | null } {
  try {
    const sp = new URLSearchParams(window.location.search);
    const raw = sp.get("s");
    if (!raw) return { step: null, variant: null };
    const state = JSON.parse(atob(raw));
    return {
      step: state?.step != null ? String(state.step) : null,
      variant: state?.variant != null ? String(state.variant) : null,
    };
  } catch {
    return { step: null, variant: null };
  }
}

/* ── The one entry point the widget calls at submit ──────────────────────── */

export async function gatherTelemetry(): Promise<TelemetrySnapshot> {
  let email: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  } catch {
    /* ignore */
  }

  const geo = await getGeo();
  const { step, variant } = decodeDeepLink();

  return {
    visitor_id: getVisitorId(),
    email,
    screen_path: window.location.pathname,
    deep_link: window.location.href,
    step,
    variant,
    ip: geo?.ip ?? null,
    geo,
    device: getDeviceInfo(),
    user_agent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    language: navigator.language ?? "",
    session_seconds: getSessionSeconds(),
    page_seconds: getPageSeconds(),
  };
}

/**
 * Tester identity for the feedback subsystem.
 *
 * Problem this solves: every tester auto-logs-in as the SAME Rahul account, so
 * the auth email can't tell testers apart. Instead we capture a real name+email
 * once per tester and key everything off `visitor_id`.
 *
 * Two sources, combined (Maalik's pick):
 *   1. Link param — `?tester=Name` (+ optional `?email=`). Certain identity,
 *      survives browser/device/incognito as long as they use their link.
 *   2. Popup fallback — first load with no stored identity → required name+email.
 *
 * Persisted to localStorage (so the popup shows once per browser) AND upserted
 * to the `launchv2_tester` roster (so the dashboard knows who opened the link
 * even before they file any feedback).
 */

import { getVisitorId } from "./telemetry";
import { upsertTesterLocal } from "./service";

const IDENTITY_KEY = "lv2_identity";

export type IdentitySource = "link" | "popup";

export interface Identity {
  name: string;
  email: string;
  source: IdentitySource;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Stored identity for this browser, or null if not set. */
export function getIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Identity>;
    if (v.name && v.email) {
      return { name: v.name, email: v.email, source: (v.source as IdentitySource) ?? "popup" };
    }
    return null;
  } catch {
    return null;
  }
}

/** Read whatever the link carries (name and/or email). */
export function parseLinkIdentity(): { name?: string; email?: string } {
  try {
    const sp = new URLSearchParams(window.location.search);
    const name = sp.get("tester") ?? sp.get("t") ?? undefined;
    const email = sp.get("email") ?? undefined;
    return {
      name: name ? decodeURIComponent(name) : undefined,
      email: email ? decodeURIComponent(email) : undefined,
    };
  } catch {
    return {};
  }
}

/** Persist identity locally + upsert the roster row. Fire-and-forget on the DB. */
export async function setIdentity(
  name: string,
  email: string,
  source: IdentitySource,
): Promise<void> {
  const identity: Identity = { name: name.trim(), email: email.trim(), source };
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    /* ignore */
  }
  try {
    const now = new Date().toISOString();
    upsertTesterLocal({
      visitor_id: getVisitorId(),
      name: identity.name,
      email: identity.email,
      source,
      first_seen: now,
      last_seen: now,
    });
  } catch {
    /* ignore — identity still works in localStorage */
  }
}

/**
 * Resolve the starting state for the gate:
 *  - complete: identity already known (stored or fully supplied by the link)
 *  - prefill : best-guess name/email to seed the popup
 */
export function resolveIdentity(): {
  complete: boolean;
  identity: Identity | null;
  prefill: { name: string; email: string };
} {
  const stored = getIdentity();
  if (stored) {
    return { complete: true, identity: stored, prefill: { name: stored.name, email: stored.email } };
  }
  const link = parseLinkIdentity();
  if (link.name && link.email && isValidEmail(link.email)) {
    const identity: Identity = { name: link.name, email: link.email, source: "link" };
    return { complete: true, identity, prefill: { name: link.name, email: link.email } };
  }
  return {
    complete: false,
    identity: null,
    prefill: { name: link.name ?? "", email: link.email ?? "" },
  };
}

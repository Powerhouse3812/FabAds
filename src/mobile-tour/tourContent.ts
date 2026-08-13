import type { ElementType } from "react";
import {
  BarChart3,
  Bookmark,
  LayoutDashboard,
  MoreHorizontal,
  Rss,
  Telescope,
  Wand2,
} from "lucide-react";

// Imported from the constants module, NOT from MobileTabBar: that component now
// imports this flow, and going back through it created a module cycle whose TDZ
// error blanked the app at runtime. See mobileNavConstants.ts.
import { MOBILE_HOME_PATH } from "@/components/shell/mobileNavConstants";
import {
  isMobileAllowed,
  resolveMobilePolicy,
} from "@/components/shell/mobileRoutePolicy";
import type { MobileTourStepId } from "@/mobile-tour/useMobileTourProgress";

/**
 * tourContent — every word and every example the Mobile tour shows.
 *
 * WHY THE EXAMPLES ARE COMPUTED, NOT WRITTEN
 * Screen 2's whole job is to tell the user which surfaces are desktop-only. If
 * that list is a hand-typed guess it becomes a lie the moment a route is opened
 * up on mobile — and an onboarding flow that misdescribes the product is worse
 * than none, because the user believes it. So the examples are RESOLVED through
 * `resolveMobilePolicy`, the same function the gate screen uses: the tour cannot
 * claim a surface is blocked unless the policy actually blocks it, and it quotes
 * the policy's own `label` + `reason` verbatim rather than paraphrasing them.
 * Open a route on mobile tomorrow and it drops out of screen 2 by itself.
 *
 * Prose copy is hand-written (it has to read like a human wrote it), but every
 * factual claim inside it is one the policy above backs up.
 */

/* ────────────────────────── what mobile is for (screen 1) ───────────────── */

/**
 * Candidate surfaces to advertise as mobile-ready, in the order a user meets
 * them. Filtered against the allowlist below, so nothing is promised that the
 * policy would then gate.
 */
const OPEN_CANDIDATES: ReadonlyArray<{ to: string; blurb: string }> = [
  { to: "/dashboard", blurb: "yesterday's spend, ROAS and account health" },
  { to: "/insights-v2/feed", blurb: "new ads from the brands you follow" },
  { to: "/insights/discover", blurb: "find brands worth watching" },
  { to: "/insights/boards", blurb: "the ads you saved, organised" },
  { to: "/reports/fb", blurb: "accounts, campaigns, ad sets and ads as cards" },
  { to: "/iq/genie6/studio-alpha", blurb: "generate creative, one step per screen" },
];

export interface TourSurface {
  /** The policy's own label — never a nickname invented here. */
  label: string;
  to: string;
  blurb: string;
  /** `readonly` surfaces are viewable but not editable on a phone. */
  readOnly: boolean;
}

export const MOBILE_OPEN_SURFACES: readonly TourSurface[] = OPEN_CANDIDATES.flatMap(
  ({ to, blurb }) => {
    const policy = resolveMobilePolicy(to);
    if (policy.support === "blocked") return [];
    return [
      {
        label: policy.label,
        to,
        blurb,
        readOnly: policy.support === "readonly",
      },
    ];
  },
);

/* ─────────────────────── what waits for a laptop (screen 2) ─────────────── */

/**
 * Deliberately the five heaviest, most-asked-about surfaces rather than every
 * blocked route — Miller's 7±2, and a full dump would read as a defect list.
 * Each is resolved below; any that is no longer blocked simply disappears.
 *
 * These are chosen because their policy `reason` explains a LAYOUT constraint
 * ("three-pane", "13-metric column picker"). Routes blocked merely because they
 * are unbuilt (Saved Ads, Automation) are excluded on purpose: "not built yet"
 * is not "lives on desktop", and mixing the two makes the product sound broken.
 */
const DESKTOP_ONLY_CANDIDATES: readonly string[] = [
  "/launchv2/new",
  "/catalogue/brands",
  "/reports/creative-v3/creatives",
  "/insights/competitors",
  "/settings/general",
];

export interface TourDesktopOnlySurface {
  label: string;
  /** Verbatim from the policy — this is the sentence the gate screen shows too. */
  reason: string;
  to: string;
}

export const DESKTOP_ONLY_SURFACES: readonly TourDesktopOnlySurface[] =
  DESKTOP_ONLY_CANDIDATES.flatMap((to) => {
    const policy = resolveMobilePolicy(to);
    if (policy.support !== "blocked" || !policy.reason) return [];
    return [{ label: policy.label, reason: policy.reason, to }];
  });

/* ───────────────────────── how to get around (screen 3) ────────────────── */

/**
 * Mirrors the bar in `src/components/shell/MobileTabBar.tsx`. That file's `TABS`
 * array is not exported, so this is a copy — but it is a checked copy: `to`
 * targets run through `isMobileAllowed` below, and the dev audit at the bottom
 * of this file shouts if one stops resolving. `MOBILE_HOME_PATH` is imported
 * rather than retyped because it is exported and is the one value expected to
 * move (when a dedicated mobile landing ships).
 */
export interface TourTab {
  label: string;
  to: string | null;
  icon: ElementType;
  what: string;
}

export const TOUR_TABS: readonly TourTab[] = [
  {
    label: "Home",
    to: MOBILE_HOME_PATH,
    icon: LayoutDashboard,
    what: "how yesterday went",
  },
  {
    label: "Insights",
    to: "/insights-v2/feed",
    icon: Telescope,
    what: "what competitors just launched",
  },
  {
    label: "Reports",
    to: "/reports/fb",
    icon: BarChart3,
    what: "accounts down to individual ads",
  },
  {
    label: "Genie",
    to: "/iq/genie6",
    icon: Wand2,
    what: "generate creative on the go",
  },
  {
    // No route — More opens the menu sheet, which is also where this tour lives.
    label: "More",
    to: null,
    icon: MoreHorizontal,
    what: "Launch, Catalogue, Settings, and this tour",
  },
];

/* ─────────────────────────── welcome screen copy ────────────────────────── */

export interface TourWelcomeScreen {
  id: "purpose" | "desktop" | "navigation";
  /** Small line above the heading — orients without competing with it. */
  eyebrow: string;
  title: string;
  /** Lead paragraph. */
  body: string;
  /** Which computed list this screen renders under its body, if any. */
  list: "open" | "desktopOnly" | "tabs" | null;
  /** Closing line under the list. */
  footnote: string;
}

export const TOUR_WELCOME_SCREENS: readonly TourWelcomeScreen[] = [
  {
    id: "purpose",
    eyebrow: "1 of 3 · What this is",
    title: "FabAds, pocket-sized",
    body:
      "Your phone is for the checking-in half of the job: see how yesterday went, catch what competitors just launched, save what's worth stealing, and set a Genie generation running while you're away from your desk.",
    list: "open",
    footnote:
      "Light edits work here too. The heavy building still belongs on a laptop — that's the next screen.",
  },
  {
    id: "desktop",
    eyebrow: "2 of 3 · What waits for your laptop",
    title: "Some screens are desktop-only, on purpose",
    body:
      "A handful of surfaces are built around wide tables, fixed rails and drag-and-drop that genuinely do not survive a 390px screen. We'd rather hold them back than hand you a squashed, half-tappable version:",
    list: "desktopOnly",
    footnote:
      "Tap one anyway and you get an honest \"best on desktop\" screen — the reason, a way back, and a Copy link button. Copy it, open it on a laptop, pick up exactly where you were.",
  },
  {
    id: "navigation",
    eyebrow: "3 of 3 · Getting around",
    title: "Five slots at the bottom",
    body:
      "The tab bar is always there, always in thumb reach. Four destinations you'll use daily, plus More for everything else:",
    list: "tabs",
    footnote:
      "Nothing is more than two taps away: a tab for the daily four, More for the long tail — including Launch, Catalogue, Settings and this tour, any time you want it again.",
  },
];

/* ─────────────────────────────── checklist ──────────────────────────────── */

export interface TourChecklistItem {
  id: MobileTourStepId;
  title: string;
  /** One sentence on what to actually do, and why it's worth doing. */
  body: string;
  /** Deep link into the real surface. */
  to: string;
  /** Label for the primary action button. */
  cta: string;
  /** Optional second route for the same goal (e.g. Boards as well as the feed). */
  alt?: { label: string; to: string };
  icon: ElementType;
}

export const TOUR_CHECKLIST: readonly TourChecklistItem[] = [
  {
    id: "follow-brand",
    title: "Follow a brand",
    body:
      "Pick one brand you actually compete with and follow it. Its new ads start landing in your feed instead of you going looking.",
    to: "/insights-v2/feed",
    cta: "Open My feeds",
    icon: Rss,
  },
  {
    id: "save-ad",
    title: "Save an ad to a board",
    body:
      "Found something worth stealing? Save it to a board so it's still there next week, when you're writing the brief.",
    to: "/insights-v2/feed",
    cta: "Find an ad to save",
    alt: { label: "Or open Boards", to: "/insights/boards" },
    icon: Bookmark,
  },
  {
    id: "check-report",
    title: "Check a report",
    body:
      "Open your ad accounts and see where spend and ROAS are sitting. Tap any row for the detail sheet — no wide table involved.",
    to: "/reports/fb",
    cta: "Open Ad accounts",
    icon: BarChart3,
  },
  {
    id: "try-genie",
    title: "Try a Genie generation",
    body:
      "Run Studio once. It's five steps, one screen per step, and you get creative out the other end.",
    to: "/iq/genie6/studio-alpha",
    cta: "Open Studio",
    icon: Wand2,
  },
];

/**
 * Runtime truth check for a checklist target. The tour must never send a phone
 * user into the gate screen it just spent a screen explaining, so the item UI
 * degrades to a "now desktop-only" note instead of a dead-end tap.
 */
export function isTourTargetReachable(to: string): boolean {
  return isMobileAllowed(to);
}

/* ────────────────────────── dev-only audit ──────────────────────────────
   Mirrors the audit at the bottom of mobileRoutePolicy.ts, for the same reason:
   these are drift failures that produce confidently WRONG onboarding copy
   rather than a crash, so nothing surfaces them at runtime. Warn only. */
if (import.meta.env.DEV) {
  for (const to of DESKTOP_ONLY_CANDIDATES) {
    if (resolveMobilePolicy(to).support !== "blocked") {
      console.warn(
        `[mobile-tour] "${to}" is no longer blocked on mobile — it has been dropped ` +
          `from the "desktop-only" screen automatically. Pick a replacement example ` +
          `in DESKTOP_ONLY_CANDIDATES so that screen still has something to show.`,
      );
    }
  }
  for (const tab of TOUR_TABS) {
    if (tab.to && !isMobileAllowed(tab.to)) {
      console.warn(
        `[mobile-tour] tab "${tab.label}" points at "${tab.to}", which the policy blocks. ` +
          `MobileTabBar filters that tab out, so screen 3 is describing a bar the user cannot see.`,
      );
    }
  }
  for (const item of TOUR_CHECKLIST) {
    if (!isMobileAllowed(item.to)) {
      console.warn(
        `[mobile-tour] checklist step "${item.id}" targets "${item.to}", which the policy blocks. ` +
          `Repoint it — the step currently cannot be completed on a phone.`,
      );
    }
  }
}

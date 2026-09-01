import { useMemo } from "react";
import { matchPath, useLocation } from "react-router-dom";
import {
  MODULES,
  SYSTEM_MODULES,
  allSubPaths,
  type ModuleDef,
} from "@/components/sidebar/modules";

/**
 * mobileRoutePolicy — the mobile allowlist for a desktop-first product.
 *
 * WHY THIS EXISTS
 * The app shell used to be `hidden md:flex`, so below 768px nothing rendered at
 * all. Unlocking it globally is not an option: there are ~538 hard-coded
 * `w-[NNpx]` utilities across ~314 files and roughly 71% of .tsx files carry no
 * breakpoint prefix. A blanket unlock would spray clipped controls and
 * horizontal overflow across the whole product. So mobile is opt-in, route by
 * route, and everything else gets an honest "Best on desktop" screen.
 *
 * TWO RULES THAT MUST NOT BE CASUALLY CHANGED
 *
 * 1. FIRST MATCH WINS, IN DECLARATION ORDER. Not longest-prefix, not a
 *    specificity sort. Array order is authoritative because it is the only way
 *    an exact rule reliably beats its own `/*` sibling — e.g.
 *    `/reports/creative-v3` (allowed Overview) must be declared BEFORE
 *    `/reports/creative-v3/*` (blocked Creatives/Compare/Components).
 *    Reordering this array silently changes which surfaces mobile can reach.
 *
 * 2. FAIL CLOSED. `CATCH_ALL` sits at the end, so any path nobody thought
 *    about is blocked rather than shipped broken. A missing entry costs a
 *    generic-but-correct gate screen; a wrong-way default costs a broken page
 *    in front of a paying user.
 *
 * Matching delegates to react-router's own `matchPath` so `:param` and splat
 * semantics can never drift from how App.tsx actually routes.
 *
 * This is deliberately NOT a field on modules.ts. That file is the locked nav
 * IA and is read by four other consumers; this allowlist needs granularity nav
 * cannot express (exact-vs-subtree splits, sibling splits, and param routes
 * like /insights/boards/:id that have no nav entry at all), and it changes on a
 * completely different cadence — per mobile phase, not per IA revision.
 */

export type MobileSupport = "full" | "readonly" | "blocked";

export interface MobilePolicyRule {
  /** react-router pattern. A trailing `/*` matches the whole subtree. */
  pattern: string;
  support: MobileSupport;
  /** Human name of the surface — BestOnDesktop heading + page-title fallback. */
  label: string;
  /** One concrete sentence on WHY it needs a bigger screen. Never "not supported". */
  reason?: string;
  /** Escape hatch so a blocked deep link is never a dead end. */
  fallback?: { label: string; to: string };
  /** Deliberately absent from modules.ts (detail/param/utility routes). Silences the dev audit. */
  notInNav?: boolean;
  /**
   * The page itself owns a complete Back affordance with its own semantics
   * (e.g. a wizard's step-aware Back, not browser history) — MobileTopBar
   * must not ALSO show its generic `navigate(-1)` Back, or the two disagree
   * about what "back" means and both appear on screen at once. Only
   * meaningful on a rule where `notInNav` or `support: "blocked"` would
   * otherwise turn the shell's Back on.
   */
  ownsBackNavigation?: boolean;
}

export interface ResolvedMobilePolicy extends MobilePolicyRule {
  /** The pattern that won, or "fallback" when CATCH_ALL matched. For debugging. */
  matched: string;
}

const TO_DASHBOARD = { label: "Go to Dashboard", to: "/dashboard" } as const;
const TO_FEED = { label: "Browse My feeds", to: "/insights-v2/feed" } as const;
const TO_CR_OVERVIEW = {
  label: "Open the Overview",
  to: "/reports/creative-v3",
} as const;
const TO_LAUNCH_HUB = { label: "Open the Launch Hub", to: "/launchv2" } as const;

export const MOBILE_ROUTE_POLICY: MobilePolicyRule[] = [
  /* ── Landing ─────────────────────────────────────────────────────────────
     Dashboard is the mobile landing: it is already mobile-first, `/` already
     redirects here, so this costs no new surface. Read-only — the KPI
     customize popover is drag-and-drop and stays desktop-only. */
  { pattern: "/dashboard", support: "readonly", label: "Dashboard" },

  /* ── Industry Insights — the phase-1 flagship ───────────────────────────
     Genuinely better on a phone: it is a scroll-and-consume surface, and its
     grids already start at 1 column. */
  { pattern: "/insights-v2/feed", support: "full", label: "My feeds" },
  { pattern: "/insights/discover", support: "full", label: "Discover" },
  { pattern: "/insights/boards", support: "full", label: "Boards" },
  {
    pattern: "/insights/boards/:id",
    support: "full",
    label: "Board",
    notInNav: true,
  },
  {
    pattern: "/insights/competitors",
    support: "blocked",
    label: "Competitors",
    reason:
      "Competitor tracking pairs a wide metrics table with a chart that needs room to be readable.",
    fallback: TO_FEED,
  },
  // Allowed even though it's an unbuilt ComingSoonPage stub: it sits in the
  // mobile Insights segmented toggle (My feeds · Discover · Saved Ads), and a
  // stub page is inherently mobile-safe. Gating it would show "Best on desktop"
  // for a screen that doesn't exist on desktop either — "coming soon" is the
  // honest answer.
  { pattern: "/insights/saved", support: "full", label: "Saved Ads" },
  // Dashboard overview is the one Industry Insights surface that stays
  // desktop-only: no sibling splat can shadow this exact rule (there is no
  // `/insights/*` wildcard in this file), so placement here — grouped with
  // the rest of the module — is safe.
  {
    pattern: "/insights/overview",
    support: "blocked",
    label: "Insights Home",
    reason:
      "The overview packs a wide KPI strip, two side-by-side chart rows and a multi-column domain table that need real width to read.",
    fallback: TO_FEED,
  },

  /* ── Reports ───────────────────────────────────────────────────────────
     Mobile gets a card list + a detail sheet, never the 12-column table.
     NOTE: /reports/fb|nb|tt are named like platforms but render entity
     LEVELS (accounts / campaigns / ad sets). Labels below describe what the
     route actually renders, not what the path implies. */
  { pattern: "/reports/fb", support: "full", label: "Ad accounts" },
  { pattern: "/reports/nb", support: "full", label: "Campaigns" },
  { pattern: "/reports/tt", support: "full", label: "Ad sets" },
  // Route added alongside the mobile work — also un-orphans AdsReport, which
  // was imported but unreachable, and fixes AdSetsReport's drill-down. Not a
  // modules.ts sub-item (the nav still only lists Facebook/NB/TikTok), hence
  // notInNav — silences the dev audit truthfully rather than fixing a
  // phantom bug.
  { pattern: "/reports/ads", support: "full", label: "Ads", notInNav: true },

  // EXACT before SPLAT — the Overview is allowed, the rest of 3.0 is not.
  {
    pattern: "/reports/creative-v3",
    support: "readonly",
    label: "Creative Report Overview",
  },
  {
    pattern: "/reports/creative-v3/*",
    support: "blocked",
    label: "Creative Report 3.0",
    reason:
      "Creatives, Components and Compare are built around a full-width grid with a 13-metric column picker.",
    fallback: TO_CR_OVERVIEW,
  },
  {
    pattern: "/reports/creative-v2",
    support: "blocked",
    label: "Creative Report 2.0",
    reason: "2.0 is a frozen snapshot kept for reference.",
    fallback: TO_CR_OVERVIEW,
  },
  {
    pattern: "/reports/creative-v2/*",
    support: "blocked",
    label: "Creative Report 2.0",
    reason: "2.0 is a frozen snapshot kept for reference.",
    fallback: TO_CR_OVERVIEW,
  },
  {
    pattern: "/reports/creative",
    support: "blocked",
    label: "Creative Reporting",
    reason: "This report is a wide metrics table built for a large screen.",
    fallback: { label: "Open Ad accounts", to: "/reports/fb" },
  },

  /* ── Launch v2 — Hub through, wizard blocked ────────────────────────────
     Hub has zero direct-mutation controls (every working control navigates or
     sets local state), so read-only here means gating the exits into the
     creation flow rather than the page itself. */
  // The Launch module has subItems but no root `.path` of its own in
  // modules.ts (New launch / History are the listed entries), so the Hub
  // route itself is genuinely absent from the nav structure — notInNav.
  { pattern: "/launchv2", support: "readonly", label: "Launch Hub", notInNav: true },
  {
    pattern: "/launchv2/history",
    support: "readonly",
    label: "Launch history",
  },
  {
    pattern: "/launchv2/new",
    support: "blocked",
    label: "New launch",
    reason:
      "The 4-step flow needs a wide canvas — the distribution step is a drag-resizable two-pane workspace.",
    fallback: TO_LAUNCH_HUB,
  },
  {
    pattern: "/launchv2/:id",
    support: "readonly",
    label: "Launch",
    notInNav: true,
  },
  // Everything else under Launch (settings, strategies, templates, auto…).
  {
    pattern: "/launchv2/*",
    support: "blocked",
    label: "Launch 2.0",
    reason: "This Launch surface is built for a wide screen.",
    fallback: TO_LAUNCH_HUB,
  },

  /* ── Nav-visible modules that are desktop-only ──────────────────────────
     Declared explicitly rather than left to CATCH_ALL so the gate copy names
     the actual surface and the dev audit stays quiet. */
  {
    pattern: "/catalogue/*",
    support: "blocked",
    label: "Catalogue",
    reason:
      "The Catalogue is a three-pane browser — two fixed rails plus a detail pane.",
    fallback: TO_DASHBOARD,
  },
  /* ── Genie — holds a bottom-tab slot as of 2026-08-11 ──────────────────
     Three surfaces are opened; everything else under /iq/genie6 stays blocked.
     EXACT rules precede the splat, per the ordering rule in the header. */
  // Overview. The Studio home variant was rebuilt responsive for this.
  { pattern: "/iq/genie6", support: "full", label: "Genie" },
  // Already the most mobile-ready surface in the module (columns-1 masonry).
  { pattern: "/iq/genie6/library", support: "full", label: "Genie library" },
  {
    pattern: "/iq/genie6/library/*",
    support: "full",
    label: "Genie library",
    notInNav: true,
  },
  // The 5-step generation wizard, one screen per step on mobile.
  { pattern: "/iq/genie6/studio-alpha", support: "full", label: "Studio" },
  {
    pattern: "/iq/genie6/studio-alpha/*",
    support: "full",
    label: "Studio",
    notInNav: true,
    // The wizard's sticky footer already has a step-aware Back
    // (previous step, not browser history) — see StudioAlpha.tsx's
    // handleBack. MobileTopBar's generic Back would do something
    // different while looking identical. One Back, not two disagreeing.
    ownsBackNavigation: true,
  },
  {
    pattern: "/iq/genie6/*",
    support: "blocked",
    label: "Genie",
    reason:
      "This Genie surface — settings, concepts and the legacy studios — is built for a wide screen.",
    fallback: { label: "Open Genie", to: "/iq/genie6" },
  },
  {
    pattern: "/iq/creative-library",
    support: "blocked",
    label: "Creative Library",
    reason:
      "The library pairs a multi-select filter rail with drag-and-drop mapping.",
    fallback: TO_DASHBOARD,
  },
  {
    pattern: "/iq/video-sage/*",
    support: "blocked",
    label: "Video Sage",
    reason: "Video Sage isn't ready for small screens yet.",
    fallback: TO_DASHBOARD,
  },
  {
    pattern: "/iq/copilot",
    support: "blocked",
    label: "Copilot",
    reason: "Copilot isn't ready for small screens yet.",
    fallback: TO_DASHBOARD,
  },
  {
    pattern: "/automation",
    support: "blocked",
    label: "Automation",
    reason: "Automation isn't built yet.",
    fallback: TO_DASHBOARD,
  },

  /* ── Utility / admin surfaces ────────────────────────────────────────────
     These are real, reachable routes (UserMenu / settings links / redirects)
     but are NOT represented as ModuleDef/SubItem entries in modules.ts, so
     they're marked notInNav — same meaning the flag already has for
     /insights/boards/:id etc.: "deliberately absent from the nav structure
     the audit walks", not "broken". */
  {
    pattern: "/settings/*",
    support: "blocked",
    label: "Settings",
    reason: "Settings are dense forms that are easier to get right on a laptop.",
    fallback: TO_DASHBOARD,
    notInNav: true,
  },
  {
    pattern: "/integrations",
    support: "blocked",
    label: "Integrations",
    reason: "Connecting an account involves an OAuth flow best done on desktop.",
    fallback: TO_DASHBOARD,
    notInNav: true,
  },
  {
    pattern: "/ums",
    support: "blocked",
    label: "Team",
    reason: "Team management is a wide permissions table.",
    fallback: TO_DASHBOARD,
    notInNav: true,
  },
  // EXACT before SPLAT — was declared after it, making this rule dead
  // (every /rrm hit matched /rrm/* first, per the first-match-wins rule).
  {
    pattern: "/rrm",
    support: "blocked",
    label: "RRM",
    reason: "RRM is built for a wide screen.",
    fallback: TO_DASHBOARD,
    notInNav: true,
  },
  {
    pattern: "/rrm/*",
    support: "blocked",
    label: "RRM",
    reason: "RRM is built for a wide screen.",
    fallback: TO_DASHBOARD,
    notInNav: true,
  },
  {
    pattern: "/activity-logs",
    support: "blocked",
    label: "Activity log",
    reason: "The activity log is a wide, densely-columned table.",
    fallback: TO_DASHBOARD,
    notInNav: true,
  },
  {
    pattern: "/dashboard-variants/*",
    support: "blocked",
    label: "Dashboard variants",
    reason: "These are full-bleed desktop design explorations.",
    fallback: TO_DASHBOARD,
    notInNav: true,
  },

  /* ── Nav-reachable but previously uncovered — were silently hitting
     CATCH_ALL with generic copy instead of a named reason. Confirmed
     user-visible: /tools/bg-remover rendered the bare "This screen isn't
     ready" fallback instead of naming itself. ─────────────────────────── */
  {
    pattern: "/auth",
    support: "full",
    label: "Auth screens",
    notInNav: true,
  },
  {
    pattern: "/iq/genie5",
    support: "blocked",
    label: "Genie 5",
    reason: "Genie 5 is a legacy version kept only so old links still open.",
    fallback: { label: "Open Genie", to: "/iq/genie6" },
  },
  {
    pattern: "/tools/bg-remover",
    support: "blocked",
    label: "BG Remover",
    reason: "BG Remover isn't built yet.",
    fallback: TO_DASHBOARD,
  },
  {
    pattern: "/tools/obj-remover",
    support: "blocked",
    label: "Object Remover",
    reason: "Object Remover isn't built yet.",
    fallback: TO_DASHBOARD,
  },
];

/**
 * Last resort. Anything unlisted is blocked — see rule 2 in the header.
 * Reached only when no rule above matched; reports `matched: "fallback"` so the
 * dev audit can tell "deliberately blocked" from "nobody has classified this".
 */
const CATCH_ALL: MobilePolicyRule = {
  pattern: "/*",
  support: "blocked",
  label: "This screen",
  reason: "This screen isn't ready for small screens yet.",
  fallback: TO_DASHBOARD,
};

function ruleMatches(rule: MobilePolicyRule, pathname: string): boolean {
  // react-router treats a trailing `/*` as a splat; for every other pattern we
  // want an exact match, hence `end: true`.
  const isSplat = rule.pattern.endsWith("/*");
  return (
    matchPath({ path: rule.pattern, end: !isSplat }, pathname) !== null
  );
}

export function resolveMobilePolicy(pathname: string): ResolvedMobilePolicy {
  for (const rule of MOBILE_ROUTE_POLICY) {
    if (ruleMatches(rule, pathname)) {
      return { ...rule, matched: rule.pattern };
    }
  }
  return { ...CATCH_ALL, matched: "fallback" };
}

export function isMobileAllowed(pathname: string): boolean {
  return resolveMobilePolicy(pathname).support !== "blocked";
}

export function useMobilePolicy(): ResolvedMobilePolicy {
  const { pathname } = useLocation();
  return useMemo(() => resolveMobilePolicy(pathname), [pathname]);
}

/* ────────────────────────── dev-only audit ──────────────────────────────
   Three classes of mistake this catches, none of which surface at runtime:
   a typo'd pattern that silently never matches, a newly-added module that
   silently inherits CATCH_ALL's generic copy, and an exact rule accidentally
   declared after its own splat sibling (making it unreachable). Warn only —
   never throw, never break the app over a lint concern. */
if (import.meta.env.DEV) {
  const navPaths = new Set<string>();
  const collect = (m: ModuleDef) => {
    if (m.path) navPaths.add(m.path);
    for (const p of allSubPaths(m)) navPaths.add(p);
  };
  for (const m of MODULES) collect(m);
  for (const m of SYSTEM_MODULES) collect(m);

  // 1. Rules that claim to be nav-reachable but match no nav path.
  for (const rule of MOBILE_ROUTE_POLICY) {
    if (rule.notInNav) continue;
    const covers = [...navPaths].some((p) => ruleMatches(rule, p));
    if (!covers) {
      console.warn(
        `[mobileRoutePolicy] rule "${rule.pattern}" matches no path in modules.ts. ` +
          `Typo, or the nav IA moved? Mark it notInNav if that's intentional.`,
      );
    }
  }

  // 2. Nav paths nobody classified — they work, but with generic gate copy.
  for (const p of navPaths) {
    if (resolveMobilePolicy(p).matched === "fallback") {
      console.warn(
        `[mobileRoutePolicy] "${p}" is nav-reachable but hits CATCH_ALL. ` +
          `It is blocked on mobile with generic copy — add an explicit rule.`,
      );
    }
  }

  // 3. An exact rule shadowed by an earlier splat sibling is dead code.
  MOBILE_ROUTE_POLICY.forEach((rule, i) => {
    if (rule.pattern.endsWith("/*")) return;
    const shadowedBy = MOBILE_ROUTE_POLICY.slice(0, i).find(
      (earlier) => earlier.pattern.endsWith("/*") && ruleMatches(earlier, rule.pattern),
    );
    if (shadowedBy) {
      console.warn(
        `[mobileRoutePolicy] "${rule.pattern}" is unreachable — "${shadowedBy.pattern}" ` +
          `is declared earlier and already matches it. Move the exact rule above the splat.`,
      );
    }
  });
}

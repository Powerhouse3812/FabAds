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
 *    an exact rule reliably beats its own `/*` sibling — e.g. `/rrm` must be
 *    declared BEFORE `/rrm/*`, and `/reports/creative-v3` (its own gate copy)
 *    must be declared BEFORE `/reports/creative-v3/*` (different gate copy) so
 *    each keeps its own label and reason instead of inheriting the splat's.
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
 *
 * SCOPE CUT (2026-08-21, Figma sync + feedback pass — see MOBILE_SPEC.md 2.2):
 * mobile scope narrowed from "Dashboard + Insights + Reports(readonly) +
 * Launch(readonly) + Genie(3 surfaces)" down to just Industry Insights +
 * Genie's library (read-only browsing) + Onboarding. Dashboard, all of
 * Reports, all of Launch, Genie Home and the generation wizard all flipped
 * from full/readonly to blocked. `MOBILE_HOME_PATH` (mobileNavConstants.ts)
 * moved from `/dashboard` to `/insights-v2/feed` to match — the Insights feed
 * is now the mobile landing.
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

/**
 * Fallback targets for blocked routes. The rule that matters: whatever a
 * blocked route falls back to must never itself be blocked — an escape hatch
 * that lands on another gate screen strands the user with no way forward.
 *
 * `TO_DASHBOARD`, `TO_CR_OVERVIEW` and `TO_LAUNCH_HUB` used to live here, but
 * the 2.2 scope cut blocked Dashboard, the Creative Report Overview and the
 * Launch Hub themselves — every rule using those constants would have pointed
 * a blocked route at another blocked route. Removed rather than left around
 * unused and ready to be misapplied by the next edit.
 */
const TO_FEED = { label: "Browse My feeds", to: "/insights-v2/feed" } as const;
const TO_GENIE_LIBRARY = {
  label: "Open Genie library",
  to: "/iq/genie6/library",
} as const;

export const MOBILE_ROUTE_POLICY: MobilePolicyRule[] = [
  /* ── `/` is not a screen, it is a redirect ──────────────────────────────
     `App.tsx`'s index route renders `<LandingRedirect/>`, which sends desktop
     to /dashboard and mobile to MOBILE_HOME_PATH. That component only gets to
     run if the gate lets `/` through: MobileRouteGate deliberately refuses to
     MOUNT a blocked route (a `display:none` page still runs its data hooks),
     and `/` was hitting CATCH_ALL — so a phone loading the bare origin saw the
     anonymous "This screen is best on desktop" gate, at URL `/`, forever. It
     could not even reach the *named* Dashboard gate, because the redirect never
     mounted to move it there.
     Marked `full` because there is no page here to be bad on a phone, and
     `notInNav` because a redirect target is not a nav destination. MUST stay
     first: it is an exact rule and nothing above it may shadow `/`. */
  { pattern: "/", support: "full", label: "Home", notInNav: true },

  /* ── Dashboard — CHANGED, used to be the landing ────────────────────────
     Dashboard used to be the mobile landing (readonly: the KPI customize
     popover is drag-and-drop and stayed desktop-only). The 2.2 scope cut
     narrowed mobile down to Industry Insights + Genie's library + Onboarding
     — the Insights feed is the landing now (`MOBILE_HOME_PATH`), so Dashboard
     is blocked outright rather than kept around half-functional. */
  {
    pattern: "/dashboard",
    support: "blocked",
    label: "Dashboard",
    reason:
      "Mobile is scoped to Industry Insights and Genie's library — the Dashboard stays a desktop surface for now.",
    fallback: TO_FEED,
  },

  /* ── Industry Insights — the phase-1 flagship, now also the landing ─────
     Genuinely better on a phone: it is a scroll-and-consume surface, and its
     grids already start at 1 column. As of the 2.2 scope cut this is the
     mobile landing (`MOBILE_HOME_PATH` in mobileNavConstants.ts) now that
     Dashboard is blocked. */
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

  /* ── Reports — CHANGED, narrowed out of mobile scope entirely ───────────
     Reports used to get a card list + a detail sheet on phone, never the
     12-column table. The 2.2 scope cut retired that mobile-specific layout
     along with the surface itself — mobile is now Industry Insights + Genie's
     library + Onboarding only. NOTE: /reports/fb|nb|tt are named like
     platforms but render entity LEVELS (accounts / campaigns / ad sets) —
     labels below describe what the route actually renders, not what the path
     implies. */
  {
    pattern: "/reports/fb",
    support: "blocked",
    label: "Ad accounts",
    reason:
      "Mobile is scoped to Industry Insights and Genie's library — Reports stays a desktop surface for now.",
    fallback: TO_FEED,
  },
  {
    pattern: "/reports/nb",
    support: "blocked",
    label: "Campaigns",
    reason:
      "Mobile is scoped to Industry Insights and Genie's library — Reports stays a desktop surface for now.",
    fallback: TO_FEED,
  },
  {
    pattern: "/reports/tt",
    support: "blocked",
    label: "Ad sets",
    reason:
      "Mobile is scoped to Industry Insights and Genie's library — Reports stays a desktop surface for now.",
    fallback: TO_FEED,
  },
  // Route added alongside the earlier mobile work — also un-orphans AdsReport,
  // which was imported but unreachable, and fixes AdSetsReport's drill-down.
  // Not a modules.ts sub-item (the nav still only lists Facebook/NB/TikTok),
  // hence notInNav — silences the dev audit truthfully rather than fixing a
  // phantom bug.
  {
    pattern: "/reports/ads",
    support: "blocked",
    label: "Ads",
    reason:
      "Mobile is scoped to Industry Insights and Genie's library — Reports stays a desktop surface for now.",
    fallback: TO_FEED,
    notInNav: true,
  },

  // EXACT before SPLAT — both blocked, but each keeps its own gate copy.
  {
    pattern: "/reports/creative-v3",
    support: "blocked",
    label: "Creative Report Overview",
    reason:
      "Mobile is scoped to Industry Insights and Genie's library — Reports stays a desktop surface for now.",
    fallback: TO_FEED,
  },
  {
    pattern: "/reports/creative-v3/*",
    support: "blocked",
    label: "Creative Report 3.0",
    reason:
      "Creatives, Components and Compare are built around a full-width grid with a 13-metric column picker.",
    fallback: TO_FEED,
  },
  {
    pattern: "/reports/creative-v2",
    support: "blocked",
    label: "Creative Report 2.0",
    reason: "2.0 is a frozen snapshot kept for reference.",
    fallback: TO_FEED,
  },
  {
    pattern: "/reports/creative-v2/*",
    support: "blocked",
    label: "Creative Report 2.0",
    reason: "2.0 is a frozen snapshot kept for reference.",
    fallback: TO_FEED,
  },
  {
    pattern: "/reports/creative",
    support: "blocked",
    label: "Creative Reporting",
    reason: "This report is a wide metrics table built for a large screen.",
    fallback: TO_FEED,
  },

  /* ── Launch v2 — CHANGED, narrowed out of mobile scope entirely ─────────
     Hub, history and the `:id` detail used to be readonly (Hub has zero
     direct-mutation controls — every working control navigates or sets local
     state — so readonly meant gating the exits into the creation flow rather
     than the page itself). The 2.2 scope cut tightened all of Launch to
     blocked regardless. */
  // The Launch module has subItems but no root `.path` of its own in
  // modules.ts (New launch / History are the listed entries), so the Hub
  // route itself is genuinely absent from the nav structure — notInNav.
  {
    pattern: "/launchv2",
    support: "blocked",
    label: "Launch Hub",
    reason:
      "Mobile is scoped to Industry Insights and Genie's library — Launch stays a desktop surface for now.",
    fallback: TO_FEED,
    notInNav: true,
  },
  {
    pattern: "/launchv2/history",
    support: "blocked",
    label: "Launch history",
    reason:
      "Mobile is scoped to Industry Insights and Genie's library — Launch stays a desktop surface for now.",
    fallback: TO_FEED,
  },
  {
    pattern: "/launchv2/new",
    support: "blocked",
    label: "New launch",
    reason:
      "The 4-step flow needs a wide canvas — the distribution step is a drag-resizable two-pane workspace.",
    fallback: TO_FEED,
  },
  {
    pattern: "/launchv2/:id",
    support: "blocked",
    label: "Launch",
    reason:
      "Mobile is scoped to Industry Insights and Genie's library — Launch stays a desktop surface for now.",
    fallback: TO_FEED,
    notInNav: true,
  },
  // Everything else under Launch (settings, strategies, templates, auto…).
  {
    pattern: "/launchv2/*",
    support: "blocked",
    label: "Launch 2.0",
    reason: "This Launch surface is built for a wide screen.",
    fallback: TO_FEED,
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
    fallback: TO_FEED,
  },
  /* ── Genie — CHANGED, read-only browsing only ───────────────────────────
     Used to hold three open surfaces (Overview, library, the generation
     wizard). The 2.2 scope cut narrowed this to the library only: Genie Home
     IS the entry point into starting a new generation (see Home.tsx:87 and
     its /iq/genie6/generate/* navigations), and Studio Alpha IS that
     generation wizard — neither belongs on a surface whose mobile contract is
     "read-only browsing". Only the library (+ previous-generation asset
     detail) stays open. EXACT rules precede the splat, per the ordering rule
     in the header. */
  // CHANGED — blocked. Genie Home is the new-generation launcher, so it can't
  // stay open even though the Studio home variant was made responsive for it.
  {
    pattern: "/iq/genie6",
    support: "blocked",
    label: "Genie",
    reason:
      "Genie Home is the entry point for starting a new generation, and mobile Genie is read-only browsing.",
    fallback: TO_GENIE_LIBRARY,
  },
  // Already the most mobile-ready surface in the module (columns-1 masonry).
  { pattern: "/iq/genie6/library", support: "full", label: "Genie library" },
  {
    pattern: "/iq/genie6/library/*",
    support: "full",
    label: "Genie library",
    notInNav: true,
  },
  // CHANGED — blocked. This is the 5-step wizard for starting a NEW
  // generation; mobile Genie is read-only browsing, so the wizard doesn't
  // mount here no matter how well its one-screen-per-step layout works.
  {
    pattern: "/iq/genie6/studio-alpha",
    support: "blocked",
    label: "Studio",
    reason:
      "This is the 5-step wizard for starting a new generation, and mobile Genie is read-only browsing.",
    fallback: TO_GENIE_LIBRARY,
  },
  {
    pattern: "/iq/genie6/studio-alpha/*",
    support: "blocked",
    label: "Studio",
    reason:
      "This is the 5-step wizard for starting a new generation, and mobile Genie is read-only browsing.",
    fallback: TO_GENIE_LIBRARY,
    notInNav: true,
    // No ownsBackNavigation here (dropped — it no longer applies). That flag
    // existed to stop MobileTopBar's generic Back fighting the wizard's own
    // step-aware Back. Now that this rule is `blocked`, the wizard component
    // never mounts (a blocked route renders BestOnDesktop instead, per
    // MobileRouteGate), so its step-aware Back can't render either — there is
    // nothing left for the generic Back to conflict with. Worse: MobileTopBar
    // computes `showBack = (notInNav || blocked) && !ownsBackNavigation`, so
    // leaving the flag set here would have suppressed the ONLY Back this gate
    // screen has, stranding the user on it with no way out but the fallback
    // link.
  },
  {
    pattern: "/iq/genie6/*",
    support: "blocked",
    label: "Genie",
    reason:
      "This Genie surface — settings, concepts and the legacy studios — is built for a wide screen.",
    fallback: TO_GENIE_LIBRARY,
  },
  {
    pattern: "/iq/creative-library",
    support: "blocked",
    label: "Creative Library",
    reason:
      "The library pairs a multi-select filter rail with drag-and-drop mapping.",
    fallback: TO_FEED,
  },
  {
    pattern: "/iq/video-sage/*",
    support: "blocked",
    label: "Video Sage",
    reason: "Video Sage isn't ready for small screens yet.",
    fallback: TO_FEED,
  },
  {
    pattern: "/iq/copilot",
    support: "blocked",
    label: "Copilot",
    reason: "Copilot isn't ready for small screens yet.",
    fallback: TO_FEED,
  },
  {
    pattern: "/automation",
    support: "blocked",
    label: "Automation",
    reason: "Automation isn't built yet.",
    fallback: TO_FEED,
  },
  // EXACT before SPLAT. Automation Center added five nav sub-items
  // (/automation/workflows|creative-report|launch|rrm|genie) after this rule
  // was written, and with only the exact `/automation` entry above they all
  // fell through to CATCH_ALL — blocked, but with anonymous "This screen"
  // copy, and the dev audit warned about all five on every boot. Same reason
  // and fallback as the parent so the gate names the module it belongs to.
  {
    pattern: "/automation/*",
    support: "blocked",
    label: "Automation",
    reason: "Automation isn't built yet.",
    fallback: TO_FEED,
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
    fallback: TO_FEED,
    notInNav: true,
  },
  {
    pattern: "/integrations",
    support: "blocked",
    label: "Integrations",
    reason: "Connecting an account involves an OAuth flow best done on desktop.",
    fallback: TO_FEED,
    notInNav: true,
  },
  {
    pattern: "/ums",
    support: "blocked",
    label: "Team",
    reason: "Team management is a wide permissions table.",
    fallback: TO_FEED,
    notInNav: true,
  },
  // EXACT before SPLAT — was declared after it, making this rule dead
  // (every /rrm hit matched /rrm/* first, per the first-match-wins rule).
  {
    pattern: "/rrm",
    support: "blocked",
    label: "RRM",
    reason: "RRM is built for a wide screen.",
    fallback: TO_FEED,
    notInNav: true,
  },
  {
    pattern: "/rrm/*",
    support: "blocked",
    label: "RRM",
    reason: "RRM is built for a wide screen.",
    fallback: TO_FEED,
    notInNav: true,
  },
  {
    pattern: "/activity-logs",
    support: "blocked",
    label: "Activity log",
    reason: "The activity log is a wide, densely-columned table.",
    fallback: TO_FEED,
    notInNav: true,
  },
  {
    pattern: "/dashboard-variants/*",
    support: "blocked",
    label: "Dashboard variants",
    reason: "These are full-bleed desktop design explorations.",
    fallback: TO_FEED,
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
    fallback: TO_GENIE_LIBRARY,
  },
  {
    pattern: "/tools/bg-remover",
    support: "blocked",
    label: "BG Remover",
    reason: "BG Remover isn't built yet.",
    fallback: TO_FEED,
  },
  {
    pattern: "/tools/obj-remover",
    support: "blocked",
    label: "Object Remover",
    reason: "Object Remover isn't built yet.",
    fallback: TO_FEED,
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
  fallback: TO_FEED,
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

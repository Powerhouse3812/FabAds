/**
 * routeTitle — route label logic extracted from AppLayout.tsx.
 *
 * Single source of truth for turning a pathname into breadcrumb-worthy
 * labeled segments. `HeaderBreadcrumbs` in AppLayout.tsx originally owned
 * this logic inline; a new mobile top bar also needs a page title derived
 * from the same route, and the two must never drift into different labels
 * for the same path. Both consumers should import from here.
 *
 * TODO: `HeaderBreadcrumbs` in AppLayout.tsx should be refactored to consume
 * `labelableSegments` from this module instead of recomputing the loop
 * inline. (Left as a follow-up — another agent wires this up.)
 *
 * Pure module: no React import, no JSX.
 */

const LABEL_MAP: Record<string, string> = {
  iq: "IQ",
  "creative-library": "Creative Library",
  // Added on main by the Automations work; carried over during the merge so
  // breadcrumbs on /automation and /automation/workflows keep their labels
  // (the labelling loop STOPS at the first unknown segment, so a missing
  // entry silently hides the whole breadcrumb rather than one crumb).
  automation: "Automations",
  workflows: "Workflows",
  copilot: "Copilot",
  genie: "Genie",
  genie6: "Genie 6.0",
  workspace: "Assets",
  generate: "Studio",
  "generate-legacy": "Old Studio",
  "generate-v3": "Studio v3",
  "brand-ad": "Brand Ad",
  "product-ad": "Product Ad",
  "affiliate-ad": "Affiliate Ad",
  "performance-ad": "Performance Ad",
  variation: "Variations",
  brand: "Brand",
  ad: "Ad",
  social: "Social",
  "product-shoot": "Product Shoot",
  "brand-focused": "Brand-focused",
  "product-focused": "Product-focused",
  "ugc-video": "UGC Video",
  variations: "Variations",
  "image-to-ad": "Image-to-Ad",
  quick: "Quick mode",
  library: "Library",
  brands: "Brands",
  categories: "Categories",
  avatars: "Avatars",
  voices: "Voices",
  outputs: "Outputs",
  hooks: "Hooks",
  angles: "Angles",
  concepts: "Concepts",
  audiences: "Audiences",
  "video-sage": "Video Sage",
  dashboard: "Dashboard",
  integrations: "Integrations",
  launch: "Launch",
  "launch-history": "Launch History",
  offers: "Campaign URLs",
  "campaign-urls": "Campaign URLs",
  rrm: "RRM",
  "rrm-settings": "RRM Settings",
  reports: "Reports",
  performance: "Performance",
  creative: "Creative",
  "creative-v2": "Creative Report 2.0",
  "creative-v3": "Creative Report 3.0",
  creatives: "Creatives",
  compare: "Compare",
  automations: "Automations",
  // Creative Report 2.0-only segments (the frozen fork at
  // src/creative-report-v2). 3.0 folded these three screens away.
  "owner-report": "Owner report",
  "brief-builder": "Brief builder",
  views: "Saved views",
  components: "Components",
  "ad-accounts": "Ad Accounts",
  "ad-sets": "Ad Sets",
  ads: "Ads",
  campaigns: "Campaigns",
  image: "Image Report",
  video: "Video Report",
  "ad-groups": "Ad Group Report",
  "targeting-templates": "Targeting Templates",
  templates: "Targeting Templates",
  ums: "Team",
  "activity-logs": "Activity Logs",
  insights: "Industry Insights",
  discover: "Discover",
  boards: "Boards",
  competitors: "Competitors",
  settings: "Settings",
  clients: "Clients",
  "quick-start": "Quick Start",
  "ai-setup": "AI Setup",
};

/** Known sub-nav leaf paths — breadcrumbs hidden when on these exactly */
const KNOWN_SUB_NAV_PATHS = new Set([
  "/dashboard",
  "/launch",
  "/launch/templates",
  "/launch/campaign-urls",
  "/insights",
  "/insights/discover",
  "/insights/boards",
  "/insights/competitors",
  "/iq/creative-library",
  "/iq/genie5",
  "/iq/genie5/studio",
  "/iq/genie5/templates",
  "/iq/genie5/brands",
  "/iq/genie5/categories",
  "/iq/genie5/quick-start",
  "/iq/genie5/ai-setup",
  "/iq/genie",
  "/iq/video-sage",
  "/iq/copilot",
  "/iq/genie6",
  "/iq/genie6/workspace",
  "/iq/genie6/generate",
  "/iq/genie6/generate-legacy",
  "/iq/genie6/generate-v3",
  "/iq/genie6/library",
  "/iq/genie6/settings",
  "/rrm",
  "/rrm/settings",
  "/integrations",
  "/ums",
  "/activity-logs",
  "/reports/performance/ad-accounts",
  "/reports/performance/campaigns",
  "/reports/performance/ad-sets",
  "/reports/performance/ads",
  "/reports/creative/image",
  "/reports/creative/video",
  "/reports/creative/ad-groups",
  "/reports/creative-v2",
  "/reports/creative-v2/creatives",
  "/reports/creative-v2/components",
  "/reports/creative-v2/compare",
  "/reports/creative-v2/automations",
  "/reports/creative-v2/owner-report",
  "/reports/creative-v2/brief-builder",
  "/reports/creative-v2/views",
  "/reports/creative-v3",
  "/reports/creative-v3/creatives",
  "/reports/creative-v3/components",
  "/reports/creative-v3/compare",
  "/reports/creative-v3/automations",
]);

/**
 * Phase D P1-10: breadcrumbs used to capitalize ANY raw URL segment that
 * wasn't in LABEL_MAP — so UUIDs, numeric IDs, slugs etc. rendered as
 * gibberish ("Iq", "Abc-123-def" → "Abc 123 Def", or worse for raw UUIDs).
 *
 * Now: only segments we explicitly know how to label render. Any segment
 * that looks like an ID (UUID, numeric, or just unrecognized) is skipped
 * for breadcrumb purposes — the breadcrumb stops at the last KNOWN segment.
 * If nothing is known, breadcrumbs hide entirely.
 */
const ID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC = /^\d+$/;
function isIdLike(seg: string): boolean {
  return ID_LIKE.test(seg) || NUMERIC.test(seg);
}

/** The breadcrumb-worthy segments of a pathname, in order. */
export function labelableSegments(pathname: string): { label: string; path: string }[] {
  if (KNOWN_SUB_NAV_PATHS.has(pathname)) return [];

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  // Build a list of segments we can confidently label. Stop at the first
  // ID-like segment (or hide breadcrumbs entirely if no segment is in
  // LABEL_MAP). Avoids "Iq" → "Iq" and UUID gibberish.
  const labelable: { label: string; path: string }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (isIdLike(seg)) break;
    const known = LABEL_MAP[seg];
    if (!known) break;
    labelable.push({ label: known, path: "/" + segments.slice(0, i + 1).join("/") });
  }

  return labelable;
}

/** The last labelable segment's label — the mobile page title. Null if none. */
export function derivePageTitle(pathname: string): string | null {
  const labelable = labelableSegments(pathname);
  if (labelable.length === 0) return null;
  return labelable[labelable.length - 1].label;
}

export { LABEL_MAP, KNOWN_SUB_NAV_PATHS, ID_LIKE, NUMERIC, isIdLike };

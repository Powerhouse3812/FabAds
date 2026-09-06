/**
 * Origin labels — turns a `RunOrigin` (src/genie6/lib/genieRunTypes.ts) into
 * the human label + filter key the Library needs.
 *
 * WHY THESE LABELS ARE HARDCODED HERE INSTEAD OF IMPORTED FROM THE FLOW/APP
 * REGISTRIES
 * `src/genie6/flows/data/flowRegistry.ts` (module labels) and
 * `src/genie6/apps/data/appRegistry.ts` (app names) are owned by parallel
 * agents building alongside this one. The Library's "which module did this
 * come from" chip is a load-bearing, always-on piece of every batch header
 * (§10), so it cannot silently go blank if a sibling file lands late or its
 * export shape drifts. The module/app NAMES themselves are locked vocabulary
 * from the spec (§7 table, §8 table) — copying them here is a one-time,
 * low-risk duplication, not a fork of behaviour. If `flowRegistry`/`appRegistry`
 * later expose the same labels, this file can be swapped to re-export them.
 */
import type { FlowModuleKey } from "../flows/flowTypes";
import type { AppKey } from "../apps/appTypes";
import type { RunOrigin } from "../lib/genieRunTypes";

export const FLOW_MODULE_LABELS: Record<FlowModuleKey, string> = {
  "industry-insights": "Industry Insights",
  "video-sage": "Video Sage",
  reports: "Reports",
  trends: "Trends",
  "campaign-urls": "Campaign URLs",
  "creative-library": "Creative Library",
  dashboard: "Dashboard",
  folders: "Folders",
  "automated-workflow": "Automated workflow",
  rrm: "RRM",
  copilot: "Co-pilot",
};

export const APP_KEY_LABELS: Record<AppKey, string> = {
  "translate-videos": "Translate Videos",
  "avatar-shots": "Avatar Shots",
  "ppt-pdf-to-video": "PPT/PDF to Video",
  "upscale-video": "Upscale Video",
  "product-placement": "Product Placement",
  "face-swap": "Face Swap",
  "speech-cleanup": "Speech Cleanup",
  "ai-studio": "AI Studio",
  "ai-video-generator": "AI Video Generator",
  "ai-clipping": "AI Clipping",
  "batch-mode": "Batch Mode",
  "generate-images": "Generate Images",
  "interactive-video": "Interactive Video",
  "video-podcast": "Video Podcast",
  "live-avatar": "LiveAvatar",
};

/** A stable, unique string key for a `RunOrigin` — used as the `?module=` filter value. */
export function originKey(origin: RunOrigin): string {
  switch (origin.kind) {
    case "studio":
      return "studio";
    case "flow":
      return `flow:${origin.module}`;
    case "app":
      return `app:${origin.app}`;
    case "upload":
      return "upload";
    case "imported":
      return `imported:${origin.module}`;
  }
}

/** Human label for a `RunOrigin` — what the batch header's module chip shows. */
export function originLabel(origin: RunOrigin): string {
  switch (origin.kind) {
    case "studio":
      return "Studio";
    case "flow":
      return FLOW_MODULE_LABELS[origin.module] ?? origin.module;
    case "app":
      return APP_KEY_LABELS[origin.app] ?? origin.app;
    case "upload":
      return "Uploaded";
    case "imported":
      return `Imported · ${FLOW_MODULE_LABELS[origin.module] ?? origin.module}`;
  }
}

/** Where the module chip should link back to, when the source module is live. */
export function originPath(origin: RunOrigin): string | undefined {
  switch (origin.kind) {
    case "studio":
      return "/iq/genie6/generate";
    case "flow":
    case "imported":
      return `/iq/genie6/flows/${origin.module}`;
    case "app":
      return `/iq/genie6/apps/${origin.app}`;
    case "upload":
      return undefined;
  }
}

/**
 * Annotation slice — Automations (rules, boards, digest), Owner Report
 * (brand/account/velocity rollups), and creative actions (duplicate, edit
 * targeting, relaunch, pause, add-to-board). Element ids namespaced
 * `automations.<element>`, `owner.<element>`, `action.<element>`.
 * Authored in the P6 annotation-overlay fan-out.
 */
import type { AnnotationSlice } from "@/creative-report/annotations/types";

export const automationsOwnerAnnotations: AnnotationSlice = {
  "automations.rule.match": {
    reason:
      "Evaluates every rule condition against already-loaded rollups — reads the same folded metrics, bucket, fatigue verdict, and tags shown elsewhere in the module. Nothing is fetched or recomputed specially for rules.",
    impact:
      "The match count you see, in the builder preview or the rule list, is the real, current set of creatives this rule would act on right now.",
    whenToAct:
      "If a match count looks wrong, check the conditions first — this is a live AND filter recomputed on every change, never a saved or stale count.",
    importance: "medium",
    personas: ["Agency lead", "Performance marketer"],
    provenance: "ours-only",
    howTo:
      "Filter the in-memory rollup array with every condition ANDed together — pure client-side, no extra fetch. At scale, the same loop runs server-side over the cached rollup table on read.",
    backend: "read-time",
  },
  "automations.rule.runNow": {
    reason:
      "Applies the rule's actions — file into a board, pause, or queue for relaunch — to every creative that currently matches. It's the only way a rule ever executes here.",
    impact:
      "Whatever it touches happens immediately and optimistically. There's no scheduled recurrence yet, so a rule only acts when someone clicks this.",
    whenToAct:
      "Click after adjusting conditions, or whenever you want to act on the current matches — nothing runs on its own in the background.",
    importance: "high",
    personas: ["Agency lead", "Performance marketer"],
    howTo:
      "Simulated — updates local prototype state (board membership, pause flag, launch queue) only. There's no real cron, and nothing is sent to Meta or any ad platform.",
  },
  "automations.board.smart": {
    reason:
      "A smart board's contents are the union of its rule's live match (re-evaluated fresh) and any creatives manually pinned to the board — recomputed on every render, never stored as a list.",
    impact:
      "Turning a rule off or deleting it immediately changes what the board shows, since membership isn't a saved snapshot.",
    whenToAct:
      "If a smart board looks emptier than expected, check whether its rule is disabled or was deleted before assuming data is missing.",
    importance: "medium",
    personas: ["Agency lead", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Re-run the rule's condition filter against current rollups and merge with the manually-pinned id set. A real backend would keep this same live-evaluation approach (or an incrementally-updated cache) rather than a stored snapshot.",
    backend: "read-time",
  },
  "automations.digest.preview": {
    reason:
      "The digest is assembled from the same folded KPIs, bucket counts, top movers, and fatiguing list every other screen in this module already shows — nothing new is computed for it.",
    impact:
      "What's rendered here is exactly what the next scheduled digest would contain, recalculated live from the current filtered dataset.",
    whenToAct:
      "Use this to sanity-check a digest's content before relying on the cadence/time settings — there's no send history to check afterward.",
    importance: "medium",
    personas: ["Agency lead", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Compose the message from the same cached rollup aggregates a nightly job would already maintain — no per-send computation. This prototype has no real cron or email/Slack integration: nothing is ever actually sent.",
    backend: "batch-rollup",
  },
  "owner.velocity": {
    reason:
      "Counts creatives by the week their creation date falls in, across the current filter — a proxy for how much new testing is happening, not a performance metric.",
    impact:
      "A flattening bar chart is an early signal the team has stopped feeding fresh creative into the pipeline, independent of how existing ads are performing.",
    whenToAct:
      "If weekly counts trend toward zero for two or more weeks, raise it as a production/output problem, not a targeting one.",
    importance: "low",
    personas: ["Agency lead", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "A nightly job buckets creative creation dates into ISO weeks and caches the counts — the same rollup pass that produces the brand/account tables.",
    backend: "batch-rollup",
  },
  "action.duplicate": {
    reason:
      "Marks this creative as duplicated in the prototype's optimistic action state — the entry point for a copy-and-edit flow on ad creative.",
    impact:
      "Gives you a \"ready to edit\" starting point without touching the original creative's data or performance history.",
    whenToAct:
      "Use before testing a variant, so the original's stats stay clean for comparison.",
    importance: "medium",
    personas: ["Solo creator", "Performance marketer"],
    howTo:
      "Simulated (optimistic flag) — flips a local flag and shows a toast; no second row is created in the dataset and nothing is sent to a real ad platform.",
  },
  "action.editTargeting": {
    reason:
      "Opens the targeting-edit modal, then on confirm queues the change as an optimistic \"Queued\" state — the same friction pattern used by Relaunch.",
    impact:
      "Lets you change targeting intent for this creative without leaving the drawer.",
    whenToAct:
      "Use when a creative's current audience looks off but the creative itself is still working.",
    importance: "medium",
    personas: ["Performance marketer", "Agency lead"],
    howTo:
      "Simulated (prototype hand-off) — after the confirm modal, flips a local \"queued\" flag; nothing is actually pushed to a real ad platform.",
  },
  "action.relaunch": {
    reason:
      "Confirms via the Launch friction modal, then marks the creative as queued in Launch — the same exit used by every other launch/relaunch entry point in this module.",
    impact:
      "Signals intent to re-run this creative; it doesn't create a live campaign from here.",
    whenToAct:
      "Use once you've decided a paused or fatiguing creative is worth another flight.",
    importance: "high",
    personas: ["Performance marketer", "Agency lead"],
    howTo:
      "Simulated (optimistic flag) — sets a local \"queued in Launch\" flag after the confirm modal; no real campaign is created or sent to a real ad platform.",
  },
  "action.save": {
    reason:
      "Adds this creative to the Creative Library — a curation action, not a computed judgment about performance.",
    impact:
      "Makes the creative easy to find again for reuse or reference outside this report.",
    whenToAct:
      "Use for anything you'd want a teammate to find later, winning or not.",
    importance: "low",
    personas: ["Solo creator", "Brand manager"],
    howTo:
      "Simulated (optimistic flag) — flips a local \"saved\" flag and shows a toast; this prototype has no real Creative Library write.",
  },
  "action.markWinner": {
    reason:
      "Manually flags a creative as a Winner — deliberately human curation, never auto-inferred from any bucket or score.",
    impact:
      "Only sets this label; it doesn't change the creative's bucket, metrics, or ranking anywhere else on the report.",
    whenToAct:
      "Use once you've reviewed the numbers yourself and decided this is a keeper worth repeating.",
    importance: "medium",
    personas: ["Agency lead", "Brand manager"],
    howTo:
      "Simulated (optimistic flag) — sets a local \"marked winner\" flag and shows a toast; no write happens outside this prototype's in-memory state.",
  },
  "action.compare": {
    reason:
      "Navigates to the Compare screen with this creative pre-selected, preserving your current filter context.",
    impact:
      "Lets you line this creative up against others without losing the filters you had applied.",
    whenToAct:
      "Use whenever you need side-by-side numbers instead of a single drawer view.",
    importance: "low",
    personas: ["Performance marketer", "Agency lead"],
    howTo:
      "A real client-side navigation, not an optimistic flag — but like every action here, nothing is sent to a real ad platform; Compare only ever reads already-loaded rollups.",
  },
  "action.pause": {
    reason:
      "Confirms via a Pause alert dialog, then marks the creative as paused in the prototype's action state.",
    impact:
      "Meant to stop spend on a fatiguing or underperforming creative. Here it flips the local paused flag that disables this creative's own Run now / relaunch affordances elsewhere.",
    whenToAct:
      "Use once fatigue or a metric threshold has already convinced you — Pause executes the decision, it doesn't diagnose one.",
    importance: "high",
    personas: ["Performance marketer", "Agency lead"],
    howTo:
      "Simulated (prototype hand-off) — after the confirm dialog, flips a local \"paused\" flag; nothing is actually paused on a real ad platform.",
  },
};

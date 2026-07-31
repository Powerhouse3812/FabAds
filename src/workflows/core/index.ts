/**
 * index.ts — Barrel for `src/workflows/core/`, the domain-agnostic workflow
 * seam that will back the top-level "Automation" module
 * (`src/components/sidebar/modules.ts`, the `automation` entry at
 * `/automation`).
 *
 * NO-IMPORTS RULE: nothing under `src/workflows/**` may import
 * `@/creative-report/*`, `@/data/*`, `@/components/*`, or `react`. Pure
 * TypeScript only — domains plug in via `ConditionMatcher<S>`, never the
 * other way around.
 */

export * from "./types";
export * from "./operators";
export * from "./evaluate";
export * from "./schedule";
export * from "./clock";

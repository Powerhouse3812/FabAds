/**
 * assetActions — what the PRIMARY action on an asset is called, per type.
 *
 * Owner spec, 2026-09-14. The Asset Library's kept types each carry one
 * headline action:
 *
 *   Avatar + voice · Concept · Script · Framework · Storyboard → "Generate Ad"
 *   Hook                                                       → "Use hook"
 *
 * and he asked for it as a DISABLED action for now ("just add it as disabled
 * action") — the affordance is visible and named, the trip behind it is not
 * built. That is deliberate: `genieHandoff.ts` today sends 7 of 14 types to a
 * bare Studio URL carrying nothing, and the real hand-off (the Other Flows
 * `?src`/`?ref`/`?act` contract, whose `use-script` / `use-concept` /
 * `use-framework` / `use-hook` actions are already registered in
 * `flows/data/flowRegistry.ts`) is its own piece of work. Shipping a live
 * button onto a dead trip would be worse than showing it as coming.
 *
 * WHY THIS FILE EXISTS AT ALL: the label and the disabled-ness are needed in
 * two places at once — `AssetCard`'s inline pill and `AssetDetailActions`'
 * row. This module has hand-duplicated its type list into 5+ places before
 * (routes, the App redirect table, two breadcrumb label maps, three dead
 * Workspace variants), and every one of those copies has since drifted. One
 * declaration, two consumers.
 *
 * Types NOT listed here keep the existing live "Use in Genie" behaviour —
 * that covers Brands / Products / Categories, which have a real hand-off
 * today, and the `navHidden` types, which are off the sub-nav but still
 * routed and should not silently lose a working button.
 */
import type { CatalogueType } from "./assetTypes";

export interface AssetPrimaryAction {
  label: string;
  /** Owner's call: present and named, not yet wired. Renders inert. */
  disabled: true;
  /** Shown as the reason next to / under the control, so a disabled button
   *  is never just mysteriously grey. */
  hint: string;
}

const GENERATE_AD: AssetPrimaryAction = {
  label: "Generate Ad",
  disabled: true,
  hint: "Coming soon",
};

export const ASSET_PRIMARY_ACTION: Partial<Record<CatalogueType, AssetPrimaryAction>> = {
  avatars: GENERATE_AD,
  concepts: GENERATE_AD,
  scripts: GENERATE_AD,
  frameworks: GENERATE_AD,
  storyboards: GENERATE_AD,
  hooks: { label: "Use hook", disabled: true, hint: "Coming soon" },
};

/** Undefined ⇒ this type keeps the existing live "Use in Genie" control. */
export function primaryActionFor(type: CatalogueType | undefined): AssetPrimaryAction | undefined {
  return type ? ASSET_PRIMARY_ACTION[type] : undefined;
}

/**
 * Script is the one type the owner asked to be editable beyond rename+retag
 * ("Edit" appears on Script and nowhere else in his spec), and he asked for
 * "a simple input field" — the script body, editable in place. Not a
 * section-level editor.
 */
export const EDITABLE_BODY_TYPES: CatalogueType[] = ["scripts"];

export function hasEditableBody(type: CatalogueType | undefined): boolean {
  return !!type && EDITABLE_BODY_TYPES.includes(type);
}

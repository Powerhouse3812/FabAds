/**
 * Model pricing — one small data file consumed by BOTH the Model popover
 * (components/PromptReferenceBar.tsx, which owns the model roster's UI:
 * icon, name, hint) and the credit-breakdown math (state/useWizard.ts's
 * `buildCreditLines`).
 *
 * §21.2 "Credits need a breakdown, not just a number" names model as one of
 * the four priced axes (outputs × concepts × model × quality/duration).
 * Deliberately split out of PromptReferenceBar.tsx rather than exporting the
 * multiplier straight off its `MODELS` array: useWizard.ts needs the numbers,
 * PromptReferenceBar.tsx needs to SHOW the numbers next to the model it's
 * priced from, and importing across the two directly would make each file
 * import the other (a real circular value-import, not just types) — this
 * file is the one-directional root both sides read from instead.
 */
export interface ModelPricing {
  id: string;
  /** Must match a MODELS[].id in PromptReferenceBar.tsx. */
  name: string;
  /** Credits multiplier applied per output. Genie 2.0 Pro = 1.5× is the
   *  worked example in §21.2 ("4 outputs × 2 concepts × Genie 2.0 Pro (1.5×)
   *  = 12 credits") — every other model's number is chosen relative to that
   *  anchor: Flash is the cheap/fast tier (below baseline), Video is the
   *  heaviest tier (dedicated video pipeline), Labs carries an experimental
   *  premium. */
  creditMultiplier: number;
}

export const MODEL_PRICING: ModelPricing[] = [
  { id: "genie-1.0", name: "Genie 1.0", creditMultiplier: 1 },
  { id: "genie-2.0-pro", name: "Genie 2.0 Pro", creditMultiplier: 1.5 },
  { id: "genie-flash", name: "Genie Flash", creditMultiplier: 0.75 },
  { id: "genie-video", name: "Genie Video", creditMultiplier: 2 },
  { id: "genie-labs", name: "Genie Labs", creditMultiplier: 1.25 },
];

/** id → multiplier, for buildCreditLines and the Model popover's cost badge. */
export const MODEL_CREDIT_MULTIPLIER: Record<string, number> = Object.fromEntries(
  MODEL_PRICING.map((m) => [m.id, m.creditMultiplier]),
);

/** id → display name, for the credit-breakdown line's note (e.g. "Genie 2.0 Pro"). */
export const MODEL_LABEL: Record<string, string> = Object.fromEntries(
  MODEL_PRICING.map((m) => [m.id, m.name]),
);

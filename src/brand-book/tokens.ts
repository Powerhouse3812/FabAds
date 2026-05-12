// FabFunnel brand tokens — ported verbatim from the prototype.
// Locked: wordmark Rich #8FB821 · mark detailing PRESERVED at all sizes
export const C = {
  // Brand
  ink: "#171717",
  paper: "#FFFFFF",
  warm: "#F7F7F4",
  cream: "#FAF9F4",
  graphite: "#1A1A1A",
  mute: "#7A7A75",
  muted2: "#9A9A93",
  line: "#E5E5DF",
  // Logo
  lime: "#C3EB42",
  soft: "#A8D632",
  rich: "#8FB821",
  // Functional
  alert: "#C0312F",
  ok: "#1B7A3E",
} as const;

export type BrandColor = keyof typeof C;

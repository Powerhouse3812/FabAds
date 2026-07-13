/**
 * Canonical field set + copy for the auth-concepts exploration track. Every
 * concept restyles the SHELL around this exact form — per Maalik's
 * constraint, the data/fields themselves don't change across the 10
 * directions, only the visual system, layout, and motion around them.
 *
 * This is a visual-exploration track, not a functional rebuild: concepts
 * hold field values in local state (enough to drive their own signature
 * motion, e.g. a live-reacting panel) but do NOT validate or submit
 * anywhere. No backend calls, ever.
 */
/**
 * CONTENT PARITY (Maalik, godmode round): every string below is copied
 * VERBATIM from the real /auth screens (src/components/auth/LoginView.tsx)
 * — concepts restyle the shell, never the words. The 👋 emoji is part of
 * the real product heading, so it ships here too (this exploration track
 * follows the live screen's content, not the DS emoji rule).
 */
export const AUTH_CONCEPT_COPY = {
  headingEmoji: "👋",
  heading: "Welcome to Fab-Funnel",
  subheading: "sign in to your account to continue",
  emailLabel: "Email",
  emailPlaceholder: "tulikagoswami@techagency.com",
  passwordLabel: "Password",
  passwordPlaceholder: "Password",
  rememberLabel: "Keep me logged in",
  forgotLabel: "Forgot password?",
  submitLabel: "Sign in",
  dividerLabel: "Or",
  googleLabel: "Sign in with Google",
  signupPromptLabel: "Don't have an account?",
  signupLinkLabel: "Sign up",
} as const;

/**
 * Real 2-step signup content — mirrors src/components/auth/signup/
 * (Step1PlanSelection + Step2ProfileSetup). Plan PRICING data must be
 * imported straight from "@/components/auth/signup/plans" (PAID_PLANS,
 * TRIAL_PLAN, ANNUAL_SAVINGS_LABEL, priceForBilling, annualSavings) so it
 * can never drift; the copy strings live here.
 */
export const SIGNUP_PLANS_COPY = {
  heading: "You're one step away from smarter marketing",
  subheading: "Unlock automation, Integration, Launch, etc — all in one powerful platform",
  stepOneLabel: "Plan selection",
  stepTwoLabel: "Profile setup",
  monthlyLabel: "Monthly",
  annualLabel: "Annual",
  planDetailsLabel: "View more about plan details",
  ctaTrialLabel: "Start trial & Set up profile",
  ctaPaidLabel: "Next",
  loginPromptLabel: "Already a user?",
  loginLinkLabel: "Login",
} as const;

export const SIGNUP_PROFILE_COPY = {
  heading: "You're one step away from smarter marketing",
  subheading: "Unlock automation, Integration, Launch, etc — all in one powerful platform",
  individualTabLabel: "Individual",
  agencyTabLabel: "Agency",
  fullNameLabel: "Full Name",
  fullNamePlaceholder: "Enter name",
  emailLabel: "Email",
  emailPlaceholder: "Zarkmukerberg@techagency.com",
  agencyNameLabel: "Agency name",
  agencyNamePlaceholder: "Enter name",
  adminEmailLabel: "Admin email",
  adminEmailPlaceholder: "Admin@techagency.com",
  phoneLabel: "Phone Number",
  phoneCode: "+36",
  phonePlaceholder: "(20) 123-4567",
  setPasswordLabel: "Set Password",
  passwordPlaceholder: "Password",
  passwordHint: "Must be 8 characters, 1 numeric and 1 special character",
  confirmPasswordLabel: "Confirm Password",
  backLabel: "Back to plans",
  submitLabel: "Create account",
  submitDisabledLabel: "Please select a plan to continue",
} as const;

export type ConceptView = "login" | "signup";

export interface ConceptMeta {
  slug: string;
  number: number;
  name: string;
  tagline: string;
  description: string;
}

/** Single source of truth for the gallery index — keep in sync with the
 *  routes registered in auth-concepts/routes.tsx. */
export const AUTH_CONCEPTS: ConceptMeta[] = [
  {
    slug: "01-spotlight",
    number: 1,
    name: "Spotlight",
    tagline: "Cinematic glass",
    description:
      "Full-bleed moody photo background, frosted glass card floating in a pool of light, icons inside the fields.",
  },
  {
    slug: "02-blob-divide",
    number: 2,
    name: "Blob divide",
    tagline: "Organic split",
    description:
      "Two panels separated by a morphing organic shape instead of a straight line, with annotated callout pins.",
  },
  {
    slug: "03-reactive-companion",
    number: 3,
    name: "Reactive companion",
    tagline: "Live panel",
    description:
      "The non-form side isn't decoration — it visibly reacts as you type your email or set a password.",
  },
  {
    slug: "04-type-texture",
    number: 4,
    name: "Type texture",
    tagline: "Bold editorial collage",
    description:
      "Oversized ghost typography as wallpaper, card floats overlapping a hard color-block boundary.",
  },
  {
    slug: "05-iridescent-ai",
    number: 5,
    name: "Iridescent AI",
    tagline: "Holographic premium",
    description:
      "Dark theme, a slow-shifting holographic gradient hero, glassy inputs, a floating avatar-stack card.",
  },
  {
    slug: "06-scattered-desk",
    number: 6,
    name: "Scattered desk",
    tagline: "Cardless collage",
    description:
      "No card, no split panel — the form sits centered on the page, surrounded by tilted scattered objects.",
  },
  {
    slug: "07-hand-drawn-journey",
    number: 7,
    name: "Hand-drawn journey",
    tagline: "Sketch illustration",
    description:
      "Cardless, centered form over a full-page hand-drawn scene with casual hand-lettered callouts.",
  },
  {
    slug: "08-stepper-in-scene",
    number: 8,
    name: "Stepper in scene",
    tagline: "Progressive onboarding",
    description:
      "The illustration panel itself carries step progress — its gradient and copy change as you advance.",
  },
  {
    slug: "09-minimal-mono",
    number: 9,
    name: "Minimal mono",
    tagline: "Quiet luxury",
    description:
      "Near-black, no illustration, a perfectly centered form — the interaction budget spent on 2-3 perfect details.",
  },
  {
    slug: "10-nature-split",
    number: 10,
    name: "Nature split",
    tagline: "Annotated photo + live stats",
    description:
      "A rounded inset photo panel with pins surfacing metrics like '+24% CTR' instead of nature labels.",
  },
  {
    slug: "11-liquid-glass",
    number: 11,
    name: "Liquid glass",
    tagline: "Apple-glass flagship",
    description:
      "Frosted glass plate over drifting gradient orbs — deep-navy dark and frosty-pink light modes, toggleable.",
  },
];

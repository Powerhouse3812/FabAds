/**
 * Copy strings for the auth-v2 standalone surface (Dark Stage / Living Split).
 *
 * Duplicated (not imported) from src/auth-concepts/shared/formSpec.ts on
 * purpose — auth-v2 is a separate, standalone surface from the
 * auth-concepts exploration gallery and must not depend on it.
 */

/** Duplicated verbatim from AUTH_CONCEPT_COPY in formSpec.ts. */
export const AUTH_V2_LOGIN_COPY = {
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
 * Based on SIGNUP_PROFILE_COPY in formSpec.ts, MINUS backLabel and
 * submitDisabledLabel — there is no "back to plans" or plan-selection step
 * anymore. Signup is a SINGLE profile form: no stepper, no plan radio
 * buttons. Plan is already chosen upstream (see PlanOverviewCard).
 */
export const AUTH_V2_SIGNUP_COPY = {
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
  phoneCode: "+91",
  phonePlaceholder: "(20) 123-4567",
  setPasswordLabel: "Set Password",
  passwordPlaceholder: "Password",
  passwordHint: "Must be 8 characters, 1 numeric and 1 special character",
  confirmPasswordLabel: "Confirm Password",
  submitLabel: "Create account",
  loginPromptLabel: "Already a user?",
  loginLinkLabel: "Login",
} as const;

/** Copy for PlanOverviewCard — the read-only "already selected plan"
 *  summary shown on the signup screen. */
export const AUTH_V2_PLAN_OVERVIEW_COPY = {
  eyebrowLabel: "Your plan",
  viewMoreLabel: "View more",
} as const;

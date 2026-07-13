/**
 * Shared client-side validators for the auth module (Login + Signup). Pure
 * UI — no backend calls; these only drive inline error states/copy so the
 * forms stop lying about what's wrong (e.g. Login previously showed
 * "Invalid email id or password" on a completely empty submit).
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** "Must be 8 characters, 1 numeric and 1 special character" (Figma 10421:45965). */
export function isValidPassword(value: string): boolean {
  return value.length >= 8 && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

/**
 * Naming-convention resolver. Turns a token pattern like
 * "{brand}_{strategy}_{objective}_{date}" into a real entity name. Empty tokens
 * collapse cleanly so you never get "Acme__Sales". Applied at launch in the
 * service AND previewed live in Settings/Review.
 */
export interface NameContext {
  brand?: string;
  strategy?: string;
  objective?: string;
  date?: string;
  campaign?: string;
  adset?: string;
  n?: number | string;
  product?: string;
}

export const NAMING_TOKENS = [
  "{brand}",
  "{strategy}",
  "{objective}",
  "{date}",
  "{campaign}",
  "{adset}",
  "{product}",
  "{n}",
] as const;

export function resolveNamingPattern(pattern: string, ctx: NameContext): string {
  const map: Record<string, string> = {
    "{brand}": ctx.brand ?? "",
    "{strategy}": ctx.strategy ?? "",
    "{objective}": ctx.objective ?? "",
    "{date}": ctx.date ?? "",
    "{campaign}": ctx.campaign ?? "",
    "{adset}": ctx.adset ?? "",
    "{product}": ctx.product ?? "",
    "{n}": ctx.n != null ? String(ctx.n) : "",
  };
  let out = pattern && pattern.trim() ? pattern : "{brand}_{strategy}_{date}";
  for (const [token, value] of Object.entries(map)) {
    out = out.split(token).join(value);
  }
  // Collapse separators left by empty tokens; trim stray edges.
  out = out
    .replace(/_{2,}/g, "_")
    .replace(/-{2,}/g, "-")
    .replace(/\s{2,}/g, " ")
    .replace(/^[_\-\s]+|[_\-\s]+$/g, "");
  return out || "Launch";
}

/** Brand label from an account name ("Acme DTC — US" → "Acme DTC"). */
export function brandFromAccount(accountName: string): string {
  return accountName.split("—")[0].trim() || accountName;
}

/** A short slug for objective/strategy in names. */
export function slug(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

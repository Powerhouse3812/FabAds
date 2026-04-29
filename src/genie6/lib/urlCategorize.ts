import type { ModeId } from "../types/output";

export type URLKind = "brand" | "product" | "landing" | "article" | "unknown";

export interface CategorizedURL {
  kind: URLKind;
  mode: ModeId | null;
  /** Normalized URL (or empty string if input is malformed) */
  url: string;
  /** The raw hostname extracted, useful for brand matching */
  host?: string;
}

/**
 * Categorize a URL into one of 5 kinds and suggest the best Genie 6 mode for it.
 *
 *   /blog, /news, /article, /post                 → article         → image-to-ad
 *   /lp, /landing, /promo, /offer, /sale, /deal   → landing page    → affiliate-ad
 *   /products/, /product/, /p/, /item/, /sku/     → product page    → product-ad
 *   pathname is empty or just "/"                 → brand homepage  → brand-ad
 *   else                                          → unknown         → null (manual mode pick)
 *
 * Order matters — article patterns are checked BEFORE landing/product because some
 * articles live under /blog/products-we-love. We treat that as article-first.
 */
export function categorizeUrl(input: string): CategorizedURL {
  const url = input.trim();
  if (!url) return { kind: "unknown", mode: null, url: "" };

  let parsed: URL;
  try {
    // Allow `mamaearth.com/products/...` without scheme — auto-prefix
    parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    return { kind: "unknown", mode: null, url };
  }

  const path = parsed.pathname.toLowerCase();
  const host = parsed.hostname.replace(/^www\./, "");

  // Article (highest priority — articles often nest under /blog/products/...)
  if (/\/(blog|news|article|articles|post|posts|stories|guide|guides|magazine|journal)(\/|$)/.test(path)) {
    return { kind: "article", mode: "image-to-ad", url: parsed.toString(), host };
  }

  // Landing / promo
  if (/\/(lp|landing|promo|promos|offer|offers|sale|deal|deals|discount|campaign)(\/|$)/.test(path)) {
    return { kind: "landing", mode: "affiliate-ad", url: parsed.toString(), host };
  }

  // Product page
  if (/\/(products?|p|item|items|sku|skus|shop)\//.test(path)) {
    return { kind: "product", mode: "product-ad", url: parsed.toString(), host };
  }

  // Brand homepage — empty path or root only
  if (path === "" || path === "/") {
    return { kind: "brand", mode: "brand-ad", url: parsed.toString(), host };
  }

  // Anything else — let user pick the mode manually
  return { kind: "unknown", mode: null, url: parsed.toString(), host };
}

/** Quick check used by HeroPromptInput to know if a string looks URL-y. */
export function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  // Bare host with TLD pattern: foo.com, foo.com/path
  return /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(trimmed);
}

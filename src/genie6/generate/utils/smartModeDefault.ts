import type { Brand, Product } from "@/genie6/types/entities";
import type { ModeId } from "@/genie6/types/output";

/**
 * Pick the smartest default ad mode given a brand + product.
 *
 * Used by FormScaffold (iter-6 A-10.1) when the user lands on the form via
 * the new ProductPicker — instead of asking "which mode?" upfront, we infer
 * a sensible default and let the user override via the inline mode-switcher
 * chip strip at the top of the form.
 *
 * Heuristic (top-down match):
 *   1. has thumbnail + ≥3 benefits         → "product-ad"
 *   2. has landingPages + brand-id is a    → "affiliate-ad"
 *      common affiliate brand
 *   3. no thumbnail + body of benefits     → "image-to-ad"
 *   4. fallback                            → "brand-ad"
 *
 * Designed to be cheap, deterministic, and easy to tweak. The cost of a wrong
 * pick is one click on the mode-switcher chip — acceptable for v1.
 */

const AFFILIATE_BRAND_KEYWORDS = [
  "mensa-brands",
  "good-glamm",
  // expand as more affiliate-led brands enter the catalogue
];

export function smartModeDefault(brand: Brand | undefined, product: Product): ModeId {
  // 1. Strong product-ad signal
  if (product.thumbnail && product.benefits && product.benefits.length >= 3) {
    return "product-ad";
  }

  // 2. Affiliate-ad signal
  if (product.landingPages && product.landingPages.length > 0) {
    if (brand && AFFILIATE_BRAND_KEYWORDS.includes(brand.id)) {
      return "affiliate-ad";
    }
  }

  // 3. No visual asset → image-to-ad makes sense (user uploads media)
  if (!product.thumbnail) {
    return "image-to-ad";
  }

  // 4. Fallback — brand-level ad
  return "brand-ad";
}

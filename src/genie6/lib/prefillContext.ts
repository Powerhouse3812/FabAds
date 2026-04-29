/**
 * Pre-fill context for the NewGenerationOverlay.
 *
 * When the user clicks "+ New generation" from a Workspace brand detail page, we want
 * the overlay to open with that brand pre-selected. Same for Library concept/hook/angle
 * detail pages. This module derives the prefill from the current route.
 *
 * --------------------------------------------------------------------------
 * Future: external module pushes (Phase D — deferred)
 *   ?from=reports&adId=X       — Reports module pushes underperformer for regen
 *   ?from=insights&winnerId=X  — Insights module pushes winner ad for Forge mode
 * resolveExternalPush(searchParams) — to be implemented when source modules emit.
 * --------------------------------------------------------------------------
 */

export type PrefillSource = "workspace" | "library" | "reports" | "insights";

export interface PrefillContext {
  brandId?: string;
  productId?: string;
  conceptId?: string;
  hookId?: string;
  angleId?: string;
  pastedUrl?: string;
  source?: PrefillSource;
}

/**
 * Map a pathname to the strongest prefill we can derive.
 * Returns an empty object if the route has no obvious entity.
 */
export function resolvePrefillFromRoute(pathname: string): PrefillContext {
  // Workspace › Brands › :brandId › Products › :productId
  let m = pathname.match(/^\/iq\/genie6\/workspace\/brands\/([^/]+)\/products\/([^/]+)/);
  if (m) return { brandId: m[1], productId: m[2], source: "workspace" };

  // Workspace › Brands › :brandId
  m = pathname.match(/^\/iq\/genie6\/workspace\/brands\/([^/]+)/);
  if (m) return { brandId: m[1], source: "workspace" };

  // Library › concepts/:id
  m = pathname.match(/^\/iq\/genie6\/library\/concepts\/([^/]+)/);
  if (m) return { conceptId: m[1], source: "library" };

  // Library › hooks/:id
  m = pathname.match(/^\/iq\/genie6\/library\/hooks\/([^/]+)/);
  if (m) return { hookId: m[1], source: "library" };

  // Library › angles/:id
  m = pathname.match(/^\/iq\/genie6\/library\/angles\/([^/]+)/);
  if (m) return { angleId: m[1], source: "library" };

  return {};
}

/** True if the prefill carries any selectable entity. */
export function hasPrefill(prefill: PrefillContext | null | undefined): boolean {
  if (!prefill) return false;
  return Boolean(
    prefill.brandId ||
    prefill.productId ||
    prefill.conceptId ||
    prefill.hookId ||
    prefill.angleId ||
    prefill.pastedUrl
  );
}

/** Human-readable summary chip text for the overlay header. */
export function summarizePrefill(prefill: PrefillContext): string {
  const parts: string[] = [];
  if (prefill.brandId) parts.push(`brand: ${prefill.brandId}`);
  if (prefill.productId) parts.push(`product: ${prefill.productId}`);
  if (prefill.conceptId) parts.push(`concept: ${prefill.conceptId}`);
  if (prefill.hookId) parts.push(`hook: ${prefill.hookId}`);
  if (prefill.angleId) parts.push(`angle: ${prefill.angleId}`);
  if (prefill.pastedUrl) parts.push(`url`);
  return parts.join(" · ");
}

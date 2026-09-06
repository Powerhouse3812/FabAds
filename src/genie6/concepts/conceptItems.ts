import {
  brands,
  products,
  categories,
  concepts as catalogueConcepts,
  KB_CONCEPTS,
  type KbConcept,
} from "@/mocks/shared";
import { sampleOutputs } from "@/genie6/mocks/sample-outputs";

/**
 * conceptItems — aggregation + derivation for the Concepts library (§12).
 *
 * Pulled out of ConceptsLibrary.tsx so the filter/derivation logic (which
 * grew once §12 collapsed 7 filter facets down to exactly 2 — Format +
 * Ad type — plus provenance and a normalized usage grammar) has room to be
 * documented without bloating the page component.
 *
 * §12 locks the Concepts filter row to Format (Image/Video) and Ad type
 * (Brand/Product/Category). Neither is a field the source data carries
 * directly for every concept, so both are DERIVED here, once, from
 * whatever text each source record does carry:
 *
 *   - Format: catalogue concepts (`concepts.ts`) already encode it as a
 *     "<ratio> static|video" string (e.g. "9:16 video") — trivial parse.
 *     KB concepts (`kbConcepts.ts`) carry no such field, so we read the
 *     visual-direction/description prose for explicit "static"/"video"
 *     wording, then production-timing tells ("0-3s", "hand-held",
 *     "timestamp burn-in") as a video signal, defaulting to image.
 *   - Ad type: KB concepts already carry `entityType: brand|product|
 *     category` — a direct 1:1 match. Catalogue concepts only reference a
 *     `brandId` (the shared `Concept` type has no product/category field —
 *     it's a Catalogue-owned, read-only file this agent does not touch),
 *     so every catalogue concept's ad type is "brand".
 */

export type AdType = "brand" | "product" | "category";
export type FormatKind = "image" | "video";
export type Provenance = "seeded" | "client-created";

export type SourceKey =
  | "catalogue"
  | "kb"
  | "saved-from-genie"
  | "saved-from-insights";

export const SOURCE_LABEL: Record<SourceKey, string> = {
  catalogue: "Catalogue",
  kb: "Knowledge Base",
  "saved-from-genie": "Genie",
  "saved-from-insights": "Insights",
};

export const AD_TYPE_LABEL: Record<AdType, string> = {
  brand: "Brand",
  product: "Product",
  category: "Category",
};

export const FORMAT_LABEL: Record<FormatKind, string> = {
  image: "Image",
  video: "Video",
};

export interface ConceptItem {
  /** Display-unique id (prefixed per aggregation source). */
  id: string;
  /** Id in the ORIGINAL source record — what a downstream consumer (e.g.
   *  Studio) would need to look this concept back up. Prefixed ids above
   *  are only for React keys / dedup across 3 merged sources. */
  rawId: string;
  name: string;
  thumbnail?: string;
  angle?: string;
  tone?: string;
  /** Hook / one-line summary — full text, for the hover/tap reveal. */
  hook?: string;
  /** Full visual-direction prose — for the hover/tap reveal. */
  visualDirection?: string;
  /** Raw display string when the source carries one, e.g. "9:16 video". */
  formatRaw?: string;
  formatKind: FormatKind;
  adType: AdType;
  brandId?: string;
  productId?: string;
  categoryId?: string;
  provenance: Provenance;
  source: SourceKey;
  capturedAt: Date;
  generationCount: number;
}

/** Stable pseudo-date so catalogue concepts sort consistently. */
function deriveCapturedAt(id: string): Date {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  const daysAgo = h % 90; // within last 90 days
  return new Date(Date.now() - daysAgo * 86400_000);
}

/** Pool of real ad thumbnails sourced from sampleOutputs (Unsplash URLs).
 *  Used for catalogue concepts that lack their own thumbnail. */
const REAL_THUMB_POOL: string[] = sampleOutputs
  .map((o) => o.thumbnail)
  .filter((t): t is string => typeof t === "string");

/** Deterministic mapping: concept id → real thumbnail from sampleOutputs. */
function deriveThumbnail(id: string): string | undefined {
  if (REAL_THUMB_POOL.length === 0) return undefined;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return REAL_THUMB_POOL[h % REAL_THUMB_POOL.length];
}

/**
 * Format derivation (§12 filter #1). `raw` is the catalogue concept's own
 * "<ratio> static|video" string when present — authoritative, just parsed.
 * `text` is a fallback bag (visualDirection + description) for sources
 * (KB concepts) that carry no format field at all.
 */
export function deriveFormatKind(raw: string | undefined, text: string): FormatKind {
  if (raw) return raw.toLowerCase().includes("video") ? "video" : "image";
  const t = text.toLowerCase();
  if (/\bstatic\b/.test(t)) return "image";
  if (/\bvideo\b|\breel\b|hand-held|handheld|timestamp|burn-in|\d+s\b/.test(t)) {
    return "video";
  }
  return "image";
}

function mapCatalogue(c: (typeof catalogueConcepts)[number]): ConceptItem {
  return {
    id: `cat-${c.id}`,
    rawId: c.id,
    name: c.name,
    thumbnail: deriveThumbnail(c.id),
    angle: c.angle,
    tone: c.tone,
    hook: c.hook,
    visualDirection: c.visualDirection,
    formatRaw: c.format,
    formatKind: deriveFormatKind(c.format, `${c.visualDirection} ${c.hook}`),
    // Shared `Concept` (catalogue) only carries brandId — no product/category
    // field exists on that type (owned by the Catalogue agent, read-only
    // here) — so every catalogue concept's ad type is "brand".
    adType: "brand",
    brandId: c.brandId,
    provenance: "seeded",
    source: "catalogue",
    capturedAt: deriveCapturedAt(c.id),
    generationCount: c.generationCount,
  };
}

function mapKb(
  c: KbConcept,
  idPrefix: string,
  provenance: Provenance,
): ConceptItem {
  const sourceKey: SourceKey =
    c.source === "from-winner-ad"
      ? "kb"
      : c.source === "saved-from-genie"
        ? "saved-from-genie"
        : "saved-from-insights";
  return {
    id: `${idPrefix}-${c.id}`,
    rawId: c.id,
    name: c.name,
    thumbnail: c.thumbnail ?? deriveThumbnail(c.id),
    angle: c.angle,
    tone: c.tone,
    hook: c.description,
    visualDirection: c.visualDirection,
    formatKind: deriveFormatKind(undefined, `${c.visualDirection} ${c.description}`),
    adType: c.entityType,
    brandId: c.entityType === "brand" ? (c.entityId as string) : undefined,
    productId: c.entityType === "product" ? (c.entityId as string) : undefined,
    categoryId: c.entityType === "category" ? (c.entityId as string) : undefined,
    provenance,
    source: sourceKey,
    capturedAt: c.capturedAt,
    generationCount: 0,
  };
}

/** Merge the 3 sources into one feed. Catalogue + KB seed data is
 *  FabFunnel-seeded (shared, read-only files); session-saved concepts are
 *  client-created (§21.2 provenance rule). */
export function buildConceptItems(savedConcepts: KbConcept[]): ConceptItem[] {
  const fromCatalogue = catalogueConcepts.map(mapCatalogue);
  const fromKb = KB_CONCEPTS.map((c) => mapKb(c, "kb", "seeded"));
  const fromSaved = savedConcepts.map((c) => mapKb(c, "saved", "client-created"));
  return [...fromCatalogue, ...fromKb, ...fromSaved];
}

/** Resolve a display label for whichever entity this concept targets —
 *  generalizes the old "brand-only" chip so Product/Category-scoped
 *  concepts (and concepts with no resolvable brand) show something too. */
export function resolveEntityLabel(item: ConceptItem): string | undefined {
  if (item.brandId) return brands.find((b) => b.id === item.brandId)?.name;
  if (item.productId) return products.find((p) => p.id === item.productId)?.name;
  if (item.categoryId) return categories.find((c) => c.id === item.categoryId)?.name;
  return undefined;
}

export function formatAge(d: Date): string {
  const ms = Date.now() - d.getTime();
  const days = Math.floor(ms / 86400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

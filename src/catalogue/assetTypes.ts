/**
 * Catalogue asset-type registry — Genie 2.0 §9 / §21.1 / §21.2.
 *
 * THE thing that didn't exist before this file (see RECON.md's Catalogue
 * section): the 9-member `CatalogueType` union was copy-pasted across
 * `CatalogueFinder.tsx`, `CatalogueListPage.tsx` and `CatalogueDetailPage.tsx`,
 * its per-type config (label/singular/icon/description) duplicated in two
 * places, and the data-resolution nested ternary in `CatalogueFinder.tsx`
 * silently fell through to `products` for any type it didn't recognise —
 * while `CatalogueListPage.tsx`'s equivalent fell through to `categories`
 * instead. Adding a type meant touching ~8 call sites. This file is the
 * single source of truth those three files now read from instead.
 *
 * §21.1 — the 26 Aug "Catalogue is commerce truth, Asset Library is
 * creative building blocks, cross-link don't merge" decision is REVERSED.
 * Everything lives here under two groups:
 *
 *   Business assets  — Brands · Products · Categories
 *   Creative assets  — Avatars · Voices · Scripts · Concepts · Hooks ·
 *                       CTAs · Frameworks · Angles · Templates ·
 *                       Audiences · References (winner ads)
 *
 * (Angle, Template, Audience and Reference/Winner-ads are the §21.2
 * carry-over additions to the §9 list — Angle and Audience already
 * existed as entities before this file; Template and Reference are new.)
 *
 * All 14 ship in V1. Avatar *presets* ship in V1; avatar *creation* is V2
 * — so `avatars` is the one Creative type with no `addForm` below, which
 * is what removes the "create avatar" affordance from the generic
 * add/upload modal (§9 / §13).
 */
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Package,
  Tag,
  Users,
  Crosshair,
  MessageSquareQuote,
  Lightbulb,
  UserRound,
  Mic,
  FileText,
  MousePointerClick,
  GitBranch,
  LayoutTemplate,
  Trophy,
} from "lucide-react";
import type { Provenance } from "@/genie6/lib/genieRunTypes";
import {
  brands,
  categories,
  products,
  audiences,
  angles,
  hooks,
  concepts,
  avatars,
  voices,
  scripts,
  ctas,
  templates,
  references,
} from "@/mocks/shared";
import type {
  Brand,
  Category,
  Product,
  Audience,
  Angle,
  Hook,
  Concept,
  Avatar,
  Voice,
} from "@/genie6/types/entities";
import type { ScriptAsset } from "@/mocks/shared/scripts";
import type { CtaAsset } from "@/mocks/shared/ctas";
import type { TemplateAsset } from "@/mocks/shared/templates";
import type { ReferenceAsset } from "@/mocks/shared/references";
// Owned by the Editor agent (Genie 2.0 §14 / §21.2 "Framework has to
// become a real object"). Coded against the documented signature —
// this file may not exist yet while the Editor agent is still building
// it; that is expected (see build brief §8).
import { FRAMEWORKS, type Framework } from "@/genie6/editor/frameworks";
import {
  writeKey,
  getWriteSnapshot,
  addedForType,
  fabricatedForType,
} from "./catalogue-write-store";

/* ─────────────────────────────── the union ─────────────────────────────── */

export type AssetGroup = "business" | "creative";

export type CatalogueType =
  | "brands"
  | "products"
  | "categories"
  | "avatars"
  | "voices"
  | "scripts"
  | "concepts"
  | "hooks"
  | "ctas"
  | "frameworks"
  | "angles"
  | "templates"
  | "audiences"
  | "references";

export const ASSET_GROUP_LABELS: Record<AssetGroup, string> = {
  business: "Business assets",
  creative: "Creative assets",
};

export const GROUP_ORDER: AssetGroup[] = ["business", "creative"];

/** Display + iteration order — Business group first, then Creative in the
 *  §9 order with the §21.2 additions appended in the order they're named. */
export const ASSET_TYPE_ORDER: CatalogueType[] = [
  "brands",
  "products",
  "categories",
  "avatars",
  "voices",
  "scripts",
  "concepts",
  "hooks",
  "ctas",
  "frameworks",
  "angles",
  "templates",
  "audiences",
  "references",
];

/* ─────────────────────────────── card grammar ─────────────────────────────── */

/**
 * §21.2 "Asset card grammar, one for all types": preview · name · tags ·
 * usage count · last used · actions. Every `AssetTypeDef.toCard` produces
 * exactly this shape regardless of the underlying entity, so `AssetCard.tsx`
 * only has to be written once.
 */
export interface AssetCardData {
  id: string;
  type: CatalogueType;
  name: string;
  subtitle?: string;
  thumbnail?: string;
  tags: string[];
  usageCount: number;
  /** ISO date (yyyy-mm-dd) — raw value, for date-range filtering. */
  lastUsedAt: string;
  /** Formatted for display, e.g. "3d ago" / "Aug 2026". */
  lastUsedLabel: string;
  provenance: Provenance;
}

export interface AddAssetInput {
  name: string;
  tags: string[];
  body?: string;
}

export interface AssetTypeDef<T = any> {
  id: CatalogueType;
  label: string;
  singular: string;
  icon: LucideIcon;
  description: string;
  group: AssetGroup;
  /** Seed + session-added + session-duplicated rows, minus deleted (and,
   *  unless `includeArchived`, minus archived), with any rename applied. */
  resolve: (opts?: { includeArchived?: boolean }) => T[];
  getId: (item: T) => string;
  getName: (item: T) => string;
  withName: (item: T, name: string) => T;
  toCard: (item: T) => AssetCardData;
  /**
   * Present only for types the generic "Manually add or upload" modal
   * (§9) supports. Absent on `brands` / `products` / `categories` (they
   * keep their existing dedicated Add{Brand,Product,Category}Modal) and
   * on `avatars` (V1 is presets-only — no "create avatar" affordance).
   */
  addForm?: { nameLabel: string; bodyLabel?: string; bodyPlaceholder?: string };
  buildAdded?: (input: AddAssetInput) => T;
}

/* ─────────────────────────────── shared helpers ─────────────────────────────── */

/** Fixed "today" so lastUsed labels ("3d ago") read sensibly against the
 *  seeded dates above, matching the rest of the mock data's date range. */
const NOW = new Date("2026-09-06T12:00:00");

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic per-id fallback usage count for entity types that carry
 *  no real "times used" field of their own (Brand/Category/Audience/Angle/
 *  Hook/Avatar/Voice). Never round (design system §3 dummy-data rule). */
function deterministicUsage(id: string, min = 3, span = 45): number {
  return min + (hashId(id) % span);
}

function deterministicLastUsed(id: string, maxDaysAgo = 75): string {
  const daysAgo = 1 + (hashId(id) % maxDaysAgo);
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return NOW.toISOString().slice(0, 10);
}

export function formatLastUsed(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const days = Math.round((NOW.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

let genSeq = 0;
export function genId(prefix: string): string {
  genSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${genSeq}`;
}

/** Client-created (session added/duplicated) always wins; otherwise the
 *  item's own `provenance` field if it carries one (scripts/ctas/templates/
 *  references/frameworks); otherwise every seed row is FabFunnel-seeded. */
function resolveProvenance(type: CatalogueType, id: string, item: unknown): Provenance {
  const snap = getWriteSnapshot();
  const key = writeKey(type, id);
  if (snap.added[key] || snap.fabricated[key]) return "client-created";
  if (item && typeof item === "object" && "provenance" in (item as Record<string, unknown>)) {
    return (item as { provenance: Provenance }).provenance;
  }
  return "fabfunnel-seeded";
}

function buildCard(
  type: CatalogueType,
  id: string,
  name: string,
  opts: {
    subtitle?: string;
    thumbnail?: string;
    tags?: string[];
    usageCount: number;
    lastUsedAt: string;
    item: unknown;
  },
): AssetCardData {
  const ov = getWriteSnapshot().overrides[writeKey(type, id)];
  const tags = ov?.tagsOverride ?? opts.tags ?? [];
  return {
    id,
    type,
    name,
    subtitle: opts.subtitle,
    thumbnail: opts.thumbnail,
    tags,
    usageCount: opts.usageCount,
    lastUsedAt: opts.lastUsedAt,
    lastUsedLabel: formatLastUsed(opts.lastUsedAt),
    provenance: resolveProvenance(type, id, opts.item),
  };
}

/** Generic resolver every `AssetTypeDef.resolve` delegates to: seed rows +
 *  session-added + session-duplicated, minus deleted / archived, with any
 *  rename applied. This is what fixes the fallthrough-default bug — a type
 *  not in `ASSET_TYPES` simply has no resolver to fall back on (see
 *  `getAssetType` below, which returns `undefined` rather than guessing). */
function makeResolver<T extends { id: string }>(
  type: CatalogueType,
  seed: T[],
  withName: (item: T, name: string) => T,
): (opts?: { includeArchived?: boolean }) => T[] {
  return (opts = {}) => {
    const snap = getWriteSnapshot();
    const added = addedForType<T>(type);
    const fabricated = fabricatedForType<T>(type);
    let all: T[] = [...seed, ...fabricated, ...added];
    all = all.filter((item) => {
      const ov = snap.overrides[writeKey(type, item.id)];
      if (ov?.deleted) return false;
      if (ov?.archived && !opts.includeArchived) return false;
      return true;
    });
    all = all.map((item) => {
      const ov = snap.overrides[writeKey(type, item.id)];
      if (!ov?.nameOverride) return item;
      return withName(item, ov.nameOverride);
    });
    return all;
  };
}

/** Generic duplicate — every type's `getId`/`getName`/`withName` is enough
 *  to clone anything without a per-type "buildDuplicate". */
export function buildDuplicate<T extends { id: string }>(
  def: AssetTypeDef<T>,
  source: T,
): T {
  const clone = { ...source, id: genId(def.id) } as T;
  return def.withName(clone, `${def.getName(source)} (Copy)`);
}

/* ─────────────────────────────── per-type defs ─────────────────────────────── */

const brandsType: AssetTypeDef<Brand> = {
  id: "brands",
  label: "Brands",
  singular: "Brand",
  icon: Building2,
  description: "Manage the brands you create ads for — brand voice, product catalogue, KB, and performance history in one place.",
  group: "business",
  resolve: makeResolver("brands", brands, (b, name) => ({ ...b, name })),
  getId: (b) => b.id,
  getName: (b) => b.name,
  withName: (b, name) => ({ ...b, name }),
  toCard: (b) =>
    buildCard("brands", b.id, b.name, {
      subtitle: b.domain,
      thumbnail: b.logo,
      tags: b.usps.slice(0, 3),
      usageCount: deterministicUsage(b.id),
      lastUsedAt: deterministicLastUsed(b.id),
      item: b,
    }),
};

const productsType: AssetTypeDef<Product> = {
  id: "products",
  label: "Products",
  singular: "Product",
  icon: Package,
  description: "Every product SKU across all brands — with landing pages, targeting templates, and generation history.",
  group: "business",
  resolve: makeResolver("products", products, (p, name) => ({ ...p, name })),
  getId: (p) => p.id,
  getName: (p) => p.name,
  withName: (p, name) => ({ ...p, name }),
  toCard: (p) => {
    const brand = brands.find((b) => b.id === p.brandId);
    const category = categories.find((c) => c.id === p.categoryId);
    return buildCard("products", p.id, p.name, {
      subtitle: `${brand?.name ?? ""} · ${p.price}`,
      thumbnail: p.thumbnail ?? brand?.logo,
      tags: [category?.name].filter((x): x is string => !!x),
      usageCount: p.generatedCount,
      lastUsedAt: deterministicLastUsed(p.id),
      item: p,
    });
  },
};

const categoriesType: AssetTypeDef<Category> = {
  id: "categories",
  label: "Categories",
  singular: "Category",
  icon: Tag,
  description: "Organise your ad catalogue by product category. Each category has its own KB, linked brands, and generation history.",
  group: "business",
  resolve: makeResolver("categories", categories, (c, name) => ({ ...c, name })),
  getId: (c) => c.id,
  getName: (c) => c.name,
  withName: (c, name) => ({ ...c, name }),
  toCard: (c) => {
    const brandCount = brands.filter((b) => b.categoryIds?.includes(c.id)).length;
    const productCount = products.filter((p) => p.categoryId === c.id).length;
    return buildCard("categories", c.id, c.name, {
      subtitle: c.instruction,
      tags: [`${brandCount} brands`, `${productCount} products`],
      usageCount: deterministicUsage(c.id),
      lastUsedAt: deterministicLastUsed(c.id),
      item: c,
    });
  },
};

const audiencesType: AssetTypeDef<Audience> = {
  id: "audiences",
  label: "Audiences",
  singular: "Audience",
  icon: Users,
  description: "Targeting segments your campaigns reach. Each audience has a brand link, demographic profile, and generation history.",
  group: "creative",
  resolve: makeResolver("audiences", audiences, (a, name) => ({ ...a, label: name })),
  getId: (a) => a.id,
  getName: (a) => a.label,
  withName: (a, name) => ({ ...a, label: name }),
  toCard: (a) => {
    const brand = a.brandId ? brands.find((b) => b.id === a.brandId) : undefined;
    return buildCard("audiences", a.id, a.label, {
      subtitle: brand?.name ?? "Brand-agnostic",
      tags: [a.segment],
      usageCount: deterministicUsage(a.id),
      lastUsedAt: deterministicLastUsed(a.id),
      item: a,
    });
  },
  addForm: { nameLabel: "Audience label", bodyLabel: "Segment definition", bodyPlaceholder: "e.g. Affluent women 30-45, urban metros, price-insensitive" },
  buildAdded: (input) => ({
    id: genId("audience"),
    label: input.name,
    segment: input.body?.trim() || "Custom segment",
    brandId: undefined,
  }),
};

const anglesType: AssetTypeDef<Angle> = {
  id: "angles",
  label: "Angles",
  singular: "Angle",
  icon: Crosshair,
  description: "Strategic ad angles — how a creative frames the product. Reusable across brands and campaigns.",
  group: "creative",
  resolve: makeResolver("angles", angles, (a, name) => ({ ...a, label: name })),
  getId: (a) => a.id,
  getName: (a) => a.label,
  withName: (a, name) => ({ ...a, label: name }),
  toCard: (a) => {
    const linked =
      hooks.filter((h) => h.angleId === a.id).length +
      concepts.filter((c) => c.angle.toLowerCase() === a.label.toLowerCase()).length;
    return buildCard("angles", a.id, a.label, {
      subtitle: a.description,
      usageCount: linked > 0 ? linked : deterministicUsage(a.id, 1, 20),
      lastUsedAt: deterministicLastUsed(a.id),
      item: a,
    });
  },
  addForm: { nameLabel: "Angle label", bodyLabel: "Description", bodyPlaceholder: "How this angle frames the product…" },
  buildAdded: (input) => ({ id: genId("angle"), label: input.name, description: input.body?.trim() }),
};

const hooksType: AssetTypeDef<Hook> = {
  id: "hooks",
  label: "Hooks",
  singular: "Hook",
  icon: MessageSquareQuote,
  description: "Opening lines + visual hooks proven to grab attention. Linked to brand + angle, with CTR + impression history.",
  group: "creative",
  resolve: makeResolver("hooks", hooks, (h, name) => ({ ...h, text: name })),
  getId: (h) => h.id,
  getName: (h) => h.text,
  withName: (h, name) => ({ ...h, text: name }),
  toCard: (h) => {
    const brand = h.brandId ? brands.find((b) => b.id === h.brandId) : undefined;
    const angle = h.angleId ? angles.find((a) => a.id === h.angleId) : undefined;
    return buildCard("hooks", h.id, h.text, {
      subtitle: [brand?.name, angle?.label].filter(Boolean).join(" · "),
      tags: h.performance ? [`${h.performance.ctr.toFixed(2)}% CTR`] : [],
      usageCount: deterministicUsage(h.id),
      lastUsedAt: deterministicLastUsed(h.id),
      item: h,
    });
  },
  addForm: { nameLabel: "Hook copy", bodyPlaceholder: "The opening line — e.g. \"Hair fall is real. This is not.\"" },
  buildAdded: (input) => ({ id: genId("hook"), text: input.name, brandId: undefined, angleId: undefined }),
};

const conceptsType: AssetTypeDef<Concept> = {
  id: "concepts",
  label: "Concepts",
  singular: "Concept",
  icon: Lightbulb,
  description: "Repeatable creative concepts — angle + hook + visual direction packaged together. Used as Genie generation seeds.",
  group: "creative",
  resolve: makeResolver("concepts", concepts, (c, name) => ({ ...c, name })),
  getId: (c) => c.id,
  getName: (c) => c.name,
  withName: (c, name) => ({ ...c, name }),
  toCard: (c) =>
    buildCard("concepts", c.id, c.name, {
      subtitle: `${c.angle} · ${c.tone}`,
      tags: [c.format],
      usageCount: c.generationCount,
      lastUsedAt: deterministicLastUsed(c.id),
      item: c,
    }),
  addForm: { nameLabel: "Concept name", bodyLabel: "Visual direction", bodyPlaceholder: "Describe the visual direction, scene and mood…" },
  buildAdded: (input) => ({
    id: genId("concept"),
    name: input.name,
    brandId: brands[0]?.id ?? "",
    angle: input.tags[0] ?? "Custom",
    hook: input.body?.trim() || "",
    tone: "Custom",
    format: "1:1 static",
    visualDirection: input.body?.trim() || "",
    generationCount: 0,
  }),
};

const avatarsType: AssetTypeDef<Avatar> = {
  id: "avatars",
  label: "Avatars",
  singular: "Avatar",
  icon: UserRound,
  description: "Avatar identities for UGC video generation. Cross-language profiles with demographic + style. Presets only in V1 — avatar creation ships V2.",
  group: "creative",
  resolve: makeResolver("avatars", avatars, (a, name) => ({ ...a, name })),
  getId: (a) => a.id,
  getName: (a) => a.name,
  withName: (a, name) => ({ ...a, name }),
  toCard: (a) =>
    buildCard("avatars", a.id, a.name, {
      subtitle: a.demographic,
      tags: a.language.slice(0, 3),
      usageCount: deterministicUsage(a.id),
      lastUsedAt: deterministicLastUsed(a.id),
      item: a,
    }),
  // No `addForm` — V1 is presets-only, no "create avatar" affordance (§9/§13).
};

const voicesType: AssetTypeDef<Voice> = {
  id: "voices",
  label: "Voices",
  singular: "Voice",
  icon: Mic,
  description: "Voice samples across languages and tones. Powers audio-led UGC generations.",
  group: "creative",
  resolve: makeResolver("voices", voices, (v, name) => ({ ...v, name })),
  getId: (v) => v.id,
  getName: (v) => v.name,
  withName: (v, name) => ({ ...v, name }),
  toCard: (v) =>
    buildCard("voices", v.id, v.name, {
      subtitle: v.language,
      tags: [v.language],
      usageCount: deterministicUsage(v.id),
      lastUsedAt: deterministicLastUsed(v.id),
      item: v,
    }),
  addForm: { nameLabel: "Voice name", bodyLabel: "Description", bodyPlaceholder: "e.g. Warm, confident, mid-30s female voice" },
  buildAdded: (input) => ({
    id: genId("voice"),
    name: input.name,
    language: input.tags[0] ?? "English",
    sample: undefined,
    description: input.body?.trim() || "",
  }),
};

const scriptsType: AssetTypeDef<ScriptAsset> = {
  id: "scripts",
  label: "Scripts",
  singular: "Script",
  icon: FileText,
  description: "Reviewed, approved video scripts — written against a framework (PAS / AIDA / BAB / FAB), ready to hand to the video editor.",
  group: "creative",
  resolve: makeResolver("scripts", scripts, (s, name) => ({ ...s, title: name })),
  getId: (s) => s.id,
  getName: (s) => s.title,
  withName: (s, name) => ({ ...s, title: name }),
  toCard: (s) =>
    buildCard("scripts", s.id, s.title, {
      subtitle: `${s.framework} · ${s.durationSec}s`,
      tags: s.tags,
      usageCount: s.usageCount,
      lastUsedAt: s.lastUsedAt,
      item: s,
    }),
  addForm: { nameLabel: "Script title", bodyLabel: "Script body", bodyPlaceholder: "Write or paste the script the avatar/voice will read…" },
  buildAdded: (input) => ({
    id: genId("script"),
    title: input.name,
    brandId: undefined,
    angleId: undefined,
    framework: "PAS",
    body: input.body?.trim() || "",
    durationSec: 0,
    tags: input.tags,
    usageCount: 0,
    lastUsedAt: todayIso(),
    provenance: "client-created",
  }),
};

const ctasType: AssetTypeDef<CtaAsset> = {
  id: "ctas",
  label: "CTAs",
  singular: "CTA",
  icon: MousePointerClick,
  description: "Reusable call-to-action lines — discount, urgency, benefit, social-proof and curiosity styles.",
  group: "creative",
  resolve: makeResolver("ctas", ctas, (c, name) => ({ ...c, text: name })),
  getId: (c) => c.id,
  getName: (c) => c.text,
  withName: (c, name) => ({ ...c, text: name }),
  toCard: (c) =>
    buildCard("ctas", c.id, c.text, {
      subtitle: c.style,
      tags: c.tags,
      usageCount: c.usageCount,
      lastUsedAt: c.lastUsedAt,
      item: c,
    }),
  addForm: { nameLabel: "CTA text", bodyPlaceholder: "e.g. \"Grab it before the Diwali sale ends\"" },
  buildAdded: (input) => ({
    id: genId("cta"),
    text: input.name,
    brandId: undefined,
    style: "benefit",
    tags: input.tags,
    usageCount: 0,
    lastUsedAt: todayIso(),
    provenance: "client-created",
  }),
};

const frameworksType: AssetTypeDef<Framework> = {
  id: "frameworks",
  label: "Frameworks",
  singular: "Framework",
  icon: GitBranch,
  description: "Ordered, named video sections (Hook / Problem / Proof / Demo / CTA) — the object the framework-based video editor edits against.",
  group: "creative",
  // FRAMEWORKS is owned + populated by the Editor agent; this file only
  // registers the type and merges in session add/duplicate the same as
  // every other Creative type.
  resolve: makeResolver("frameworks", FRAMEWORKS, (f, name) => ({ ...f, name })),
  getId: (f) => f.id,
  getName: (f) => f.name,
  withName: (f, name) => ({ ...f, name }),
  toCard: (f) =>
    buildCard("frameworks", f.id, f.name, {
      subtitle: f.description ?? `${f.sections?.length ?? 0} sections`,
      tags: [f.fullName ?? `${f.sections?.length ?? 0} sections`],
      usageCount: f.usageCount ?? 0,
      lastUsedAt: deterministicLastUsed(f.id),
      item: f,
    }),
  addForm: { nameLabel: "Framework name" },
  buildAdded: (input) =>
    ({
      id: genId("framework"),
      name: input.name,
      sections: [],
      provenance: "client-created",
      usageCount: 0,
    }) as unknown as Framework,
};

const templatesType: AssetTypeDef<TemplateAsset> = {
  id: "templates",
  label: "Templates",
  singular: "Template",
  icon: LayoutTemplate,
  description: "Pre-built ad layouts, brand-agnostic — a starting shell for a new generation.",
  group: "creative",
  resolve: makeResolver("templates", templates, (t, name) => ({ ...t, name })),
  getId: (t) => t.id,
  getName: (t) => t.name,
  withName: (t, name) => ({ ...t, name }),
  toCard: (t) =>
    buildCard("templates", t.id, t.name, {
      subtitle: `${t.format} · ${t.aspect}`,
      thumbnail: t.thumbnail,
      tags: [t.category],
      usageCount: t.usageCount,
      lastUsedAt: t.lastUsedAt,
      item: t,
    }),
  addForm: { nameLabel: "Template name" },
  buildAdded: (input) => ({
    id: genId("template"),
    name: input.name,
    format: "Static",
    aspect: "1:1",
    category: input.tags[0] ?? "Custom",
    thumbnail: "",
    tags: input.tags,
    usageCount: 0,
    lastUsedAt: todayIso(),
    provenance: "client-created",
  }),
};

const referencesType: AssetTypeDef<ReferenceAsset> = {
  id: "references",
  label: "References",
  singular: "Reference",
  icon: Trophy,
  description: "Winner ads and saved reference creative — proof of what's worked, pulled up as inspiration for the next generation.",
  group: "creative",
  resolve: makeResolver("references", references, (r, name) => ({ ...r, headline: name })),
  getId: (r) => r.id,
  getName: (r) => r.headline,
  withName: (r, name) => ({ ...r, headline: name }),
  toCard: (r) =>
    buildCard("references", r.id, r.headline, {
      subtitle: r.description,
      thumbnail: r.thumbnail,
      tags: r.tags,
      usageCount: r.usageCount,
      lastUsedAt: r.lastUsedAt,
      item: r,
    }),
  addForm: { nameLabel: "Reference headline", bodyLabel: "Note / URL", bodyPlaceholder: "Paste a URL or add a short note about why this is a good reference" },
  buildAdded: (input) => ({
    id: genId("reference"),
    headline: input.name,
    entityType: "brand",
    entityId: brands[0]?.id ?? "",
    thumbnail: undefined,
    format: "image",
    source: "uploaded",
    description: input.body?.trim(),
    tags: input.tags,
    usageCount: 0,
    lastUsedAt: todayIso(),
    provenance: "client-created",
  }),
};

/* ─────────────────────────────── the registry ─────────────────────────────── */

export const ASSET_TYPES: Record<CatalogueType, AssetTypeDef> = {
  brands: brandsType,
  products: productsType,
  categories: categoriesType,
  audiences: audiencesType,
  angles: anglesType,
  hooks: hooksType,
  concepts: conceptsType,
  avatars: avatarsType,
  voices: voicesType,
  scripts: scriptsType,
  ctas: ctasType,
  frameworks: frameworksType,
  templates: templatesType,
  references: referencesType,
};

/**
 * Explicit lookup — returns `undefined` for anything not in the registry
 * instead of silently falling through to another type. This is the fix
 * for RECON's "fallthrough default is products" bug: callers MUST branch
 * on `undefined` and render an "unknown asset type" state, never guess.
 */
export function getAssetType(id: string | undefined): AssetTypeDef | undefined {
  if (!id) return undefined;
  return ASSET_TYPES[id as CatalogueType];
}

export function groupedAssetTypes(): { group: AssetGroup; label: string; types: AssetTypeDef[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    label: ASSET_GROUP_LABELS[group],
    types: ASSET_TYPE_ORDER.map((id) => ASSET_TYPES[id]).filter((d) => d.group === group),
  }));
}

/** Fixes RECON's other bug: `/catalogue/{type}/:id` ignoring `:id` and
 *  rendering `resolve()[0]`. Callers pass the route param straight through. */
export function findEntityById<T = unknown>(
  type: CatalogueType,
  id: string,
  opts?: { includeArchived?: boolean },
): T | undefined {
  const def = getAssetType(type);
  if (!def) return undefined;
  return (def.resolve(opts) as T[]).find((item) => def.getId(item) === id);
}

export function firstIdForType(type: CatalogueType): string | undefined {
  const def = getAssetType(type);
  if (!def) return undefined;
  const first = def.resolve()[0];
  return first ? def.getId(first) : undefined;
}

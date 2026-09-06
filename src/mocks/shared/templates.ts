import type { Provenance } from "@/genie6/lib/genieRunTypes";

/**
 * Templates — pre-built ad layouts, a Creative-asset type carried over
 * from the 26 Aug record (§21.2: "Angle, Template, Audience and
 * Reference / Winner ads" join the §9 list). Brand-agnostic layout
 * shells the user starts a generation from.
 *
 * Distinct from `src/genie6/studio-v4/components/TemplateRail.tsx`'s
 * internal `TEMPLATES` mock (that file is owned by the Studio agent and
 * its array isn't exported) — this is the Catalogue-side registry so the
 * asset type has real backing data without reaching into another agent's
 * file. Same shape in spirit (format / aspect / category), authored
 * fresh here.
 */

export type TemplateFormat = "Static" | "Video" | "Carousel";

export interface TemplateAsset {
  id: string;
  name: string;
  format: TemplateFormat;
  /** Display aspect, e.g. "1:1" / "4:5" / "9:16" / "16:9". */
  aspect: string;
  category: string;
  thumbnail: string;
  tags: string[];
  usageCount: number;
  /** ISO date. */
  lastUsedAt: string;
  provenance: Provenance;
}

const t = (
  id: string,
  name: string,
  format: TemplateFormat,
  aspect: string,
  category: string,
  thumbnail: string,
  tags: string[],
  usageCount: number,
  lastUsedAt: string,
  provenance: Provenance = "fabfunnel-seeded",
): TemplateAsset => ({ id, name, format, aspect, category, thumbnail, tags, usageCount, lastUsedAt, provenance });

export const templates: TemplateAsset[] = [
  t(
    "tpl-ugc-testimonial",
    "UGC Testimonial",
    "Video",
    "9:16",
    "UGC",
    "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=400&q=75",
    ["UGC", "testimonial"],
    47,
    "2026-09-02",
  ),
  t(
    "tpl-product-hero",
    "Product Hero",
    "Static",
    "1:1",
    "Product hero",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=75",
    ["hero", "packshot"],
    62,
    "2026-09-04",
  ),
  t(
    "tpl-before-after",
    "Before / After Split",
    "Static",
    "4:5",
    "Comparison",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=75",
    ["comparison", "transformation"],
    29,
    "2026-08-19",
  ),
  t(
    "tpl-discount-badge",
    "Discount Badge Hero",
    "Static",
    "1:1",
    "Discount",
    "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=400&q=75",
    ["discount", "urgency"],
    38,
    "2026-08-30"
  ),
  t(
    "tpl-carousel-bestsellers",
    "Bestsellers Carousel",
    "Carousel",
    "1:1",
    "Catalogue",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=75",
    ["carousel", "catalogue"],
    17,
    "2026-08-05",
  ),
  t(
    "tpl-founder-story",
    "Founder Story",
    "Video",
    "9:16",
    "Brand story",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=75",
    ["brand", "narrative"],
    9,
    "2026-07-22",
  ),
  t(
    "tpl-social-proof-grid",
    "Social Proof Grid",
    "Static",
    "4:5",
    "Social proof",
    "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=400&q=75",
    ["reviews", "grid"],
    24,
    "2026-08-14",
  ),
  t(
    "tpl-ingredient-macro",
    "Ingredient Macro Shot",
    "Static",
    "1:1",
    "Ingredient",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=75",
    ["ingredient", "macro"],
    13,
    "2026-08-01",
  ),
  t(
    "tpl-spec-comparison",
    "Spec Comparison Table",
    "Static",
    "4:5",
    "Comparison",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=75",
    ["spec-led", "tech"],
    11,
    "2026-07-30",
  ),
  t(
    "tpl-gifting-hamper",
    "Gifting Hamper Hero",
    "Static",
    "1:1",
    "Festive",
    "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=400&q=75",
    ["festive", "gifting"],
    6,
    "2026-06-15",
  ),
  t(
    "tpl-founder-diwali-draft",
    "Diwali gifting hero — draft",
    "Static",
    "4:5",
    "Festive",
    "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=400&q=75",
    ["festive", "draft"],
    1,
    "2026-09-05",
    "client-created",
  ),
];

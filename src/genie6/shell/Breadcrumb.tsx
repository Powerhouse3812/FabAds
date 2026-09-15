import { Link, useLocation } from "react-router-dom";
import { ASSET_TYPES, ASSET_TYPE_ORDER } from "@/catalogue/assetTypes";

/**
 * Asset-type segments are DERIVED from the registry, not retyped here.
 * This map was a hand-copy and had already drifted: it was missing
 * `scripts`, `ctas`, `frameworks` and `storyboards` entirely, so those
 * breadcrumbs fell back to a raw slug — and three of those four are now
 * primary items on the Asset Library sub-menu. It also still said
 * "Avatars" after that type became "Avatar + voice" (owner, 2026-09-14).
 *
 * The literal entries below stay for every NON-asset segment and win over
 * the derived ones, so nothing outside the Asset Library changes.
 */
const ASSET_SEGMENT_LABELS: Record<string, string> = Object.fromEntries(
  ASSET_TYPE_ORDER.map((id) => [id, ASSET_TYPES[id].label]),
);

const SEGMENT_LABELS: Record<string, string> = {
  ...ASSET_SEGMENT_LABELS,
  genie6: "Genie 6.0",
  workspace: "Workspace",
  generate: "Generate",
  wizard: "Wizard",
  form: "Form",
  progress: "Progress",
  results: "Results",
  library: "Library",
  outputs: "Outputs",
  settings: "Settings",
  "brand-ad": "Brand Ad",
  "product-ad": "Product Ad",
  "affiliate-ad": "Affiliate Ad",
  "ugc-video": "UGC Video",
  forge: "Variants",
  "image-to-ad": "Image to Ad",
};

function labelFor(seg: string) {
  return SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-g6-sm text-g6-text-secondary">
      {segments.map((seg, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        const label = labelFor(seg);
        return (
          <span key={path} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-g6-text-tertiary">/</span>}
            {isLast ? (
              <span className="text-g6-text">{label}</span>
            ) : (
              <Link to={path} className="hover:text-g6-text transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

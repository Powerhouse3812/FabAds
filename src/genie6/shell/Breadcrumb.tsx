import { Link, useLocation } from "react-router-dom";

const SEGMENT_LABELS: Record<string, string> = {
  genie6: "Genie 6.0",
  workspace: "Workspace",
  brands: "Brands",
  categories: "Categories",
  products: "Products",
  generate: "Generate",
  wizard: "Wizard",
  form: "Form",
  progress: "Progress",
  results: "Results",
  library: "Library",
  outputs: "Outputs",
  hooks: "Hooks",
  angles: "Angles",
  concepts: "Concepts",
  templates: "Templates",
  avatars: "Avatars",
  audiences: "Audiences",
  settings: "Settings",
  voices: "Voices",
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

import { useState } from "react";
import { X, Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { brands } from "../../mocks/brands";
import { productsForBrand } from "../../mocks/products";
import { categories } from "../../mocks/categories";
import { concepts } from "../../mocks/library";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { OutputCard } from "../../components/OutputCard";
import { useNewGenerationOverlay } from "../../shell/NewGenerationOverlay";

/**
 * Cards + drawer view (Track 4.3 — Linear / Krea style).
 *
 * Main area: brand cards in a grid (logo + counts + last-gen).
 * Click any card → side drawer (~600px) slides in from right.
 * Drawer has tabs: Overview / Products / Concepts / Variants.
 */

type DrawerTab = "overview" | "products" | "concepts" | "variants";

export function WorkspaceCards({
  tab,
  initialId,
}: {
  tab: "brands" | "categories";
  initialId?: string;
}) {
  const items = tab === "brands" ? brands : categories;
  const [openId, setOpenId] = useState<string | null>(initialId ?? null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview");
  const { open: openOverlay } = useNewGenerationOverlay();

  const opened = openId ? items.find((i) => i.id === openId) : null;

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const prodCount = tab === "brands" ? productsForBrand(item.id).length : 0;
            const variantCount =
              tab === "brands"
                ? sampleOutputs.filter((o) => o.brand?.name === item.name).length
                : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setOpenId(item.id);
                  setDrawerTab("overview");
                }}
                className="g6-lift group flex flex-col gap-3 rounded-g6-xl border border-g6-border-secondary bg-g6-bg-container p-5 text-left"
              >
                <BrandLogoTile name={item.name} logo={tab === "brands" ? (item as any).logo : undefined} colors={tab === "brands" ? (item as any).colors : undefined} />
                <div className="space-y-0.5">
                  <p className="text-g6-h5 font-bold text-g6-text">{item.name}</p>
                  {tab === "brands" && (
                    <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">
                      {(item as any).domain}
                    </p>
                  )}
                </div>
                {tab === "brands" && (
                  <div className="mt-auto flex items-center gap-3 font-g6-mono text-g6-xs text-g6-text-tertiary">
                    <span>{prodCount} products</span>
                    <span>·</span>
                    <span>{variantCount} variants</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Drawer */}
      {opened && (
        <aside className="w-[600px] flex-shrink-0 border-l border-g6-border-secondary overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
            <div className="flex-1">
              <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                {tab === "brands" ? "Brand" : "Category"}
              </p>
              <h2 className="text-g6-h4 font-bold text-g6-text">{opened.name}</h2>
            </div>
            <button
              type="button"
              onClick={() =>
                openOverlay({ brandId: opened.id, source: "workspace" })
              }
              className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-2.5 py-1 text-g6-xs font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-colors hover:bg-g6-primary-hover"
            >
              <Sparkles className="h-3 w-3" /> Generate
            </button>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              aria-label="Close drawer"
              className="inline-flex h-7 w-7 items-center justify-center rounded-g6-base text-g6-text-tertiary transition-colors hover:bg-g6-bg-spotlight hover:text-g6-text"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {tab === "brands" && (
            <>
              <nav className="flex border-b border-g6-border-secondary px-3" aria-label="Drawer tabs">
                {(["overview", "products", "concepts", "variants"] as DrawerTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDrawerTab(t)}
                    className={cn(
                      "border-b-2 px-3 py-2 text-g6-sm font-medium capitalize transition-colors",
                      drawerTab === t
                        ? "border-g6-primary text-g6-text"
                        : "border-transparent text-g6-text-tertiary hover:text-g6-text"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </nav>

              <div className="p-5">
                {drawerTab === "overview" && <OverviewTab brandId={opened.id} />}
                {drawerTab === "products" && <ProductsTab brandId={opened.id} />}
                {drawerTab === "concepts" && <ConceptsTab brandId={opened.id} />}
                {drawerTab === "variants" && <VariantsTab brandId={opened.id} brandName={opened.name} />}
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Brand logo tile — uses Clearbit logo with letter fallback
   ───────────────────────────────────────────────────────── */
function BrandLogoTile({
  name,
  logo,
  colors,
}: {
  name: string;
  logo?: string;
  colors?: string[];
}) {
  const [errored, setErrored] = useState(false);
  const fallbackBg = colors?.[0] ?? "var(--g6-color-bg-spotlight)";
  const fallbackFg = colors?.[1] ?? "var(--g6-color-text-secondary)";

  if (logo && !errored) {
    return (
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-g6-card bg-white p-1.5 shadow-g6-sm">
        <img
          src={logo}
          alt={`${name} logo`}
          className="h-full w-full object-contain"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-g6-card font-g6-mono text-g6-h4 font-bold"
      style={{ backgroundColor: fallbackBg, color: fallbackFg }}
    >
      {name[0]}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Drawer tab contents
   ───────────────────────────────────────────────────────── */
function OverviewTab({ brandId }: { brandId: string }) {
  const brand = brands.find((b) => b.id === brandId);
  if (!brand) return null;
  return (
    <div className="space-y-4">
      <p className="text-g6-base text-g6-text-secondary">{brand.tone}</p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-g6-sm">
        <dt className="text-g6-text-tertiary">Voice</dt>
        <dd className="text-g6-text">{brand.voice}</dd>
        <dt className="text-g6-text-tertiary">USPs</dt>
        <dd className="text-g6-text">{brand.usps?.join(" · ") ?? "—"}</dd>
        <dt className="text-g6-text-tertiary">Domain</dt>
        <dd className="font-g6-mono text-g6-text">{brand.domain}</dd>
      </dl>
      <Link
        to={`/iq/genie6/settings/brands/${brand.id}`}
        className="inline-flex items-center gap-1 font-g6-mono text-g6-xs text-g6-text-secondary underline-offset-2 hover:text-g6-text hover:underline"
      >
        Edit profile in Settings <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function ProductsTab({ brandId }: { brandId: string }) {
  const prods = productsForBrand(brandId);
  if (prods.length === 0)
    return <p className="text-g6-sm text-g6-text-tertiary">No products yet.</p>;
  return (
    <ul className="grid grid-cols-2 gap-3">
      {prods.map((p) => (
        <li
          key={p.id}
          className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3"
        >
          {p.thumbnail && (
            <img src={p.thumbnail} alt={p.name} className="mb-2 h-24 w-full rounded object-cover" />
          )}
          <p className="text-g6-sm font-semibold text-g6-text">{p.name}</p>
          <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{p.price}</p>
        </li>
      ))}
    </ul>
  );
}

function ConceptsTab({ brandId }: { brandId: string }) {
  const list = concepts.filter((c) => c.brandId === brandId);
  if (list.length === 0)
    return <p className="text-g6-sm text-g6-text-tertiary">No concepts saved.</p>;
  return (
    <ul className="space-y-2">
      {list.map((c) => (
        <li
          key={c.id}
          className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3"
        >
          <p className="text-g6-sm font-semibold text-g6-text">{c.name}</p>
          <p className="text-g6-xs text-g6-text-tertiary">{c.angle} · {c.tone}</p>
        </li>
      ))}
    </ul>
  );
}

function VariantsTab({ brandId, brandName }: { brandId: string; brandName: string }) {
  void brandId;
  const list = sampleOutputs.filter((o) => o.brand?.name === brandName);
  if (list.length === 0)
    return <p className="text-g6-sm text-g6-text-tertiary">No variants generated yet.</p>;
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {list.map((o) => (
        <li key={o.id}>
          <OutputCard
            {...o}
            variant="compact"
            selectable={false}
            onSave={() => {}}
            onLaunch={() => {}}
            onDownload={() => {}}
          />
        </li>
      ))}
    </ul>
  );
}

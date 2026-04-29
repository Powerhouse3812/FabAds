import { useState } from "react";
import { ChevronRight, Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { brands } from "../../mocks/brands";
import { productsForBrand } from "../../mocks/products";
import { categories } from "../../mocks/categories";
import { audiences, angles, concepts } from "../../mocks/library";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { useNewGenerationOverlay } from "../../shell/NewGenerationOverlay";
import { OutputCard } from "../../components/OutputCard";

/**
 * Master-detail cascading view (Track 4.3 default).
 *
 * Layout: 3 panes max, click cascades right-to-left
 *  Pane 1 (always visible)   list of brands (or categories)
 *  Pane 2 (on selection)     children of selected brand — products / audiences /
 *                            angles / concepts / variants as collapsible sections
 *  Pane 3 (on child select)  detail of the selected child
 *
 * Maalik's example: brand → product list (pane 2) → product detail (pane 3).
 */

type Section = "products" | "audiences" | "angles" | "concepts" | "variants";

export function WorkspaceMasterDetail({
  tab,
  initialId,
}: {
  tab: "brands" | "categories";
  initialId?: string;
}) {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(initialId ?? null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedChild, setSelectedChild] = useState<{ section: Section; id: string } | null>(null);

  const { open: openOverlay } = useNewGenerationOverlay();

  const selectedBrand = selectedBrandId ? brands.find((b) => b.id === selectedBrandId) : null;

  const items = tab === "brands" ? brands : categories;
  const itemKey = (item: any) => item.id;
  const itemLabel = (item: any) => item.name;
  const itemSub = (item: any) => (tab === "brands" ? item.domain : `${item.winnerCount ?? 0} winners`);

  return (
    <div className="flex h-full">
      {/* Pane 1: list */}
      <aside className="w-[260px] flex-shrink-0 border-r border-g6-border-secondary overflow-y-auto">
        <ul className="py-2">
          {items.map((item) => {
            const id = itemKey(item);
            const active = id === selectedBrandId;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrandId(id);
                    setSelectedSection(null);
                    setSelectedChild(null);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-4 py-2 text-left transition-colors",
                    active
                      ? "bg-g6-primary-bg text-g6-text"
                      : "text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-g6-sm font-semibold text-g6-text">{itemLabel(item)}</p>
                    <p className="truncate font-g6-mono text-g6-xs text-g6-text-tertiary">{itemSub(item)}</p>
                  </div>
                  {active && <ChevronRight className="h-4 w-4 text-g6-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Pane 2: children sections */}
      {selectedBrand && (
        <aside className="w-[280px] flex-shrink-0 border-r border-g6-border-secondary overflow-y-auto">
          <header className="border-b border-g6-border-secondary px-4 py-3">
            <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
              {selectedBrand.name}
            </p>
            <button
              type="button"
              onClick={() =>
                openOverlay({ brandId: selectedBrand.id, source: "workspace" })
              }
              className="mt-2 inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-2.5 py-1 text-g6-xs font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-colors hover:bg-g6-primary-hover"
            >
              <Sparkles className="h-3 w-3" /> Generate
            </button>
          </header>
          <div className="p-2">
            <SectionRow
              label="Products"
              count={productsForBrand(selectedBrand.id).length}
              active={selectedSection === "products"}
              onClick={() => {
                setSelectedSection("products");
                setSelectedChild(null);
              }}
            />
            <SectionRow
              label="Audiences"
              count={audiences.filter((a) => !a.brandId || a.brandId === selectedBrand.id).length}
              active={selectedSection === "audiences"}
              onClick={() => {
                setSelectedSection("audiences");
                setSelectedChild(null);
              }}
            />
            <SectionRow
              label="Angles"
              count={angles.length}
              active={selectedSection === "angles"}
              onClick={() => {
                setSelectedSection("angles");
                setSelectedChild(null);
              }}
            />
            <SectionRow
              label="Concepts"
              count={concepts.filter((c) => c.brandId === selectedBrand.id).length}
              active={selectedSection === "concepts"}
              onClick={() => {
                setSelectedSection("concepts");
                setSelectedChild(null);
              }}
            />
            <SectionRow
              label="Variants"
              count={sampleOutputs.filter((o) => o.brand?.name === selectedBrand.name).length}
              active={selectedSection === "variants"}
              onClick={() => {
                setSelectedSection("variants");
                setSelectedChild(null);
              }}
            />
          </div>

          {/* When a section is picked but no child yet — list children inline */}
          {selectedSection && (
            <div className="border-t border-g6-border-secondary p-2">
              <SectionChildList
                section={selectedSection}
                brandId={selectedBrand.id}
                brandName={selectedBrand.name}
                selectedChildId={selectedChild?.id ?? null}
                onPick={(id) => setSelectedChild({ section: selectedSection, id })}
              />
            </div>
          )}
        </aside>
      )}

      {/* Pane 3: detail of selected child OR brand overview */}
      <div className="flex-1 overflow-y-auto">
        {selectedBrand && !selectedSection && <BrandOverviewPane brandId={selectedBrand.id} />}
        {selectedBrand && selectedSection && selectedChild && (
          <ChildDetailPane
            section={selectedChild.section}
            id={selectedChild.id}
            brandId={selectedBrand.id}
          />
        )}
        {!selectedBrand && (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="text-g6-base text-g6-text-tertiary">
              Pick a {tab === "brands" ? "brand" : "category"} from the list to see its details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

function SectionRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-g6-base px-3 py-2 text-left transition-colors",
        active
          ? "bg-g6-primary-bg text-g6-text"
          : "text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text"
      )}
    >
      <span className="text-g6-sm font-medium">{label}</span>
      <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{count}</span>
    </button>
  );
}

function SectionChildList({
  section,
  brandId,
  brandName,
  selectedChildId,
  onPick,
}: {
  section: Section;
  brandId: string;
  brandName: string;
  selectedChildId: string | null;
  onPick: (id: string) => void;
}) {
  let items: Array<{ id: string; primary: string; secondary?: string }> = [];

  if (section === "products") {
    items = productsForBrand(brandId).map((p) => ({
      id: p.id,
      primary: p.name,
      secondary: p.price,
    }));
  } else if (section === "audiences") {
    items = audiences
      .filter((a) => !a.brandId || a.brandId === brandId)
      .map((a) => ({ id: a.id, primary: a.label, secondary: a.segment }));
  } else if (section === "angles") {
    items = angles.map((a) => ({ id: a.id, primary: a.label, secondary: a.description }));
  } else if (section === "concepts") {
    items = concepts
      .filter((c) => c.brandId === brandId)
      .map((c) => ({ id: c.id, primary: c.name, secondary: c.angle }));
  } else if (section === "variants") {
    items = sampleOutputs
      .filter((o) => o.brand?.name === brandName)
      .map((o) => ({ id: o.id, primary: o.headline ?? "Untitled", secondary: o.product?.name }));
  }

  if (items.length === 0) {
    return (
      <p className="px-3 py-4 text-g6-xs text-g6-text-tertiary text-center">
        No {section} for this brand yet.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {items.map((it) => (
        <li key={it.id}>
          <button
            type="button"
            onClick={() => onPick(it.id)}
            className={cn(
              "flex w-full flex-col rounded-g6-base px-3 py-2 text-left transition-colors",
              selectedChildId === it.id
                ? "bg-g6-primary-bg"
                : "hover:bg-g6-bg-spotlight"
            )}
          >
            <span className="text-g6-sm font-medium text-g6-text">{it.primary}</span>
            {it.secondary && (
              <span className="text-g6-xs text-g6-text-tertiary">{it.secondary}</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

function BrandOverviewPane({ brandId }: { brandId: string }) {
  const brand = brands.find((b) => b.id === brandId);
  const prods = productsForBrand(brandId);
  if (!brand) return null;

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h2 className="font-g6-sans text-g6-h3 font-bold text-g6-text">{brand.name}</h2>
        <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{brand.domain}</p>
        <p className="text-g6-base text-g6-text-secondary">{brand.tone}</p>
        <Link
          to={`/iq/genie6/settings/brands/${brand.id}`}
          className="inline-flex items-center gap-1 font-g6-mono text-g6-xs text-g6-text-secondary underline-offset-2 hover:text-g6-text hover:underline"
        >
          Edit profile in Settings <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      <section className="space-y-2">
        <h3 className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          Products ({prods.length})
        </h3>
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {prods.map((p) => (
            <li
              key={p.id}
              className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3"
            >
              <p className="text-g6-sm font-medium text-g6-text">{p.name}</p>
              <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{p.price}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          Identity
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-g6-sm">
          <dt className="text-g6-text-tertiary">Voice</dt>
          <dd className="text-g6-text">{brand.voice}</dd>
          <dt className="text-g6-text-tertiary">USPs</dt>
          <dd className="text-g6-text">{brand.usps?.join(" · ") ?? "—"}</dd>
          <dt className="text-g6-text-tertiary">Colors</dt>
          <dd className="flex gap-1.5">
            {brand.colors?.map((c) => (
              <span
                key={c}
                title={c}
                className="inline-block h-4 w-4 rounded-full border border-g6-border-secondary"
                style={{ background: c }}
              />
            ))}
          </dd>
        </dl>
      </section>

      {brand.competitors && brand.competitors.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Competitors ({brand.competitors.length})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {brand.competitors.map((cId) => {
              const known = brands.find((b) => b.id === cId);
              const label =
                known?.name ??
                cId
                  .split("-")
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join(" ");
              return (
                <span
                  key={cId}
                  className="inline-flex items-center gap-1.5 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-2.5 py-0.5 text-g6-xs text-g6-text-secondary"
                >
                  {known && (
                    <span
                      aria-hidden
                      title="In workspace"
                      className="inline-block h-1.5 w-1.5 rounded-full bg-g6-primary"
                    />
                  )}
                  {label}
                </span>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function ChildDetailPane({
  section,
  id,
  brandId,
}: {
  section: Section;
  id: string;
  brandId: string;
}) {
  if (section === "products") {
    const product = productsForBrand(brandId).find((p) => p.id === id);
    if (!product) return null;
    return (
      <div className="space-y-4 p-6">
        <header>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Product</p>
          <h2 className="text-g6-h3 font-bold text-g6-text">{product.name}</h2>
          <p className="font-g6-mono text-g6-base text-g6-text-secondary">{product.price}</p>
        </header>
        {product.thumbnail && (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="h-48 w-full rounded-g6-card object-cover"
          />
        )}
        <ul className="list-disc space-y-1 pl-5 text-g6-sm text-g6-text-secondary">
          {product.benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        {product.promo && (
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-success">
            {product.promo}
          </p>
        )}
      </div>
    );
  }

  if (section === "concepts") {
    const concept = concepts.find((c) => c.id === id);
    if (!concept) return null;
    return (
      <div className="space-y-4 p-6">
        <header>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Concept</p>
          <h2 className="text-g6-h3 font-bold text-g6-text">{concept.name}</h2>
        </header>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-g6-sm">
          <dt className="text-g6-text-tertiary">Angle</dt>
          <dd className="text-g6-text">{concept.angle}</dd>
          <dt className="text-g6-text-tertiary">Hook</dt>
          <dd className="text-g6-text">{concept.hook}</dd>
          <dt className="text-g6-text-tertiary">Tone</dt>
          <dd className="text-g6-text">{concept.tone}</dd>
          <dt className="text-g6-text-tertiary">Format</dt>
          <dd className="text-g6-text">{concept.format}</dd>
        </dl>
      </div>
    );
  }

  if (section === "variants") {
    const output = sampleOutputs.find((o) => o.id === id);
    if (!output) return null;
    return (
      <div className="p-6">
        <OutputCard
          {...output}
          selectable={false}
          onSave={() => {}}
          onLaunch={() => {}}
          onDownload={() => {}}
        />
      </div>
    );
  }

  // audiences / angles — simple text-only detail
  return (
    <div className="p-6">
      <p className="text-g6-base text-g6-text-secondary">
        Selected {section} · {id}. Detail view coming soon.
      </p>
    </div>
  );
}

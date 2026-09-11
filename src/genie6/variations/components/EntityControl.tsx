import { useMemo, useState } from "react";
import {
  Building2,
  Check,
  Layers,
  Package,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { brands, getBrand } from "@/mocks/shared/brands";
import { categories, getCategory } from "@/mocks/shared/categories";
import { getProduct, products, productsForCategory } from "@/mocks/shared/products";
import type { EntitySelection } from "../types";

/**
 * EntityControl — the Brand / Product / Category control for ASSET variations
 * (Part 2). On a whole ad the entity is a read-only analysis row; on an asset
 * it is optional and editable: "B/P/C+P optional hai to add or remove and if
 * already there then remove or change" (Maalik, 2026-09-09).
 *
 * Empty is a first-class final state meaning Auto, not a validation failure —
 * it reuses ContextRail's Auto/Set chip grammar so a user who learned it on
 * Angle reads it here without relearning.
 *
 * §7.2 — `detectedLabel` is DISPLAY TEXT and is never resolved to an id. The
 * source of an asset variation can be a competitor's ad, so "helpfully"
 * pre-selecting what the analysis detected would tell the user to write an
 * asset for a rival. There is deliberately no "use this" affordance here.
 */

interface EntityControlProps {
  value: EntitySelection;
  onChange: (next: EntitySelection) => void;
  /** What the analysis detected on the source, for the "currently" hint. */
  detectedLabel?: string | null;
  /** True when the source is a rival's — changes the hint's copy only. */
  detectedIsCompetitor?: boolean;
  className?: string;
}

type Pane = "brand" | "cp";
type CpTab = "category" | "product";

/** How many rows a list shows before it asks for a search term instead. */
const LIST_CAP = 40;

/**
 * The clearing rules, kept behaviourally identical to `entitySelectionPatch()`
 * in studio-v4/state/useWizard.ts under the Performance-Ad rule this control
 * mirrors (`kinds: [category, product]`, `required: category`, `also:
 * [product]`): category+product coexist, brand is exclusive of both. Importing
 * that function is not allowed here (it patches WizardState, not
 * EntitySelection) so the rule is re-expressed — not re-derived — over the
 * three fields of `EntitySelection`.
 */
function selectBrand(id: string | null): EntitySelection {
  return { brandId: id, productId: null, categoryId: null };
}

function selectCategory(value: EntitySelection, id: string | null): EntitySelection {
  return { brandId: null, categoryId: id, productId: value.productId ?? null };
}

/**
 * Picking a product keeps the category and clears the brand, as the patch
 * does. The one divergence: the patch cannot ADD, so it would leave a product
 * sitting under an unrelated (or absent) category. Here the product's own
 * `categoryId` fills or corrects that, because an incoherent category+product
 * pair is exactly what this control exists to make easy to get right.
 */
function selectProduct(id: string | null): EntitySelection {
  if (!id) return { brandId: null, productId: null, categoryId: null };
  const product = getProduct(id);
  return {
    brandId: null,
    productId: id,
    categoryId: product?.categoryId ?? null,
  };
}

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

export function EntityControl({
  value,
  onChange,
  detectedLabel,
  detectedIsCompetitor,
  className,
}: EntityControlProps) {
  const [pane, setPane] = useState<Pane | null>(null);
  const [cpTab, setCpTab] = useState<CpTab>("category");
  const [query, setQuery] = useState("");

  const brand = value.brandId ? getBrand(value.brandId) : undefined;
  const category = value.categoryId ? getCategory(value.categoryId) : undefined;
  const product = value.productId ? getProduct(value.productId) : undefined;

  const isAuto = !brand && !category && !product;

  const openPane = (next: Pane, tab?: CpTab) => {
    setPane(next);
    if (tab) setCpTab(tab);
    setQuery("");
  };

  const closePane = () => {
    setPane(null);
    setQuery("");
  };

  const brandRows = useMemo(
    () => brands.filter((b) => matches(query, b.name, b.category, b.domain)),
    [query],
  );

  const categoryRows = useMemo(
    () => categories.filter((c) => matches(query, c.name, c.id)),
    [query],
  );

  /* Products are scoped to the chosen category when there is one — that is the
     path where a coherent pair is the default rather than a thing to notice.
     A query escapes the scope, which is the only way a cross-category pick can
     happen, and `selectProduct` then corrects the category to match. */
  const scopeCategoryId = query ? null : (value.categoryId ?? null);
  const productScoped = scopeCategoryId !== null;
  const productRows = useMemo(() => {
    const pool = scopeCategoryId ? productsForCategory(scopeCategoryId) : products;
    return pool.filter((p) =>
      matches(query, p.name, getBrand(p.brandId)?.name, getCategory(p.categoryId ?? "")?.name),
    );
  }, [query, scopeCategoryId]);

  return (
    <section
      className={cn(
        "rounded-g6-xl border border-g6-border bg-g6-bg-container",
        className,
      )}
    >
      {/* ---------------------------------------------------------- header */}
      <header className="flex items-start justify-between gap-4 border-b border-g6-border-secondary px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
              Brand / Product / Category
            </p>
            <StateChip isAuto={isAuto} />
          </div>
          <p className="mt-1 text-[11px] leading-4 text-g6-text-secondary">
            Optional. Attach one if these variations are for something specific —
            or leave it on Auto.
          </p>
        </div>
        {!isAuto && (
          <button
            type="button"
            onClick={() => {
              onChange({ brandId: null, productId: null, categoryId: null });
              closePane();
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-container px-2 py-1 text-[11px] font-semibold leading-4 text-g6-text-secondary hover:border-g6-primary-border hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Back to Auto
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3 px-4 py-3">
        {/* ------------------------------------------------ what is attached */}
        {isAuto ? (
          /* Auto is a FINAL answer, not an unfilled field. The soft lime surface
             plus the accented clause say so; the chip above still distinguishes
             Auto (outline) from Set (filled), so this doesn't blur the two. */
          <p className="rounded-g6-base bg-g6-primary-bg px-3 py-2 text-g6-sm leading-snug text-g6-text-secondary">
            Nothing attached — generation will infer the brand, product or category
            from the source.{" "}
            <span className="font-medium text-g6-primary-active">
              That is a complete answer
            </span>
            ; you only need to attach one to override it.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {brand && (
              <AttachedRow
                kind="Brand"
                Icon={Building2}
                name={brand.name}
                context={brand.category}
                onChange={() => openPane("brand")}
                onRemove={() => onChange(selectBrand(null))}
              />
            )}
            {category && (
              <AttachedRow
                kind="Category"
                Icon={Layers}
                name={category.name}
                context={
                  product ? `Paired with ${product.name}` : "Product optional"
                }
                onChange={() => openPane("cp", "category")}
                onRemove={() => onChange(selectCategory(value, null))}
              />
            )}
            {product && (
              <AttachedRow
                kind="Product"
                Icon={Package}
                name={product.name}
                /* The product's brand is shown as CONTEXT, never written to
                   `brandId` — picking a product clears brand, as the patch does. */
                context={[getBrand(product.brandId)?.name, product.price]
                  .filter(Boolean)
                  .join(" · ")}
                onChange={() => openPane("cp", "product")}
                onRemove={() => onChange(selectProduct(null))}
              />
            )}
          </div>
        )}

        {/* --------------------------------------------------- the kind choice */}
        {/* Two intents, not one flat roster of 200 things: pick the KIND first,
            then the item. Picking a brand and picking a category+product are
            mutually exclusive, and the buttons say so. */}
        {pane === null && (
          <div className="flex flex-wrap gap-2">
            <KindButton
              Icon={Building2}
              label={brand ? "Change brand" : "Add a brand"}
              hint={`${brands.length} brands`}
              active={!!brand}
              onClick={() => openPane("brand")}
            />
            <KindButton
              Icon={Layers}
              label={category || product ? "Change category + product" : "Add a category + product"}
              hint="Category, product, or both"
              active={!!category || !!product}
              onClick={() => openPane("cp", category ? "product" : "category")}
            />
          </div>
        )}

        {/* --------------------------------------------------------- the picker */}
        {pane !== null && (
          <div className="flex flex-col gap-2 rounded-g6-base border border-g6-border bg-g6-bg-base p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                {pane === "brand" ? (
                  <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
                    Pick a brand
                  </p>
                ) : (
                  <div role="tablist" aria-label="Category or product" className="flex gap-1">
                    <SubTab
                      label="Category"
                      active={cpTab === "category"}
                      onClick={() => {
                        setCpTab("category");
                        setQuery("");
                      }}
                    />
                    <SubTab
                      label="Product"
                      active={cpTab === "product"}
                      onClick={() => {
                        setCpTab("product");
                        setQuery("");
                      }}
                    />
                  </div>
                )}
              </div>
              {/* Explicit close only — overlays and panels in this app never
                  dismiss on an outside click. */}
              <button
                type="button"
                onClick={closePane}
                className="inline-flex shrink-0 items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-container px-2 py-1 text-[11px] font-semibold leading-4 text-g6-text hover:border-g6-primary-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
              >
                <X className="h-3 w-3" aria-hidden />
                Close
              </button>
            </div>

            {pane === "brand" && (
              <p className="text-[11px] leading-4 text-g6-text-secondary">
                A brand replaces any category or product you have attached — they
                are different intents, so only one stands at a time.
              </p>
            )}

            {pane === "cp" && cpTab === "product" && (
              <p className="text-[11px] leading-4 text-g6-text-secondary">
                {productScoped
                  ? `Showing products in ${category?.name ?? "the chosen category"} — search to look outside it.`
                  : "Picking a product also sets its category, so the pair always matches."}
              </p>
            )}

            <SearchField
              value={query}
              onChange={setQuery}
              label={
                pane === "brand"
                  ? "Search brands"
                  : cpTab === "category"
                    ? "Search categories"
                    : "Search products"
              }
              count={
                pane === "brand"
                  ? brandRows.length
                  : cpTab === "category"
                    ? categoryRows.length
                    : productRows.length
              }
            />

            <div className="max-h-64 overflow-y-auto pr-0.5">
              {pane === "brand" && (
                <OptionList
                  rows={brandRows.slice(0, LIST_CAP).map((b) => ({
                    id: b.id,
                    name: b.name,
                    context: b.category,
                    selected: value.brandId === b.id,
                  }))}
                  total={brandRows.length}
                  Icon={Building2}
                  onPick={(id) => {
                    onChange(selectBrand(id));
                    closePane();
                  }}
                  emptyLabel="No brand matches that."
                />
              )}

              {pane === "cp" && cpTab === "category" && (
                <OptionList
                  rows={categoryRows.slice(0, LIST_CAP).map((c) => ({
                    id: c.id,
                    name: c.name,
                    context: `${c.winnerCount} winners`,
                    selected: value.categoryId === c.id,
                  }))}
                  total={categoryRows.length}
                  Icon={Layers}
                  onPick={(id) => {
                    onChange(selectCategory(value, id));
                    /* Category alone is a valid answer, so the panel stays open
                       on the Product tab rather than assuming they want one. */
                    setCpTab("product");
                    setQuery("");
                  }}
                  emptyLabel="No category matches that."
                />
              )}

              {pane === "cp" && cpTab === "product" && (
                <OptionList
                  rows={productRows.slice(0, LIST_CAP).map((p) => ({
                    id: p.id,
                    name: p.name,
                    context: [getBrand(p.brandId)?.name, getCategory(p.categoryId ?? "")?.name]
                      .filter(Boolean)
                      .join(" · "),
                    selected: value.productId === p.id,
                  }))}
                  total={productRows.length}
                  Icon={Package}
                  onPick={(id) => {
                    onChange(selectProduct(id));
                    closePane();
                  }}
                  emptyLabel="No product matches that."
                />
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------- the detected hint */}
        {/* §7.2 — read-only, and there is no control that turns it into a
            selection. The asset may have come from a rival's ad.
            The copy tracks `value`: once something IS attached, "not attached"
            is a false claim sitting under the row that says otherwise. */}
        {detectedLabel ? (
          <p className="flex items-start gap-1.5 border-t border-g6-border-secondary pt-2.5 text-[11px] leading-4 text-g6-text-tertiary">
            <Sparkles className="mt-px h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0">
              Currently on the source:{" "}
              <span className="font-medium text-g6-text-secondary">{detectedLabel}</span>.{" "}
              {detectedIsCompetitor
                ? isAuto
                  ? "That belongs to a competitor — shown for reference only, and never attached. Attach your own above."
                  : "That belongs to a competitor — reference only. What you attached above is what these use."
                : isAuto
                  ? "Not attached — attach it above if you want it, or leave Auto."
                  : "Reference only — what you attached above is what these variations use."}
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ pieces */

/** ContextRail's Auto/Set grammar — Auto is a real answer, never a placeholder. */
function StateChip({ isAuto }: { isAuto: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-g6-pill px-1.5 py-0.5 font-g6-mono text-[9px] font-semibold uppercase tracking-wider",
        isAuto
          ? "border border-g6-border bg-g6-bg-container text-g6-text-secondary"
          : "border border-g6-primary-border bg-g6-primary-bg text-g6-primary",
      )}
    >
      {isAuto ? "Auto" : "Set"}
    </span>
  );
}

/** One attached entity. Change and Remove sit together — taking it off is
 *  exactly as reachable as putting it on. */
function AttachedRow({
  kind,
  Icon,
  name,
  context,
  onChange,
  onRemove,
}: {
  kind: string;
  Icon: React.ElementType;
  name: string;
  context?: string;
  onChange: () => void;
  onRemove: () => void;
}) {
  return (
    /* Full lime tint, not the 40% wash it had: "attached" is the state this
       whole control exists to make unmistakable at a glance. */
    <div className="flex items-center gap-2.5 rounded-g6-base border border-g6-primary-border bg-g6-primary-bg px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-g6-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
          {kind}
        </p>
        {/* 60-char names truncate rather than reflow the row; full text on hover. */}
        <p title={name} className="truncate text-g6-sm font-medium leading-tight text-g6-text">
          {name}
        </p>
        {context ? (
          <p title={context} className="truncate text-[11px] leading-4 text-g6-text-secondary">
            {context}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-g6-pill px-1.5 py-1 text-[11px] font-semibold leading-4 text-g6-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
      >
        Change
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${kind.toLowerCase()} ${name}`}
        className="shrink-0 rounded-g6-pill border border-g6-border bg-g6-bg-container p-1 text-g6-text-tertiary hover:border-g6-border hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

function KindButton({
  Icon,
  label,
  hint,
  active,
  onClick,
}: {
  Icon: React.ElementType;
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-w-0 flex-1 items-center gap-2 rounded-g6-base border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
        active
          ? "border-g6-primary-border bg-g6-bg-container hover:bg-g6-bg-muted"
          : "border-dashed border-g6-border bg-g6-bg-container hover:border-g6-primary-border hover:bg-g6-bg-muted",
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-g6-sm bg-g6-bg-muted">
        {active ? (
          <Icon className="h-3.5 w-3.5 text-g6-text-secondary" aria-hidden />
        ) : (
          <Plus className="h-3.5 w-3.5 text-g6-text-secondary" aria-hidden />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-g6-sm font-medium leading-tight text-g6-text">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-4 text-g6-text-secondary">
          {hint}
        </span>
      </span>
    </button>
  );
}

function SubTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-g6-pill px-2.5 py-1 font-g6-mono text-[9px] font-semibold uppercase tracking-[0.12em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
        active
          ? "border border-g6-primary-border bg-g6-primary-bg text-g6-primary"
          : "border border-g6-border bg-g6-bg-container text-g6-text-secondary hover:text-g6-text",
      )}
    >
      {label}
    </button>
  );
}

function SearchField({
  value,
  onChange,
  label,
  count,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
  count: number;
}) {
  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-g6-text-tertiary"
        aria-hidden
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        placeholder={`${label} (${count})`}
        className="w-full rounded-g6-pill border border-g6-border bg-g6-bg-container py-1.5 pl-9 pr-8 text-g6-sm text-g6-text outline-none placeholder:text-g6-text-tertiary focus-visible:border-g6-primary-border focus-visible:ring-2 focus-visible:ring-g6-primary-border"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-g6-pill p-0.5 text-g6-text-tertiary hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

interface OptionRow {
  id: string;
  name: string;
  context?: string;
  selected: boolean;
}

function OptionList({
  rows,
  total,
  Icon,
  onPick,
  emptyLabel,
}: {
  rows: OptionRow[];
  /** Pre-cap count, so the "narrow it down" line can be honest. */
  total: number;
  Icon: React.ElementType;
  onPick: (id: string) => void;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-1 py-3 text-g6-sm text-g6-text-tertiary">{emptyLabel}</p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {rows.map((row) => (
        <button
          key={row.id}
          type="button"
          onClick={() => onPick(row.id)}
          aria-pressed={row.selected}
          className={cn(
            "flex w-full min-w-0 items-center gap-2.5 rounded-g6-sm border px-2.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
            row.selected
              ? "border-g6-primary-border bg-g6-primary-bg"
              : "border-transparent hover:bg-g6-bg-muted",
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-g6-text-tertiary" aria-hidden />
          <span className="min-w-0 flex-1">
            <span
              title={row.name}
              className="block truncate text-g6-sm leading-tight text-g6-text"
            >
              {row.name}
            </span>
            {row.context ? (
              <span
                title={row.context}
                className="block truncate text-[11px] leading-4 text-g6-text-secondary"
              >
                {row.context}
              </span>
            ) : null}
          </span>
          {row.selected ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-g6-primary" aria-hidden />
          ) : null}
        </button>
      ))}
      {total > rows.length ? (
        <p className="px-1 pt-1 text-[11px] leading-4 text-g6-text-tertiary">
          Showing {rows.length} of {total} — search to narrow it down.
        </p>
      ) : null}
    </div>
  );
}

export default EntityControl;

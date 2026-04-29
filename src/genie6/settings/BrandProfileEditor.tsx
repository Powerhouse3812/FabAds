import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronLeft, Plus } from "lucide-react";
import { getBrand } from "../mocks/brands";
import { productsForBrand } from "../mocks/products";
import { categories } from "../mocks/categories";

export function BrandProfileEditor() {
  const { brandId } = useParams<{ brandId: string }>();
  const brand = brandId ? getBrand(brandId) : null;

  if (!brand) return <Navigate to="/iq/genie6/settings/brands" replace />;

  const prods = productsForBrand(brand.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        to="/iq/genie6/settings/brands"
        className="mb-4 inline-flex items-center gap-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary hover:text-g6-text"
      >
        <ChevronLeft className="h-3 w-3" /> Brands
      </Link>

      {/* Brand header card */}
      <header className="mb-6 flex items-center gap-4 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-5">
        {brand.logo ? (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-g6-card bg-white p-2 shadow-g6-sm">
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-g6-card font-g6-sans text-g6-h2 font-bold"
            style={{ backgroundColor: brand.colors[0], color: brand.colors[1] ?? "#fff" }}
          >
            {brand.name[0]}
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-g6-sans text-g6-h3 font-bold text-g6-text">{brand.name}</h1>
          <p className="mt-1 font-g6-mono text-g6-sm text-g6-text-secondary">{brand.domain}</p>
          <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">
            {brand.category} · {brand.tone}
          </p>
        </div>
      </header>

      <Section title="Identity">
        <Field label="Fonts">
          <span className="font-g6-mono text-g6-base text-g6-text">
            {brand.fonts.display} · {brand.fonts.body}
          </span>
        </Field>
        <Field label="Colors">
          <div className="flex items-center gap-2">
            {brand.colors.map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-5 w-5 rounded-g6-sm border border-g6-border-secondary"
                  style={{ backgroundColor: c }}
                />
                <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{c}</span>
              </span>
            ))}
          </div>
        </Field>
        <Field label="Voice">
          <span className="text-g6-base text-g6-text">{brand.voice}</span>
        </Field>
        <Field label="USPs">
          <div className="flex flex-wrap gap-1.5">
            {brand.usps.map((u) => (
              <span
                key={u}
                className="inline-flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-2 py-0.5 font-g6-mono text-g6-xs text-g6-text-secondary"
              >
                {u}
              </span>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Compliance per category">
        <ul className="divide-y divide-g6-border-secondary">
          {categories.slice(0, 2).map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="font-g6-sans text-g6-base font-semibold text-g6-text">{c.name}</p>
                <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{c.instruction}</p>
              </div>
            </li>
          ))}
          <li className="pt-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 font-g6-mono text-g6-xs text-g6-text-secondary hover:text-g6-text"
            >
              <Plus className="h-3 w-3" /> Add category override
            </button>
          </li>
        </ul>
      </Section>

      <Section title={`Competitors (${brand.competitors.length})`}>
        <p className="-mt-1 mb-2 text-g6-xs text-g6-text-tertiary">
          Competitor brands AI references when generating ads — for comparison angles + differentiation hooks.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {brand.competitors.map((cId) => {
            const known = getBrand(cId);
            const label = known?.name ?? humanize(cId);
            return (
              <span
                key={cId}
                className="inline-flex items-center gap-1.5 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-2.5 py-1 font-g6-sans text-g6-sm text-g6-text"
              >
                {known && (
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-g6-primary"
                    title="In your workspace"
                  />
                )}
                {label}
              </span>
            );
          })}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-g6-pill border border-dashed border-g6-border bg-transparent px-2.5 py-1 font-g6-mono text-g6-xs text-g6-text-secondary hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
          >
            <Plus className="h-3 w-3" /> Add competitor
          </button>
        </div>
      </Section>

      <Section title={`Products (${prods.length})`}>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {prods.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-g6-card border border-g6-border-secondary bg-g6-bg-base"
            >
              <div className="aspect-square bg-g6-bg-spotlight">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-2">
                <p className="truncate font-g6-sans text-g6-sm font-medium text-g6-text">
                  {p.name}
                </p>
                <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{p.price}</p>
              </div>
            </li>
          ))}
          <li className="flex aspect-square items-center justify-center rounded-g6-card border border-dashed border-g6-border bg-transparent text-g6-text-tertiary hover:border-g6-primary-border hover:bg-g6-primary-bg">
            <button type="button" className="flex flex-col items-center gap-1">
              <Plus className="h-4 w-4" />
              <span className="font-g6-mono text-g6-xs">Add product</span>
            </button>
          </li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
        {title}
      </h2>
      <div className="space-y-3 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4">
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-3">
      <dt className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Turn a slug like "the-derma-co" into "The Derma Co" for display. */
function humanize(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

import { Link } from "react-router-dom";
import { Plus, ChevronLeft } from "lucide-react";
import { brands } from "../mocks/brands";
import { productsForBrand } from "../mocks/products";
import { AddBrandModal } from "./AddBrandModal";

export function BrandSettings() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        to="/iq/genie6/settings"
        className="mb-4 inline-flex items-center gap-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary hover:text-g6-text"
      >
        <ChevronLeft className="h-3 w-3" /> Settings
      </Link>

      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-g6-sans text-g6-h2 font-bold text-g6-text">Brand Settings</h1>
          <p className="mt-1 text-g6-base text-g6-text-secondary">
            Per-brand profiles drive identity, voice, compliance, and competitor linkage across all
            generations.
          </p>
        </div>

        <AddBrandModal
          trigger={
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover"
            >
              <Plus className="h-4 w-4" /> Add brand
            </button>
          }
        />
      </header>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {brands.map((b) => {
          const prods = productsForBrand(b.id);
          return (
            <li key={b.id}>
              <Link
                to={`/iq/genie6/settings/brands/${b.id}`}
                className="group flex items-center gap-4 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg"
              >
                <div
                  aria-hidden
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-g6-base font-g6-sans text-g6-h4 font-bold"
                  style={{ backgroundColor: b.colors[0], color: b.colors[1] ?? "#fff" }}
                >
                  {b.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-g6-sans text-g6-base font-semibold text-g6-text">{b.name}</h2>
                  <p className="truncate font-g6-mono text-g6-xs text-g6-text-tertiary">
                    {b.domain} · {b.category}
                  </p>
                  <p className="mt-1 font-g6-mono text-g6-xs text-g6-text-secondary">
                    {prods.length} products · {b.competitors.length} competitors
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

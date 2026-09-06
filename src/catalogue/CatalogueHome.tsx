import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { groupedAssetTypes } from "./assetTypes";
import { useCatalogueWrites } from "./catalogue-write-store";
import { CreditsPill } from "./CatalogueShared";

/**
 * Catalogue home — the grouped picker Genie 2.0 §9/§21.1 asks for:
 * "The two groups must be visible in the surface — a grouped picker, not
 * one flat list of 14 types" (Miller's 7±2: fourteen undifferentiated
 * entries is a wall). Nothing rendered this before — `/catalogue` just
 * redirected straight to `/catalogue/categories`.
 *
 * Driven entirely by `groupedAssetTypes()` — adding a 15th type never
 * touches this file.
 *
 * Routing note: this component is NOT wired into a route yet (routes are
 * owned by the wiring agent — see this agent's final report). It should
 * replace the `<Route path="catalogue" element={<Navigate .../>} />`
 * redirect in `src/App.tsx`.
 */
export function CatalogueHome() {
  const navigate = useNavigate();
  const writes = useCatalogueWrites();
  const groups = groupedAssetTypes();

  return (
    <div className="v3-page-mesh flex h-full flex-col overflow-y-auto p-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Catalogue</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every input asset FabAds and Genie work from — business truth and creative building
            blocks, in one place.
          </p>
        </div>
        <CreditsPill />
      </header>

      <div className="space-y-8">
        {groups.map(({ group, label, types }) => (
          <section key={group}>
            <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {types.map((def) => {
                const count = def.resolve().length;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => navigate(`/catalogue/${def.id}`)}
                    className="group flex flex-col gap-2 rounded-xl border border-border bg-background p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <def.icon className="h-4 w-4 text-primary" />
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{def.label}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                        {def.description}
                      </p>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
                      {count} {count === 1 ? def.singular.toLowerCase() : def.label.toLowerCase()}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {/* Subscribing to writes keeps the per-type counts live as the user
          adds/archives/deletes assets elsewhere in the Catalogue. */}
      <span className="sr-only" aria-hidden data-writes-version={writes.version} />
    </div>
  );
}

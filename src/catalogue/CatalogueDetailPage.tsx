import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Package, Tag, Building2 } from "lucide-react";
import { brands, categories, products } from "@/mocks/shared";

type CatalogueType = "categories" | "brands" | "products";

/**
 * Catalogue entity detail — stub for iter-6 A-9.
 *
 * Displays the entity's full metadata + linked relations. Real entity-level
 * sub-nav (Products / KB / Generations / Targeting Templates / Linked Folder /
 * Campaign URLs / etc. tabs) ships in the next sprint per A-1's planning.
 */
export function CatalogueDetailPage({ type }: { type: CatalogueType }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <div className="p-6 text-muted-foreground">Missing entity id.</div>;

  if (type === "brands") {
    const brand = brands.find((b) => b.id === id);
    if (!brand) return <NotFound type={type} navigate={navigate} />;
    const linkedProducts = products.filter((p) => p.brandId === brand.id);
    const linkedCategories = categories.filter((c) => brand.categoryIds?.includes(c.id));
    return (
      <Shell type={type} title={brand.name} subtitle={brand.domain} icon={<Building2 className="h-5 w-5" />}>
        <Section title="Brand voice"><p className="text-sm text-foreground">{brand.voice}</p></Section>
        <Section title="USPs">
          <div className="flex flex-wrap gap-1.5">
            {brand.usps.map((u) => (
              <span key={u} className="text-xs rounded bg-muted px-2 py-1 text-muted-foreground">{u}</span>
            ))}
          </div>
        </Section>
        <Section title={`Categories · ${linkedCategories.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {linkedCategories.map((c) => (
              <Link key={c.id} to={`/catalogue/categories/${c.id}`}
                className="text-xs rounded bg-primary/10 text-primary px-2 py-1 hover:bg-primary/15">
                {c.name}
              </Link>
            ))}
          </div>
        </Section>
        <Section title={`Products · ${linkedProducts.length}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {linkedProducts.map((p) => (
              <Link key={p.id} to={`/catalogue/products/${p.id}`}
                className="rounded-lg border border-border p-3 text-sm hover:border-primary/40">
                <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.price}</p>
              </Link>
            ))}
          </div>
        </Section>
      </Shell>
    );
  }

  if (type === "categories") {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return <NotFound type={type} navigate={navigate} />;
    const linkedProducts = products.filter((p) => p.categoryId === cat.id);
    const linkedBrands = brands.filter((b) => b.categoryIds?.includes(cat.id));
    return (
      <Shell type={type} title={cat.name} subtitle={`${linkedBrands.length} brands · ${linkedProducts.length} products`} icon={<Tag className="h-5 w-5" />}>
        <Section title="KB instruction"><p className="text-sm text-foreground">{cat.instruction}</p></Section>
        <Section title={`Brands · ${linkedBrands.length}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {linkedBrands.map((b) => (
              <Link key={b.id} to={`/catalogue/brands/${b.id}`}
                className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:border-primary/40">
                {b.logo && <img src={b.logo} alt="" className="h-5 w-5 rounded" />}
                <span className="truncate">{b.name}</span>
              </Link>
            ))}
          </div>
        </Section>
        <Section title={`Products · ${linkedProducts.length}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {linkedProducts.map((p) => (
              <Link key={p.id} to={`/catalogue/products/${p.id}`}
                className="rounded-lg border border-border p-3 text-sm hover:border-primary/40">
                <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.price}</p>
              </Link>
            ))}
          </div>
        </Section>
      </Shell>
    );
  }

  // products
  const prod = products.find((p) => p.id === id);
  if (!prod) return <NotFound type={type} navigate={navigate} />;
  const brand = brands.find((b) => b.id === prod.brandId);
  const category = categories.find((c) => c.id === prod.categoryId);
  return (
    <Shell type={type} title={prod.name} subtitle={`${brand?.name}${category ? ` · ${category.name}` : ""}`} icon={<Package className="h-5 w-5" />}>
      <Section title="Price"><p className="text-2xl font-bold text-foreground font-mono">{prod.price}</p></Section>
      {prod.promo && <Section title="Promo"><span className="inline-block rounded bg-primary/15 text-primary px-2 py-1 text-sm">{prod.promo}</span></Section>}
      <Section title="Benefits">
        <ul className="space-y-1 text-sm text-foreground">
          {prod.benefits.map((b) => <li key={b}>· {b}</li>)}
        </ul>
      </Section>
      {prod.landingPages && prod.landingPages.length > 0 && (
        <Section title={`Landing pages · ${prod.landingPages.length}`}>
          <ul className="space-y-1">
            {prod.landingPages.map((lp) => (
              <li key={lp}>
                <a href={lp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  {lp} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {prod.campaignUrls && prod.campaignUrls.length > 0 && (
        <Section title={`Campaign URLs · ${prod.campaignUrls.length}`}>
          <ul className="space-y-1">
            {prod.campaignUrls.map((cu) => (
              <li key={cu}>
                <a href={cu} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground">
                  {cu} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Shell>
  );
}

/* Shared layout pieces */

function Shell({
  type,
  title,
  subtitle,
  icon,
  children,
}: {
  type: CatalogueType;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-5">
        <Link to={`/catalogue/${type}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3 w-3" /> Back to {type}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">{icon}</div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-5">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      {children}
    </section>
  );
}

function NotFound({ type, navigate }: { type: CatalogueType; navigate: (to: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <p className="text-foreground font-medium">Entity not found</p>
      <p className="text-sm text-muted-foreground mt-1">No {type.slice(0, -1)} matches that id.</p>
      <button type="button" onClick={() => navigate(`/catalogue/${type}`)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {type}
      </button>
    </div>
  );
}

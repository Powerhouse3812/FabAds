import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { brands as ALL_BRANDS } from "@/mocks/shared/brands";
import { products as ALL_PRODUCTS, getProduct } from "@/mocks/shared/products";
import { categories as ALL_CATEGORIES } from "@/mocks/shared/categories";
import { LaunchedBeforeCard } from "@/creative-report/components/LaunchedBeforeCard";
import { GenerateConceptsForm } from "./GenerateConceptsForm";

/**
 * GenerateConceptsPage — standalone /iq/genie6/concepts/generate route.
 * Wraps GenerateConceptsForm in the page surface (hero header + spacing)
 * and reads optional ?brand= / ?product= / ?category= from the URL to
 * pre-fill entity context.
 */

export function GenerateConceptsPage() {
  const [searchParams] = useSearchParams();
  const brandId = searchParams.get("brand");
  const productId = searchParams.get("product");
  const categoryId = searchParams.get("category");

  const entityContext = (() => {
    if (productId) {
      const p = ALL_PRODUCTS.find((x) => x.id === productId);
      if (p) return { type: "product" as const, id: p.id, label: p.name };
    }
    if (brandId) {
      const b = ALL_BRANDS.find((x) => x.id === brandId);
      if (b) return { type: "brand" as const, id: b.id, label: b.name };
    }
    if (categoryId) {
      const c = ALL_CATEGORIES.find((x) => x.id === categoryId);
      if (c) return { type: "category" as const, id: c.id, label: c.name };
    }
    return undefined;
  })();

  // findLaunchedBefore() only matches on brandId/categoryId — a "product"
  // entityContext's id is a PRODUCT id, so resolve it to its parent brand
  // before passing it through (never pass a product id where a brand id
  // is expected, it would silently fail to match).
  const launchedBeforeIds = (() => {
    if (!entityContext) return { brandId: undefined, categoryId: undefined };
    if (entityContext.type === "brand") {
      return { brandId: entityContext.id, categoryId: undefined };
    }
    if (entityContext.type === "product") {
      const product = getProduct(entityContext.id);
      return { brandId: product?.brandId, categoryId: undefined };
    }
    return { brandId: undefined, categoryId: entityContext.id };
  })();

  return (
    <div className="v3-page-mesh h-full overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pt-8 pb-16">
        <Link
          to="/iq/genie6/concepts"
          className="inline-flex w-max items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Concepts library
        </Link>

        {entityContext && (
          <div className="inline-flex w-max items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
            Context · {entityContext.label}
          </div>
        )}

        <LaunchedBeforeCard
          brandId={launchedBeforeIds.brandId}
          categoryId={launchedBeforeIds.categoryId}
        />

        <GenerateConceptsForm surface="page" entityContext={entityContext} />
      </div>
    </div>
  );
}

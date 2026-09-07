import { Navigate } from "react-router-dom";
import { groupedAssetTypes } from "./assetTypes";

/**
 * Catalogue home — Maalik's ruling: "I think there is a extra screen of
 * All Asset in catalogue. We can keep all assets in sub nav itself." The
 * grouped landing grid this component used to render is gone; every asset
 * type it listed now lives directly in the Catalogue sub-nav (see
 * `src/components/sidebar/modules.ts`), sectioned the same way (Business /
 * Creative) via the same `groupedAssetTypes()` source of truth.
 *
 * `src/App.tsx` (not owned by this pass) still routes bare `/catalogue` to
 * this component, so it stays mounted as a redirect rather than a route
 * change: it forwards to the first Business-asset type — Brands — instead
 * of rendering a now-redundant screen. Derived, not hardcoded, so it tracks
 * `ASSET_TYPE_ORDER` if that ever changes.
 */
export function CatalogueHome() {
  const firstType = groupedAssetTypes()[0]?.types[0]?.id ?? "brands";
  return <Navigate to={`/catalogue/${firstType}`} replace />;
}

import { Navigate } from "react-router-dom";
import { groupedAssetTypes } from "@/catalogue/assetTypes";

/**
 * Bare `/iq/genie6/assets` — forwards to the first Creative asset type
 * (Avatars), same "index is a redirect, not a landing grid" rule
 * `CatalogueHome` already follows for Business assets. Derived from
 * `groupedAssetTypes()` so it tracks the registry if that group ever
 * reorders, rather than a hardcoded "avatars".
 */
export function GenieAssetsHome() {
  const creative = groupedAssetTypes().find((g) => g.group === "creative");
  const firstType = creative?.types[0]?.id ?? "avatars";
  return <Navigate to={`/iq/genie6/assets/${firstType}`} replace />;
}

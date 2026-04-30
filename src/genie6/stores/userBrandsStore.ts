import { useSyncExternalStore } from "react";
import type { Brand, Product } from "../types/entities";

/**
 * userBrandsStore — runtime brand additions (BrandFetchModal saves land here).
 *
 * Module-level store with subscribe/getSnapshot pattern (matches
 * useGenie6Theme). The brands mock stays the seed library; user-added brands
 * concatenate. Survives across navigation but resets on reload (no
 * persistence yet — backend will replace this).
 */

let userBrands: Brand[] = [];
let userProducts: Product[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function addBrand(brand: Brand, products: Product[] = []) {
  userBrands = [...userBrands, brand];
  userProducts = [...userProducts, ...products];
  emit();
}

export function getUserBrandsSnapshot(): Brand[] {
  return userBrands;
}

export function getUserProductsSnapshot(): Product[] {
  return userProducts;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useUserBrands(): Brand[] {
  return useSyncExternalStore(subscribe, getUserBrandsSnapshot, getUserBrandsSnapshot);
}

export function useUserProducts(): Product[] {
  return useSyncExternalStore(subscribe, getUserProductsSnapshot, getUserProductsSnapshot);
}

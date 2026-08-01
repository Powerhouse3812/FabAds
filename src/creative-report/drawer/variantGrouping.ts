/**
 * variantGrouping — pure helper for grouping a rollup's surviving instances
 * by variantId. Split out of VariantsList.tsx so the component module only
 * exports the component (react-refresh/only-export-components) while
 * RelatedCreativesGrid (the 1100px overlay's bottom "similar ads" grid) can
 * still render the SAME variant grouping as visual tiles instead of
 * re-deriving it — one source of truth, no new data.
 */
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export interface VariantGroup {
  variantId: string;
  count: number;
}

/** Group a rollup's surviving instances by variantId, in first-seen order. */
export function groupVariants(rollup: CreativeRollup): VariantGroup[] {
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const inst of rollup.instances) {
    if (!counts.has(inst.variantId)) order.push(inst.variantId);
    counts.set(inst.variantId, (counts.get(inst.variantId) ?? 0) + 1);
  }
  return order.map((variantId) => ({ variantId, count: counts.get(variantId) ?? 0 }));
}

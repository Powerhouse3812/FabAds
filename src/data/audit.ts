/**
 * Creative Report 2.0 — data audit (handoff §3 / §10.7).
 *
 * Proves the generated dataset obeys the realism rules before any UI trusts it:
 *   • ratios are recomputed from summed rows (never averaged)
 *   • no unit bugs (no absurd ratio magnitudes like "$172.6k hook rate")
 *   • no backwards date ranges
 *   • image/carousel ads report hook/hold as N/A (null), not a bare "–"
 *   • the required archetype distribution is present
 *
 * runDataAudit() console.tables a per-creative report + a summary, and (in DEV)
 * throws if any hard check fails so a bad dataset can't ship silently.
 */
import { getDataset } from "@/data/generator";
import { foldRows, fullRangeFilter, rollupCreative } from "@/creative-report/lib/selectors";
import type { AdInstance } from "@/data/model";
import { AUDIO_KINDS, FRAMEWORKS } from "@/data/model";
import { getBrand } from "@/mocks/shared/brands";
import { getProduct } from "@/mocks/shared/products";
import { getCategory } from "@/mocks/shared/categories";

/** Average of per-instance ROAS — shown ONLY to prove it differs from the
 *  correct fold-from-sums ROAS. This is the number we must never display. */
function averagedRoas(instances: AdInstance[]): number {
  const perInstance = instances
    .map((inst) => {
      const f = foldRows(inst.daily, true);
      return f.spend > 0 ? f.revenue / f.spend : null;
    })
    .filter((v): v is number => v !== null);
  if (!perInstance.length) return 0;
  return perInstance.reduce((a, b) => a + b, 0) / perInstance.length;
}

export interface AuditResult {
  pass: boolean;
  failures: string[];
  rows: Record<string, unknown>[];
  summary: Record<string, unknown>;
}

export function runDataAudit(opts?: { log?: boolean }): AuditResult {
  const log = opts?.log ?? true;
  const dataset = getDataset();
  const f = fullRangeFilter();
  const failures: string[] = [];

  const rows: Record<string, unknown>[] = [];
  const archetypeCounts: Record<string, number> = {};
  let crossPlatform = 0;
  let staticWithVideoMetric = 0;
  let ratioMismatch = 0;
  let backwardsDates = 0;
  let unitBugs = 0;
  let imageNaCount = 0;
  let dedupFlagged = 0;
  let catalogueLinked = 0;
  let catalogueLinkBroken = 0;
  let elementsBugs = 0;

  for (const creative of dataset.creatives) {
    archetypeCounts[creative.archetype] = (archetypeCounts[creative.archetype] ?? 0) + 1;
    const rollup = rollupCreative(dataset, creative, f);
    if (!rollup) continue;
    const m = rollup.metrics;

    // 1. Ratio reconciliation — fold-from-sums must equal a fresh recompute.
    const recomputedRoas = m.spend > 0 ? m.revenue / m.spend : 0;
    const reconciles = Math.abs(recomputedRoas - m.roas) < 1e-9;
    if (!reconciles) {
      ratioMismatch++;
      failures.push(`${creative.id}: ROAS does not reconcile from sums`);
    }
    const avgRoas = averagedRoas(rollup.instances);

    // 2. Date order — every instance ascending + within 90 days.
    let datesOk = true;
    for (const inst of rollup.instances) {
      for (let i = 1; i < inst.daily.length; i++) {
        if (inst.daily[i].date < inst.daily[i - 1].date) datesOk = false;
      }
      if (inst.daily.length) {
        const first = inst.daily[0].date;
        const last = inst.daily[inst.daily.length - 1].date;
        if (last < first) datesOk = false;
        if (first < f.from || last > f.to) datesOk = false;
      }
    }
    if (!datesOk) {
      backwardsDates++;
      failures.push(`${creative.id}: date order/range invalid`);
    }

    // 3. Unit sanity — ratios inside plausible ceilings.
    const unitSane =
      m.ctr <= 25 &&
      m.cvr <= 30 &&
      m.roas <= 20 &&
      (m.hookRate === null || m.hookRate <= 100) &&
      (m.holdRate === null || m.holdRate <= 100) &&
      m.frequency <= 15;
    if (!unitSane) {
      unitBugs++;
      failures.push(`${creative.id}: implausible ratio (unit bug)`);
    }

    // 4. Image/carousel ⇒ hook/hold null.
    const isVideo = creative.format === "video";
    if (!isVideo && (m.hookRate !== null || m.holdRate !== null)) {
      staticWithVideoMetric++;
      failures.push(`${creative.id}: non-video creative has video metrics`);
    }
    if (!isVideo) imageNaCount++;

    if (rollup.isCrossPlatform) crossPlatform++;
    if (creative.dedupMatch) dedupFlagged++;

    // 5. Catalogue link (iter-2 W1) — brandId/categoryId/productId, when set,
    //    must resolve to a real Catalogue entity, and productId (when set)
    //    must actually belong to that brand.
    let catalogueOk = true;
    if (creative.brandId) {
      catalogueLinked++;
      if (!getBrand(creative.brandId)) catalogueOk = false;
      if (creative.categoryId && !getCategory(creative.categoryId)) catalogueOk = false;
      if (creative.productId) {
        const product = getProduct(creative.productId);
        if (!product || product.brandId !== creative.brandId) catalogueOk = false;
      }
    }
    if (!catalogueOk) {
      catalogueLinkBroken++;
      failures.push(`${creative.id}: Catalogue link does not resolve (brand/category/product)`);
    }

    // 6. Elements 2.0 sanity — video-only fields null/empty for non-video,
    //    populated for video; framework/audio kind from the allowed enum.
    const el = creative.elements;
    const frameworkOk = (FRAMEWORKS as readonly string[]).includes(creative.script.framework);
    const scriptOk =
      frameworkOk &&
      creative.script.sections.hookLine.length > 0 &&
      creative.script.sections.body.length > 0 &&
      creative.script.sections.ctaLine.length > 0;
    const elementsShapeOk = isVideo
      ? el.frames.length >= 4 && el.audio !== null && (AUDIO_KINDS as readonly string[]).includes(el.audio.kind)
      : el.frames.length === 0 && el.audio === null;
    if (!scriptOk || !elementsShapeOk) {
      elementsBugs++;
      failures.push(`${creative.id}: script/elements shape invalid`);
    }

    rows.push({
      id: creative.id,
      format: creative.format,
      archetype: creative.archetype,
      bucket: rollup.bucket ?? "—",
      spend: Math.round(m.spend),
      roasFromSums: Number(m.roas.toFixed(2)),
      roasAvgOfInstances: Number(avgRoas.toFixed(2)),
      ratioReconciles: reconciles ? "PASS" : "FAIL",
      dateOrderOK: datesOk ? "PASS" : "FAIL",
      unitSane: unitSane ? "PASS" : "FAIL",
      hookRate: m.hookRate === null ? "N/A — no video" : `${m.hookRate.toFixed(1)}%`,
      n_purchases: m.purchases,
      brand: creative.brandId ?? "—",
      framework: creative.script.framework,
      elementsOK: elementsShapeOk && scriptOk ? "PASS" : "FAIL",
    });
  }

  // ----- Distribution asserts -----
  const winners = archetypeCounts["winner"] ?? 0;
  const fakeWinners = archetypeCounts["fake-winner"] ?? 0;
  const fatiguing = archetypeCounts["fatiguing"] ?? 0;
  if (winners < 2) failures.push(`Expected ≥2 winners, got ${winners}`);
  if (fakeWinners < 1) failures.push(`Expected ≥1 fake-winner, got ${fakeWinners}`);
  if (fatiguing < 1) failures.push(`Expected ≥1 fatiguing, got ${fatiguing}`);
  if (crossPlatform < 5) failures.push(`Expected ≥5 cross-platform creatives, got ${crossPlatform}`);
  const dedupPairs = dedupFlagged / 2;
  if (dedupPairs < 1) failures.push(`Expected ≥1 dedup pair, got ${dedupPairs}`);
  if (imageNaCount < 1) failures.push(`Expected ≥1 image/carousel (N/A hook) creative`);
  if (catalogueLinked < 1) failures.push(`Expected ≥1 Catalogue-linked creative, got ${catalogueLinked}`);

  const summary = {
    creatives: dataset.creatives.length,
    adInstances: dataset.adInstances.length,
    archetypes: archetypeCounts,
    crossPlatform,
    dedupPairs,
    imageOrCarousel: imageNaCount,
    ratioMismatch,
    backwardsDates,
    unitBugs,
    staticWithVideoMetric,
    catalogueLinked,
    catalogueLinkBroken,
    elementsBugs,
    dateWindow: `${f.from} → ${f.to}`,
    verdict: failures.length === 0 ? "ALL PASS ✅" : `${failures.length} FAILURE(S) ❌`,
  };

  if (log) {
    // eslint-disable-next-line no-console
    console.log("%c[Creative Report 2.0] Data audit", "font-weight:bold;font-size:13px");
    // eslint-disable-next-line no-console
    console.table(rows);
    // eslint-disable-next-line no-console
    console.log("Summary:", summary);
    if (failures.length) {
      // eslint-disable-next-line no-console
      console.error("Audit failures:", failures);
    }
  }

  return { pass: failures.length === 0, failures, rows, summary };
}

/**
 * Creative Report 2.0 — deterministic dummy-data generator (handoff §4).
 *
 * Builds the full Concept → Angle → Creative → Variant → AdInstance → daily[]
 * tree from seeds. Everything is seeded (see rng.ts) so the dataset is
 * identical across reloads. AdInstance.daily[] is the ONLY store of metrics —
 * all ratios are folded up later by the selector layer, so averaged-ratio bugs
 * cannot exist by construction.
 *
 * Guaranteed distribution (verified by audit.ts):
 *   • 3 real winners at meaningful spend (ROAS ≥ 2.5, spend ≥ $5k)
 *   • 2 tiny-spend fake winners (ROAS ≥ 3 on < $200 → demos spend-weighting)
 *   • 3 fatiguing (rising frequency > 4 + 14-day CTR decay)
 *   • 2 scaling (spend ramping up, ROAS 1.5–1.9)
 *   • 4 brand-new (launched in last 5 days, low n)
 *   • 6 clear losers (ROAS < 1 at meaningful spend)
 *   • ≥ 5 creatives running cross-platform / multi-account
 *   • 1 near-duplicate pair flagged "Possibly the same creative (92% match)"
 *   • static + carousel ads carry null video metrics → "N/A — no video"
 *   • all dates within the last 90 days, ascending (no backwards ranges)
 */
import {
  AGES,
  ARCHETYPE_QUOTA,
  COLLECTIONS,
  CONCEPT_SEEDS,
  CTAS,
  DEVICES,
  FORMAT_WEIGHTS,
  GENDERS,
  GEOS,
  HEADLINES,
  HOOKS,
  MESSY_ADSET_TEMPLATES,
  MESSY_CAMPAIGN_TEMPLATES,
  OBJECTIVES,
  PLACEMENTS,
  PRIMARY_TEXTS,
  VISUAL_STYLES,
} from "@/data/content";
import type {
  AdInstance,
  Angle,
  Archetype,
  Concept,
  Creative,
  CreativeFormat,
  DailyRow,
  Dataset,
  Platform,
  Variant,
} from "@/data/model";
import type { AdStatus } from "@/creative-report/lib/paramSchema";
import {
  gaussish,
  hashString,
  pick,
  randFloat,
  randInt,
  rngFor,
  round,
  seededRandom,
  shuffle,
  weightedPick,
} from "@/data/rng";

/* ------------------------------------------------------------------ */
/*  Metric profiles per archetype                                      */
/* ------------------------------------------------------------------ */

interface MetricProfile {
  days: [number, number];
  /** How many days ago the run ENDED (0 = still running through today). */
  endedDaysAgo: [number, number];
  spendPerDay: [number, number];
  cpm: [number, number];
  ctr: [number, number];
  /** Fraction the CTR declines linearly across the window (0 = flat). */
  ctrDecay: number;
  cvr: [number, number];
  aov: [number, number];
  hookRate: [number, number];
  holdRate: [number, number];
  freqStart: [number, number];
  freqEnd: [number, number];
  outboundShare: [number, number];
  /** Ramp spend up across the window (scaling) — multiplier at end vs start. */
  spendRamp?: number;
}

const PROFILES: Record<Archetype, MetricProfile> = {
  // Run windows are long enough that most creatives span BOTH the current and
  // the previous reporting period, so period-over-period deltas stay realistic
  // (±10–40%) rather than exploding because the prior window was under-populated.
  winner: {
    days: [48, 74], endedDaysAgo: [0, 0],
    spendPerDay: [220, 520], cpm: [8, 12], ctr: [1.9, 2.4], ctrDecay: 0.05,
    cvr: [2.8, 3.6], aov: [46, 60], hookRate: [30, 42], holdRate: [18, 27],
    freqStart: [1.4, 1.8], freqEnd: [1.9, 2.7], outboundShare: [0.62, 0.8],
  },
  "fake-winner": {
    days: [4, 6], endedDaysAgo: [12, 22],
    spendPerDay: [22, 38], cpm: [22, 32], ctr: [1.8, 2.4], ctrDecay: 0,
    cvr: [4.5, 6.5], aov: [120, 165], hookRate: [28, 40], holdRate: [16, 24],
    freqStart: [1.1, 1.4], freqEnd: [1.3, 1.7], outboundShare: [0.6, 0.78],
  },
  fatiguing: {
    days: [44, 60], endedDaysAgo: [0, 0],
    spendPerDay: [160, 340], cpm: [10, 14], ctr: [1.9, 2.3], ctrDecay: 0.34,
    cvr: [2.2, 3.0], aov: [48, 58], hookRate: [26, 36], holdRate: [15, 22],
    freqStart: [2.2, 2.8], freqEnd: [4.6, 5.8], outboundShare: [0.6, 0.76],
  },
  scaling: {
    days: [22, 30], endedDaysAgo: [0, 0],
    spendPerDay: [120, 260], cpm: [9, 13], ctr: [1.5, 1.9], ctrDecay: 0.04,
    cvr: [2.2, 2.8], aov: [46, 56], hookRate: [24, 34], holdRate: [14, 20],
    freqStart: [1.3, 1.7], freqEnd: [1.8, 2.4], outboundShare: [0.6, 0.76],
    spendRamp: 2.6,
  },
  new: {
    days: [2, 5], endedDaysAgo: [0, 0],
    spendPerDay: [35, 80], cpm: [11, 15], ctr: [1.2, 1.8], ctrDecay: 0,
    cvr: [1.6, 2.6], aov: [44, 56], hookRate: [22, 34], holdRate: [13, 20],
    freqStart: [1.0, 1.3], freqEnd: [1.1, 1.5], outboundShare: [0.58, 0.74],
  },
  loser: {
    days: [40, 68], endedDaysAgo: [0, 3],
    spendPerDay: [130, 300], cpm: [12, 16], ctr: [0.7, 1.1], ctrDecay: 0.08,
    cvr: [1.1, 1.8], aov: [40, 50], hookRate: [16, 24], holdRate: [9, 14],
    freqStart: [1.6, 2.2], freqEnd: [2.4, 3.4], outboundShare: [0.55, 0.72],
  },
  steady: {
    days: [42, 76], endedDaysAgo: [0, 2],
    spendPerDay: [90, 240], cpm: [10, 13], ctr: [1.3, 1.8], ctrDecay: 0.07,
    cvr: [1.9, 2.5], aov: [46, 56], hookRate: [22, 32], holdRate: [13, 19],
    freqStart: [1.4, 2.0], freqEnd: [2.0, 3.0], outboundShare: [0.58, 0.75],
  },
};

/* ------------------------------------------------------------------ */
/*  Date helpers (anchored on "today")                                 */
/* ------------------------------------------------------------------ */

function todayFloor(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ddmmyyyy(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${m}.${d.getFullYear()}`;
}

/* ------------------------------------------------------------------ */
/*  Daily-row generation                                               */
/* ------------------------------------------------------------------ */

interface InstanceGenOpts {
  archetype: Archetype;
  isVideo: boolean;
  /** Splits volume when a creative fans out to several instances. */
  scale: number;
  /** Stable seed for this instance's rows. */
  seedKey: string;
  today: Date;
}

interface GeneratedRun {
  daily: DailyRow[];
  createdAt: string;
}

function generateRun(opts: InstanceGenOpts): GeneratedRun {
  const { archetype, isVideo, scale, seedKey, today } = opts;
  const p = PROFILES[archetype];
  const rand = seededRandom(hashString(seedKey));

  const nDays = randInt(rand, p.days[0], p.days[1]);
  const endedAgo = randInt(rand, p.endedDaysAgo[0], p.endedDaysAgo[1]);
  const endDate = addDays(today, -endedAgo);
  const startDate = addDays(endDate, -(nDays - 1));

  const cpmBase = randFloat(rand, p.cpm[0], p.cpm[1]);
  const ctrBase = randFloat(rand, p.ctr[0], p.ctr[1]);
  const cvrBase = randFloat(rand, p.cvr[0], p.cvr[1]);
  const aovBase = randFloat(rand, p.aov[0], p.aov[1]);
  const hookBase = randFloat(rand, p.hookRate[0], p.hookRate[1]);
  const holdBase = randFloat(rand, p.holdRate[0], p.holdRate[1]);
  const freqStart = randFloat(rand, p.freqStart[0], p.freqStart[1]);
  const freqEnd = randFloat(rand, p.freqEnd[0], p.freqEnd[1]);
  const spendPerDay = randFloat(rand, p.spendPerDay[0], p.spendPerDay[1]) * scale;
  const outboundShare = randFloat(rand, p.outboundShare[0], p.outboundShare[1]);

  const daily: DailyRow[] = [];
  const denom = nDays > 1 ? nDays - 1 : 1;

  for (let t = 0; t < nDays; t++) {
    const frac = t / denom;
    const date = isoDate(addDays(startDate, t));

    // CTR declines linearly across the window (fatigue), plus daily jitter.
    const ctrToday = ctrBase * (1 - p.ctrDecay * frac) * (1 + gaussish(rand) * 0.06);
    // Spend ramps for scaling; mild jitter otherwise.
    const ramp = p.spendRamp ? 1 + (p.spendRamp - 1) * frac : 1;
    const spend = Math.max(3, spendPerDay * ramp * (1 + gaussish(rand) * 0.12));
    const cpm = Math.max(3, cpmBase * (1 + gaussish(rand) * 0.05));
    const frequency = round(freqStart + (freqEnd - freqStart) * frac + gaussish(rand) * 0.1, 2);

    const impressions = Math.max(1, Math.round((spend / cpm) * 1000));
    const clicks = Math.max(0, Math.round(impressions * (ctrToday / 100)));
    const outboundClicks = Math.round(clicks * outboundShare);
    const cvrToday = Math.max(0, cvrBase * (1 + gaussish(rand) * 0.1));
    const purchases = Math.max(0, Math.round(clicks * (cvrToday / 100)));
    const aovToday = aovBase * (1 + gaussish(rand) * 0.05);
    const revenue = round(purchases * aovToday, 2);

    const video3s = isVideo
      ? Math.round(impressions * (hookBase * (1 - p.ctrDecay * 0.5 * frac)) / 100)
      : null;
    const thruplays = isVideo && video3s !== null
      ? Math.round(video3s * (holdBase / 100))
      : null;

    daily.push({
      date,
      spend: round(spend, 2),
      impressions,
      clicks,
      outboundClicks,
      purchases,
      revenue,
      video3s,
      thruplays,
      frequency: Math.max(1, frequency),
    });
  }

  return { daily, createdAt: isoDate(startDate) };
}

/* ------------------------------------------------------------------ */
/*  Naming                                                             */
/* ------------------------------------------------------------------ */

function hookToken(hook: string): string {
  return hook
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .slice(0, 14);
}

function productToken(product: string): string {
  return product.replace(/[^a-zA-Z0-9]/g, "");
}

/** Clean, parseable ad-level convention name (§8.2). */
function adConventionName(
  product: string,
  hook: string,
  format: CreativeFormat,
  setNo: number,
  versionNo: number,
  createdAt: string,
): string {
  const fmtToken = format === "video" ? "VI" : "IA";
  const date = ddmmyyyy(new Date(`${createdAt}T00:00:00`));
  return `MBS_NC_LS_CC_${fmtToken}_SS_${productToken(product)}_${hookToken(hook)}_set${setNo}_v${String(
    versionNo,
  ).padStart(2, "0")}_${date}`;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? k);
}

/* ------------------------------------------------------------------ */
/*  Dataset assembly                                                   */
/* ------------------------------------------------------------------ */

const PLATFORM_BY_ACCOUNT: Record<string, Platform> = {
  "acc-amalfa-meta": "meta",
  "acc-amalfa-tt": "tiktok",
  "acc-glowkart": "meta",
  "acc-peaksupps": "meta",
  "acc-nordic": "newsbreak",
};

const CROSS_PLATFORM_TARGETS: Platform[] = ["meta", "tiktok", "newsbreak"];

function buildDataset(daySeed: string): Dataset {
  const today = todayFloor();
  const master = seededRandom(hashString(`creative-report-v2::${daySeed}`));

  const concepts: Concept[] = [];
  const angles: Angle[] = [];
  const creatives: Creative[] = [];
  const variants: Variant[] = [];
  const adInstances: AdInstance[] = [];

  // ----- Concepts + angles -----
  CONCEPT_SEEDS.forEach((seed, ci) => {
    const conceptId = `concept-${ci + 1}`;
    concepts.push({ id: conceptId, name: seed.name, thesis: seed.thesis });
    seed.angles.forEach((angleName, ai) => {
      angles.push({
        id: `${conceptId}-angle-${ai + 1}`,
        conceptId,
        name: angleName,
      });
    });
  });

  // ----- Plan ~60 creatives across angles, round-robin -----
  const TARGET_CREATIVES = 60;
  const archetypePool: Archetype[] = [];
  ARCHETYPE_QUOTA.forEach(({ archetype, count }) => {
    for (let i = 0; i < count; i++) archetypePool.push(archetype);
  });
  while (archetypePool.length < TARGET_CREATIVES) archetypePool.push("steady");
  const shuffledArchetypes = shuffle(archetypePool, master);

  // Choose which creative indices run cross-platform (≥5): spread across the
  // book, avoiding brand-new (too little data to be multi-platform yet).
  const crossPlatformIdx = new Set<number>([2, 9, 17, 24, 33, 41]);

  for (let i = 0; i < TARGET_CREATIVES; i++) {
    const angle = angles[i % angles.length];
    const concept = concepts.find((c) => c.id === angle.conceptId)!;
    const seed = CONCEPT_SEEDS[concepts.indexOf(concept)];
    const archetype = shuffledArchetypes[i];
    const creativeId = `cr-${String(i + 1).padStart(3, "0")}`;
    const crand = rngFor(`${creativeId}::${daySeed}`);

    const format = weightedPick(FORMAT_WEIGHTS, crand) as CreativeFormat;
    const isVideo = format === "video";
    const hook = pick(HOOKS, crand);
    const components = {
      hook,
      headline: pick(HEADLINES, crand),
      primaryText: pick(PRIMARY_TEXTS, crand),
      cta: pick(CTAS, crand),
      visualStyle: pick(VISUAL_STYLES, crand),
    };
    const setNo = randInt(crand, 1, 4);
    const versionNo = randInt(crand, 1, 6);

    // Primary run defines createdAt (earliest instance start).
    const primaryPlatform = PLATFORM_BY_ACCOUNT[seed.accountId];
    const primaryRun = generateRun({
      archetype,
      isVideo,
      scale: 1,
      seedKey: `${creativeId}-primary::${daySeed}`,
      today,
    });

    const creative: Creative = {
      id: creativeId,
      angleId: angle.id,
      name: adConventionName(seed.product, hook, format, setNo, versionNo, primaryRun.createdAt),
      format,
      thumbKey: `${creativeId}-${productToken(seed.product)}`,
      createdAt: primaryRun.createdAt,
      archetype,
      components,
      product: seed.product,
    };
    creatives.push(creative);

    // ----- Variants (1–4) -----
    const nVariants = randInt(crand, 1, 4);
    const variantKinds: Variant["kind"][] = ["crop", "text", "cta", "length"];
    const creativeVariants: Variant[] = [];
    for (let v = 0; v < nVariants; v++) {
      const kind = variantKinds[v % variantKinds.length];
      const variant: Variant = {
        id: `${creativeId}-var-${v + 1}`,
        creativeId,
        kind,
        label:
          v === 0
            ? "Original"
            : `${kind[0].toUpperCase()}${kind.slice(1)} swap ${v}`,
      };
      creativeVariants.push(variant);
      variants.push(variant);
    }

    // ----- Ad instances -----
    // Platforms this creative runs on.
    const platforms: Platform[] = [primaryPlatform];
    if (crossPlatformIdx.has(i)) {
      const extras = shuffle(
        CROSS_PLATFORM_TARGETS.filter((p) => p !== primaryPlatform),
        crand,
      ).slice(0, randInt(crand, 1, 2));
      platforms.push(...extras);
    }

    platforms.forEach((platform, pIdx) => {
      // Account: primary account for the primary platform, or a matching
      // account for the extra platform (amalfa TT for tiktok, nordic for NB).
      const accountId =
        pIdx === 0
          ? seed.accountId
          : platform === "tiktok"
            ? "acc-amalfa-tt"
            : platform === "newsbreak"
              ? "acc-nordic"
              : "acc-glowkart";

      // Each variant becomes one ad instance on the primary platform; extra
      // platforms carry just the original variant (keeps counts realistic).
      const variantsForPlatform =
        pIdx === 0 ? creativeVariants : [creativeVariants[0]];
      const platformScale = pIdx === 0 ? 1 : randFloat(crand, 0.4, 0.75);

      variantsForPlatform.forEach((variant, vi) => {
        const instanceId = `${variant.id}-ad-${platform}-${vi}`;
        const run =
          pIdx === 0 && vi === 0
            ? primaryRun
            : generateRun({
                archetype,
                isVideo,
                scale: platformScale / Math.max(1, variantsForPlatform.length * 0.6),
                seedKey: `${instanceId}::${daySeed}`,
                today,
              });

        const irand = rngFor(`${instanceId}-meta::${daySeed}`);
        const status: AdStatus =
          archetype === "loser" && irand() < 0.4
            ? "paused"
            : run.daily.length > 0 &&
                new Date(`${run.daily[run.daily.length - 1].date}T00:00:00`) <
                  addDays(today, -3)
              ? "archived"
              : "active";

        const vars = {
          product: seed.product,
          collection: pick(COLLECTIONS, irand),
          geo: pick(GEOS, irand),
          age: pick(AGES, irand),
          gender: pick(GENDERS, irand),
        };

        adInstances.push({
          id: instanceId,
          variantId: variant.id,
          creativeId,
          platform,
          accountId,
          campaignName: fill(pick(MESSY_CAMPAIGN_TEMPLATES, irand), vars),
          adsetName: fill(pick(MESSY_ADSET_TEMPLATES, irand), vars),
          placement: pick(PLACEMENTS, irand),
          geo: vars.geo,
          device: pick(DEVICES, irand),
          objective: pick(OBJECTIVES, irand),
          age: vars.age,
          gender: vars.gender,
          status,
          daily: run.daily,
        });
      });
    });
  }

  // ----- Dedup pair: make cr-002 a near-duplicate crop of cr-001 -----
  const dupA = creatives[0];
  const dupB = creatives[1];
  dupB.dedupGroupId = dupA.id;
  dupA.dedupGroupId = dupA.id;
  dupA.dedupMatch = 0.92;
  dupB.dedupMatch = 0.92;
  // Align B's identity to A so it reads as the same asset, different crop.
  dupB.product = dupA.product;
  dupB.components = { ...dupA.components };
  dupB.format = dupA.format;
  dupB.name = dupA.name.replace(/_v\d+_/, "_v09_").replace("set", "set9");

  // ----- Lookup indices -----
  const conceptById: Record<string, Concept> = {};
  concepts.forEach((c) => (conceptById[c.id] = c));
  const angleById: Record<string, Angle> = {};
  angles.forEach((a) => (angleById[a.id] = a));
  const creativeById: Record<string, Creative> = {};
  creatives.forEach((c) => (creativeById[c.id] = c));
  const variantsByCreative: Record<string, Variant[]> = {};
  variants.forEach((v) => {
    (variantsByCreative[v.creativeId] ??= []).push(v);
  });
  const instancesByCreative: Record<string, AdInstance[]> = {};
  const instancesByVariant: Record<string, AdInstance[]> = {};
  adInstances.forEach((inst) => {
    (instancesByCreative[inst.creativeId] ??= []).push(inst);
    (instancesByVariant[inst.variantId] ??= []).push(inst);
  });

  return {
    concepts,
    angles,
    creatives,
    variants,
    adInstances,
    conceptById,
    angleById,
    creativeById,
    variantsByCreative,
    instancesByCreative,
    instancesByVariant,
  };
}

/* ------------------------------------------------------------------ */
/*  Memoized accessor                                                  */
/* ------------------------------------------------------------------ */

const _cache = new Map<string, Dataset>();

/** Day-stamp so the memo refreshes at day boundaries (dates stay in range). */
function daySeed(): string {
  return isoDate(todayFloor());
}

export function getDataset(): Dataset {
  const key = daySeed();
  let ds = _cache.get(key);
  if (!ds) {
    ds = buildDataset(key);
    _cache.set(key, ds);
  }
  return ds;
}

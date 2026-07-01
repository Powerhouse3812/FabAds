/**
 * preflight.ts — Pre-flight validation layer for Launch v2.
 *
 * Runs synchronously before launch and catches Meta API constraint violations
 * that aren't already caught by `buildIssues`. Uses static mock data from
 * `mockMetaData.ts` (swap imports to async when the real API lands).
 *
 * Checks implemented:
 *   C1  — Account active + payment method + currency (USD-only)
 *   C2  — Budget minimums + lifetime budget needs an end date
 *   C3  — Objective ↔ optimization_goal compatibility
 *   C4  — Advantage+ only valid for specific objectives
 *   C5  — Pixel/dataset required for conversion objectives
 *   C6  — Page exists + is published + leadgen ToS for OUTCOME_LEADS
 *   C11 — Page 250-ad active-ad cap (page-cap family, via `distributionErrors`
 *         so preflight and `reviewModel.buildIssues` agree — STEP3_ERROR_MODEL.md §5.1)
 */

import type { PlanV2, CreativeRef } from "./types";
import type { ReviewIssue } from "./screens/review/reviewModel";
import { distributionErrors } from "./distributionErrors";
import {
  MOCK_AD_ACCOUNTS,
  MOCK_PAGES,
  MOCK_DATASETS,
  VALID_OPTIMIZATION_GOALS,
  ADVANTAGE_PLUS_OBJECTIVES,
  PIXEL_REQUIRED_OBJECTIVES,
} from "./services/mockMetaData";

/**
 * Page-cap family: catalog codes from STEP3_ERROR_MODEL.md §3A that represent
 * a page/slot overflow (as opposed to PS-01 no-page, PS-10 slot-read, PS-11
 * restricted-account, PS-14 shared-page, or PS-DUP's warning-tier heads-up).
 * Kept in sync with the engine's page-split family so preflight and
 * `buildIssues` never drift out of agreement.
 */
const PAGE_CAP_CODES = new Set([
  "PS-02", // page saturated (0 free)
  "PS-03", // one_page > free₁
  "PS-04", // equal-split per-page breach
  "PS-05", // fill_first aggregate short
  "PS-06", // best-fit still unplaceable
  "PS-07", // custom weight > free (field)
  "PS-08", // custom Σweights ≠ D
]);

/* ------------------------------------------------------------------ */
/*  runPreflight                                                        */
/* ------------------------------------------------------------------ */

/**
 * Run all pre-flight checks against `plan` and return the full list of
 * `ReviewIssue`s. Callers should treat any `tier === "error"` result as
 * launch-blocking and surface it alongside `buildIssues` output.
 *
 * The function is intentionally sync — the mock data is static. When the
 * real Meta API replaces the mocks, change the signature to async and
 * `await` the data lookups; callers in the Review screen should then
 * `await runPreflight(plan)` before rendering.
 */
export function runPreflight(plan: PlanV2): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  /* ---- C1: Account active + payment method + currency -------------- */
  // Deduplicate by accountId — multiple targets may share the same account.
  const seenAccounts = new Set<string>();

  for (const target of plan.targets) {
    const { accountId } = target;
    if (seenAccounts.has(accountId)) continue;
    seenAccounts.add(accountId);

    const account = MOCK_AD_ACCOUNTS[accountId];

    if (!account) {
      // Unknown account — treat as disabled to be safe.
      issues.push({
        id: `pre:account-disabled:${accountId}`,
        tier: "error",
        title: `Ad account not found`,
        detail: `Account "${target.accountName}" (${accountId}) could not be verified. Ensure the account is active and accessible.`,
      });
      continue;
    }

    // account_status: 1 = ACTIVE. Any other value = blocked.
    if (account.account_status !== 1) {
      issues.push({
        id: `pre:account-disabled:${accountId}`,
        tier: "error",
        title: `Ad account disabled`,
        detail: `Account "${target.accountName}" (${accountId}) is not active (status ${account.account_status}). Reactivate the account in Meta Business Manager before launching.`,
      });
    }

    if (!account.has_payment_method) {
      issues.push({
        id: `pre:no-payment-method:${accountId}`,
        tier: "error",
        title: `No payment method on "${target.accountName}"`,
        detail: `Account "${target.accountName}" (${accountId}) has no valid payment method. Add a payment method in Meta Business Manager.`,
      });
    }

    if (account.currency !== "USD") {
      issues.push({
        id: `pre:currency-mismatch:${accountId}`,
        tier: "error",
        title: `Non-USD currency on "${target.accountName}"`,
        detail: `Account "${target.accountName}" uses ${account.currency}. Launch requires USD-only accounts — budget totals and the spend safeguard assume USD. Switch to a USD ad account.`,
      });
    }
  }

  /* ---- C2: Budget minimums + lifetime end date -------------------- */
  // budgetAmount is stored as dollars; Meta min_daily_budget is in account currency cents.
  const seenAccountsForBudget = new Set<string>();

  for (const target of plan.targets) {
    const { accountId } = target;
    if (seenAccountsForBudget.has(accountId)) continue;
    seenAccountsForBudget.add(accountId);

    const account = MOCK_AD_ACCOUNTS[accountId];
    if (!account) continue; // already flagged in C1

    // Only compare budgets for USD accounts; non-USD accounts are blocked by C1.
    // budgetAmount is in major currency units (USD dollars); min_daily_budget is in cents.
    const budgetCents = plan.budgetAmount * 100;
    if (account.currency === "USD" && budgetCents < account.min_daily_budget) {
      const minDollars = (account.min_daily_budget / 100).toFixed(2);
      issues.push({
        id: `pre:budget-below-min:${accountId}`,
        tier: "error",
        title: `Budget below minimum for "${target.accountName}"`,
        detail: `Daily budget $${plan.budgetAmount} is below the minimum $${minDollars} required by this account. Increase the budget in Setup.`,
      });
    }
  }

  // Lifetime budget needs an end date (budgetPeriod field in PlanV2).
  if (plan.budgetPeriod === "lifetime" && !plan.scheduledFor) {
    // PlanV2 doesn't have a dedicated `endDate` field — the closest equivalent
    // is `scheduledFor` (the scheduled launch date). A lifetime budget without
    // any scheduled end window is not valid.
    issues.push({
      id: "pre:lifetime-needs-enddate",
      tier: "error",
      title: "Lifetime budget requires a scheduled end date",
      detail: "Lifetime budget campaigns must have a defined end date. Set a scheduled date (which Meta uses as the campaign end) in Setup.",
    });
  }

  /* ---- C3: Objective ↔ optimization_goal compatibility ------------ */
  if (plan.objective && plan.optimizationGoal) {
    const validGoals = VALID_OPTIMIZATION_GOALS[plan.objective];
    if (validGoals && !validGoals.includes(plan.optimizationGoal)) {
      issues.push({
        id: "pre:invalid-optimization-goal",
        tier: "error",
        title: "Optimization goal incompatible with objective",
        detail: `"${plan.optimizationGoal}" is not a valid optimization goal for ${plan.objective}. Valid options: ${validGoals.join(", ")}.`,
      });
    }
  }

  if (!plan.optimizationGoal && plan.objective) {
    issues.push({
      id: "pre:no-optimization-goal",
      tier: "warning",
      title: "No optimization goal set",
      detail: "Setting an optimization goal helps Meta's delivery system optimize for your desired result. Pick one in Setup.",
    });
  }

  /* ---- C4: Advantage+ objective validity -------------------------- */
  if (plan.advantagePlus && plan.objective) {
    if (!ADVANTAGE_PLUS_OBJECTIVES.includes(plan.objective)) {
      issues.push({
        id: "pre:advantageplus-invalid-objective",
        tier: "error",
        title: "Advantage+ not supported for this objective",
        detail: `Advantage+ Shopping Campaigns are only available for: ${ADVANTAGE_PLUS_OBJECTIVES.join(", ")}. Switch to a supported objective or disable Advantage+.`,
      });
    }
  }

  /* ---- C5: Pixel / dataset required ------------------------------- */
  if (
    plan.objective &&
    PIXEL_REQUIRED_OBJECTIVES.includes(plan.objective) &&
    (plan.optimizationGoal === "OFFSITE_CONVERSIONS" || plan.optimizationGoal === "VALUE")
  ) {
    // Check if pixelId is attached at the plan level (via targets).
    // TargetPair has a `pixelId` field (optional string).
    const missingPixelTargets = plan.targets.filter((t) => !t.pixelId);

    if (missingPixelTargets.length > 0) {
      issues.push({
        id: "pre:pixel-required",
        tier: "error",
        title: "Pixel required for conversion objective",
        detail: `${missingPixelTargets.length} destination(s) — ${missingPixelTargets.map((t) => t.accountName).join(", ")} — are missing a Meta Pixel. Attach a pixel in Setup.`,
      });
    } else {
      // All targets have a pixelId — validate each exists in MOCK_DATASETS.
      const seenPixels = new Set<string>();
      for (const target of plan.targets) {
        const pixelId = target.pixelId!;
        if (seenPixels.has(pixelId)) continue;
        seenPixels.add(pixelId);

        if (!MOCK_DATASETS[pixelId]) {
          issues.push({
            id: `pre:pixel-not-found:${pixelId}`,
            tier: "error",
            title: `Pixel not found: ${pixelId}`,
            detail: `The Meta Pixel "${pixelId}" could not be found or accessed. Verify the pixel ID in Meta Events Manager and re-attach it in Setup.`,
          });
        }
      }
    }
  }

  /* ---- C6: Page exists + is published + leadgen ToS --------------- */
  // Deduplicate by fbPageId.
  const seenPages = new Set<string>();

  for (const target of plan.targets) {
    const { fbPageId, pageName } = target;
    if (seenPages.has(fbPageId)) continue;
    seenPages.add(fbPageId);

    const page = MOCK_PAGES[fbPageId];

    if (!page || !page.is_published) {
      issues.push({
        id: `pre:page-unavailable:${fbPageId}`,
        tier: "error",
        title: `Page unavailable: "${pageName}"`,
        detail: page
          ? `Page "${pageName}" is not published. Publish the Page in Meta before launching ads.`
          : `Page "${pageName}" (${fbPageId}) could not be found. Ensure the page exists and your account has access.`,
      });
      continue;
    }

    if (plan.objective === "OUTCOME_LEADS" && !page.leadgen_tos_accepted) {
      issues.push({
        id: `pre:leadgen-tos-required:${fbPageId}`,
        tier: "error",
        title: `Leadgen ToS not accepted for "${pageName}"`,
        detail: `Page "${pageName}" must accept Meta's Lead Ads Terms of Service before running lead generation ads. Accept the ToS in Meta Business Manager.`,
      });
    }
  }

  /* ---- C11: Page cap / distribution overflow (reuses distributionErrors) */
  // Reuse the same engine `reviewModel.buildIssues` reuses (STEP3_ERROR_MODEL.md
  // §5.1) for the page-cap family, instead of a separately-computed cap check —
  // keeps preflight and buildIssues in agreement on when a launch is blocked.
  const capFamily = distributionErrors(plan).filter(
    (e) => e.tier === "error" && PAGE_CAP_CODES.has(e.code),
  );
  for (const err of capFamily) {
    issues.push({
      id: `pre:page-cap-exceeded:${err.id}`,
      tier: "error",
      title: err.title,
      detail: err.message,
    });
  }

  /* ---- C7: Creative completeness ---------------------------------- */
  // Check that shared ad-copy essentials and creative refs are non-empty.
  // Per-node blank detection is A6's job; this checks the global defaults.
  {
    const missingDestUrl = !plan.adCopy.destinationUrl?.trim();
    const missingPrimaryText = !plan.adCopy.primaryText?.trim();

    if (missingDestUrl) {
      issues.push({
        id: "pre:creative-incomplete:destination-url",
        tier: "warning",
        title: "Destination URL is empty",
        detail: "No default destination URL is set. All ads will inherit this blank — set a destination URL in the Creatives step or add per-creative overrides.",
      });
    }

    if (missingPrimaryText) {
      issues.push({
        id: "pre:creative-incomplete:primary-text",
        tier: "warning",
        title: "Primary text is empty",
        detail: "No default primary text is set. All ads will inherit this blank — add primary text in the Creatives step.",
      });
    }

    // Check each creative ref: source must be present.
    // For single_image / carousel formats, the id (used as asset hash/url) must be non-empty.
    for (const creative of plan.creatives) {
      if (!creative.source) {
        issues.push({
          id: `pre:creative-incomplete:no-source:${creative.id}`,
          tier: "warning",
          title: `Creative "${creative.name}" has no source`,
          detail: `Creative "${creative.name}" has no source type set. Attach a media asset or saved ad before launching.`,
        });
      }
      if (
        (creative.format === "single_image" || creative.format === "carousel") &&
        !creative.id?.trim()
      ) {
        issues.push({
          id: `pre:creative-incomplete:empty-asset:${creative.id}`,
          tier: "warning",
          title: `Creative "${creative.name}" has no asset`,
          detail: `A ${creative.format} creative requires at least one media asset. Select an image or video in the Creatives step.`,
        });
      }
    }
  }

  /* ---- C8: Special ad category targeting normalization ------------ */
  // PlanV2.specialAdCategories: SpecialAdCategory[] (may be empty).
  // Restricted categories: HOUSING, EMPLOYMENT, FINANCIAL_PRODUCTS_SERVICES, ISSUES_ELECTIONS_POLITICS.
  // Meta disallows age/gender targeting for housing, credit (financial), employment.
  {
    const RESTRICTED: string[] = [
      "HOUSING",
      "EMPLOYMENT",
      "FINANCIAL_PRODUCTS_SERVICES",
    ];

    if (plan.specialAdCategories.length > 0) {
      // General advisory — not blocking.
      issues.push({
        id: "pre:special-ad-category-set",
        tier: "warning",
        title: "Special ad category declared",
        detail: `This plan declares: ${plan.specialAdCategories.join(", ")}. Verify your targeting complies with Meta's restricted targeting rules (age, gender, location limits).`,
      });

      // Hard block: age targeting below 18 is disallowed for restricted categories.
      const hasRestricted = plan.specialAdCategories.some((cat) =>
        RESTRICTED.includes(cat),
      );
      if (hasRestricted && plan.targeting.ageMin < 18) {
        issues.push({
          id: "pre:special-category-targeting-violation",
          tier: "error",
          title: "Age targeting below 18 not allowed for this special ad category",
          detail: `Meta prohibits targeting users under 18 for ${plan.specialAdCategories
            .filter((c) => RESTRICTED.includes(c))
            .join(", ")} ads. Set minimum age to 18 or higher in the Audience step.`,
        });
      }
    }
  }

  /* ---- C10: Time validity ----------------------------------------- */
  // C2 already catches lifetime-without-enddate (budgetPeriod === "lifetime" && !scheduledFor).
  // Here: catch an obviously malformed scheduledFor (non-null but empty string after trim).
  // "Is in the past" validation is intentionally left to the UI (client-side Date.now() check).
  {
    if (plan.scheduledFor !== null && plan.scheduledFor.trim() === "") {
      issues.push({
        id: "pre:schedule-in-past",
        tier: "warning",
        title: "Scheduled date is empty",
        detail: "A scheduled launch date was indicated but the value is blank. Set a valid future date or clear the schedule field.",
      });
    }
  }

  /* ---- C9: EU / DSA beneficiary + payor (stub) -------------------- */
  // PlanV2 does not yet have dsaBeneficiary / dsaPayor fields.  These are
  // distinct from the ISSUES_ELECTIONS_POLITICS `payor` / `beneficiary` fields
  // (which exist) and are required by Meta for EU-targeted ads under the DSA.
  // Access via safe cast so this compiles even before the fields are added.
  {
    const dsaBeneficiary = (plan as unknown as Record<string, unknown>)["dsaBeneficiary"];
    const dsaPayor = (plan as unknown as Record<string, unknown>)["dsaPayor"];

    if (dsaBeneficiary === undefined && dsaPayor === undefined) {
      // Neither field exists on PlanV2 yet — emit a forward-looking stub.
      issues.push({
        id: "pre:dsa-check-unavailable",
        tier: "warning",
        title: "EU/DSA compliance fields not yet captured",
        detail:
          "EU/DSA compliance fields not yet captured — add dsa_beneficiary and dsa_payor before targeting EU audiences",
      });
    } else {
      // Fields exist — validate them once they are wired up.
      if (typeof dsaBeneficiary === "string" && dsaBeneficiary.trim() === "") {
        issues.push({
          id: "pre:dsa-beneficiary-missing",
          tier: "warning",
          title: "DSA beneficiary missing",
          detail:
            "EU regulations require a dsa_beneficiary value for ads targeting EU audiences. Add the beneficiary name in Setup.",
        });
      }
      if (typeof dsaPayor === "string" && dsaPayor.trim() === "") {
        issues.push({
          id: "pre:dsa-payor-missing",
          tier: "warning",
          title: "DSA payor missing",
          detail:
            "EU regulations require a dsa_payor value for ads targeting EU audiences. Add the payor name in Setup.",
        });
      }
    }
  }

  /* ---- C12: Aspect ratio / placement compatibility (stub) --------- */
  // CreativeRef has no aspectRatio or placement fields yet.  When those fields
  // are added the stub block can be replaced with real ratio checks:
  //   • Feed: 1:1 (1.0) or 4:5 (0.8) preferred
  //   • Stories / Reels: 9:16 (0.5625) required
  // Until then, emit a blanket stub warning.  Additionally, if the plan is
  // using manual placements with stories or reels enabled, surface the warning
  // with higher urgency so it is not silently ignored.
  {
    const hasAspectRatioField = plan.creatives.some(
      (c) => "aspectRatio" in c || "placementGroup" in c,
    );

    if (!hasAspectRatioField) {
      // Detect whether Stories / Reels placements are explicitly chosen.
      const storiesOrReelsActive =
        plan.placementMode === "manual" &&
        (plan.placements.facebook.stories ||
          plan.placements.facebook.reels ||
          plan.placements.instagram.stories ||
          plan.placements.instagram.reels ||
          plan.placements.messenger.stories);

      issues.push({
        id: "pre:aspect-ratio-check-unavailable",
        tier: "warning",
        title: storiesOrReelsActive
          ? "Stories/Reels placements active — aspect ratio unverified"
          : "Creative placement/aspect-ratio not yet captured",
        detail: storiesOrReelsActive
          ? "Stories and Reels require a 9:16 vertical asset. Creative aspect-ratio is not yet captured in the plan — verify before launching Stories or Reels placements."
          : "Creative placement/aspect-ratio not yet captured — verify before launching Stories or Reels placements",
      });
    } else {
      // Fields exist — run real ratio checks per creative.
      for (const creative of plan.creatives) {
        const cr = creative as CreativeRef & {
          aspectRatio?: number;
          placementGroup?: string;
        };

        if (cr.format === "single_image" && cr.aspectRatio === undefined) {
          issues.push({
            id: `pre:aspect-ratio-unspecified:${creative.id}`,
            tier: "warning",
            title: `Aspect ratio unspecified for "${creative.name}"`,
            detail: `Creative "${creative.name}" is a single image with no aspect ratio set. Meta Feed prefers 1:1 or 4:5; Stories/Reels require 9:16.`,
          });
        }

        const isStoriesOrReels =
          typeof cr.placementGroup === "string" &&
          (cr.placementGroup.includes("story") || cr.placementGroup.includes("reel"));
        const isVertical = cr.aspectRatio !== undefined && cr.aspectRatio <= 0.6;

        if (isStoriesOrReels && !isVertical) {
          issues.push({
            id: `pre:aspect-ratio-mismatch:${creative.id}`,
            tier: "warning",
            title: `Aspect ratio mismatch for "${creative.name}"`,
            detail: `Creative "${creative.name}" targets Stories/Reels but does not have a 9:16 vertical aspect ratio. Stories and Reels require a 9:16 (0.5625) asset.`,
          });
        }
      }
    }
  }

  /* ---- C13: Idempotency key (stub) -------------------------------- */
  // PlanV2 does not yet have an `idempotencyKey` field — this is a forward-looking
  // stub that warns when the key is absent, ready for the real API's idempotency_key header.
  // When the field is added to PlanV2, remove the `as any` cast and the stub comment.
  {
    const idempotencyKey = (plan as unknown as Record<string, unknown>)["idempotencyKey"];
    if (!idempotencyKey) {
      issues.push({
        id: "pre:no-idempotency-key",
        tier: "warning",
        title: "No idempotency key set",
        detail: "No idempotency key set — duplicate launch protection unavailable. This is a stub: when the idempotencyKey field is added to PlanV2 and the Meta API integration lands, this check will gate duplicate submissions.",
      });
    }
  }

  return issues;
}

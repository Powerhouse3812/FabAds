# Launch 2.0 — Research Doc

> **Method:** mirrors the Genie 6.0 research process — 10 gated steps, each blocking on
> the previous, each surfaced for Maalik's lock before proceeding. Reference model:
> `Genie_6.0_Planning_Deck`. Final artifact: a Genie-style PPTX (+ this doc as the
> backing source of truth).
>
> **Evidence legend (used throughout):**
> **V** Verified — named source / code-cited, defensible attribution.
> **O** Observed — cohort pattern across ≥2 sources; not single-URL-pinned.
> **I** Inferred — synthesized / first-principles / extrapolated; flagged as hypothesis.
>
> **Scope:** Meta-only (Facebook / Instagram) for now.
> **Author:** Rahul Saini · **Date:** June 2026 · **Status:** Step 1 drafted — pending lock.

---

## Step 1 — Problem Statement

*Status: **DRAFT — awaiting Maalik's lock.** Citations are to the `docs/launch-2.0/` corpus;
fresh web citations to be layered in at Steps 4–5.*

### (a) The unaddressed job

The job high-volume Meta advertisers are hiring a launcher to do — and that nothing on the
market, FabAds v1 included, does well — is **distribution-aware bulk launch at the
(ad-account × page) layer**: stamp a proven `campaign → adset → ad` structure across the
*right* surviving accounts and pages from minimal input, while respecting Meta's per-Page
~250-ad cap. That cap is the crux — it counts active + scheduled + in-review ads **per Page**
and **aggregates across every ad account touching that page**, so it cannot be dodged by
spreading across accounts, and **no competitor surfaces it as a first-class concept**
`[V — 02 §1, §8]`. The sharpest-fit persona is the dropship / agency-account operator (and
the agency lead): many accounts, many pages, lives with bans `[O — 05, 06]`. Today they
hand-spray across pages, fight a CSV export/import hack that silently breaks pixels and
Advantage+ text `[V — 02 §1]`, and pay **3–15% of spend (or ~£200–1,500+/mo) to rent agency
accounts purely to dodge bans** — hard willingness-to-pay evidence for an account-health job
no launcher owns `[V — 05 §5]`. The full band — distribution + cap-awareness + codified
warm-up + rejection/account-health recovery + guided strategy presets — is empty `[V — 02 §8]`.

### (b) What's broken now

Launching is broken in three arenas, and FabAds v1 is the worst of them.

- **FabAds v1.** `launch-execute` is a **simulated stub** — it shows "Launch successful!"
  and writes a History row with **no Meta API call, no per-entity result, no partial-success
  handling** `[V — 01 F-R1]`. Two of four create paths don't even simulate (Catalogue only
  toasts; Fast Launch fakes `status:'launched'` with empty ad rows) `[V — 01 F-C2/F-CL5]`.
  The data model has **no `ad_account_id` on campaigns/adsets/ads** (account-level
  distribution impossible at the entity level), validates the 250-cap against **hashed mock
  capacities** instead of the real `fb_pages` table, and fans `duplicate` strategy out to
  **~500K client-side row-writes** with no virtualization `[V — 03 §1.7/§4.7]`.
- **Meta Ads Manager (the baseline).** No cross-account duplication without the
  pixel-breaking CSV hack; enforces the per-Page cap (aggregating across accounts); costs
  **~5–15 min per ad** by hand; atop learning-phase volatility and ~83 platform changes/yr
  `[V — 02 §1]`.
- **Competitors.** Launch is a **bolt-on** to optimization/creative engines; schedulers fire
  silently (Madgicx, Smartly) `[V — 02 §2/§5]`; none model (account×page) distribution, the
  cap, warm-up, or account-health `[O — 02 §8]`. But the direct bulk-launcher tier
  (AdsUploader / Adnova / AdManage) **already ships the table-stakes v1 lacks** — API-direct
  execution, aspect-ratio auto-grouping, pixel re-map on duplicate, post-ID reuse, rich
  formats `[V — 08]`. So v1 is simultaneously *behind* on ergonomics and *ahead only on an
  unbuilt wedge*.

### (c) Why now

Three timing forces converge.

1. **Genuinely greenfield.** The "Launch 2.0 (Beta)" CTA is a no-op `toast("Coming Soon")` —
   no route, flag, or component exists anywhere — so there is no parallel build to reconcile,
   just one button to repoint; and the "Beta" label is **actively lying to users** every day
   it ships `[V — 01:63-99]`.
2. **A closing window.** The differentiating band is empty across every competitor, but the
   **table-stakes layer beneath it is filling fast** (AdsUploader/Adnova ship API-direct bulk
   today; Meta's ~83 changes/yr rot any latent capability, à la AdEspresso). Open, not
   permanent `[O — 02 §6/§11]`.
3. **The closed loop.** Genie 6 — the entry-point product, research just completed — now
   generates creative *volume* with no trustworthy launch destination; the generate→launch
   path is **already wired at 8 sites** yet dead-ends in the simulated execute. Launch closes
   the **generate → launch → learn** loop and is FabAds' monetization/retention bridge
   `[I — strategic framing; underlying facts V]`. The pull is **dated and committed**: the
   06-03 MOM gates "Launch Strategies" behind Enterprise with a ~7-day UX timeline
   `[V — 00 §decisions]`. The single most consequential action in the product is fake today —
   that credibility gap blocks the business *now*, not later.

**Honesty flags:** the "closed-loop / monetization bridge" framing in (c) is **I** — underlying
facts (Genie ships volume, path wired at 8 sites, execution simulated) are V, but
"retention/monetization bridge" is interpretation, not a measured metric. The "closing window"
is **O** (directional, not quantified). "No competitor owns the wedge" is **O** (multi-source
pattern, not a single named admission). Vendor-sold tedium figures (e.g. "60–70% of time on
setup") were deliberately excluded — the case stands on structural evidence.

---

## Step 2 — Goal
*Pending Step 1 lock.*

## Step 3 — Personas
*Pending.*

## Step 4 — Competitor inventory
*Pending — fresh web-sourced (WebSearch).*

## Step 5 — Pain points + opportunity matrix
*Pending.*

## Step 6 — Launch JTBD enumeration
*Pending — the heart of the research.*

## Step 7 — Input shape taxonomy
*Pending.*

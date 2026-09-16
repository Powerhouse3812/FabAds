# Launch 2.0 — Stream 05c: Ratio Strategies (`c:as:ad`) + Bruno / Mass-Test

**Stream:** 05c — refined retry of 05b, run **after** the FabAds team clarified the
strategy grammar.
**Date:** 2026-06-04
**Why this exists:** 05b (`05b-strategy-demand.md §3`) concluded the strategy
**labels** (151/135/115/Bruno) have **no authoritative public canon**. The team
has since clarified the grammar: the numeric labels are **ratios
`campaign : adset : ad`**. This pass re-runs the research with that grammar to
**corroborate the MECHANICS** of each shape from public sources — not to define
canon (the team owns that).

> ### Scope guardrail (read first — unchanged from 05b)
> This document does **NOT** define the strategies. The canonical definitions of
> `1:5:1` / `1:3:5` / `1:1:5` / Bruno belong **authoritatively to the FabAds team**.
> My job: find public evidence for the *mechanics* each ratio implies (budget
> model, targeting, creative, account/page usage, test-vs-scale goal), and
> cross-check the high-volume "Bruno" idea against FabAds' 250-ads-per-page cap.
> Every finding is confidence-labelled. Gaps are marked as gaps, not guessed.

---

## 0. Method, grammar & honest confidence ceiling

**Clarified grammar (authoritative, from the FabAds team):** labels are
`campaign : adset : ad` counts.
- `1:5:1` = 1 campaign, 5 ad sets, **1 ad each** (5 ads total)
- `1:3:5` = 1 campaign, 3 ad sets, **5 ads each** (15 ads total)
- `1:1:5` = 1 campaign, 1 ad set, **5 ads** (5 ads total)
- **Bruno** ≈ high-volume, minimal-budget **mass-test** (thousands of cheap ads to
  surface winners) — **team's rough read, NOT confirmed.**

**Method.** Fan-out WebSearch, English + Portuguese (for the "Bruno/Brazilian"
angle), then attempted primary-source fetches. Prioritised recurring, multi-source
signals over single mentions.

**Honest confidence ceiling (set expectations low — this is the headline):**
- **The ratio NOTATION itself is still [not-found] as public canon.** No public
  source labels a Meta structure "`1:5:1`" / "151". Direct search for the notation
  returned, verbatim, *"the specific '1-5-1' campaign structure … isn't explicitly
  mentioned as a named strategy."* So this pass corroborates the **mechanics of the
  shapes** (e.g. "1 campaign / 5 ad sets / 1 ad each"), **not** the labels.
- **The MECHANICS of each shape ARE well-corroborated** across many independent
  2026 guides — that's where the [data-backed] findings sit.
- **"Bruno" as a named method is still [not-found]** in EN and PT. PT search
  surfaces *people* named Bruno who teach FB ads (Bruno Moura; "Método FB Pro" by
  Brunno Tassitani) but **none is attached to a thousands-of-cheap-ads mass-test**.
  The label is most likely **insider/person shorthand**, which lives on the exact
  surfaces this environment can't read (see constraint).

**Network constraint (material — same as 02/05/05b).** Reddit, FB groups, X, and
most media-buyer course/blog domains are **blocked (403 / not-in-allowlist)**.
This pass confirmed live 403s on `jonloomer.com`. So vendor/community claims rest
on **search-surfaced extracts** + reachable primary docs (Meta help, Capterra/G2,
reachable blogs), not full-page reads. Absence of a clean public definition for
the labels is therefore **consistent with the constraint**, and is itself the
finding that argues for FabAds authoring the canon.

**Confidence labels:** **[data-backed]** = ≥2 independent source types or a
platform primary doc · **[directional]** = multiple extracts but mostly vendor/SEO
or single-source · **[not-found]** = searched specifically, no reliable public
source.

---

## 1. Per-ratio interpretation + corroborated mechanics

> Read the table as: *"if a structure has this shape, here's what the public
> 2026 literature says about how it's typically run."* The **label** is the team's;
> the **mechanics** are what's findable.

| Ratio (`c:as:ad`) | Likely budget model | Targeting | Creative approach | Primary use | Confidence (of the *mechanics*) | Representative source |
|---|---|---|---|---|---|---|
| **`1:5:1`** — 1 camp / 5 ad sets / 1 ad each | **ABO** (budget per ad set, equal split) — "use ABO **not** CBO because you need equal spend per test"; ~**$20–50/day per ad set** (or $10–17 at tight account limits). With 5 ad sets that's ≈ **$100–250/day** total. | **Variable held at the ad-set level** — each ad set isolates one thing (audience / interest / LAL / placement). One ad per set keeps the *ad* constant so the **ad set** is the unit under test. | **One creative, held constant** across the 5 ad sets. The thing being read is the *audience/placement*, not the creative. | **Audience / targeting test** (which segment responds). Maps to MOM "testing flow." | **[directional]** for the exact shape (no source labels it "1:5:1"); **[data-backed]** that *5-ad-set ABO equal-split tests* are a real, taught pattern. **Caveat:** the 2026 consolidation consensus warns **>5 ad sets fragments signal** — 5 sits at the edge, defensible only as a *test*, not for scaling. | [adligator — anatomy/5 structures](https://adligator.com/blog/facebook-ads-campaign-structure-examples-verticals); [digitorm — testing/scaling/retargeting](https://www.digitorm.com/blog/the-right-facebook-ad-campaign-structure-for-testing-scaling-and-retargeting); [npprteam — CBO vs ABO 2026](https://npprteam.shop/en/articles/facebook/scaling-facebook-ads-in-2026-cbo-vs-abo-budget-phases-and-when-to-kill-a-campaig/) |
| **`1:3:5`** — 1 camp / 3 ad sets / 5 ads each | **ABO for the test phase** ("ABO gives each creative equal opportunity; CBO might dump 80% of budget into the first early winner"); per-ad-set budget sized so each can gather data — **~$50–150 per concept**, *not* $50 spread thin across all. | **3 ad sets = 3 audiences/angles** (broad / interest / LAL is the common split); each ad set holds **5 creatives** Meta rotates. **Both axes move** (audience × creative). | **5 creatives per ad set** = the most-recommended creative-test width: "run **3–5 ads per ad set**"; "test **3–5 creative variations at a time**." Meta auto-allocates within the ad set to the better creative. | **Combined audience × creative test** — the "balanced" tester. Closest to the generic 2026 default tester. | **[data-backed]** for the component rules ("3–5 ad sets," "3–5 ads/ad set," ABO-for-testing); **[directional]** that they're bundled as a single "1:3:5" preset. | [lebesgue — multiple ads vs one ad per ad set](https://lebesgue.io/facebook-ads/facebook-ads-testing-multiple-ads-per-ad-set-vs-one-ad-per-ad-set); [admanage — how many ads at once](https://admanage.ai/blog/how-many-facebook-ads-should-you-run-at-once); [adligator — CBO vs ABO](https://adligator.com/blog/facebook-ads-budget-optimization-cbo-vs-abo-guide) |
| **`1:1:5`** — 1 camp / 1 ad set / 5 ads | **Either, but leans CBO/consolidated** with **one** ad set the budget question is moot at the *split* level — "keeps budget and data concentrated… moves through learning faster." Concentrate spend on the single ad set (one daily number, e.g. $50–100+). | **One audience** — almost always **broad / Advantage+** in 2026 ("one ad set with broad targeting is frequently the most effective setup"). | **5 creatives in the single ad set** — a **pure creative test** (audience constant, only the creative varies). This is the cleanest read of "which creative wins" because there's no audience confound. | **Creative test / consolidated launch.** Maps to the MOM "creative-testing flow" and the rising "1-1-1"/single-ad-set consolidation trend. | **[data-backed]** that *single-ad-set + broad + multiple creatives* is a real, increasingly-recommended 2026 pattern; **[directional]** that "1:1:5" is the canonical label. | [adlibrary — structure 2026](https://adlibrary.com/posts/facebook-ad-campaign-structure); [cropink — CBO 2026](https://cropink.com/cbo-facebook-ads); [tryvizup — how many ad sets 2026](https://www.tryvizup.com/blog/how-many-ad-sets-per-campaign-in-meta-ads-2026) |
| **Bruno** — high-volume / low-budget mass-test | **Many ad sets at very low budget** (Meta floor **$1/day per ad set**; practical signal floor higher). The thesis: *creative volume as the edge* — "top advertisers test **hundreds of variations monthly** and let data pick winners." | **Broad** (let Meta + creative volume do the targeting). | **Volume over polish** — bulk-generate many cheap variations; kill fast (48–72h), scale the few winners. | **Mass product/creative discovery** (dropshipping-style). | **[directional]** for the *shape* (high-volume, low-budget, fast-cull testing is real and taught — esp. PT/BR dropshipping); **[not-found]** for the **name "Bruno"** and for any *single* canonical structure. See §2. | [dropshippingnagringa (PT) — "100 mil/dia" teste](https://www.dropshippingnagringa.com/100-mil-dia-estrategia-de-teste-de-anuncios-no-facebook-ads/); [roaspig — min budget to test 2026](https://roaspig.com/blog/minimum-viable-budget-testing-facebook-ads); [stackmatix — top advertisers 2026](https://www.stackmatix.com/blog/top-facebook-advertisers-2026) |

### Cross-cutting mechanics that hold across ALL the test ratios `[data-backed]`

These recur in nearly every reachable 2026 source and should anchor whatever the
team builds:

- **ABO for testing, CBO for scaling.** Universal: "use ABO for testing… CBO for
  scaling — once you've identified winners, consolidate them into a new CBO
  campaign." So a *test* ratio (`1:5:1` / `1:3:5` / `1:1:5`) is naturally **ABO**;
  a *scale* preset would flip the winners into **CBO**.
  ([adligator CBO/ABO](https://adligator.com/blog/facebook-ads-budget-optimization-cbo-vs-abo-guide), [npprteam](https://npprteam.shop/en/articles/facebook/scaling-facebook-ads-in-2026-cbo-vs-abo-budget-phases-and-when-to-kill-a-campaig/))
- **Don't spread test budget too thin.** "Testing 10 creatives at $50 each won't
  give you valid data… better: test 3 creatives at $150 each." Each ad set needs
  roughly **50 conversions/week** to exit learning; rule of thumb **min weekly
  budget ≈ target CPA × 50**. This is the *tension* a low-budget mass-test (Bruno)
  fights against. ([admanage — how many ads](https://admanage.ai/blog/how-many-facebook-ads-should-you-run-at-once), [roaspig](https://roaspig.com/blog/minimum-viable-budget-testing-facebook-ads))
- **Broad / Advantage+ is the 2026 default audience.** Advantage+ is now the
  default for most objectives; sophisticated buyers run **~70–80% broad/Advantage+**,
  10–20% retargeting, 5–10% interest/LAL for testing new concepts. Andromeda
  "treats creative as the primary targeting signal." So any test ratio's audience
  axis is increasingly **broad**, with the **creative** doing the differentiating.
  ([adligator — broad/Advantage+ 2026](https://adligator.com/blog/meta-broad-targeting-advantage-plus-audiences-2026), [conversios](https://www.conversios.io/blog/meta-advantage-audience-vs-detailed-targeting-2026-guide/))
- **Creative count sweet spot = 3–5 per ad set.** Repeated verbatim; >5 is
  tolerated for testing but rarely recommended as default. This makes the **"5"**
  in `1:3:5` / `1:1:5` sit exactly at the top of the recommended band — i.e. the
  team's grammar lines up with best practice here. ([lebesgue](https://lebesgue.io/facebook-ads/facebook-ads-testing-multiple-ads-per-ad-set-vs-one-ad-per-ad-set), [admanage](https://admanage.ai/blog/how-many-facebook-ads-should-you-run-at-once))

### One-line read of the three ratios
- **`1:5:1`** isolates the **audience** (creative fixed) → *audience test*.
- **`1:1:5`** isolates the **creative** (audience fixed/broad) → *creative test*.
- **`1:3:5`** tests **both at once** (3 audiences × 5 creatives) → *balanced test*.

That clean "which variable is held constant" framing is **[directional]**
(inferred from the grammar + the corroborated component rules), but it is the most
defensible way to describe the trio to users — and it doubles as the UI's
"what this builds + when to use it" copy (recognition-over-recall).

---

## 2. "Bruno" / high-volume-low-budget mass-test — what's findable, and the 250-cap collision

### 2a. What public sources DO support `[directional]`
The **shape** the team described — *thousands of cheap ads, broad, fast-cull,
scale the winners* — has a real public footprint, strongest in **PT/BR
dropshipping** content:
- **"Creative volume has replaced targeting as the primary competitive
  advantage,"** with top advertisers **"testing hundreds of variations monthly and
  letting data pick winners."** ([stackmatix — top advertisers 2026](https://www.stackmatix.com/blog/top-facebook-advertisers-2026))
- BR/PT method: **validate in 48–72h, kill below breakeven CPA, scale winners to
  R$5–10k/day**; built on **very low daily budgets** so you can "test many
  audiences, adding/removing by performance, running the least risk possible."
  ([dropshippingnagringa](https://www.dropshippingnagringa.com/100-mil-dia-estrategia-de-teste-de-anuncios-no-facebook-ads/))
- "Bulk launching systems let you input variables once and create **hundreds of ad
  variations in minutes**… quickly identify which combination resonates." (This is
  the *mechanism* a mass-test depends on — and exactly FabAds' bulk-launch job.)
  ([trueprofit — dropshipping FB ads](https://trueprofit.io/blog/facebook-ads-for-dropshipping))

### 2b. What is NOT findable `[not-found]`
- **The name "Bruno"** attached to any documented structure (EN + PT). PT search
  surfaces *educators* named Bruno (Bruno Moura; "Método FB Pro" / Brunno
  Tassitani) but none teaches a thousands-of-cheap-ads mass-test under that name.
- **Any single canonical "Bruno" ratio/structure.** Mass-testing is taught as a
  *philosophy* (volume + fast cull), not a fixed `c:as:ad` template. So the team
  can't import a definition — it must author one.
- **Confirmation that "Bruno = mass-test"** at all. That equivalence is the team's
  rough read and remains unverified; treat it as a hypothesis.

### 2c. The hard part — how a "thousands of cheap ads" mass-test collides with FabAds' 250-cap
This is where the abstract idea meets FabAds' actual data model. Cross-checked
against `02-competitive.md §1` and the distribution engine in
`03-data-model-flows.md §4` (`src/lib/launch-distribution.ts`):

1. **The cap is per *Page*, and it aggregates across ad accounts.** Meta's limit is
   **250 active+scheduled+in-review ads per Page** (tiers up to 1k/5k/20k by
   spend), and **"if a single page is controlled by multiple ad accounts, all ads
   count toward that page's limit"** — you **cannot** dodge it by spreading across
   accounts. ([Meta — Ad limits per Page](https://www.facebook.com/business/help/766697140509126), corroborated by the search extract of [Jon Loomer — ad limits per page](https://www.jonloomer.com/qvt/ad-limits-per-page/) (direct fetch 403)). FabAds already models this correctly: capacity is keyed on
   `fb_page_id`, and **the same `fb_page_id` under two accounts is ONE shared
   250-bucket, never two** (`launch-distribution.ts` `aggregateCapacityByPage`,
   per `03-data-model-flows.md §4.2`).
2. **A naive Bruno run hits the wall almost immediately.** "Thousands of cheap
   ads" / "hundreds of variations" against a **250-active-per-Page** ceiling means
   a single Page is exhausted by one mid-size mass-test. The mass-test thesis and
   the per-Page cap are in **direct tension** — this is precisely the constraint
   competitors ignore (`02-competitive.md §8`: the per-page-cap band is empty
   across every rival).
3. **So Bruno is only viable as a *multi-Page* job — FabAds' wedge.** To run
   thousands of live ads you need **many distinct `fb_page_id`s** (250 live each),
   i.e. the **(account × page)-pair distribution** FabAds is built around. The
   relevant strategy is `fill_first` / `equal` (spread the *same* ads across pairs),
   **not** `duplicate`.
4. **`duplicate` strategy is the trap for mass-tests.** Output =
   `selectedAdCount × targetPairsCount` (`launch-distribution.ts` `computeOutputCount`,
   `03 §4.4`). A mass-test (already high `selectedAdCount`) on `duplicate` is the
   **10× explosion vector** flagged as risk **A1** in `03 §7` — e.g. 1,000 cheap
   ads × 50 pairs = **50,000** created ads in one run, with no ceiling beyond a
   generic amber note. A Bruno preset must **hard-default away from `duplicate`**
   and likely cap/confirm total output.
5. **Slot accounting actually helps a mass-test.** Only **active + scheduled**
   consume a Page slot; **paused is free** (`slotConsuming()`, `03 §2.3`). A
   mass-test that stages a backlog (launch a batch live, hold the rest **paused**,
   rotate as losers are killed) fits the engine's model **and** respects the cap.
   That "staged rotation against per-Page headroom" is a genuinely FabAds-shaped
   feature a Bruno preset could own.
6. **Caveat — capacity is currently fiction.** Today the 250-cap UX validates
   against a **hash-seeded mock**, not real `fb_pages.active_ad_count` (risk **G1**,
   `03 §4.7`). A Bruno/mass-test mode is the **worst** case to ship on mock
   capacity: it's the exact workload that would silently blow past 250 on a shared
   Page while the UI says "OK." **Wiring real page capacity is a prerequisite**
   before any high-volume preset is trustworthy.

**Net:** the public web supports the *idea* of high-volume/low-budget testing, but
not the name or a fixed structure; and FabAds' own model says such a preset is
**only safe as a multi-Page, non-`duplicate`, capacity-aware, paused-backlog**
flow. That intersection (mass-test ÷ 250-cap ÷ multi-page distribution) is exactly
FabAds' differentiator — and exactly where it must not ship on mock data.

---

## 3. Honest gaps the team MUST define (this pass could not)

1. **The label→meaning binding for `1:5:1` / `1:3:5` / `1:1:5`.** **[not-found]**
   publicly. The *mechanics per shape* are corroborated (§1), but **no source
   labels a structure with this notation**. The team owns the labels; this research
   can only say the shapes are real and how they're typically run.
2. **Budget *amounts* baked into each preset.** Public guidance gives *ranges*
   ($1 floor; ~$20–50/ad set practical; ≈ CPA×50/week min) but **no canonical
   per-ratio number**. The team must set defaults (and ideally derive them from the
   user's target CPA, per the corroborated "CPA × 50" rule).
3. **CBO-vs-ABO default per ratio.** Best practice says **ABO for these test
   shapes**, CBO for the scale step — but whether each FabAds preset ships ABO,
   CBO, or user-choice is a **product decision**, not a researchable fact.
4. **"Bruno": name, owner, and whether it even means "mass-test."** **[not-found]**
   on all three. Likely insider/person shorthand on blocked surfaces (Reddit /
   FB groups / courses). The team must (a) confirm the intent, (b) author a
   concrete structure, and (c) decide if "Bruno" is even the right user-facing
   name (it carries zero public recognition, unlike e.g. Meta's "Power 5").
5. **Per-ratio mapping to FabAds distribution strategy.** Which ratios pair with
   `fill_first` / `equal` / `duplicate`, and the per-Page-cap guardrails — derivable
   from `03-data-model-flows.md` but **not yet specified per preset**. §2c argues
   mass-test/Bruno must avoid `duplicate`; the team must lock the mapping for each.
6. **Scale presets (the missing half).** All three numeric ratios read as **test**
   shapes. The corroborated "ABO-test → **CBO-scale**" pipeline and the horizontal
   "duplicate winners into new (account, page) pairs" pattern
   (`05b §1` rows 2 & 5) imply there should be **scale** presets too. The team
   hasn't named ratios for the scale side — a gap if "Launch Strategies" is meant
   to cover the full test→scale lifecycle.

---

## 4. Bottom line

- **Grammar accepted, labels still uncanonical.** With `c:as:ad` clarified, the
  three ratios decode cleanly and their **mechanics are [data-backed]** — but the
  **notation itself has no public currency [not-found]**, so FabAds is *defining*,
  not *adopting*, these labels. (Consistent with 05b.)
- **The trio is coherent and best-practice-aligned:** `1:5:1` = audience test,
  `1:1:5` = creative test, `1:3:5` = both — all naturally **ABO**, broad/Advantage+
  leaning, 3–5 creatives where applicable. The only friction is `1:5:1`'s 5 ad sets
  brushing the "≤5, don't fragment" consolidation line — defensible **as a test**.
- **"Bruno" is the weakest link.** The mass-test *shape* is real and findable;
  the **name and any fixed structure are not**. Treat "Bruno = mass-test" as an
  unconfirmed hypothesis the team must resolve and probably rename.
- **The 250-cap is the binding constraint on any high-volume preset**, and it's
  where FabAds wins: a mass-test is only safe as a **multi-Page, capacity-aware,
  non-`duplicate`, paused-backlog** flow — but **not on today's mock capacity**
  (wire real `fb_pages` first).

---

### Source index

**Ratio-shape mechanics (structure / ad-set & ad counts / ABO-test):**
[adligator — anatomy/5 structures](https://adligator.com/blog/facebook-ads-campaign-structure-examples-verticals) ·
[adligator — CBO vs ABO](https://adligator.com/blog/facebook-ads-budget-optimization-cbo-vs-abo-guide) ·
[digitorm — testing/scaling/retargeting](https://www.digitorm.com/blog/the-right-facebook-ad-campaign-structure-for-testing-scaling-and-retargeting) ·
[npprteam — CBO vs ABO 2026](https://npprteam.shop/en/articles/facebook/scaling-facebook-ads-in-2026-cbo-vs-abo-budget-phases-and-when-to-kill-a-campaig/) ·
[lebesgue — multiple vs one ad per ad set](https://lebesgue.io/facebook-ads/facebook-ads-testing-multiple-ads-per-ad-set-vs-one-ad-per-ad-set) ·
[admanage — how many ads at once](https://admanage.ai/blog/how-many-facebook-ads-should-you-run-at-once) ·
[adlibrary — structure 2026](https://adlibrary.com/posts/facebook-ad-campaign-structure) ·
[cropink — CBO 2026](https://cropink.com/cbo-facebook-ads) ·
[tryvizup — how many ad sets 2026](https://www.tryvizup.com/blog/how-many-ad-sets-per-campaign-in-meta-ads-2026)

**Budget thresholds / min viable test budget:**
[roaspig — min budget to test 2026](https://roaspig.com/blog/minimum-viable-budget-testing-facebook-ads) ·
[stackmatix — FB ads budget for startups](https://www.stackmatix.com/blog/facebook-ads-budget-startups)

**Broad / Advantage+ default (2026):**
[adligator — broad/Advantage+ 2026](https://adligator.com/blog/meta-broad-targeting-advantage-plus-audiences-2026) ·
[conversios — Advantage+ vs detailed targeting](https://www.conversios.io/blog/meta-advantage-audience-vs-detailed-targeting-2026-guide/) ·
[leadsync — targeting guide 2026](https://leadsync.me/blog/facebook-ads-targeting-guide/)

**Bruno / mass-test / high-volume creative (EN + PT):**
[stackmatix — top advertisers 2026](https://www.stackmatix.com/blog/top-facebook-advertisers-2026) ·
[trueprofit — dropshipping FB ads](https://trueprofit.io/blog/facebook-ads-for-dropshipping) ·
[dropshippingnagringa (PT) — "100 mil/dia"](https://www.dropshippingnagringa.com/100-mil-dia-estrategia-de-teste-de-anuncios-no-facebook-ads/) ·
[grecos.com.br (PT) — como escalar](https://grecos.com.br/como-escalar-facebook-ads/) ·
[brunomoura.pt — FB ads 16 dicas](https://brunomoura.pt/facebook-ads-16-dicas-basicas/) (educator named Bruno; not a mass-test method) ·
[Método FB Pro / Brunno Tassitani](https://brunnotassitani.com.br/metodo-fb-pro/) (educator; not a mass-test method)

**250-cap / per-Page limit (constraint cross-check):**
[Meta — Ad limits per Page](https://www.facebook.com/business/help/766697140509126) ·
[Meta — campaign/ad set/ad limits per account](https://www.facebook.com/business/help/652738434773716) ·
[Jon Loomer — ad limits per Page](https://www.jonloomer.com/qvt/ad-limits-per-page/) (search extract; direct fetch 403) ·
internal: `02-competitive.md §1`, `03-data-model-flows.md §4 & §7` (`src/lib/launch-distribution.ts`)

> **Confidence summary.** **Per-shape mechanics** (ABO-for-testing, 3–5 ad sets,
> 3–5 ads/ad set, broad/Advantage+, ABO-test→CBO-scale) are **[data-backed]**
> across many independent 2026 guides. The **binding of those mechanics to the
> labels `1:5:1` / `1:3:5` / `1:1:5`** is **[directional]** (inferred from the
> clarified grammar + corroborated component rules; no source uses the notation).
> The **"Bruno" name and any fixed mass-test structure** are **[not-found]**; only
> the high-volume/low-budget *shape* is [directional]. The **250-cap aggregation
> across accounts** is **[data-backed]** (Meta primary doc + codebase). Pricing/
> threshold figures are point-in-time mid-2026.

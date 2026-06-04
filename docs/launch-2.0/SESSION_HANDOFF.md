# Launch 2.0 — Session Handoff & Full Context

> **HOW TO USE THIS FILE.** Upload this single `.md` to a fresh **claude.ai chat**
> session to continue the FabAds **Launch 2.0** research with full context. It is
> self-contained — it embeds the methodology, locked decisions, the reference model,
> the current Step-1 deliverable, condensed findings from the entire research corpus
> (with citations), the two AdManage demo-video transcripts verbatim, and the
> open/blocked gaps. You do **not** need the repo to continue research; you only need
> the repo again when it's time to commit deliverables + build the code.
>
> **Why we moved to chat:** the Claude-Code remote env has a network allowlist that
> blocks direct-fetching of Reddit / YouTube / forums / Google Docs — exactly the
> sources the methodology leans on for Steps 4–5. Chat browses them freely. (WebSearch
> *does* work in Code; only raw-thread fetches are blocked. The repo, git, parallel
> agents, and the PPTX build all work in Code — so we return there to commit + build.)
>
> **Repo pointers (for when you return to Code):**
> - Branch: `claude/lucid-cerf-Q2yVp` · Draft PR: **#1** (`Powerhouse3812/FabAds`)
> - Research corpus lives in: `docs/launch-2.0/` (12 evidence docs + this handoff)
> - The full research doc-in-progress: `docs/launch-2.0/Launch_Research_Doc.md`

---

## 0. Where we are right now

- **Phase:** Research (Step 1 of a 10-step gated methodology). **No code** until the
  spec is approved.
- **Step 1 — Problem Statement: DRAFTED, awaiting Maalik's lock** (full text in §6).
- Everything before this was a research-corpus build (12 docs) + an AdManage
  transcript ingestion. That corpus is condensed in §7 so the chat has the evidence.

---

## 1. The mission (one breath)

**Launch 2.0** is a greenfield redesign of FabAds' **Meta-only** (Facebook/Instagram)
**bulk ad-launch** module. FabAds is a multi-account, multi-page Meta ad launcher; the
existing Launch module has a History page, a 3-step wizard, Targeting Templates,
AutoPilot (prototype), RRM, and stubbed Launch Settings / Clones. The "Launch 2.0
(Beta)" CTA that exists today is a **no-op toast** → this is a from-scratch redesign,
not reconciling a half-built v2.

We are running **rigorous, front-loaded, data-backed research first** (the way Genie
6.0 was done), then a Q&A round, then design, then build. **No shipping on assumption.**

---

## 2. The research methodology — 10 gated steps (FOLLOW EXACTLY, IN ORDER)

> Each step **blocks** on the previous. After each step: **STOP, surface to Maalik,
> wait for approval/correction.** Use button-mode Q/A (ask_user_input style) for every
> "STOP and surface" moment. Spawn multiple agents to go fast without losing quality.
> Don't write fluffy marketing copy — write what a senior PM would defend in a roadmap
> review.

1. **Problem Statement** — 3 paragraphs: (a) unaddressed user JTBD; (b) what's broken
   now (FabAds v1, competitor tools, Meta Ads Manager itself); (c) why worth solving at
   this point in FabAds' lifecycle. → STOP.
2. **Goal** — 3–5 *measurable* outcomes. Candidates: time-to-first-launch
   (creative-ready → live on Meta); cross-platform reach (1 creative → N launches in one
   action); launch confidence (compliance + budget + audience pre-flight before live);
   whatever else matters. → STOP.
3. **Personas** — two are locked from Genie 6.0 (**Solo Operator** + **Agency
   Strategist**). For Launch, ask whether these are the same personas/JTBDs, or whether
   Launch has a **third** persona (e.g. a Media Buyer who only Launches + Optimizes,
   never Generates). → STOP, confirm.
4. **Competitor inventory** — for each: primary JTBD solved · distinctive
   feature/pattern worth borrowing · failure mode / where users complain · one-line
   positioning. **Minimum:** Madgicx, Revealbot, Smartly.io, AdEspresso, Meta Ads
   Manager (baseline), Triple Whale, Northbeam, Motion/Atria. **Web search REQUIRED —
   find real user complaints on Reddit, G2, ProductHunt, agency Slack; quote with
   sources.** → STOP, Maalik flags important vs noise.
5. **Pain points + opportunity matrix** — 10–20 pains; for each: persona affected,
   severity 1–5, competitor coverage, whether FabAds Launch could *uniquely* solve it.
   (This is the Genie "Pain × Tool heatmap" equivalent.) → STOP.
6. **Launch JTBD enumeration** — *the heart.* Brainstorm every distinct flow Launch
   might support (candidate list in §8). For each: is it a **separate flow**, a
   **sub-method** of a parent, or an **angle/filter** on a parent? + required input +
   output (live campaign / draft / scheduled) + owning persona + frequency. → STOP.
   Maalik edits/merges/drops/reorders. **Do not proceed to spec until the list is
   locked.**
7. **Input shape taxonomy** — for each locked flow, the input options (creative from
   Genie Library / from FabAds Reports / saved template / net-new audience / saved
   audience / budget / schedule / platform target / placement filter / compliance
   preset / lookalike + custom-audience source / etc.). → STOP.
8. **Architecture decision** — outside CTAs + routes + form structure. Apply Genie's
   rules (single unified form per flow, Advanced drawer collapsed = Quick; type-aware
   sticky top zone; floating action bar *if applicable*; references/templates strips;
   gate modal for type/scope confirm; route per CTA). **Open questions to ASK, not
   assume:** does Launch have a "prompt bar" or is it pure-parameter UI? Is there a
   Launch dashboard (in-flight/scheduled/paused) or only the create-flow? Does Launch
   need its own Library (saved campaigns/audiences/templates) or borrow Genie's? Where
   does Genie's Results-screen "Launch" button hand off (single-ad only, or also bulk)?
   → STOP at each open question; don't self-answer.
9. **Form spec per outside CTA** — mirror `Genie_6.0_Form_Specs.md` depth: route · top
   sticky zone · form-body sections (in order) · advanced-drawer fields (in order) ·
   floating action bar · pre-fill matrix per entry path · empty state · error state
   (failed launch / platform API rejection / compliance reject / budget cap hit) ·
   success state (live confirm / draft saved / scheduled queued) · cross-mode behavior.
10. **Consolidation + handoff** — write to `/mnt/user-data/outputs/`:
    `Launch_Research_Doc.md` (Steps 1–7), `Launch_Form_Specs.md` (Step 9, mirrors the
    Genie form-specs format), `Launch_Handoff_Note.md` (locked decisions / what NOT to
    re-debate). Update `Master_Planning_Doc` with **Section 13 — Launch module**.

---

## 3. Tone & rules

- Address Maalik as **"Maalik"**. **Hinglish** OK. Direct and dense. **No flattery.**
- **Push back** if something Maalik says conflicts with research or the design system —
  don't quietly comply.
- Button-mode Q/A for foundational decisions / every STOP-and-surface.
- Sign off **"System paad denge"** when natural.

**What NOT to do:**
- Don't propose a spec before locking research (Steps 1–7).
- Don't design forms before locking the JTBD list (Step 6).
- Don't assume Launch needs a Wizard/Form split — Generate explicitly killed that;
  same default for Launch unless research shows otherwise.
- Don't propose **Catalog DPA** scope without explicitly flagging it — for Generate it
  was OUT; for Launch it might be IN (platforms handle it). Decide explicitly.
- Don't skip inventory — read what exists first.
- Don't re-debate Genie 6.0 decisions that touch Launch (e.g. the
  Save/Launch/Download action structure on the Genie OutputCard is **locked**).
- **No code this phase.** Research + spec only. Code comes after Maalik approves the spec.

---

## 4. Locked decisions

- **Scope:** Meta-only (Facebook/Instagram) for now.
- **Final artifact:** a **Genie-style PPTX** deck (reference model =
  `Genie_6.0_Planning_Deck`), backed by the markdown research doc.
- **Sequence:** Research (Steps 1–7) → lock → Q&A round → design/spec (Steps 8–9) →
  consolidation (Step 10) → *then* code.
- **Filenames:** `Launch_Research_Doc.md`, `Launch_Form_Specs.md`,
  `Launch_Handoff_Note.md`; update `Master_Planning_Doc` → "Section 13 — Launch module".
- **Strategy grammar:** Launch Strategies are `campaign : adset : ad` ratios — see §9.
- **Enterprise gating:** "Launch Strategies" are positioned under the Enterprise plan
  (06-03 MOM decision).

---

## 5. The reference model — Genie 6.0 Planning Deck (structure + quality bar)

The Genie deck is **19 slides across 10 numbered sections**, single source of truth.
Mirror this structure + depth for Launch. Anatomy:

- **Slide 1 — Cover scorecard.** Big numbers (Genie: "6 generation modes · 2 personas ·
  8 whitespace bets · 28 competitors audited"), the **one-line WEDGE**, the **evidence
  legend (V/O/I)**, author/date/status.
- **§2 Problem Statement** — shared root cause + 3 layered problems, each WHO / WHAT /
  IMPACT / EVIDENCE (cited, V/O/I + source + date).
- **§2 Evidence** — real user-voice **verbatim quotes** per problem, each cited to
  platform/subreddit/date, `[verify]`-flagged.
- **§8 Competitor landscape** — N tools across clusters; each cluster TOOLS / PRICING /
  DOES WELL / FAILS AT / evidence.
- **§8 Pain × Tool heatmap** — pains × tools, H/M/L severity from complaint patterns;
  "reading the gap" = whitespace.
- **§4 Personas** — SNAPSHOT / JOBS-TO-BE-DONE / FRUSTRATIONS / BEHAVIORS (actual
  workflow) / QUOTES (cited). Plus a **persona → UI contract** (UI must SHOW / HIDE /
  anti-patterns / vocabulary / onboarding shape / default priority).
- **§3 Goal** — USER GOAL / BUSINESS GOAL / SUCCESS METRICS table (metric · target ·
  why-this-one · source-tier) / ANTI-GOALS. (Genie used Hinglish here.)
- **§6 Flows** — step-by-step, each with EMPTY / ERROR / SUCCESS states + drop-off
  prevention. (Design-phase for us — after Q&A.)
- **§5 "What it builds"** — surface table + **CARRY / DROP / NET-NEW vs the prior
  version**; generation primitives; interaction patterns.
- **§7 Critical interaction patterns** — the build-or-break details.
- **Closing** — "N features no competitor ships well" (enumerated bets) + HANDOFF
  checklist.

**Evidence legend (use on every claim):** **V** verified (named source / code) · **O**
observed (cohort pattern, ≥2 sources) · **I** inferred (synthesized — flag as hypothesis).

---

## 6. STEP 1 — Problem Statement (current deliverable, AWAITING LOCK)

*Citations are to the `docs/launch-2.0/` corpus (condensed in §7). Fresh web citations
to be layered in at Steps 4–5.*

### (a) The unaddressed job
The job high-volume Meta advertisers are hiring a launcher to do — and that nothing on
the market, FabAds v1 included, does well — is **distribution-aware bulk launch at the
(ad-account × page) layer**: stamp a proven `campaign → adset → ad` structure across the
*right* surviving accounts and pages from minimal input, while respecting Meta's per-Page
~250-ad cap. That cap is the crux — it counts active + scheduled + in-review ads **per
Page** and **aggregates across every ad account touching that page**, so it cannot be
dodged by spreading across accounts, and **no competitor surfaces it as a first-class
concept** `[V]`. The sharpest-fit persona is the dropship / agency-account operator (and
the agency lead): many accounts, many pages, lives with bans `[O]`. Today they hand-spray
across pages, fight a CSV export/import hack that silently breaks pixels and Advantage+
text `[V]`, and pay **3–15% of spend (~£200–1,500+/mo) to rent agency accounts purely to
dodge bans** — hard willingness-to-pay evidence for an account-health job no launcher owns
`[V]`. The full band — distribution + cap-awareness + codified warm-up +
rejection/account-health recovery + guided strategy presets — is empty `[V]`.

### (b) What's broken now
Launching is broken in three arenas, and FabAds v1 is the worst of them. **FabAds v1:**
`launch-execute` is a **simulated stub** — shows "Launch successful!" and writes a History
row with no Meta API call, no per-entity result, no partial-success handling `[V]`; two of
four create paths don't even simulate (Catalogue only toasts; Fast Launch fakes
`status:'launched'` with empty ad rows) `[V]`; the data model has **no `ad_account_id` on
campaigns/adsets/ads** (account-level distribution impossible at the entity level),
validates the 250-cap against **hashed mock capacities** instead of the real `fb_pages`
table, and fans `duplicate` strategy out to **~500K client-side row-writes** with no
virtualization `[V]`. **Meta Ads Manager (the baseline):** no cross-account duplication
without the pixel-breaking CSV hack; enforces the per-Page cap (aggregating across
accounts); ~5–15 min per ad by hand; atop learning-phase volatility and ~83 platform
changes/yr `[V]`. **Competitors:** launch is a **bolt-on** to optimization/creative
engines; schedulers fire silently (Madgicx, Smartly) `[V]`; none model (account×page)
distribution, the cap, warm-up, or account-health `[O]`. But the direct bulk-launcher tier
(AdsUploader / Adnova / AdManage) already ships the table-stakes v1 lacks — API-direct
execution, aspect-ratio auto-grouping, pixel re-map on duplicate, post-ID reuse, rich
formats `[V]`. So v1 is simultaneously *behind* on ergonomics and *ahead only on an
unbuilt wedge*.

### (c) Why now
Three timing forces converge. **(1) Genuinely greenfield** — the "Launch 2.0 (Beta)" CTA
is a no-op `toast("Coming Soon")`; no route, flag, or component exists, so there's no
parallel build to reconcile, just one button to repoint; and the "Beta" label is *actively
lying to users* every day it ships `[V]`. **(2) A closing window** — the differentiating
band is empty across every competitor, but the table-stakes layer beneath it is filling
fast (AdsUploader/Adnova ship API-direct bulk today; Meta's ~83 changes/yr rot any latent
capability, à la AdEspresso) — open, not permanent `[O]`. **(3) The closed loop** — Genie 6
(the entry-point product, research just completed) now generates creative *volume* with no
trustworthy launch destination; the generate→launch path is **already wired at 8 sites**
yet dead-ends in the simulated execute. Launch closes the **generate → launch → learn**
loop and is FabAds' monetization/retention bridge `[I — framing; underlying facts V]`. The
pull is dated and committed: the 06-03 MOM gates "Launch Strategies" behind Enterprise with
a ~7-day UX timeline `[V]`. The most consequential action in the product is fake today —
that credibility gap blocks the business now, not later.

**Honesty flags:** "closed-loop / monetization bridge" is **I** (interpretation; facts are
V). "Closing window" and "no competitor owns the wedge" are **O** (directional / multi-source
pattern, not single-source-pinned). Vendor-sold tedium figures deliberately excluded.

---

## 7. Research corpus — condensed findings (the evidence base)

> 12 docs from the prior research pass. Condensed here so the chat has the evidence
> without the repo. Each carries its own citations in the full docs.

### 00-context.md — MOM digest + scope
- Source: **06-03 Product Meeting "Launch Strategies and Enterprise Bulk Campaign Flows."**
- Scope = **Launch Strategies** (predefined guided bulk-launch flows). Grammar =
  `campaign:adset:ad` ratios. **8 decisions locked, 9 open questions.**
- Decisions incl.: predefined strategies; Enterprise-gated; preview/confirm final screen;
  mandatory activity logs; two-phase launch; ~7-day UX-close timeline then dev.
- **Neeraj's feedback:** co-locate validation (v1 scatters/skips it across wizard steps);
  creative visibility required (thumbnails, not filename dropdowns); the 3 creative-mapping
  modes look too similar ("are these the same?").
- **Team Slack:** study **AdManage feature-wise before redesigning**; **custom audience**
  must be first-class in 2.0 (v1 omitted it); consider **post-id / static / flexible /
  catalogue-partnership** as differentiation surfaces. "Influencer / e-commerce audience
  this will be useful for."

### 01-v1-teardown.md — current Launch + "Beta" audit
- **"Launch 2.0 (Beta)" CTA** (`src/pages/LaunchHistory.tsx:~98`) fires only
  `toast({title:"Coming Soon"})` — **no route/flag/plan-gate/component** anywhere →
  greenfield confirmed. It's one of **three colliding create CTAs** on the History toolbar.
- **`launch-execute` = simulated stub** (sleeps 2–3s, "fails" only if launch name contains
  "fail"; fakes success). Catalogue "Launch N Ads" only toasts (never mutates). Fast Launch
  writes `status:'launched'` with zero platform work + empty ad rows.
- **AutoPilot** is fully in-memory (refresh wipes config). **RRM** blends dummy + real data
  on a spend-triggering surface. **Launch Settings + Clones** are stubs.
- Dead code: `StepReview.tsx` (orphaned — was the preview/confirm), `FastLaunchModal.tsx`
  (orphaned; `FastLaunchDrawer.tsx` is live), `Launch.tsx` (nothing routes to it).

### 02-competitive.md — competitive teardown (the field)
- **5 tiers:** (0) Meta Ads Manager baseline · (1) rules/optimization: Revealbot/Bïrch,
  Madgicx · (2) **bulk launchers = FabAds' tier:** AdsUploader, Adnova, **AdManage.ai**,
  AdAmigo, AdEspresso (legacy) · (3) enterprise creative-at-scale: Smartly.io · (4)
  adjacent: Foreplay, Motion, Hootsuite, Sprout.
- **Meta baseline pain:** no cross-account dup w/o CSV hack that breaks pixels/Advantage+
  text; **250-ads-per-Page cap** tiered (250 < €100k/mo → 1k → 5k → 20k), counts
  active+scheduled+in-review, **aggregates across all accounts touching the page**; ~5–15
  min/ad; learning-phase volatility; ~83 Meta changes/yr.
- **The empty band (FabAds wedge):** (account×page) distribution · per-page cap awareness ·
  warm-up/ramp · rejection/account-health (RRM) — `○` across *every* competitor.
- **Patterns to adopt:** combinatorial matrix builder + visual prune (AdEspresso);
  API-direct publishing; dynamic naming → filename→placement grouping; same-post-ID social
  proof (Madgicx); reusable templates; cloud-drive import; flat/predictable pricing
  (AdsUploader $59 flat); observable retry-safe scheduling; codified warm-up.
- **Anti-patterns:** distributing by account only (ignoring page+cap); unreliable opaque
  schedulers; falling behind Meta's changelog (AdEspresso's death); punitive per-account
  pricing; rules-engine-style UI; launch-as-bolt-on; naive cross-account dup that breaks
  pixels; ignoring account-health/circumvention risk; thin support at failure.

### 03-data-model-flows.md — data model, distribution, stress @ 10×
- Entity model: `launches → launch_ad_accounts → launch_campaigns → launch_adsets →
  launch_ads`. **No `ad_account_id` on campaigns/adsets/ads** → account-level distribution
  blocked at the entity level; currency mis-resolved at launch level.
- **Distribution engine** (`src/lib/launch-distribution.ts`): `fill_first | equal |
  duplicate` strategies across (ad_account × page) pairs, ~250-ads-per-Page cap shared
  across accounts. Today on **mock/hash-derived (FNV-1a) capacities** — the real
  `fb_pages.active_ad_count` table exists but is never queried; every account gets exactly
  3 mock pages.
- **Stress @ 10×:** zero table virtualization (no react-window/virtual dep); `duplicate`
  can explode to ~**500K** ads (`selectedAdCount × targetPairsCount`); unbounded loads;
  N+1 writes (per-row round-trips for generate/clone/bulk).

### 04-roles-failures.md — roles + failure taxonomy (light)
- Plan tier is a `"full" | "ai"` **demo toggle** (`?plan=` / sessionStorage); `usePlan()`
  **fails open to `full`**. `plan==="ai"` early-returns an upsell page (so only full-plan
  users even see the Beta CTA).
- **No partial-success model**; execution stub; no retry-failed-only; no activity logs.

### 05-market-user.md — market & user (personas, pains)
- **#1 user pain = account bans/restrictions** with no support → maps to RRM.
  Empirical **willingness-to-pay**: agency-account *rental* at **3–15% of spend / ~£200–
  1,500+/mo** purely to dodge bans.
- **Personas:** *Dropship/agency-account operator* = **sharpest fit** (many accounts +
  pages, treats accounts as disposable); *Agency lead* (scale + delegation); *Solo
  Performance Operator* (replaces weak "solo creator"; runs real spend solo); *Performance
  marketer* (in-house optimization); *Brand manager* (fewer launches, brand-safety).

### 05b-strategy-demand.md — strategy demand + competitor presets
- **No competitor ships vendor-defined named launch-STRUCTURE presets.** Revealbot
  "Strategies" + Madgicx "Tactics" govern **post-launch automation**, not structure.
  User-authored "presets" elsewhere = copy/creative/identity defaults, not structure.
- Most in-demand pipeline: **ABO test → CBO scale.**

### 05c-ratio-strategies.md — ratio strategies + Bruno
- `1:5:1` = **audience test** (1 campaign, 5 ad sets, 1 constant ad; ABO ~$20–50/ad set).
- `1:1:5` = **creative test** (1 broad/Advantage+ ad set, 5 creatives; concentrated budget).
- `1:3:5` = **both** (3 audiences × 5 creatives).
- **"Bruno"** = high-volume minimal-budget mass-test; the **name = `[not-found]`** in EN+PT
  search (likely insider shorthand); the *shape* is real `[directional]`. Collides with the
  250/Page cap (which aggregates across accounts) → viable **only as a multi-Page job using
  `fill_first`/`equal`, never `duplicate`** (the explosion case). Real `fb_pages` capacity is
  a prerequisite (today mock).
- **Standing gap:** all three named ratios are **TEST** shapes — there is **no named SCALE
  preset** yet, though the MOM calls for scaling flows.

### 06-synthesis.md — cross-stream synthesis
- **Thesis:** the wedge (distribution + warm-up + RRM + guided strategies) = #1 user pain +
  empty competitive band + *not actually built*.
- **P0 (trust/foundation):** real batched server-side execution + partial-success + retry;
  activity logs; co-located + gated validation; virtualization + real capacity.
- **P1 (the product):** Launch Strategy presets with resulting-shape preview; distinct
  visible creative-mapping (fix the 3 modes); account/page distribution first-class;
  Enterprise gating.
- **Naming collision to resolve:** "strategy" already means the distribution enum AND
  AutoPilot's automation profile AND Revealbot/Madgicx automation bundles. Disambiguate.

### 07-meta-fields.md — Meta field inventory vs v1
- **Custom audiences = fake stub** (`SelectCustomAudienceModal.tsx`): free-text name box +
  FB/IG platform dropdown, **no real fetch / no IDs**.
- **Absent in v1:** lookalikes, saved audiences, existing-post/`object_story_id` (Post-ID),
  real pixel/dataset + conversion event, interests/behaviors/demographics, attribution spec,
  billing event, A/B test, buying type, dayparting, min-ROAS/cost-cap, lead-form/WhatsApp/app
  destinations, offline/3rd-party tracking.
- **Objectives are stale** legacy labels — Meta now uses ODAX `OUTCOME_*` only (old labels
  400 on the API).

### 08-admanage.md — AdManage.ai feature teardown (the competitor the team flagged)
- **What AdManage has that v1 doesn't:** actual Marketing-API execution ("100+ ads in <1
  min"); **aspect-ratio auto-grouping → placement routing** (1:1/4:5/9:16 → Feed vs
  Stories/Reels); **Smart Fix** media processing + custom thumbnails; **pixel verified +
  reassigned per destination account on every duplicate**; **Post-ID reuse at scale**; rich
  formats (Collection, Flexible, Carousel-10, Partnership, Multi-Language/DLO); cloud-drive
  + YouTube import; Google Sheets add-on; public API + MCP server; multi-platform
  (Meta/TikTok/Google/Snap/Taboola/AppLovin); workspaces.
- **Where FabAds' design intent still beats it:** AdManage has **no** (account×page)
  distribution, **no** 250-cap awareness, **no** warm-up, **no** RRM, **no** named
  launch-structure presets. That band stays FabAds' wedge — *but only once FabAds actually
  executes* and matches AdManage on table-stakes.
- **VIDEO-CONFIRMED (transcripts, §10):** post-ID is a **persisted account-level launch
  setting**; partnership ads = co-brand toggle + dual-identity-in-header, one-click.
- **STILL UNCONFIRMED (the important gap):** AdManage's **targeting/audience picker depth** —
  interest/behavior/lookalike/saved/**custom-audience attach** UI — plus the named
  targeting-template library, in-app RBAC, and whether a combinatorial creatives×copy matrix
  builder exists. The two demo videos were narrow feature clips and didn't show the ad-set/
  targeting step. **Needs a live AdManage trial capture** of the targeting screen (the team's
  original ask), OR design custom-audience from Meta's own field spec (07) and mark AdManage
  parity unverified.

### prototype-review.md — Lovable "Unified Launch Builder"
- TanStack Start; 4-step wizard (Scope → Strategy → Creatives → Preflight); ~2 hand-written
  files of ~63. **Scale fake** (caps rows at 12 via `Math.min`); mapping modes not truly
  distinct (`manual` = `distribute` + overrides; `multiply` shape-math buggy); validation
  scattered, `Continue` never gated, 2/4 preflight checks hardcoded `ok:true`. **Verdict:
  reference-only.**

---

## 8. Step-6 candidate flows (for the JTBD enumeration — NOT exhaustive, NOT locked)

Single ad launch · Bulk launch (N creatives → N ad sets) · Variation launch (winner +
auto-variants → A/B grid) · Campaign launch (audience + budget + schedule + creative pack) ·
Cross-platform launch (1 pack → Meta+TikTok+Google) — *NOTE: scope is Meta-only for now;
flag cross-platform explicitly* · Re-launch / refresh (winner CPA spiking → fresh batch) ·
Audience-builder + launch (build lookalike/custom inline, then launch) · Budget allocator
(split budget by predicted performance) · Scheduled launch (Diwali/BFCM/launch-day) ·
Lead-gen launch (Meta lead form + LP) · **Catalog DPA launch (feed-driven, multi-product —
flag IN/OUT explicitly; was OUT for Genie, may be IN for Launch)** · Compliance-gated launch
(brand-constitution + geo-policy + platform-policy pre-flight) · Optimize-during-launch
(auto-pause losers / auto-scale winners — likely belongs to rules engine, not Launch) ·
Status sync (pull live performance back into FabAds Reports).

For each: separate flow vs sub-method vs angle? · required input · output · owning persona ·
frequency.

---

## 9. Launch Strategy grammar (locked framing)

`campaign : adset : ad` ratios. `1:5:1` = audience test · `1:1:5` = creative test · `1:3:5`
= both · "Bruno" = high-volume minimal-budget mass-test (name unconfirmed publicly; shape
real; must be multi-Page + never `duplicate` due to the 250/Page cap). **All named ratios
are TEST shapes — the named SCALE preset is an open question (Step-6 / Q&A).**

---

## 10. AdManage demo-video transcripts (verbatim — provided by Maalik, 2026-06-04)

### Video A — "Launch Ads as Post IDs in One Click"
> This is how I launch all my ads as post ID in one click. So first what you want to do is
> head over to admanage.ai. Just select your ad account — this one we're just going to use
> "ad manage limited." Scroll down to your settings on the side. Go to **account settings**
> and then you'll see launch customization / ad account settings. Click on **launch
> settings**. Scroll down and you'll see "**Launch ads as post ID when launched. Use post ID
> when recreating ads.**" Take that on. Once that's on, just go to **ad launcher, select your
> ad set** — let's select this one. We want to **launch ads as paused**. Then go to **load
> media** — select these few, **add six creatives**. And then **launch**. Just like that, in
> literally **10 seconds, we launched the six ads**. If you go across you'll see **creative
> type** and it says **post ID**. That's how you launch your ads as post ID. It's so
> important to keep all your likes, comments, and social proof in one place — and that's what
> post ID does for you.

**Reading:** post-ID reuse is a **persisted account-level launch SETTING**, not a per-ad
chore; launches into an **existing ad set**; "launch as paused" toggle; results table has a
**`creative type` column** surfacing "Post ID".

### Video B — "Launch Meta Partnership Ads in seconds with AdManage.ai"
> Launch meta partnership ads in seconds. **Switch to your meta ad account. Load media.** Pick
> your video. **Click "partnership ads" to set up co-branding.** Your own brand identity is
> ready. **Show both identities in the header.** Pick your ad set, then **confirm. Launch with
> one click. Ad manage handles the partnership setup in the background.** AdManage.ai — launch
> every meta feature 10 times faster.

**Reading:** partnership/branded-content setup is collapsed to **one co-brand toggle +
single/dual identity choice**, launched into an existing ad set, one click — no separate
partnership wizard.

---

## 11. Blocked / open gaps (don't fake these)

1. **AdManage targeting/audience-picker depth** — the #1 thing Neeraj flagged. The two demo
   videos were narrow (post-ID, partnership) and did NOT show the ad-set/targeting step.
   Needs: a **live AdManage trial capture** of the targeting screen (best), OR design
   custom-audience from Meta's field spec (07) and mark AdManage parity unverified. In chat,
   try opening AdManage docs/site + any longer demo videos directly.
2. **Raw user-voice quotes** (Reddit r/PPC, r/FacebookAds, r/dropship, agency Slack, G2,
   ProductHunt) — Step 4/5 needs these *with sources*. These were blocked in Code; **chat can
   open them** — go get them.
3. **The original MOM** was pasted (06-03 Product Meeting) — re-paste if the chat needs the
   verbatim.

---

## 12. The 9 open questions (from prior synthesis — for the Q&A round AFTER research locks)

1. Entry point — creative-first or strategy-first as primary? (Sahil leaned creative-first.)
2. Per-strategy mechanics — confirm budget/CBO-vs-ABO/account-page-spread per ratio. **And:
   what is the named SCALE preset?** (all current ratios are test shapes.)
3. "Bruno" canon — confirm name/owner/structure + how it respects the 250/Page cap + budget
   floor.
4. Which strategies ship first? (a testing + a scaling one = safest first bet.)
5. Editing on the preview/confirm screen — how much is allowed?
6. User-created / saved strategies — supported in v1?
7. Catalog product mapping — at which level (account/campaign/adset/ad)? In or out of scope?
8. Enterprise pricing model.
9. Publish permissions — role-gate publishing? (today any member can.)

---

## 13. Immediate next step

**Lock or correct Step 1 (§6).** Then proceed to **Step 2 — Goal** (3–5 measurable
outcomes), STOP, surface. Continue gated through Step 10. Build the Genie-style PPTX as the
artifact. Bring final deliverables back to the FabAds repo (branch `claude/lucid-cerf-Q2yVp`,
PR #1) to commit.

*System paad denge.*

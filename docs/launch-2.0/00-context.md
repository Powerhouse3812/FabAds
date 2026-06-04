# 00 — Context (MOM digest + scope)

> Source: **06-03 Product Meeting — "Launch Strategies and Enterprise Bulk Campaign Flows"** (MOM provided by Maalik, pasted 2026-06-04). This doc structures that MOM and cross-references it to research streams 01–05. **Nothing here is assumed** — where the meeting left something open, it's marked **UNDECIDED**; where a claim comes from our code research, it's cited.

## The reframe (what Launch 2.0 actually is)
Launch 2.0 is **not** a generic redesign of the Launch module. It is **"Launch Strategies"** — predefined, guided **bulk-launch flows** that let users launch with **fewer inputs, stronger validation, and clearer expected behavior**, plus a **scratch / flow-builder** mode for advanced users. Enterprise-gated, ending in a **preview/confirm** screen, with **mandatory activity logs** and a **cloning overhaul**.

Named predefined strategies discussed: **151, 135, 115, Bruno/Brazilian-style**, + scratch/custom.

## Concept model
- **Two modes**: (a) **Predefined strategies** (common scaling approaches, minimal input); (b) **Scratch / flow-builder** (advanced, custom). Product goal: *"the person should not scratch at all"* (Sahil) — push users into predefined flows.
- **Flow categories**:
  - **Scaling flows** — 151 / 135 / Bruno-Brazilian.
  - **Creative-testing flows** — more creatives, different structures.
  - **Catalog-based flows** — different handling; product/catalog mapping at the **ad level**.
- **Tags** for flows (categorize by purpose), mirroring concept tagging.
- **Entry point** — UNDECIDED between: *creative-first → strategy*, or *strategy-first → creative*. Team wants **consistency** across entry points (creative area / launch / catalog).
- **Final screen** — DECIDED: **preview/confirmation**, not a full editing interface (for predefined strategies). How much editing is allowed there = UNDECIDED.
- **Bulk-launch variables** (from the existing example reviewed): Ad account · Profile name · Tracking URL · Pixel · Page · Catalog/product · Campaign count · Ad set count · Budget strategy · Launch type · Launch strategy · Targeting · Creative/media folder.
- **Creative mapping** — DECIDED configurable **per strategy** (not one universal rule): folder-level, individual-creative, or mapped at ad-account / campaign / ad-set / ad level.

## Decisions made (verbatim intent)
1. **Terminology**: use **"Launch strategy"** for the predefined-flow concept.
2. Predefined flows **minimize user inputs** + validation issues via a known structure.
3. **Scratch mode stays** for advanced users, but reduce reliance on it.
4. **Creative-testing vs scaling flows** are treated **separately**.
5. **Mapping is configurable by strategy**, not forced universal.
6. **Final screen = preview/confirmation**, not complex editing.
7. Predefined strategies → positioned under the **Enterprise plan**.
8. **Activity logging is strictly required** (who launched what, when, retries, relaunches, failures).

## Stakeholders (from the transcript)
- **Sahil** — product lead voice: two-phase launch, "future is bulk creatives", scratch-minimization, Enterprise-only flows, preview-only final screen.
- **Speaker 4** — pushed the term "Launch strategy"; wants a dedicated high-level user-journey discussion; flagged catalog + 1–2 flows needed for testing.
- **Speaker 6** — activity logs are non-negotiable; **do proper research on which strategies are in highest demand before prioritizing**; cloning needs improvement; heavier effort likely on frontend + testing.

## Timeline (no exact dates confirmed)
- **Next ~7 days**: close UX / user journeys.
- **Post 7 days**: start development.
- **~20 days**: something testable.
- Rollout in **two phases** (dedicated resources for the initial launch; rest parked + adjusted on performance).

## Open decisions needed (UNDECIDED in the MOM)
- Entry point: **creative-first vs strategy-first**.
- **Which predefined strategies to build first** (and the basis: internal knowledge vs user demand vs formal research).
- How much **editing on the preview screen**.
- Can users **create/save their own strategies**?
- **Catalog product mapping** across account / campaign / adset / ad.
- **Pricing model** for Enterprise flows (% of spend / per-ad / plan-limit + usage).
- How to handle **static / flexible / collapsible / browser / catalog** formats in one system.
- How **cloning** is redesigned relative to the new flows.

## Risks (from the MOM)
- **Over-complexity** — too many strategies/formats/mapping options → confusing UI.
- **Catalog complexity** — ad-level product mapping.
- **Expectation mismatch** — users may expect manual mapping/editing inside predefined flows.
- **System exploitation** — if flows are too easy + broadly available → the reason for Enterprise gating.
- **Infrastructure load** — high-volume bulk launching (thousands of ads).
- **Incomplete logging**; **unresolved pricing**.

---

## How the MOM maps to our research (data-backed convergence)
The meeting's concerns line up almost 1:1 with what streams 01–05 found in code/market:

| MOM item | Our finding | Source |
|---|---|---|
| Activity logs: who/when/**retries/relaunches/failures** | `launch-execute` is a **stub**; **no partial-success model**, no per-ad/per-pair result tracking, no retry | `01`, `04` |
| **Infrastructure load** at thousands of ads | **Zero table virtualization**; duplicate strategy can explode to ~500K ads; unbounded loads + N+1 writes | `03` |
| **Cloning** needs improvement | Clones is a **ComingSoon stub**; the "Clones→History filter" doesn't actually exist | `01` |
| **Preview/confirm** final screen | Pattern exists (`LaunchPreviewModal`) but `StepReview` is **orphaned**; two launch paths collide on Step 3 | `01` |
| **Enterprise gating** of flows | Plan tier is a `full|ai` demo toggle; `usePlan()` **fails open**; gating is inconsistent | `04` |
| **Catalog-based** flows (ad-level mapping) | Catalogue Ads flow is a **separate UI** from the standard wizard (the real existing fork) | `01` |
| Predefined flows = **monetizable wedge** | No competitor surfaces page-pair distribution / 250-cap / warm-up / RRM as first-class; **empty market band** | `02`, `05` |
| **Minimize inputs / strong validation** | Validation pattern (`MissingFieldsSummary` + scroll-to) is mature and worth carrying | `01` |

## What the MOM introduces that we have NOT verified (honest gaps — to close before synthesis)
1. **Precise definitions of 151 / 135 / 115 / Bruno-Brazilian.** These are **not in the FabAds codebase** (grep: 0 matches for `Bruno`/`Brazilian` and for `1-5-1`/`1-3-5`/`1-1-5`). They must be defined from authoritative knowledge (Maalik/Sahil) or validated research — **not assumed**.
2. **Which strategies are in highest demand** — the MOM's explicit research action item (Speaker 6). Stream 05 didn't target these named strategies (we didn't have the MOM at launch time).
3. **Do competitors ship predefined "strategy" templates?** Stream 02 covered combinatorial *matrix builders* (AdEspresso) but not named-strategy presets — a targeted re-scan is warranted.
4. **Naming collision** — "Launch strategy" already means **two** things in code: the `fill_first|equal|duplicate` distribution enum (`launch-distribution.ts`) and AutoPilot's automation-profile type (`AutoPilotConfigTab`). The MOM's "Launch strategy" would be a **third**. IA must disambiguate (Stream 01 flagged this as F-A3).

## New inputs (2026-06-04) — prototype + manager feedback

**Lovable prototype "Unified Launch Builder"** (from the backend dev) — provided as reference. Maalik's caveat: only a small portion, already too big/complex, and still missing many use cases, edge cases, user needs, and pain points. Under review in `prototype-review.md`.

**Observed grammar (data, from the prototype screenshot — not assumed):** strategy structure is `campaign : adset : ad` — e.g. `1:50:1` = 1 campaign, 50 ad sets, 1 ad. The creative→ad step offers **3 mapping modes**:
- **Distribute across ads** — spread each media item across the ads (e.g. across 50 ads, each gets 1, repeating as needed). Best for fast experiments.
- **Multiply by media** — clone the whole structure once per media (5 media → 5× campaigns / 250 ad sets / 250 ads, each clone uses one creative). Best for a clean per-creative read.
- **Map manually** — drag exact creatives into ad slots (50 slots from 5 creatives, override). Best for hand-crafted launches.

This confirms the *grammar*; the canonical **151 / 135 / 115 / Bruno** numbers + per-strategy mapping rules still come from Maalik (gap #1). Per `05b`, these labels have **no authoritative public definition** — PT/BR sources describe a high-ad-set testing shape as the likely "Brazilian-style," but it was never named that.

**Manager feedback — Neeraj Moudgil** (high-level, quick-glimpse only):
- "Good to start"; the creative-mapping screen "looks good."
- Questioned whether the **3 mapping options are too similar** ("all 3 options are same?").
- **Creative visibility** is required in the flow.
- **Load-bearing constraint**: today's multi-step/multi-screen launch makes users go **back and forth**, which forces **disabling/skipping validations in multiple places** → users hit errors **after** launching → bad experience → they may not retry. So **keep easily-validated things together** (co-locate + validate early). A primary architectural constraint for 2.0.

## Next
- **Awaiting**: Maalik's canonical strategy definitions (gap #1) — the last blocker for synthesis.
- **Done**: demand + competitor-preset research (`05b` — confirms the empty market band); prototype review running (`prototype-review.md`).
- Then write `06-synthesis.md` (evidence-tagged) + the open-questions list for the high-level user-journey discussion Speaker 4 requested.

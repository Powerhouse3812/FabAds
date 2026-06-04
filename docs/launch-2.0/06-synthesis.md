# 06 — Synthesis & Recommendations · Launch 2.0 ("Launch Strategies")

> **How to read.** Every non-obvious claim is tagged with its source: `[01]`–`[05b]` research streams · `[proto]` prototype review · `[MOM]` meeting · `[Neeraj]` manager feedback · `[Maalik]`. Confidence is flagged where it matters. **Assumptions are labelled as assumptions, never dressed as fact** (per Maalik's data-backed mandate). Strategy-mechanics corroboration is pending `05c` (running).

## 1. Thesis (why 2.0, in one breath)
FabAds' differentiator — **(account × page) distribution + warm-up + account-health/RRM** — is at once:
- **the #1 user pain** — account bans/restrictions with no support; willingness-to-pay empirically proven `[05]`;
- **an empty competitive band** — no rival ships page-pair distribution, the per-page 250-cap, codified warm-up, or *named launch-structure presets* `[02][05b]`; and
- **not actually built** — execution is a simulated stub, distribution runs on mock capacities, no partial-success/retry, no activity logs `[01][03][04]`.

So Launch 2.0 has a twofold job:
1. **Productize the wedge** — predefined "Launch Strategies" that encode the distribution/warm-up/account-health know-how into guided, low-input flows `[MOM][05b]`.
2. **Make execution real & trustworthy** — batched server-side execution, partial-success + retry-failed-only, mandatory activity logs, and validation that prevents post-launch errors `[01][03][04][Neeraj]`.

## 2. Personas (discovered from data, not assumed) `[05]`
- **Dropship / agency-account operator** — *sharpest fit*; many accounts + pages, lives with bans. The persona the wedge serves best.
- **Agency lead** — many clients/accounts; scale + delegation.
- **Solo Performance Operator** — replaces the weak "solo creator"; runs real spend solo.
- **Performance marketer** (in-house, optimization) · **Brand manager** (fewer launches, brand-safety).

*Proposed priority for 2.0* (**[Maalik to confirm]**): Dropship/agency-account operator + Agency lead — the volume + pain that "Launch Strategies" + Enterprise gating target `[MOM]`.

## 3. Core journeys 2.0 must serve `[MOM][Maalik]`
1. **Scaling launch** — pick a ratio strategy (`1:5:1` / `1:3:5` / `1:1:5`) → creatives → distribute across accounts/pages → preview/confirm.
2. **Creative-testing launch** — more creatives, different structure; treated separately from scaling `[MOM decision #4]`.
3. **Mass-test ("Bruno")** — thousands of cheap ads, minimal budget, find winners `[Maalik]`. Collides hard with the 250/page cap + leans entirely on the distribution engine `[03]`; **exact mechanics open**.
4. **Catalog launch** — product mapping at the ad level; distinct handling `[MOM]`.
5. **Scratch / flow-builder** — advanced custom; goal is to minimize its use ("the person should not scratch at all") `[MOM]`.
6. **Entry from anywhere** — creative-first *or* strategy-first, consistent across creative/launch/catalog areas. **Entry point UNDECIDED** (Sahil leaned creative-first: *"that's a natural flow"*) `[MOM]`.

## 4. The "Launch Strategy" model
- **Grammar**: `campaign : adset : ad` ratios `[Maalik]`. A preset encodes ratio + budget + targeting + creative-mapping + account/page spread, to **minimize inputs** `[MOM]`.
- **Creative mapping** — 3 observed modes `[proto, screenshot]`: *Distribute across ads* / *Multiply by media* / *Map manually*. **Finding** `[proto]`: as built, only *Multiply* is structurally distinct; *Manual* = *Distribute* + per-slot overrides, and *Multiply*'s shape math is **buggy**. → **Recommend** making the three genuinely distinct (or collapse to 2 + an override toggle) and answering Neeraj's *"are these the same?"* head-on. **Add creative thumbnails** — visibility is required `[Neeraj]` (today: filename dropdowns only `[proto]`).
- **Tags** to categorize flows by purpose `[MOM]`.
- **Naming collision** `[01][02][05b]`: "strategy" already means the `fill_first|equal|duplicate` distribution enum **and** AutoPilot's automation profile (in-code) **and** Revealbot/Madgicx automation bundles (market). **IA must disambiguate** — proposal: "**Launch Strategy**" = the structure preset; rename the distribution enum (e.g. "Distribution mode"); keep AutoPilot's as "Automation profile."

## 5. Validation architecture — a **P0** `[Neeraj][proto]`
The prototype proves the anti-pattern: validation scattered across 4 steps, `Continue` never gated, 2/4 preflight checks hard-coded `ok:true`, publish ungated `[proto]`. v1 disables/skips validation across back-and-forth steps `[Neeraj]`. → 2.0 must:
- **Co-locate** related fields so they validate together `[Neeraj]`.
- **Validate early + gate progression** — can't advance or publish with blocking errors.
- **One source of validation truth**, surfaced inline, never silently skipped.
- Carry the mature v1 pattern: `MissingFieldsSummary` + scroll-to-anchor `[01]`.

## 6. Heuristic + cognitive cross-check `[design]`
- **Hick's** — predefined presets cut choice load vs scratch (= the MOM's "minimize inputs" goal). Keep the preset set small + tagged.
- **Recognition > recall** — render the *resulting shape* ("1 campaign → 5 ad sets → 1 ad"), never raw ratios (carry the prototype's before→after preview `[proto]`).
- **Miller's / Fitts's** — chunk the wizard; the preview/confirm screen is the final recognition gate `[MOM]`.
- **NN/g**: #1 visibility of status → per-row publish/status + activity logs `[04][MOM]`; #5 error prevention → gated validation `[Neeraj]`; #9 recover from errors → partial-success + retry-failed-only `[04]`.

## 7. Edge-case matrix (scoped)
| Edge | Risk | Handling for 2.0 |
|---|---|---|
| Bruno: 1000s of ads | 250/page cap, ~500K output explosion `[03]` | Distribute across accounts/pages; capacity-vs-requested preview; cap-aware math `[03]` |
| 0 / 1 creative in folder | mapping modes degenerate | Empty/partial states; block or adapt mapping |
| Long names (60+) | truncation/overflow | Tested layouts |
| Slow / offline mid-launch | partial submit | Partial-success + retry `[04]` |
| Permission denied | any member can publish today `[04]` | Decide gating (open Q) |
| Narrow viewport / a11y | complex tables | Responsive; keyboard/SR; colour-blind safe |

## 8. State coverage `[design rule]`
Every surface needs **populated / partial / zero-data**. The prototype has **none** `[proto]`. Specifically: empty strategy list, zero creatives, zero connected accounts, partial launch results.

## 9. Scale & execution — **P0 engineering reality** `[03][04]`
- **Virtualize** all bulk tables (none today) `[03]`.
- **Server-side batched execution** — replace the client stub `[03][04]`.
- **Real capacity** — query `fb_pages`, not mock hashes `[03]`.
- **Partial-success + retry-failed-only**; **activity logs** (who/when/retries/relaunches/failures) — MOM-mandatory `[MOM][04]`.

## 10. Prioritized recommendations
**P0 — foundational / trust**
- Real batched execution + partial-success + retry `[03][04]`
- Activity logs `[MOM]`
- Co-located, gated validation `[Neeraj]`
- Virtualization + real capacity `[03]`

**P1 — the wedge / product**
- "Launch Strategy" presets (`1:5:1` / `1:3:5` / `1:1:5` + mass-test) with resulting-shape preview `[MOM][Maalik]`
- Distinct, visible creative-mapping (fix the 3 modes) `[proto][Neeraj]`
- Account/page distribution surfaced first-class — the empty band `[02][05b]`
- Enterprise gating `[MOM]`

**P2 — later**
- Scratch/flow-builder · tags · cloning overhaul `[MOM]`
- Pricing model — unresolved `[MOM]`

## 11. Anti-pattern registry (seed — don't repeat)
- Simulated success (UI says "launched" when it didn't) `[01]`
- Scattered / skippable validation → post-launch errors `[Neeraj][proto]`
- "3 mapping modes" that are secretly ~1.5 `[proto]`
- No virtualization at bulk scale `[03]`
- Overloading the word "strategy" `[01][02]`
- Mock capacities posing as real `[03]`

## 12. Open questions for the Q&A round (Speaker 4's user-journey session) `[MOM]`
Genuine unknowns — need Maalik/team, **not assumable**:
1. **Entry point** — creative-first or strategy-first as primary? (Sahil leaned creative-first.)
2. **Per-strategy mechanics** — budget (CBO/ABO + amounts), targeting, default creative-mapping, account/page spread for each of `1:5:1` / `1:3:5` / `1:1:5`.
3. **Bruno** — exact structure + how it respects the 250/page cap + budget floor.
4. **Which strategies ship first?** (`05b` `[directional]`: a testing + a scaling one are the safest first bets.)
5. **Editing on the preview/confirm screen** — how much is allowed?
6. **User-created / saved strategies** — supported?
7. **Catalog product mapping** — across account / campaign / adset / ad?
8. **Pricing model** for Enterprise flows.
9. **Permissions** — should publishing be role-gated? (today any member can `[04]`.)

## 13. Still corroborating
`05c` (ratio-strategy + Bruno mechanics) is running; findings will be confidence-labelled and folded into §3–§4. Expect thin public canon `[05b]` — the authoritative source is the FabAds team.

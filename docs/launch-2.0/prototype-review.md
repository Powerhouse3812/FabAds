# Launch 2.0 — Prototype Review: "Unified Launch Builder" (ULB)

> Critical review of the Lovable-built reference prototype at `/tmp/ulb`.
> Reviewed 2026-06-04 against the Launch 2.0 MOM scope, Neeraj's validation/mapping
> feedback, and research streams 01–05b.
>
> **TL;DR.** A clean, single-file 4-step wizard that nails *visual* IA for a
> structure→creative→preflight flow and has a few genuinely carry-worthy ideas
> (the allocation "Resulting shape" preview, the visible AI-enhance toggle, the
> row-by-row publish centre). But it is **reference-only, not reusable**: ~95%
> of the substance is mocked, the data caps at 12 entities/account so the entire
> "scale" story is fake, validation is **scattered across steps** (the exact
> anti-pattern Neeraj flagged), and it addresses roughly **2 of ~10 MOM scope
> items**. It misses every one of our top user pains: account-health/RRM,
> partial-success + retry, activity logs, and distribution at real scale.

---

## 1. Overview & tech

**What it is.** A self-contained reference prototype branded "Bulk Launch
Builder / Unified Launch Builder" — a 4-step wizard for bulk-creating Meta ad
entities (campaigns × ad sets × ads) from a structure preset + a creative
folder/pack, ending in a mocked publish.

**Stack** (`package.json`):
- **TanStack Start** (`@tanstack/react-start` 1.167) + **TanStack Router**
  (file-based routing, `routeTree.gen.ts`) — *not* Vite-SPA + React Router.
  This is an SSR framework with a server entry (`src/server.ts`, `src/start.ts`).
- React 19, TypeScript 5.8, Tailwind v4, **shadcn/ui** (full set — 47 primitives
  in `src/components/ui/`), TanStack Query, Zod, lucide-react, sonner, recharts.
- Lovable scaffolding: `src/lib/lovable-error-reporting.ts`, `error-capture.ts`,
  `error-page.ts`, `.lovable/project.json`.

**Routes / screens** (`src/routes/`):

| Route | File | Purpose |
|---|---|---|
| `/` | `routes/index.tsx` | Landing — 3 "intent" entry cards (Launch / Creatives / Reporting), each links to `/launch?from=<key>`. Footer explicitly lists what's mocked. |
| `/launch` | `routes/launch.tsx` | The entire builder. **~990 lines, one file, ~25 inline components.** Search param `from` ∈ `launch \| creatives \| reporting`. |
| `__root` | `routes/__root.tsx` | App shell, 404 + error boundary (Lovable-standard). |

**Reality check on the file inventory.** Of ~63 files, **47 are unmodified
shadcn primitives** and **6 are Lovable boilerplate** (`server.ts`, `start.ts`,
`router.tsx`, `config.server.ts`, `error-*.ts`, `api/example.functions.ts` — the
last is a stock `getGreeting` demo). **The product is exactly two hand-written
files**: `routes/launch.tsx` (UI) and `lib/launch-mocks.ts` (data + the only
real logic). Everything is client-side `useState`; nothing persists, nothing
hits a server.

### The "Unified Launch Builder" flow, step by step

State lives in one `Builder()` component (`launch.tsx:46–145`). Steps are
defined in `STEPS` (`launch.tsx:29–34`) — **4 steps**, despite the landing
page's copy promising a "six-step builder" twice (`index.tsx:63`, plus the
old code comments still say "Step 6" at `launch.tsx:792`). That mismatch is a
tell that this was cut down from a larger sketch.

1. **Scope** (`StepScope`, `launch.tsx:199–271`). Multi-select account list from
   `ACCOUNTS` mock; each account shows Page/Pixel access badges. Page-pool and
   Pixel-pool `<select>`s. E-commerce mode shows a "Role-based approval" card
   whose copy literally reads *"Approval state machine: unspecified."*
2. **Strategy** (`StepStrategy`, `launch.tsx:275–422`). Structure-shell preset
   picker + a custom `c:a:ads` builder; bid-strategy cards (lowest-cost /
   cost-cap / bid-cap / min-ROAS); targeting template, daily budget, conversion
   event (ecom only), UTM pattern. Ends with a **Matrix preview** with 3 tabs:
   `Matrix` (table), `Spreadsheet` (CSV-ish `<pre>`), `Power-user JSON` (`<pre>`).
   Import/Export CSV buttons are **non-functional** (no `onClick`).
3. **Creatives** (`StepCreatives`, `launch.tsx:440–660`). Folder picker
   (raw media) or library pack; AI-enhancement toggle; brand-safe toggle (ecom);
   **Allocation strategy** (the 3 mapping modes — see §2) with a "Resulting
   shape" before→after preview; a manual-mapping grid when `manual` is chosen.
4. **Preflight** (`StepPreflight`, `launch.tsx:794–847`). A 4-item preflight
   checklist, a "You're about to publish" summary, and a **Publish centre**
   (`PublishCentre`, `launch.tsx:849–897`) that simulates row-by-row publishing
   with a `setTimeout` loop and random failures.

Chrome: sticky header with an **Affiliate / E-commerce `ModeToggle`** that
rewrites copy and shows/hides ecom fields; a clickable `Stepper` (you can jump
to any step freely — no gating); a sticky footer with a running entity count +
issue count + Back/Continue/Publish.

---

## 2. Strategy + mapping model (Neeraj's "are the 3 modes distinct?" question)

### How structure is represented

Structure is a **string ID**, parsed ad-hoc in three different places:

- Presets are flat objects with a precomputed `entities` count and a
  human-readable `name`, *not* a parsed triple (`launch-mocks.ts:31–36`):
  ```
  { id: "1-50-1", name: "1 : 50 : 1", desc: "1 campaign · 50 ad sets · 1 ad each", mode: "affiliate", entities: 50 }
  ```
- The custom shell encodes the triple in the id as `custom-<c>-<a>-<ads>`
  (`CustomShellCard`, `launch.tsx:673–714`).
- Two consumers re-parse that string independently:
  `StepCreatives` does `presetId.split("-").map(parseInt)` and assumes
  `parts.length === 3` else falls back to `[1,10,1]` (`launch.tsx:455–456`) —
  **this silently mishandles the named presets** (`"cbo-5-4"` → `[NaN, 5, 4]` →
  fallback), and `buildRows` re-parses again differently (`launch-mocks.ts:123–125`).

There is **no shared `campaign:adset:ad` model**. The grammar lives in string
formatting and three separate parsers. For the real build we need one typed
structure object (`{campaigns, adSets, adsPerSet}`) as the single source.

### The 3 mapping modes (`ALLOCATION_MODES`, `launch-mocks.ts:67–87`)

| Mode | Copy | Computed shape (`launch.tsx:459–462`) |
|---|---|---|
| `distribute` | "Round-robin every media item across the ads." | unchanged: `{C, A, A·ads}` |
| `multiply` | "Clone the entire structure once per media." | `{C·m, A·m, A·ads·m}` |
| `manual` | "Pick exactly which creatives land in which ad slots." | unchanged shape; per-slot media map |

**Are they genuinely distinct? Partially — and one is mathematically wrong.**

- `distribute` vs `manual` are **the same structural shape**; they differ only in
  *which* media lands in each slot (round-robin vs hand-picked). In fact `manual`
  is implemented as "round-robin defaults you can override" — unmapped slots fall
  back to `media[i % m]` (`launch.tsx:629`, `643`), i.e. *distribute*. So
  **`manual` = `distribute` + per-row overrides**, not a third concept. Neeraj's
  instinct is right: as modeled, these two are one feature with an "edit" affordance.
- `multiply` is the only structurally distinct one — but its math is **buggy**.
  A clean "one structure per creative" clone should be `{C·m, A·m, ads}` (ads-per-set
  unchanged). The prototype computes `ads: baseAdsets * baseAds * m` (`launch.tsx:461`),
  i.e. it multiplies the ad count by media **on top of** already multiplying ad sets
  by media — producing `A·ads·m` ads across `A·m` ad sets, which is still `ads`
  per set but the headline "Ads" number double-counts the ad-set multiplication.
  The "Resulting shape" widget therefore shows an inflated ad total that doesn't
  match "each clone uses one creative." (Compare the mock's own example string at
  `launch-mocks.ts:79`, which says `m·a·ads` — so the bug is baked into the copy too.)

**Verdict for the real build:** collapse to **two real axes** — (1) *shape*:
"one structure, creatives fill the ads" vs "clone structure per creative", and
(2) *fill rule within the shape*: auto (round-robin/even) vs manual override.
That is the distinction users actually reason about. Three sibling cards imply
three independent strategies; they aren't.

### Where mapping is *visible*

Neeraj asked for creative **visibility in the flow**. The prototype is weak here:
the allocation preview shows **counts and one-line text** ("ad 1 → hero_beach_01.mp4,
ad 2 → hero_pool_02.mp4 …", `launch.tsx:603–606`) and the manual grid uses
**text `<select>` dropdowns of filenames** (`launch.tsx:634–642`) — **no
thumbnails anywhere**. The MatrixTable's placement columns render a generic green
dot + "v1" for every cell regardless of actual creative (`launch.tsx:752–756`).
You never see the creative you're launching. That fails Neeraj's bar.

---

## 3. Carry-worthy patterns (worth adopting)

These are concepts/interactions worth lifting; the *code* mostly isn't (single
file, inline components, no tests, mocked logic). Adopt the idea, rebuild in
FabAds tokens/components.

1. **"Resulting shape" before→after preview** (`Shape`, `launch.tsx:594–671`).
   Showing `was 50 → 250` campaigns/ad sets/ads the instant allocation changes
   is the single best idea here. It makes the explosion of bulk launches legible.
   Keep it — and make it the *anchor* of a co-located validation panel (§5).
2. **Visible AI-enhancement toggle with an honest rationale** ("Visible toggle so
   reviewers know", `launch.tsx:542`) and a **conflict warning** when AI-enhance +
   brand-safe-off combine (`launch.tsx:545–549`). Good instinct: surface
   automation so it's auditable rather than silent.
3. **Row-by-row Publish centre with per-row status** (`PublishCentre`,
   `launch.tsx:849–897`) — idle/running/done/failed dots + an inline Retry on
   failures. The *shape* of this is exactly what FabAds execution needs (today
   it's a stub per stream 01). The implementation is a `setTimeout` toy with
   `Math.random()` failures and a dead Retry button, but the UX skeleton is right.
4. **Live entity/issue counter in the sticky footer** (`launch.tsx:118–126`).
   Persistent "N entities · M issues to review / All checks passing" is good
   ambient feedback. (It's currently the *only* always-on validation signal —
   see §5.)
5. **Entry-context prefill via a `from` search param** (`launch.tsx:47`,
   `index.tsx:69–73`). The mechanism (deep-link with context) is reusable even
   though the prefill itself is trivial today. Directly relevant to the MOM's
   undecided "creative-first vs strategy-first" entry question.
6. **Mode-aware copy & fields** (`ModeToggle` rewriting headings + revealing ecom
   fields). A clean pattern for affiliate-vs-ecom divergence without forking screens.
7. **Three views over one dataset** (Matrix / Spreadsheet / JSON tabs,
   `launch.tsx:385–413`). The power-user escape hatch is a good idea for
   bulk editors — *if* it's wired to real edit + import (it isn't here).
8. **TanStack Start + Query + Zod stack** matches a modern SSR direction. Note
   FabAds today is Vite-SPA; this is *not* a drop-in and is **not** a reason to
   migrate. Reference only.

---

## 4. What it MISSES — the core of the review

Read against research streams 01–05b and the edge-case / state-coverage lenses.
Everything below is a real gap, not a nitpick. Items marked **(fake)** are worse
than missing — the UI *implies* a capability the code doesn't have.

### 4a. Scale & distribution — the headline failure

- **Hard 12-entity cap.** `buildRows` does `const perAccount = Math.min(entities, 12)`
  (`launch-mocks.ts:127`). A "1:50:1" preset advertises 50 entities in its card
  and footer but **generates at most 12 rows per account**. The entire "bulk"
  premise is **(fake)** — there is no path in the code that produces 50, 500, or
  5000 rows. None of the "scale a winner / 1:50:1 affiliate" use cases actually run.
- **No virtualization, no pagination — only `.slice()`.** Every surface truncates:
  Matrix `.slice(0,30)` (`launch.tsx:747`), JSON `.slice(0,5)` (`411`), Spreadsheet
  `.slice(0,8)` (`786`), manual map `Math.min(totalAdSlots,24)` (`628`), Publish
  `.slice(0,12)` (`855`,`875`). Stream 01's "no table virtualization at scale" and
  the 250/page cap are completely unaddressed — the prototype dodges the problem by
  never showing more than 30 rows.
- **No 1000+ / 10K stress behaviour.** At 10× scale there is literally nothing —
  the data can't reach those numbers, and the renderers would choke if it could.

### 4b. Account health / bans / RRM — the #1 user pain, entirely absent

- Stream 05's top pain is **account bans → RRM**. The prototype has **zero**
  surface for account health, ban risk, spend limits, payment status, or RRM
  hand-off. Account cards show only Page/Pixel *access* booleans
  (`launch-mocks.ts:13–18`) — not health, not disabled state, not restriction.
- No "this account is at risk / restricted / disabled — don't launch here" gate.
  Bulk-launching into a banned account is the exact churn driver, and the flow
  has no defence.

### 4c. Execution: partial-success, retry, idempotency — (fake)

- The Publish centre *looks* like partial-success handling but is a `setTimeout`
  loop with `Math.random() > 0.4` failures (`launch.tsx:857–858`). **Retry is a
  button with no handler** (`launch.tsx:883–885`) — it does nothing.
- No idempotency keys, no resumability, no "3 of 250 failed → fix → relaunch only
  the failures", no dedupe on re-submit, no rate-limit/back-off, no partial rollback.
  Stream 01 calls today's execution a stub with no partial-success/retry — the
  prototype reproduces the stub with nicer chrome.

### 4d. Activity logs — MOM-mandatory, completely absent

- MOM marks activity logs **mandatory** (who/when/retries/relaunches/failures).
  There is **no log model, no audit trail, no history, no actor attribution**
  anywhere in the prototype. Failures vanish on refresh (local `useState`).

### 4e. Edge cases (per CLAUDE.md §5 minimum coverage)

| Edge case | Prototype behaviour |
|---|---|
| **Long names (60+ chars)** | Account/creative names are short mocks; row names are templated. Table cells use `truncate` in Publish (`launch.tsx:880`) but **not** in the Matrix name column (`749`) — long names will overflow. Untested. |
| **0 items (zero-data)** | No empty states. 0 accounts selected → `buildRows` returns `[]` → Matrix renders an empty `<tbody>`, footer says "0 entities", Publish is enabled. No "select an account first" guard. |
| **1 item** | Works incidentally; no singular/plural copy handling ("1 entities", "1 issues to review" — `launch.tsx:120`,`124`). |
| **1000+ items** | Impossible (12 cap) and unhandled (no virtualization). |
| **Slow network** | N/A — nothing is async except the fake publish loop. No loading/skeleton states (the `skeleton` primitive is imported by shadcn but unused). |
| **Offline** | No handling. No optimistic/queue/retry-on-reconnect. |
| **Partial data** | Mocks are always complete. No "creative missing crop for Stories → what happens at launch" beyond a warning badge. |
| **Validation errors** | Surfaced as warning badges only; **never block** (see §5). |
| **Permission denied** | Modeled only as `pageAccess`/`pixelAccess` booleans that produce a non-blocking "needs access" badge (`launch.tsx:233–237`) and a row error string (`launch-mocks.ts:133–134`). You can still proceed and "publish." No real RBAC, no role gating, no "you can't launch in this account." |
| **Mobile / narrow** | Stepper has `overflow-x-auto`; grids use `lg:`/`md:` breakpoints; otherwise desktop-first. The manual-map and matrix tables will be cramped. `use-mobile.tsx` hook exists but is unused. |
| **RTL / long-language** | Not considered. |
| **Dark / light parity** | Single theme (oklch tokens in CSS); no toggle, parity untested. |
| **Keyboard-only** | Native `<button>`/`<input>`/`<select>` are reachable, but the custom toggle/stepper have no `aria-*`, no roving focus, no `aria-current` on the active step. |
| **Screen-reader** | Status conveyed by **colour + icon only** (green/red dots, badges) with no text alternative in several places (e.g. MatrixTable placement dots, `launch.tsx:754`). |
| **Color-blind safe** | Relies heavily on success-green / warning-amber / destructive-red with minimal text labels — fails CB-safety in the matrix. |

### 4f. State coverage (design-system §3 — non-negotiable)

- **Populated**: present (the only state actually designed).
- **Partial**: weakly — warning badges exist, but there's no "some accounts lack
  access, here's what we'll skip" partial-launch state.
- **Zero-data**: **missing entirely.** No empty state for 0 accounts, 0 creatives,
  empty folder, or first-run. This violates the project's hard rule.

### 4g. Other notable gaps

- **`INTENTS` is dead code.** The whole intent taxonomy
  (`new-test/scale-winner/relaunch/creative-refresh`, `launch-mocks.ts:5–10`) is
  **defined and never imported**. The "intent-first builder" headline
  (`index.tsx:55`) is unbacked — `from` only flips 2–3 default IDs.
- **Prefill is near-noop.** `from` changes `accountIds`, `presetId`… and `packId`
  has a copy-paste bug: `from === "creatives" ? "cp_1" : "cp_1"` (`launch.tsx:60`)
  — both branches return the same pack. "Creative-first" entry does nothing.
- **No save/draft/resume.** Close the tab and the entire launch is gone.
- **No real CSV import/export, no real JSON edit** — all three "power" affordances
  are display-only `<pre>` blocks; the schema is annotated *"unspecified"*
  (`launch.tsx:411`,`782`).
- **No scheduling, no budget pacing/total-spend guardrail, no naming-convention
  engine** (UTM is a single free-text field; campaign/ad-set names are hardcoded
  templates in `buildRows`).
- **No cloning** of existing campaigns (MOM "cloning overhaul") — "clone" appears
  only as a word in the `multiply` copy.
- **Duplicate-name detection exists but only at the very end** (`StepPreflight`,
  `launch.tsx:795–797`) — over the ≤12 visible rows, after every decision is made.

---

## 5. Validation architecture (Neeraj's BIG ONE)

**Question:** is validation **co-located + early**, or **scattered across
back-and-forth steps**? **Answer: scattered, late, and non-blocking — the exact
anti-pattern Neeraj warned about.** Concretely:

- **Errors are computed centrally but surfaced everywhere, piecemeal.**
  `buildRows` attaches an `errors: string[]` per row (`launch-mocks.ts:132–137`:
  missing page/pixel access, unsupported crop, missing CTA). `errorCount` is
  summed in `Builder` (`launch.tsx:78`). So the *data* is co-located — good — but
  the *surfacing* is sprinkled across all four steps:
  - Step 1: access badges + "needs access" (`launch.tsx:228–237`).
  - Step 2: per-row "Status" badge inside the Matrix (`launch.tsx:758–763`).
  - Step 3: pack-level "Missing CTA" / crop warnings on the cards
    (`launch.tsx:523–525`) and the AI/brand-safe conflict note (`545–549`).
  - Step 4: a **separate** preflight checklist (`launch.tsx:799–804`) that
    *recomputes* duplicates and hard-codes `ok: true` for "UTM tokens resolve" and
    "Tracking events mapped" (`launch.tsx:802–803`) — i.e. **two of four preflight
    checks are fake passes**.
- **Validation is late.** The user picks accounts (1) → strategy (2) → creatives
  (3) before any consolidated check at preflight (4). A missing-CTA pack chosen in
  step 3 only becomes a "row needs attention" you might notice in the step-2 matrix
  (which is *before* step 3) or in the step-4 summary. The feedback loop crosses
  step boundaries — to fix a step-1 access problem flagged at step-4 you go *back*.
  That's the "back-and-forth" churn pattern.
- **Validation never blocks.** `Continue` is always enabled (`launch.tsx:132–136`);
  the stepper lets you jump anywhere (`174`). Only the **final** `PublishButton` is
  gated on `errorCount > 0` (`launch.tsx:138`,`901`) — but the parallel
  **"Simulate publish"** button in the Publish centre is **not gated at all**
  (`launch.tsx:869`), so you can run the (fake) launch with open errors anyway.
- **The footer counter is the one good, always-on signal** ("N issues to review",
  `launch.tsx:122–125`) — but it only counts errors over the ≤12 generated rows and
  links nowhere (no click-to-jump-to-the-bad-row).

**What "co-located + early" should look like instead** (for the real build): one
persistent validation panel (anchored to the "Resulting shape" widget from §3)
that runs *all* checks — access/RBAC, account health, crop/CTA readiness,
duplicate names, budget floors, UTM resolution, scale/quota — **continuously from
step 1**, blocks `Continue` per category, and deep-links each issue to the offending
row/account. The prototype has the raw material (centralized `errors[]`) but
delivers it in the scattered, skippable way that drives the post-launch-error
churn we're trying to kill.

---

## 6. Alignment with MOM scope

| MOM scope item | Prototype status |
|---|---|
| **Predefined strategies (151 / 135 / 115 / Bruno-Brazilian)** | **Missing.** Presets are generic (`1-50-1`, `1-10-3`, `cbo-5-4`, `abo-3-5`); none of the named playbooks exist. |
| **Scratch / flow-builder** | **Partial.** "Custom shell" `c:a:ads` builder (`CustomShellCard`) is a scratch *ratio* entry, not a flow builder. No node/graph composition. |
| **Flow categories (scaling / creative-testing / catalog)** | **Missing.** No category concept. `INTENTS` (dead) gestures at it but isn't wired, and doesn't match these categories. |
| **Entry point: creative-first vs strategy-first** | **Gestured, undecided — and broken.** `from=creatives` exists but the creative-prefill is a no-op (`launch.tsx:60` bug). Flow is strategy-first in practice (Scope→Strategy→Creatives). |
| **Tags** | **Missing.** No tag model anywhere. |
| **Enterprise gating** | **Missing.** No plan/tier/feature-flag concept; ecom "role-based approval" card is explicitly *"unspecified."* |
| **Final PREVIEW / CONFIRM (not full editing)** | **Closest match.** Step 4 Preflight is a preview/confirm. But the *earlier* steps over-index on editing (full bid/targeting/allocation config), and there's no read-only confirm of the final structure. |
| **Catalog flows (DPA / catalog ads)** | **Missing.** "E-commerce" mode only adds a conversion-event select; no product set, no catalog, no DPA. |
| **Activity logs (mandatory)** | **Missing entirely** (see §4d). |
| **Cloning overhaul** | **Missing** (see §4g). |

**Score: ~1.5 of 10 scope items meaningfully addressed** (preview/confirm fully;
scratch-ratio + entry-point partially/brokenly). The prototype is essentially a
visual study of *one* path — generic-preset → creative-allocation → mock-publish —
and skips the parts that make Launch 2.0 hard.

---

## 7. Verdict — reusable vs reference-only

**Reference-only. Do not fork the code.** Honest split:

- **Reusable code: ~0%.** Single 990-line file, inline components, all logic
  mocked, the one real algorithm (`buildRows`) is capped at 12 and buggy
  (`multiply` math, named-preset parsing). The shadcn primitives are reusable but
  we already have our own. The TanStack Start stack doesn't match FabAds' Vite SPA.
- **Reusable concepts: ~6 ideas** worth carrying (§3) — chiefly the **Resulting-shape
  preview**, the **per-row publish/status centre**, the **visible-automation toggle**,
  the **persistent entity/issue counter**, the **entry-context deep-link**, and the
  **multi-view (matrix/sheet/json) editor** idea. Lift the *patterns*, rebuild in
  FabAds tokens/components, and **fix the architecture** they sit in.

**What this prototype proves vs leaves open.** It proves a 4-step bulk wizard
*reads* clean and that a structure→creative→preview spine is viable. It leaves
open — i.e. it is silent or fake on — **everything that actually causes Launch
churn**: validation co-location/early-blocking (§5), scale & virtualization (§4a),
account-health/RRM (§4b), partial-success + retry + idempotency (§4d/4c), activity
logs (§4d), tags/Enterprise/catalog/cloning (§6), and full state coverage (§4f).

**Maalik's framing holds.** "Only a small portion, yet too big and complex, and
missing soo many use cases and edge cases" — accurate. It's a *demo of the easy
40% of one happy path*, presented with enough polish to look near-complete.
Mine it for the half-dozen interaction ideas above; build the real thing around a
**co-located, early, blocking validation core**, **real partial-success
execution**, and **virtualized scale** — none of which exist here.

---

### Appendix — file map (hand-written substance only)

| File | Lines | Role |
|---|---|---|
| `src/routes/launch.tsx` | ~990 | The entire builder UI + ~25 inline components. |
| `src/lib/launch-mocks.ts` | 154 | All data + the only real logic (`buildRows`, allocation defs). Capped at 12/account; `multiply` math bug; `INTENTS` dead. |
| `src/routes/index.tsx` | 98 | Landing / intent cards. Lists mocked contracts in its own footer. |
| `src/routes/__root.tsx` | 126 | Shell + error/404 boundaries (Lovable-standard). |
| `src/routes/README.md` | — | TanStack routing conventions (boilerplate). |
| *all `src/components/ui/*` (47)* | — | Unmodified shadcn primitives. |
| *`server.ts`, `start.ts`, `router.tsx`, `config.server.ts`, `lib/error-*`, `api/example.functions.ts`* | — | Lovable/TanStack boilerplate; `example.functions.ts` is a stock `getGreeting` demo. |

**Self-declared mocks** (prototype's own words): account/page/pixel APIs, creative
library schema, template store, publish API, CSV schema, **approval state machine**,
and **retry semantics** — all listed as *"unspecified / mocked"* at
`index.tsx:89–93`, `launch.tsx:264`, `411`, `648`, `782`, `839`.

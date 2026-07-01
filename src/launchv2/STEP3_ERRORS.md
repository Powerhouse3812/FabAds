# Launch v2 · Step 3 — Distribution & Creative Error Catalog

> The as-built error list for Step 3 (Ad & Distribution). Every row is emitted by
> `distributionErrors(plan)` in `src/launchv2/distributionErrors.ts` (single source
> of truth), surfaced **inline at the control** and **mirrored in the cap-meter**,
> and mapped into Review via `reviewModel`. Codes map back to the
> `Launch_2.0_Distribution_Errors` handoff.
>
> **Severity:** 🔴 Block (can't launch) · 🟠 Warn (proceed after confirm) · 🔵 Info.
> `[I]` = provisional — cross-account cap aggregation is unverified vs Meta; the
> caveat stays visible and is re-checked at Review.
>
> The count is **computed from two levers**: creative distribution (`spread` +
> structure + creatives + mix-match) sets `D` = ads per destination; page split
> (`pageDistribution` + weights) maps `D` onto pages vs each page's free slots
> (`250 − active ads`). Errors arise from the *interaction* of both.

---

## Fix-selection rule (CONFIRMED — Maalik)

> **"Add a Page" only fixes an overflow when ads can be redistributed to the
> new page** — i.e. **Fill-first** (aggregate short) and secondarily **Equal**.
> For **Duplicate** (every page gets the full set), **One page**, or an
> **at-cap page**, adding a page **cannot** fix it — the correct fix is
> **replace/remove the page**, or **change the split method**. Every
> suggested fix below matches its root cause; add-page is offered only where
> it actually relieves the breach.

---

## A. Page-split errors (anchor: Page-split control / per page)

| Code | Sev | When it occurs | Message | Suggested fix |
|---|---|---|---|---|
| **PS-01** | 🔴 | No Page selected | "Select at least one Page to continue." | Go to Accounts |
| **PS-02** | 🔴 | A selected Page is already at the 250 cap (0 free) | "Page {P} is at its 250-ad limit — change it or remove it to continue." | Change this Page · Remove this Page |
| **PS-03** | 🔴 | `One page` split & the launch's ads > that page's free slots | "Page {P} only holds {s} of the {n} ads this launch needs." | Spread across Pages (Use suggested) · Change this Page · Reduce structure |
| **PS-04** | 🔴 | `Equal` split puts more ads on a Page than it has free slots | "Splitting equally puts {a} ads on {P}, which only has {s} slots." | Use suggested spread · Change this Page · Add a Page (secondary — more Pages shrink each share) |
| **PS-05** | 🔴 | Total ads > total free slots across all Pages (aggregate short) | "Your pages have {s} free slots but this launch needs {n} — {d} won't fit." | Add a Page · Reduce structure |
| **PS-06** | 🔴 | Even the suggested optimal spread still leaves ads unplaceable | "Even the best possible spread leaves {d} ads with nowhere to go across {s} free slots." | Add a Page · Reduce structure |
| **PS-07** | 🔴 | Custom split: a Page's manual weight exceeds its free slots | "{P} only has {s} free slots — bring every Page's weight within its own limit." | Auto-balance |
| **PS-08** | 🔴 | Custom split: assigned weights don't sum to the total ads | "You've assigned {x} of {n} ads — close the {d}-ad {over/under}." | Auto-balance |
| **PS-DUP** (breach) | 🔴 | `Duplicate` split & any Page would exceed its 250 cap | "Duplicate would push {P} over its 250-ad cap." | Change Page · Remove Page · Switch off Duplicate (to Fill-first) |
| **PS-DUP** (fits) | 🟠 | `Duplicate` split, >1 Page, no Page breaches — count + spend ×Pages | "Duplicate runs the full {n} ads on each of {p} Pages — count and spend ×{p}." | Switch to Fill-first · Acknowledge (budget warn) |
| **PS-10** `[I]` | 🟠 | A Page's remaining-slots read is unavailable | "Couldn't check {P}'s remaining slots right now." | Retry · continue (re-check at Review) |
| **PS-11** | 🔴 | A selected Page sits on a restricted/disabled account | "Page {P} is on a restricted account — check Account Health or change the Page." | Change Page · Account Health |
| **PS-12** | 🔵 | `Equal` split doesn't divide evenly | "{n} ads / {p} Pages → {split}. Remainder goes to the Page with most room." | — |
| **PS-13** `[I]` | 🟠 | Multi-account selection where per-Page aggregation is unverified | "Slots shown are per Page; other accounts on this Page may lower real headroom." | — (re-check at Review) |
| **PS-14** | 🟠 | Same Facebook Page selected under ≥2 accounts (shared 250 cap) | "Page {P} is selected under {k} accounts — their ads share the same 250 cap." | Dedupe · Acknowledge |

## B. Creative-distribution errors (anchor: Creative distribution / Structure / Combination)

| Code | Sev | When it occurs | Message | Suggested fix |
|---|---|---|---|---|
| **CD-01** | 🔴 | Manual mapping fills fewer slots than the structure needs | "Structure needs {n} ads but only {c} slots are mapped — auto-map the rest or reduce structure." | Auto-map creatives · Reduce structure |
| **CD-02** | 🟠 | `Rotating` spread & more creatives than slots → some never used | "You added {c} creatives but structure only has {n} slots — switch to Multiply to use them all, or reduce structure." | Switch spread to Multiply · Reduce structure |
| **CD-03** | 🟠 | `Rotating` spread & creatives don't split evenly across ad sets | "{c} creatives across {a} ad sets isn't even — auto-balance so some get {x}, others {y}." | Auto-balance · Acknowledge |
| **CD-04** | 🔴 | Carousel with fewer than 2 cards | "Carousel needs at least 2 cards; this ad has {c} — add cards or switch format." | Add cards · Switch format |
| **CD-05** | 🔴 | Carousel with more than 10 cards | "Carousel allows max 10 cards; you have {c} — remove the extras." | Remove cards |
| **CD-06** | 🔴 | Flexible format with assets outside the 1–10 range | "Flexible ads take 1–10 assets; you added {c} — adjust the count or switch format." | Add/remove assets · Switch format |
| **CD-07** | 🔵 | Catalogue/DPA mode active (count comes from product set, not creatives) | "Catalogue ads are dynamic — ad count comes from the product set, not creatives." | — |
| **CD-08** | 🔴 | Post-ID mode & fewer selected posts than ad slots | "Structure expects {n} ads but you picked {c} posts — pick more or reduce structure." | Pick more posts · Reduce structure |
| **CD-11** | 🟠 | Mix-match `All` — texts × creatives spikes count vs slots/budget | "{t} texts × {c} creatives = {n} ads, which may exceed slots or budget — switch to paired or confirm." | Switch to paired · Confirm |
| **CD-12** | 🟠 | Launch mixes more than one ad format | "This launch mixes {types} — split into separate launches, or confirm and proceed." | Split launch · Acknowledge |

## C. Cross-cutting

| Code | Sev | When it occurs | Message | Suggested fix |
|---|---|---|---|---|
| **CC-01** | 🔴 | Final count (after mix-match expansion) exceeds total free slots | "Creatives expand this to {n} ads, over your {s} free slots — reduce structure, or add a Page if you're on Fill-first/Equal." | Reduce structure · Add a Page (fill-first/equal only — see Fix-selection rule) |
| **CC-02** | 🟠 | Ad count × per-unit budget crosses the spend threshold | "Count is now {n} ads → est. daily {$} — confirm, reduce, or edit budget." | Confirm · Reduce structure · Edit budget |
| **CC-03** | 🔴 | *(Review)* Free slots dropped since Step 3 | "Slots changed since Step 3 — {P} now has {s}. Re-balance before launch." | Auto-balance · Back to Step 3 |
| **CC-04** | 🔵 | *(Retry)* Retrying failed ads only — not recounted against cap | "Retrying failed ads only — they won't be recounted against the cap." | — |

> **Implementation note:** PS-01…14, CD-01…08/11/12, and CC-01/CC-02 fire live in
> Step 3. PS-DUP splits into a breach variant (a Page would exceed 250 — Change/
> Remove Page or switch off Duplicate) and a fits variant (no breach — just the
> ×Pages count/spend warning). CC-03 (slot-drift) is evaluated at Review against a
> fresh free-slots read; CC-04 is an execution-time info during retry-failed-only.
> All one-tap fixes route through `applyDistFix(plan, fix)`; "Use suggested"
> applies `suggestedDistribution`; "Remove this Page"/"Remove Page" route through
> the new `remove_page` fix kind (see `STEP3_ERROR_MODEL.md` §5.1 and the
> Fix-selection rule above — add-page is never offered where it can't redistribute).

## The combination matrix (why a lever pair breaches)

`D` grows with the creative-distribution lever; the page-split lever decides where
`D` lands and thus what breaches:

| ↓ Page-split \ D → | small `D` (One-per-ad-set / Rotating) | large `D` (Stacked / Multiply) |
|---|---|---|
| **One page** | breach if `D > free₁` → PS-03 | high breach risk → PS-03 |
| **Fill first** | breach only if `D > Σfree` → PS-05/06 | aggregate-short likely → PS-05/06 |
| **Equal** | tightest Page may overflow → PS-04; remainder → PS-12 | shares large → PS-04 |
| **Duplicate** | fits: count & spend ×Pages → PS-DUP + CC-02; any breach → PS-DUP (breach), fixed by Change/Remove Page or switching off Duplicate — never Add a Page | ×Pages on large `D` → CC-01 + multi-Page breach, same no-add-page rule |
| **Custom** | `Σweights≠D` → PS-08; `weight>free` → PS-07 | same, larger numbers |

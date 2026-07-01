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

## A. Page-split errors (anchor: Page-split control / per page)

| Code | Sev | When it occurs | Message | Suggested fix |
|---|---|---|---|---|
| **PS-01** | 🔴 | No Page selected | "Select at least one Page to continue." | Go to Accounts |
| **PS-02** | 🔴 | A selected Page is already at the 250 cap (0 free) | "Page {P} is at its 250-ad limit — 0 slots left." | Change Page · Add a Page |
| **PS-03** | 🔴 | `One page` split & the launch's ads > that page's free slots | "Page {P} has {s} slots; this launch needs {n} ads." | Use suggested · Add a Page · Reduce structure |
| **PS-04** | 🔴 | `Equal` split puts more ads on a Page than it has free slots | "Split Equally puts {a} ads on {P}, but it has only {s} slots." | Use suggested · Change Pages · Auto-balance |
| **PS-05** | 🔴 | Total ads > total free slots across all Pages (aggregate short) | "Selected pages have {s} free slots; launch needs {n}. {d} won't fit." | Add a Page · Reduce structure · Split launch |
| **PS-06** | 🔴 | Even the suggested optimal spread still leaves ads unplaceable | "Even optimally spread, {d} ads exceed your pages' {s} free slots." | Add a Page · Reduce structure |
| **PS-07** | 🔴 | Custom split: a Page's manual weight exceeds its free slots | "Max {s} for {P} — that's its free slots." | Auto-balance |
| **PS-08** | 🔴 | Custom split: assigned weights don't sum to the total ads | "You've assigned {x} of {n} ads — {d} {over/under}." | Auto-balance |
| **PS-DUP** | 🟠 | `Duplicate` split with >1 Page — full set + spend ×Pages | "Duplicate runs the full {n} ads on each of {p} Pages — ad count and spend ×{p}." | Acknowledge · Switch to Equal |
| **PS-10** `[I]` | 🟠 | A Page's remaining-slots read is unavailable | "Couldn't check {P}'s remaining slots right now." | Retry · continue (re-check at Review) |
| **PS-11** | 🔴 | A selected Page sits on a restricted/disabled account | "Page {P} is on a restricted account — can't launch now." | Go to Account-Health · Change Page |
| **PS-12** | 🔵 | `Equal` split doesn't divide evenly | "{n} ads / {p} Pages → {split}. Remainder goes to the Page with most room." | — |
| **PS-13** `[I]` | 🟠 | Multi-account selection where per-Page aggregation is unverified | "Slots shown are per Page; other accounts on this Page may lower real headroom." | — (re-check at Review) |
| **PS-14** | 🟠 | Same Facebook Page selected under ≥2 accounts (shared 250 cap) | "Page {P} is selected under {k} accounts — their ads share the same 250 cap." | Dedupe · Acknowledge |

## B. Creative-distribution errors (anchor: Creative distribution / Structure / Combination)

| Code | Sev | When it occurs | Message | Suggested fix |
|---|---|---|---|---|
| **CD-01** | 🔴 | Manual mapping fills fewer slots than the structure needs | "Structure needs {n} ads but only {c} slots are mapped — {d} empty." | Auto-map creatives · Reduce structure |
| **CD-02** | 🟠 | `Rotating` spread & more creatives than slots → some never used | "You added {c} creatives but structure has {n} slots — {d} unused." | **Switch spread to Multiply** · Reduce structure |
| **CD-03** | 🟠 | `Rotating` spread & creatives don't split evenly across ad sets | "{c} creatives across {a} ad sets isn't even — some get {x}, others {y}." | Auto-balance · Acknowledge |
| **CD-04** | 🔴 | Carousel with fewer than 2 cards | "Carousel needs at least 2 cards; this ad has {c}." | Add cards · Switch format |
| **CD-05** | 🔴 | Carousel with more than 10 cards | "Carousel allows max 10 cards; you have {c}." | Remove cards |
| **CD-06** | 🔴 | Flexible format with assets outside the 1–10 range | "Flexible ads take 1–10 assets; you added {c}." | Add/remove assets · Switch format |
| **CD-07** | 🔵 | Catalogue/DPA mode active (count comes from product set, not creatives) | "Catalogue ads are dynamic — ad count comes from the product set, not creatives." | — |
| **CD-08** | 🔴 | Post-ID mode & fewer selected posts than ad slots | "Structure expects {n} ads but you picked {c} posts." | Pick more posts · Reduce structure |
| **CD-11** | 🟠 | Mix-match `All` — texts × creatives spikes count vs slots/budget | "{t} texts × {c} creatives = {n} ads. That may exceed slots or budget." | Switch to paired · Confirm |
| **CD-12** | 🟠 | Launch mixes more than one ad format | "This launch mixes {types} — some may need separate launches." | Split launch · Acknowledge |

## C. Cross-cutting

| Code | Sev | When it occurs | Message | Suggested fix |
|---|---|---|---|---|
| **CC-01** | 🔴 | Final count (after mix-match expansion) exceeds total free slots | "Final count {n} exceeds free slots {s} once creatives expand." | Reduce structure · Add a Page |
| **CC-02** | 🟠 | Ad count × per-unit budget crosses the spend threshold | "Count is now {n} ads → est. daily {$}. Confirm or reduce." | Confirm · Reduce structure · Edit budget |
| **CC-03** | 🔴 | *(Review)* Free slots dropped since Step 3 | "Slots changed since Step 3 — {P} now has {s}. Re-balance before launch." | Auto-balance · Back to Step 3 |
| **CC-04** | 🔵 | *(Retry)* Retrying failed ads only — not recounted against cap | "Retrying failed ads only — they won't be recounted against the cap." | — |

> **Implementation note:** PS-01…14, CD-01…08/11/12, and CC-01/CC-02 fire live in
> Step 3. CC-03 (slot-drift) is evaluated at Review against a fresh free-slots read;
> CC-04 is an execution-time info during retry-failed-only. All one-tap fixes route
> through `applyDistFix(plan, fix)`; "Use suggested" applies `suggestedDistribution`.

## The combination matrix (why a lever pair breaches)

`D` grows with the creative-distribution lever; the page-split lever decides where
`D` lands and thus what breaches:

| ↓ Page-split \ D → | small `D` (One-per-ad-set / Rotating) | large `D` (Stacked / Multiply) |
|---|---|---|
| **One page** | breach if `D > free₁` → PS-03 | high breach risk → PS-03 |
| **Fill first** | breach only if `D > Σfree` → PS-05/06 | aggregate-short likely → PS-05/06 |
| **Equal** | tightest Page may overflow → PS-04; remainder → PS-12 | shares large → PS-04 |
| **Duplicate** | count & spend ×Pages → PS-DUP + CC-02; per-Page breach | ×Pages on large `D` → CC-01 + multi-Page breach |
| **Custom** | `Σweights≠D` → PS-08; `weight>free` → PS-07 | same, larger numbers |

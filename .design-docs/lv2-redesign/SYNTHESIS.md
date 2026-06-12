# Launch 2.0 — Synthesis of 6 design agents

## Top design decisions per theme

### Hub
- **6 zones** stacked: Ops bar (5 KPI tiles) → Needs attention (conditional) → Live launches (grid) → Start a launch (strategy tag chips, blank launch) → Drafts → Recent (7 days, tag-filterable)
- Strategy chips replace "Quick actions" — top user tags (#scale, #test, #evergreen) as entry points
- Subtitle dropped; Auto launch tile killed; "+ Launch" header CTA shorter; Templates/History tiles removed (sidebar redundant)
- Title: "Launch" (drop "v2" — version is internal noise)

### Step 1 + Strategy model
- **Strategies lead, objective is fallback.** Top 70% of viewport = strategy library (search + tag filter + recently-used + grid). Bottom = "Or start fresh — pick objective".
- Tag input UX: typeahead combobox on Step 4 save. Lowercase normalized, max 24 chars, alphanumeric+dash, 8-tag soft cap.
- Strategy model fields: name, tags[], objective, budgetMode, budget, currency, audience (template ref OR inline), structure, creativeSource, owner, visibility, lastUsedAt, useCount.
- "Save as strategy" moves to Step 4 Review (after launch, in success toast/modal). No more orphaned checkbox on Step 1.
- Default state: nothing pre-selected. No false-positive Custom card with full lime border.

### Vocabulary (66 specific renames documented)
- **Two surface concepts only:** Strategy (everywhere upstream is saved end-to-end) + Targeting Template (audience-only). "Template" word allowed ONLY in "Targeting Template".
- "Goal" → "Objective" (canonical)
- "Done" status → "Live"
- "Hub" title "Launch v2" → "Launches"
- Section subtitles: drop all tutorial-voice subtitles
- Errors: cause + impact + next action (in that order)
- Sentence case everywhere. UPPERCASE banned. Proper nouns: Page, Pixel, Advantage+, Strategy, Targeting Template, Special Ad Category.

### Step 2 Setup
- **Kill the floating Overview card.** Thin top bar only (step counter + Save draft). Template bar collapsed to single line.
- **Per-account budget split UI:** Total budget + Equal/Custom/Weighted split, per-account rows with bar + % + edit icon
- **Account health inline card** on selection: spend today vs cap, pages, pixel, cap-risk
- **Special Ad Category moves to top of §1** as "Regulated category?" gate (compliance gates targeting/placement — must be answered first). Auto-detect from page category, user overrides.
- **§3 splits internally:** Optimization (location/event/attribution/goal) + Audience & Placement (template/geo/age/custom/placements). Single section header, two `▸` sub-headings.
- Attribution + Placements: pull OUT of AdvancedReveal. Surface inline.
- Currency hint: inline under budget row for non-INR accounts.

### Step 3 + Step 4
- **Kill split-pane on Step 3.** Replace with vertical stack (max-width 960px, centered). Distribution sits BELOW Creative in vertical flow.
- **Catalogue (DPA) mode:** distribution collapses to one-line summary "Distributed by catalog feed · Meta-managed".
- **Persistent breadcrumb strip** across all 4 steps: step rail + overview chips (objective, accounts, budget, audience, strategy) + autosave tri-state. Sticky under top nav.
- **Setup summary card moves OUT of Step 3 left pane** → into the persistent breadcrumb chips.
- **Step 4 Launch CTA promotion:** large lime button, 48px height, copy = "Launch · 6 ads · ₹12,000 first-day". Click → modal (NOT hold-to-confirm — modal is B2B standard).
- **Pre-launch confirmation modal** lists: counts, first-day spend, daily budget (+ USD equivalent for multi-currency), Meta review hint, pause anytime. User reads BEFORE primary CTA enables.
- **Recursive "Edit on Step 4 Distribution →"** removed. Pencil icons next to each editable row → deeplink to Step 3.
- Tree pane in Step 4: fixed 280px (was draggable, nobody resized).
- Footer Feedback button removed (floating bubble is single source).
- Autosave: tri-state with timestamp in breadcrumb strip (Saving… / Saved 12s ago / Save failed — Retry).

### Visual system
- **Lime = primary CTA ONLY.** 1–2 lime uses max per screen. Selection state → 2px foreground border (mono), no lime fill. Filter chips active → foreground-fill, not lime.
- **Geist Mono = identifiers ONLY** (account IDs, pixel IDs, UTM). Currency/dates/counts → Geist Sans with `tabular-nums`.
- **Case rules:** Sentence case everywhere. UPPERCASE banned. Title Case only for product proper nouns.
- **Section labels:** 13px medium foreground, no uppercase tracking, optional count chip after `·`
- **Empty state template:** Action heading → 1-line context → primary CTA. No "No X yet."
- **Selected vs locked vs disabled** = visually distinct (2px border vs dashed border + lock icon vs muted fill + reason tooltip)
- **Density:** drop card padding 32→24, stat tile gap 24→16, table row 56→44, form gap 20→16
- **Icons:** remove 32px hero icons on objective cards (label is enough)
- **Pill system:** Filter chip / Status pill / Tag chip / Value chip — each visually distinct

---

## Conflicts between agents (need resolution)

1. **Lime border for selected state** — Visual agent says kill (use 2px foreground). Conflicts with current design pattern. Big change. NEEDS LOCK.
2. **Skip-to-Step-4 when Strategy fully applies** — Step 1 agent suggests jump to Step 4 with banner. Could feel jarring. NEEDS LOCK.
3. **Step 3 split-pane vs vertical** — Step 3/4 agent says kill split-pane entirely. Major architectural shift. NEEDS LOCK.
4. **Autosave placement** — Step 3/4 agent moves to breadcrumb strip. Visual agent doesn't specify. Confirm breadcrumb is canonical home.
5. **"Live" status name** — Vocabulary agent: rename "Done" → "Live". Possible confusion with "still launching". NEEDS LOCK.

---

## Open questions (15) — to answer in batches

### Batch A (highest leverage — answer first)
1. Selected-state visual: 2px foreground border (mono) OR keep lime fill?
2. Step 3 layout: split-pane OR vertical stack?
3. When Strategy fully applies in Step 1, skip to Step 4 or walk through 2→3→4?

### Batch B (Hub specifics)
4. Conversion FX hint source: Meta API / Settings manual / daily fetch?
5. "Needs attention" max rows: 4 then "View all" OR up to 8?
6. Live launches: 3-up grid OR horizontal scroll strip?

### Batch C (Strategy + Targeting Template)
7. Shared vs private Strategies: org-wide OR team-scoped?
8. Targeting Template ref: live reference (auto-updates) OR frozen copy?
9. CBO/ABO: tooltip-only spell-out OR first-mention inline?

### Batch D (Step 2 specifics)
10. Budget split default: Equal OR Weighted-by-30d-spend?
11. Health card data: live API on select OR cached at session start?
12. Regulated category: auto-flip with override OR suggestion banner?

### Batch E (Step 3/4 + visual)
13. Multi-currency hint on breadcrumb chip too OR launch-modal-only?
14. Tab label rename: "Creative" OR "Ad creative" (current "Ad & ..." truncates)?
15. Tag chip overflow on Strategy cards: 3 + "+N" OR wrap to second line?

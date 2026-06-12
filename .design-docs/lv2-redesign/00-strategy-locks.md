# Launch 2.0 — All locked design decisions (18)

Final ground-truth after 5 batches of Q&A with Maalik. 12 Jun 2026.

---

## Tier 1 — Strategy locks (5)

### 1. Hub purpose
**Heavily dashboard + lightly Start-launch.**
Top 60–70% = agency operating state. Bottom 30–40% = "Start launch" path. NOT a "Quick actions + recent list" entry page.

### 2. Template / strategy model
**Two visible concepts:**
- **Strategy** — end-to-end preset (saved post-launch from Step 4)
- **Targeting Template** — audience-only Meta primitive

Setup/Distribution/Adset-level templates may exist internally but **hidden** (Settings only).

### 3. Intent model
**Free-form user-defined tags on Strategies.** No predefined test/scale/custom segmented control. Tags created at save time on Step 4 via typeahead.

### 4. Governance
**Out of scope entirely.** No approvals, no role hierarchy, no per-client caps. Single agency = single workspace.

### 5. Currency
**USD only. `$` symbol only** (no "USD" prefix, no other symbols).
- All budgets, spend, ops bar in `$`
- Multi-currency Meta accounts: converted invisibly to USD for display
- Daily-fetched FX rate, cached 24h
- Tooltip on conversion: "Converted at $1 = ₹84 · updated 6h ago"

---

## Tier 2 — Visual + flow (4)

### 6. Selection state
**Mono 2px foreground border + bg-foreground/[0.03] fill + small check dot top-right.**
Lime stays ONLY for primary CTA. Lime border for selection = killed.

### 7. Step 3 layout
**Keep split-pane** but tighten internal padding/margin AND **utilize the page gutters** (sidebar margins around the split-pane). Notion/Figma/Linear-style gutter usage — tools rail, contextual help, mini overview.

### 8. Strategy apply behavior
**Per-Strategy toggle** for "skip to Step 4 on apply". Default = walk through 2→3→4.
- Demo strategies have **intentional gaps** (some 100% complete → jump to Step 4, some 80% → land at first missing step) for tester storytelling.

### 9. Status name
**"Active"** for a launched campaign. Not "Live", not "Done".

---

## Tier 3 — Hub specifics (3)

### 10. FX source
**Daily-fetched from public rates API**, cached 24h. Tooltip shows rate + age.

### 11. Needs attention rows
**Cap at 4** + "View all (N)" link to drawer/full-page.

### 12. Live launches layout
**3-up card grid** (max 6 visible + "View all" to History).

---

## Tier 4 — Strategy + Targeting Template (3)

### 13. Strategy visibility
**All workspace-wide shared by default.** No "mine vs theirs". Filter by tags + name + last-used only, no owner filter.

### 14. Targeting Template reference
**Frozen copy at Strategy save time.** Strategy snapshots TT contents inline. Future TT edits don't propagate to existing Strategies. Self-contained.

### 15. CBO/ABO acronym treatment
**Tooltip on hover only.** Pills stay short ("Campaign (CBO)" / "Ad set (ABO)"). Hover reveals explanation. No inline spell-out.

---

## Tier 5 — Step 2 corrections (3)

### 16. Budget model (CORRECTED)
Budget lives at **Campaign (CBO) or Ad set (ABO) level — NOT per ad account.** Ad account = container only.
- ONE budget input in Step 2 Campaign section
- When 2+ accounts selected: show projection "Running in N accounts → $X × N = $Y/day total"
- No per-account budget split UI (deleted)

### 17. Account health card data freshness
**Cached at session start.** Parallel fetch all account health on page load. Instant display on chip click.

### 18. Regulated category default
**Off by default + suggestion banner.** If page category matches regulated vertical, show banner "This page is in a regulated category. Turn this on if needed." User must consciously toggle.

---

## Tier 6 — Step 3/4 + visual (3)

### 19. Launch CTA copy
**"Launch · 6 ads · $200/account · day-1"**
- "6 ads" = total ads across all accounts
- "$200/account" = per-campaign budget (not total)
- "day-1" = first day, since budget recurs daily

### 20. Tab label rename
**"Creative"** (currently "Ad & ..." truncates). Drop "Distribution" from label — user discovers when they land on the step.

### 21. Strategy tag overflow
**3 chips visible + "+N more" chip.** Card height stable. Hover/click `+N` shows full list popover.

---

## Out-of-scope / deferred to v2.1+
- Per-account budget overrides (current model: one budget × N accounts)
- Multi-currency picker per launch
- Strategy ownership / sharing controls
- Approval workflows
- Role hierarchy
- Targeting Template auto-propagation to Strategies
- Manual FX rate override

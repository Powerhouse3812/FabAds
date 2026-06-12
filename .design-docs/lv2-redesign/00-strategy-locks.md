# Launch 2.0 — Strategy locks (Maalik decisions, 12 Jun 2026)

These 5 decisions are ground truth. All downstream design follows from these.

## 1. Hub purpose
**Heavily dashboard + lightly Start-launch affordance.**
- Top 60–70% = agency operating state (live launches, drafts, account health, needs-attention)
- Bottom 30–40% = "Start launch" path
- NOT a pure "Quick actions + recent list" entry page

## 2. Template / strategy model
**Two visible concepts:**
- **Strategy** — end-to-end preset (objective + budget + audience + structure + creatives + tags). Saved post-launch.
- **Targeting Template** — audience-only reusable (Meta-style primitive)

Setup-template, Distribution-template, Campaign/Adset-level templates may exist internally but are **hidden** (Settings only, not promoted in the flow).

## 3. Intent model
**Free-form user-defined tags on Strategies** — no predefined test/scale/custom segmented control.
- Users tag their Strategies with anything ("test", "test-audience", "scale", "abc", "Q4-2025")
- Strategy library has tag-based filtering
- Tags created on save (Step 4), not upfront

## 4. Governance
**Out of scope entirely.**
- No approvals
- No role hierarchy (junior/senior)
- No per-client/per-account caps
- Single agency = single workspace, flat permissions

## 5. Currency
**Single workspace currency, default INR.**
- All budget inputs in workspace currency
- Multi-currency accounts: inline "Will be converted at ₹XX rate" hint
- No multi-currency picker per launch

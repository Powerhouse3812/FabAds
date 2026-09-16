# Launch 2.0 — Research

**Purpose.** One clear, data-backed picture of *what* Launch 2.0 is, *why* we're
building it, *who* it's for, what exists today, what competitors do, and which
Meta fields we must cover. **No decisions here** — decisions happen in the Q&A
*after* this doc. The exhaustive evidence lives in the numbered stream docs
(`00`–`08`); this is the readable summary that ties them together.

**Scope (locked).**
- **Meta only** (Facebook + Instagram), for now.
- Launch 2.0 = **the act of launching ads**. Post-launch work (scaling,
  optimisation, recovery) is handled by **reports + the rule engine** — *out of
  scope* here.

---

## 1. The problem — why 2.0
**In short: launching ads today is slow, manual, error-prone — and partly fake.**
- The current launch is a **long multi-step wizard** with fields scattered across
  screens. Users go back-and-forth, validation gets skipped, and errors surface
  *after* hitting "launch." *(stream 01; Neeraj)*
- Worse: **execution is a stub** — the UI says "Launch successful!" but nothing is
  actually sent to Meta. *(01, 04)*
- It supports only a fraction of Meta's real fields *(see §7)*.

→ 2.0's job: make launching **fast, guided, complete, and real.**

## 2. What we're building — "Launch Strategies"
**In short: ready-made *recipes* to launch many Meta ads in one go, with few inputs.**
- A **Launch Strategy** = a preset structure written as **`campaign : adset : ad`**.
  Example **`1:5:1`** = *1 campaign · 5 ad sets · 1 ad each*.
- The named recipes are **test structures** *(Maalik; corroborated in 05c)*:
  - `1:5:1` → test **audiences** (5 ad sets, same ad)
  - `1:1:5` → test **creatives** (1 ad set, 5 ads)
  - `1:3:5` → test **both** (3 audiences × 5 creatives)
  - **"Bruno"** → a high-volume, low-budget **mass-test** (thousands of cheap ads).
    *Name unconfirmed; the shape is real.*
- **User flow (high level):** pick a recipe → add creatives → system builds the
  campaign/ad-set/ad tree + spreads it across ad-accounts/pages → **one
  preview/confirm** → launch.
- A **scratch / flow-builder** stays for advanced users — but the goal is that
  most users never need it.
- **Scope reminder:** scaling a winner is *not* launch's job — that's the rule
  engine + reports.

## 3. Who it's for — personas *(data-backed, stream 05)*
- **Dropship / agency-account operator** — many ad-accounts + pages, lives with
  bans. *Sharpest fit.*
- **Agency lead** — many clients/accounts; needs scale + delegation.
- **Solo performance operator** · **Performance marketer** · **Brand manager**.
- **Team note:** especially useful for **e-commerce / catalogue + influencer**
  audiences *(Maalik, Neeraj)*. All four use-cases are in scope.

## 4. What users actually struggle with — pains & needs *(05, 05b)*
- **#1 pain: ad-account bans / restrictions** with no support — people even pay
  for rented accounts to avoid it. *(strong evidence)*
- Bulk-launch tedium: duplicating across accounts, mapping creatives, hitting the
  250-ads-per-Page wall.
- Reliability: launches that silently fail; no clear "what launched, what didn't."
- The need: **fewer inputs, strong validation, visibility, and recovery.**
- *Honesty:* the deepest sources (Reddit / FB groups) were blocked in this
  environment, so a few figures are directional — flagged in `05`/`05b`.

## 5. The market — feature-wise *(02, 05b, 08)*
**In short: many launchers exist, but none own our wedge.**
- **AdManage** (team-flagged; studied feature-wise — the two YouTube demos were
  blocked, so this is from their site/docs/public API, `08`):
  - Flagship = **filename → aspect-ratio auto-grouping → placement routing**
    (1:1 / 4:5 / 9:16 → Feed vs Stories/Reels), Smart-Fix media, custom
    thumbnails. **v1 has none of this.**
  - **Cross-account duplication that re-assigns the pixel per destination
    account** (solves a real breakage).
  - Strong bulk formats: Collection, Flexible, Carousel-10, Partnership ads,
    Multi-language/DLO, **post-ID reuse at scale**.
  - From-scratch creation is **API-only**; the UI launches into *existing*
    campaigns. Flat pricing £499/£999. Multi-platform.
- **The whitespace nobody fills:** (ad-account × page) distribution, **250-cap
  awareness**, **warm-up**, **account-health / RRM**. → that's **FabAds' edge.**

## 6. What exists today — v1 + the prototype *(01, 03, prototype-review)*
- **v1 Launch:** History, a 3-step wizard, Targeting Templates, AutoPilot, RRM —
  but execution is simulated, distribution runs on **mock** page-capacities, there
  is **no table virtualisation** (breaks at scale), and there are big field gaps
  *(§7)*.
- **Lovable prototype ("Unified Launch Builder"):** a 4-step demo. Useful *ideas*
  (resulting-shape preview, per-row status, entry-context deep-link) but **not
  reusable** — fake scale (≤12 rows), the 3 creative-mapping modes aren't truly
  distinct, validation ungated, no empty states. *(Maalik's read was right.)*
- **Worth carrying (idea, not code):** the validation-summary + scroll-to pattern;
  the distribution-logic core; the catalogue tree→config→preview layout; the
  before→after "resulting shape" preview.

## 7. Meta fields — what we must cover vs what v1 has *(stream 07 = full tables)*
**In short: 2.0 builds the Meta field layer almost from scratch.**
- **Custom audiences:** v1 is a **fake stub** (just a name textbox + platform
  dropdown — no real audiences, IDs, or source). **Lookalikes + saved audiences:
  absent.** *(Neeraj's point — confirmed.)*
- **"Use existing post" / post-id:** missing entirely.
- **Objectives:** stale — Meta now accepts only the ODAX `OUTCOME_*` set.
- **Whole categories absent:** real pixel / conversion event, attribution setting,
  A/B test, dayparting, frequency cap, cost-cap / min-ROAS, behaviours &
  demographics targeting, lead-form / WhatsApp / app destinations, offline
  tracking.
- v1 covers only **~30–40 %** (basic fields); near-zero on audiences, tracking,
  advanced bidding, existing-post.
- **Team-flagged to include up front:** custom audience, post-id, and
  differentiation by **static / flexible / catalogue** type (fields + mapping
  change per type).
- → Full campaign/ad-set/ad inventory in **`07-meta-fields.md`**.

## 8. Constraints & data model — what shapes the design *(stream 03)*
- **250 ads per Page** — Meta hard cap; counts active + scheduled + in-review and
  **aggregates across all ad-accounts sharing a Page**. This is *why* distribution
  across accounts/pages exists.
- **Distribution:** strategies `fill_first` / `equal` / `duplicate`; page
  capacities are **mock today** (must wire the real `fb_pages` source).
- **Hierarchy:** launch → ad-accounts → campaigns → ad-sets → ads. Entities
  currently carry **no `ad_account_id`** (blocks account-level distribution);
  currency resolves at launch level.
- **"Strategy" is overloaded** (distribution mode vs AutoPilot profile vs the new
  recipe) → must rename to disambiguate.
- **Scale:** no virtualisation today; bulk (especially mass-test) will choke
  without it + server-side batched execution.

## 9. Edge cases & states — must design for
- 0 / 1 / **thousands** of creatives & ads (Bruno = thousands → 250-cap math).
- Long names, slow / offline, validation errors, permission-denied, narrow
  viewport, accessibility.
- Every screen needs **populated / partial / empty** states *(the prototype had
  none)*.

## 10. Open questions — for the Q&A *(decide AFTER, data-backed — not assumed)*
1. **Entry point** — creatives-first or strategy-first? (both wanted; sequence TBD)
2. **Per-recipe mechanics** — budget (CBO/ABO + amounts), targeting defaults,
   account/page spread for `1:5:1` / `1:3:5` / `1:1:5`.
3. **"Bruno"** — exact structure + how it respects the 250-cap.
4. **Build-first** — which recipes / use-cases first (all 4 in scope).
5. **Creative-mapping** — keep 3 modes (made genuinely distinct) or simplify? +
   thumbnails.
6. **Preview screen** — how much editing is allowed there?
7. **Catalogue mapping** — at which level (account / campaign / ad-set / ad)?
8. **Enterprise gating + pricing** model.
9. **Permissions** — who can publish?
10. **Meta fields** — which are must-have for v1 vs phase 2? (full list in `07`)

---

### Evidence map
`00` context · `01` v1 teardown · `02` competitive · `03` data-model · `04`
roles/failures · `05` market/user · `05b` strategy-demand · `05c`
ratio-strategies · `07` meta-fields · `08` AdManage · `prototype-review`.
*(`06-synthesis` was an earlier, denser synthesis — superseded by this doc.)*

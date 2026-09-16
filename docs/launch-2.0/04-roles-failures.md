# Launch 2.0 — Research Stream 4: Roles + Failure Taxonomy

> Scope note (LIGHT by request): a high-level read of (a) roles/plan-gating as
> they exist today and (b) the practical failure modes when launching ads, with
> current handling + gaps. Not a full RBAC matrix. Cites code where it matters.

---

## 1. Roles & plan-gating (high level)

Two **independent** axes gate Launch. They are not the same thing.

### Axis A — Workspace roles (multi-user / agency)

- Model: every user is mapped into a workspace via `workspace_users` with an
  `app_role` enum. Three roles exist, collapsed to two for display:
  - DB roles: `owner`, `admin`, `member` (`workspace_users.role`, default `member`;
    workspace creator becomes `owner`). Source: `supabase/migrations/20260209115019_*.sql`.
  - UI: `displayRole()` collapses `owner`/`admin` → **"Admin"**, everything else →
    **"Member"** (`src/lib/display-role.ts`).
- Enforcement: RLS via `is_workspace_member(uid, workspace_id)` (read access) and
  `has_role(uid, 'admin')` (privileged writes). The `launch-execute` edge function
  re-checks `is_workspace_member` server-side before running — non-members get 403.
- Last-admin / sole-user protection lives in `src/lib/edge-errors.ts`
  (`SOLE_USER`, `PROMOTE_REQUIRED`, "Cannot remove the last admin").
- **Solo creator vs agency**: there is no separate "solo" vs "agency" entity — it's
  the same workspace model at different scale. Solo = 1 user (owner) + few accounts;
  agency = many `workspace_users` + many `fb_ad_accounts` + clients table
  (`clients` / `client_users`, migration `20260323085149_*.sql`). Multi-account is
  native to Launch (account multi-select, per-pair distribution, the 250-cap logic).
- Practical gap for 2.0: roles gate *workspace membership/admin actions*, but there's
  **no Launch-specific permission** (e.g. "Member can build but not publish", or
  spend-cap approval). Anyone who is a member can hit `launch-execute`. Worth deciding
  whether 2.0 needs a publish/approval gate for agencies.

### Axis B — Plan tier (feature-gating / upsell)

- Model: `PlanContext` exposes `plan: "full" | "ai"` (`src/contexts/PlanContext.tsx`).
  **This is the in-app demo toggle** — resolved from `?plan=` → sessionStorage → default
  `"ai"`. "Growth" / "AI Team" are the **marketing tier names** used in CTAs, not the
  context enum. (`full` ≈ paid/Growth, `ai` ≈ the entry AI plan.)
- Gating pattern: a page reads `usePlan()`; if `plan === "ai"` it returns an upsell
  surface instead of the feature. Two upsell shapes:
  - Full-takeover hero: `LaunchUpsellPage` ("47 ads. Zero launched.", orbital art,
    `src/components/upsell/LaunchUpsellPage.tsx`), `AutomationUpsellPage`,
    `ReportsUpsellPage`.
  - Inline empty-state: `UpsellEmptyState` (lock chip + value prop + CTA →
    `/plans-v2?tier=…`, `src/components/upsell/UpsellEmptyState.tsx`).
- **Which Launch-area features are plan-locked on the `ai` plan** (gate = `plan === "ai"`):
  | Surface | File | Upsell target |
  |---|---|---|
  | AutoPilot (auto-launch) | `src/pages/AutoPilotLaunch.tsx` | Growth (`AutomationUpsellPage`) |
  | RRM (Recovery & Retention) | `src/pages/RRM.tsx` | Growth (`UpsellEmptyState`) |
  | Reports / Launch History | `src/pages/Reports.tsx`, `src/pages/LaunchHistory.tsx` | Growth |
- Note: the **core launch flow itself** (build → preview → execute) is not hard-gated in
  the code paths reviewed; the AI-plan upsell pressure sits on AutoPilot/RRM/Reports/History.
  `LaunchUpsellPage` is the "your built ads can't publish on AI plan" framing.
- `usePlan()` **fails open** to `"full"` outside a provider — so an unwrapped screen shows
  everything. Risk for 2.0: a new Launch screen that forgets the provider silently
  un-gates itself.

---

## 2. Failure taxonomy (the useful part)

> **Critical context:** `launch-execute` is currently a **stub/simulation**, not a real
> Meta call. It sleeps ~2–3s, then "fails" only if the launch *name* contains the string
> `"fail"`; otherwise it marks success (`supabase/functions/launch-execute/index.ts`).
> So almost every Meta-side failure below is **unhandled today** — the gap column is the
> real deliverable for 2.0.

| Failure | Likely trigger | Current handling | Gap / risk for 2.0 |
|---|---|---|---|
| **Pre-submit validation** | Missing required fields (name, account, objective, budget, location, creative text/CTA/media, schedule date for scheduled ads) | **Solid.** `validateStep1–4` (`src/lib/launch-validation.ts`) produce per-field errors; `MissingFieldsSummary` lists + scroll-to-field; Preview blocks Launch when invalid (`LaunchPreviewModal`). | Strongest area. Mostly client-side though — no server re-validation before the (future) real Meta call. Add a server validation pass in `launch-execute`. |
| **Ad rejected / invalid parameter** | Meta rejects asset/creative spec (policy, malformed asset_feed_spec, bad URL) — often a vague "Invalid parameter" | **None.** Simulation never calls Meta; no rejection path, no per-ad rejection state in UI. | Need per-ad rejection status + human-readable mapping of Meta error subcodes. AutoPilot already models intent (`pauseRejectionPercent`, `skipIfInReview`) but Launch proper doesn't surface rejections. |
| **Account restricted / banned / permission** | Ad account disabled, BM flagged, or token role too weak (Analyst can't create) | **None** for Meta-side. Workspace-side 403 exists (`is_workspace_member`) but that's app auth, not Meta. `edge-errors.ts` maps app errors only. | Detect Meta account-status errors pre-launch (account health check) and block with a clear reason rather than a generic toast. Tie into RRM health snapshots already in the codebase. |
| **Rate-limit / quota** | Meta mutation cap (~100 QPS per app+account; err 613 / subcode 1487225) — likely on bulk/duplicate launches | **None.** No throttle, no backoff, no queue. Single fire-and-wait invoke. | Bulk + Duplicate strategies multiply requests fast → will hit limits. Need client/edge throttling, retry-with-backoff, and a launch queue. High priority for "launch at scale." |
| **Token expired mid-launch** | Short/long-lived FB token expires (1–2h / ~60d) | **None** in launch path. Generic `catch` → `toast({ "Launch error", err.message })`. App-level "session expired" mapping exists in `edge-errors.ts` but isn't wired to Meta token state. | Pre-flight token validity check + refresh flow; distinguish "your FB connection expired, reconnect" from a generic error. |
| **Partial-launch failure** (some ads succeed, some fail) | Mixed result across many ad/account/page pairs in one bulk run | **None.** Status is a single launch-level enum (`executing`→`success`/`failed`); no per-ad/per-pair result tracking. A real partial run would show all-or-nothing. | Biggest structural gap. 2.0 needs per-row (ad × pair) result status, a partial state, and retry-only-failed. `LaunchConfirmDialog` allocates per-pair but results aren't tracked per-pair. |
| **Network / timeout** | Slow/dropped connection during the invoke; long bulk run exceeds function timeout | **Minimal.** `try/catch` around `supabase.functions.invoke` → destructive toast; button shows spinner/disabled. No timeout handling, no resumability — a timeout looks like a hard failure even if work continued server-side. | Idempotent execute + resumable/queued model so a timeout doesn't double-launch or lose state. Add explicit timeout + "still processing" state. |
| **250-ads-per-page cap exceeded** | Active+scheduled demand on a unique FB Page > 250 slots (cap keyed on `fb_page_id`, shared across account-page pairs) | **Solid (pre-submit).** `MAX_ADS_PER_PAGE=250` + `validateStrategy` (`src/lib/launch-distribution.ts`) computes per-page demand, names over-capacity pages, blocks Preview/Confirm. `LaunchConfirmDialog` **re-validates on open AND immediately before execute** (aborts on stale capacity). | Well-handled client-side, including the shared-page-across-accounts case. Gap: capacity is **mock** (`mock-page-capacity.ts`) — real current-active counts must come from Meta, and the cap could still be hit if Meta state drifts between check and submit. Paused ads correctly don't consume slots. |

### Quick takeaways for 2.0
1. **Validation + the 250-cap are the mature parts** — pre-submit UX is good; keep it.
2. **Everything Meta-side is a stub** — there is effectively *no* real Meta failure
   handling yet. The execute function is the single biggest build item.
3. **No partial-success model** — launch status is one all-or-nothing enum. Per-row
   (ad × account × page) result tracking + retry-failed-only is the key structural add.
4. **No throttle/retry/queue** — bulk + duplicate will hit Meta rate limits; needs a
   queue + backoff before "launch at scale" is real.
5. **Token/account-status pre-flight missing** — wire FB connection + account health
   (RRM snapshots already exist) into a pre-launch gate.
6. **`usePlan()` fails open** — new Launch 2.0 screens must be inside the provider or
   they silently un-gate.

### Sources (Meta failure categories)
- [Meta Marketing API rate limiting](https://developers.facebook.com/docs/marketing-api/overview/rate-limiting/)
- [Meta Marketing API error reference](https://developers.facebook.com/docs/marketing-api/error-reference/)
- [Meta Marketing API: common challenges (AdManage.ai)](https://admanage.ai/blog/meta-marketing-api-challenges-and-fix)
- [Fix Meta ad account permission errors (AdAmigo.ai)](https://www.adamigo.ai/blog/fix-meta-ad-account-permission-errors)

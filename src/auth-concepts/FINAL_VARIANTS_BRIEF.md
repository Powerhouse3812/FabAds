# Signup Final Variants — Feedback Synthesis Brief

> Source: Maalik's feedback round on concepts 1–11 (2026-07-14).
> Scope: **Signup only** for now. Login versions come after the 2 finals are locked.
> Concepts 12–19 (wave-1) rejected as "too inconsistent for our app". Concepts 9 & 11
> received no feedback — treated as skipped (open question Q1).

---

## 1. Feedback → concept mapping

| # | Concept (file) | Liked | Disliked | Notes / discrepancies |
|---|---|---|---|---|
| 1 | `Concept01Spotlight` | Dark theme background · light-spread (tungsten spotlight) behind card · card parallax tilt · light follows cursor | — | Spotlight = rAF-lerped radial gradient tracking `--mx/--my`; card tilt = `perspective(1000px)` ±6°. Both proven, portable. |
| 2 | `Concept02BlobDivide` | Animated left image panel moving on page load · floating tags | — | "Moving on load" = blob clip-path **morph wobble** + 7s breathe loop. Floating tags = 3 glass callout pins ("Live campaigns" / "Auto-optimized" / "24/7 monitoring") with staggered pin-in + float loops. |
| 3 | `Concept03ReactiveCompanion` (assumed — see Q2) | Clean minimal look · white space · **password strength meter** | Vertical scroll · heading · logo usage · basic UI | Only concept with a strength meter (`scorePassword()` 4-tier, lime fill — deliberately not traffic-light). "Basic UI" = it uses raw shadcn primitives, unlike the styled pill inputs elsewhere. |
| 4 | `Concept04TypeTexture` | **Only** the card tilt→straighten effect | Everything else | ⚠️ In code the straighten is **hover**-driven (`rotate(-1.25deg)` → `0` on `:hover`). Maalik read it as fill-driven. Final = implement it **focus/typing-driven**: card rests tilted, straightens while the user fills the form. |
| 5 | `Concept05IridescentAI` | Left-side ripple effect + lines + grid dots · small brag number at bottom · signup centered, onboarding-style | — | Ripple = 3 pulsing concentric rings (scale 0.55→2.1 fade). Grid = breathing 24px dot-grid. Lines = 2 fading abstract SVG paths. Brag number = "4,500+ marketers already in" + avatar stack. Signup there is a single centered glass panel. |
| 6 | `Concept06ScatteredDesk` | Small items with parallax · center-aligned onboarding-like flow (signup only) | — | 11 scattered stat objects (CTR +12.4%, 2.1M reach, Genie hook chip…), rAF-throttled page-level mouse parallax (6–20px per-object depth) + idle bob + hover straighten/reveal. Form is centered & cardless. |
| 7 | `Concept07HandDrawnJourney` | Faded & smooth staggered loading of small elements · tags "you're here →" and "most people start here ↖" | — | Loading = SVG stroke self-draw (`stroke-dashoffset`) with 0→950ms page stagger + per-path sequencing. Tags are Caveat handwriting in coral. Also has "no credit card!" tag. |
| 8 | `Concept08StepperInScene` | Clean professional software look · dark theme · clicking a form item → light effect on the image/scene side | — | ⚠️ In code the scene light **pulse fires on plan selection**, not field focus (fields have no scene reaction). Final = extend to **focus-driven**: focusing any input lights the corresponding region/chip on the scene side (C8 already has floating field chips — Full Name / Email / +91 — to light up). |
| 9 | `Concept09MinimalMono` | *(no feedback)* | *(no feedback)* | Skipped? → Q1 |
| 10 | `Concept10NatureSplit` | Title treatment — background + abstract shape painting behind **half of the text** | — | The `Highlight` marker: skewed `bg-primary/70` bar that paints in (scaleX 0→1, −1.5°) behind one word of the heading. |
| 11 | `Concept11LiquidGlass` | *(no feedback)* | *(no feedback)* | Previous flagship. Out of the finals? → Q1 |

---

## 2. Element inventory for the 2 finals

### Locked-in (clearly liked, no conflicts)
- **Cursor-tracking light spread** behind/around the card (C1)
- **Card parallax tilt** with cursor (C1) — merged with **rest-tilted → straighten-on-fill** (C4, rebuilt as focus-driven)
- **Ripple rings + dot grid + abstract lines** ambience (C5)
- **Brag stat** small, bottom placement (C5 — "4,500+ marketers already in")
- **Floating stat/feature tags** (C2 pins / C6 desk objects) with **parallax depth** (C6)
- **Staggered, faded, smooth element entrance** (C7 technique, minus the hand-drawn skin)
- **Guidance tags**: "you're here →" on the stepper, "most people start here" on Starter plan (C7 — re-skinned to match final visual language, not necessarily handwriting)
- **Focus → scene light** reaction (C8, extended from selection-only to focus-driven)
- **Animated image-side panel on load** (C2 morph/breathe)
- **Half-highlighted title** — abstract shape behind part of the heading (C10)
- **Password strength meter** (C3 — 4-tier lime fill, non-traffic-light)
- **Clean professional input styling** (C8), generous **white space** (C3)
- **Centered, onboarding-style signup flow** (C5/C6)

### Explicitly avoid
- Vertical scroll on the form (C3 dislike) — signup steps must fit the viewport
- Oversized heading treatment + heavy logo usage (C3 dislike)
- Raw/basic shadcn look (C3 dislike) — keep the styled pill-input language
- Everything else from C4 (poster split, ghost typography, torn-photo collage)
- Wave-1 concepts 12–19 wholesale

### Structural tension to resolve (→ Q3)
"Centered onboarding-style flow" (C5/C6) vs "animated left image panel" (C2) +
"light effect on the image side" (C8) — the latter two need a split layout.
Both can't live in one version; this is the natural axis to split the two finals on.

---

## 3. The 2 finals — LOCKED with Maalik (2026-07-14, revised same day)

**Count locked: exactly 2 variants (A + B).** The optional third candidates
("Pro Split" dark-split C8-DNA, and "Desk Canvas" light-centered C6-DNA) were
presented on the decision board and rejected. Element compositions below
approved as-is by Maalik — no moves/tweaks. Implementation starts only on
Maalik's explicit go.

**Decisions from Maalik's answer round:**
- Feedback items can reference multiple concepts — "minimal + white space" was liked
  in **both** C3 and C9. Traits are additive across variants, not 1:1 mapped.
- **Both finals are split-family** — but in **one of them, the signup flow renders
  centered onboarding-style** (à la C5: the split identity lives elsewhere/login,
  signup itself is a centered staged flow).
- **Final A = dark. Final B = light.** One dark final, one light final.
- Guidance tags = **clean glass chips** (professional re-skin, no Caveat handwriting).

### Revision round 2 (Maalik, same day) — flow contract changes

1. **Finals live OUTSIDE the exploration track** — standalone surface(s), separate
   from `/auth-concepts` and its ConceptSwitcher. Full flows included: login +
   signup (with profile fields) etc., not signup-only.
2. **Liquid Glass (C11) is parked, not dead** — excluded from this build round only.
3. **NO stepper. NO plan selection.** The 2-step plan→profile wizard is gone from
   the signup/login flow entirely. Signup = a single form (the old step-2 profile
   fields: Individual/Agency toggle, name/email or agency/admin email, phone,
   set/confirm password).
4. **Plan overview instead of plan selection**: signup shows a compact read-only
   overview of the plans, with a **"View more" button — placeholder redirect only,
   intentionally non-functional** for now.
5. Layouts confirmed: **A = split-family with centered onboarding-style signup**,
   **B = normal split view**.
6. **B's panel is state-reactive**: the split panel's content must change based on
   (a) **Individual vs Agency** selection and (b) **signup vs login** view. This
   extends the C8 "scene reacts to app state" DNA beyond focus-lighting.

Consequences: the "you're here →" stepper chip is dropped (no stepper);
"most people start here" repurposes onto the plan-overview card if anywhere.
`shared/formSpec` copy still sources field labels; `components/auth/signup/plans`
now feeds the read-only overview card, not a radiogroup.

### Revision round 3 (Maalik answers) — final contract

- **Mount**: ONE standalone route (e.g. `/auth-v2`) outside `/auth-concepts`, with a
  **dev-only variant toggle** to switch A ↔ B (same pattern as the nav-variant
  cycler — Maalik-only, hidden from users). Live `/auth` untouched.
- **Plan overview card shows the SELECTED plan, not a recommendation** — the user
  arrives at this page having already picked a plan upstream (pricing page). Plan +
  billing arrive via context/URL (e.g. `?plan=growth&billing=annual`; sensible
  default if absent). Card: plan name + price + 2–3 features + "View more"
  (placeholder, non-functional).
- **Reactivity**: B's split panel reacts to Individual/Agency + login/signup state.
  A stays ambient-static — its Individual/Agency toggle only swaps form fields.
- **Forgot password = link placeholder only** (no screen this round).
- **A's layout**: login = split view; signup = centered onboarding-style. B: both
  views split.

### Final A — "Dark Stage" (dark · signup centered onboarding-style)
Dark theme (C1) · **signup = centered onboarding-style staged flow** (C5/C6) ·
cursor-tracking light spread behind the card (C1) · card rests slightly tilted,
straightens as the user fills (C4→focus-driven) + subtle cursor parallax tilt (C1) ·
ripple rings + dot grid + abstract lines in the ambience (C5) · small brag stat at
the bottom (C5) · half-highlighted title (C10) · password strength meter (C3) ·
clean professional inputs (C8) · minimal, whitespace-generous composition (C3/C9) ·
staggered faded entrance (C7 technique).

### Final B — "Living Split" (light · true split signup)
**Light theme** · left panel = product image that **animates on load** (C2
morph/breathe) with **floating stat tags** drifting with cursor parallax (C2+C6) ·
**focusing a form field lights up the matching region/tag on the panel** (C8,
rebuilt focus-driven) · right side = clean, whitespace-generous form column
(C3/C9) · guidance glass chips "you're here →" / "most people start here" on
stepper & plans (C7 copy, glass-chip skin) · staggered faded entrance (C7) ·
password strength meter (C3) · half-highlighted title (C10).

Shared by both: 2-step signup contract from `shared/formSpec` + `components/auth/signup/plans`
(plan step → profile step), no vertical scroll, no heavy logo, mobile fallback
(effects degrade gracefully, panel hidden below `lg`), `prefers-reduced-motion`
respected (C7 already models this).

---

## 4. Remaining open questions (minor)

- **Q1.** Concepts 9 & 11 — 9's minimal/white-space DNA is now folded into both finals; Liquid Glass (11) fully out of the running?
- **Q2.** Do the finals replace `/auth` eventually, or land as concepts 20 & 21 in the exploration track first? *(Default: exploration track first.)*
- **Q3.** Password strength meter confirmed for both finals? *(Default: yes, both.)*

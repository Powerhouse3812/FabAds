# Generation targets — source doc

Maalik's handwritten notes (2026-09-08), transcribed and reconciled against
the actual code in `state/useWizard.ts`. This is the reference for: what can
be generated (§1), what each needs (§1/§10), what a source already carries
and what it can become (§2/§4), what actions exist on an asset or a whole ad
(§4/§7), and the Other Apps list he separately handed over (§11) — across
Studio and every module that feeds into it (Other Flows, Other Apps,
Catalogue/Assets).

Status: **mostly confirmed** — 2 items still open, tracked in "Still open"
at the bottom. Everything else on this page is settled.

---

## 1. The four targets — what each needs

| Target | Mode | Format | Angle+Concept / Approach | Entity (B/P/C) | Notes |
|---|---|---|---|---|---|
| **Ad** | required | required | required | required — but see §3 for how required varies by entity type | Aspect ratio: Auto (AI picks). Reference: optional. Script: Auto by default. |
| **Script** | — | needed, but only so it CAN become a Storyboard later (see §4) | required (angle+concept, or one Approach) | optional | |
| **Concept** | — | — | needs angle only (concept IS the thing being made) | optional | |
| **Storyboard** | — | required, **video only** | required | optional | Stays a separate card from Script (§5, resolved) — considered a merge, decided against. |
| **Social** (as a Mode) | — | — | different ONLY if entity selection is optional — the flow must be able to continue with nothing picked | optional | |

Code reference: `TARGET_SPECS` in useWizard.ts matches this table exactly
(`entityRequired` / `needsAngle` / `needsConcept` / `videoOnly` per target).

## 2. What a source already carries (decides whether Approach gets asked)

| Source | Carries angle? | Carries concept? |
|---|---|---|
| none / hook / script | No | No |
| angle | Yes | No |
| concept | Yes | Yes |
| framework | No — fixes section order only | No |
| storyboard | No (same as script — storyboard = script + visuals) | No |

If a source already carries everything the target needs, Approach is
skipped. Code reference: `SOURCE_CARRIES` in useWizard.ts.

## 3. Ad generation — entity-selection sub-flow

```
Ad generation:
  Mode, Format, Angle+Concept (or Approach), Script (Auto), Aspect ratio (Auto), Reference (optional)
  then, if the user selects an entity:
    Brand           → then Brand selection
    Product         → then Product
    Category        → then Category → Product optional — runs through the
                      Performance Ad mode specifically, not a mode of its own
                      (confirmed — shipped 2026-09-08: Performance Ad's card
                      now carries a "+ Category" tag + leads its desc with
                      "Category-wide" for exactly this reason)
    Product Shoot   → then Product
```

## 4. What can be made from what (source → reachable targets)

| Source | Reaches |
|---|---|
| none | Ad, Script, Concept, Storyboard |
| hook | Ad, Script, Storyboard, Concept |
| angle | Ad, Script, Storyboard, Concept |
| concept | same reach as angle (+ concept→concept only as a variation) |
| framework | Ad, Script, Storyboard, Concept |
| script | Ad, Concept |
| storyboard | Ad, Script, Concept, Storyboard (self, variation only) |
| **whole ad** (existing ad, not a `GenerationSource` value — handled as a flag) | **Create variation** (keep data, same flow pre-filled) or **change anything** (edit fields) — same flow either way. **Confirmed, build now:** a "quick variation" / "want to tweak" fork right at this point, wherever "generate variation" is clicked from ANY module — not just Studio — and for every asset target as well as whole-ad. See §7. |

Code reference: `VALID_SOURCES_BY_TARGET` + `isValidSourceForTarget` in
useWizard.ts. `isVariation` is a boolean flag, not a source value — matches
"whole ad" being handled separately above.

**Angle → Concept, resolved:** Angle is the strategic framing (e.g.
"before/after"). Concept is a specific creative execution built around an
angle — the same angle can be represented by several different concepts, and
the user picks one. "Approach" = angle × concept together. Matches
`ApproachRoute`'s doc comment in useWizard.ts ("Approach is nothing but angle
+ concept"). His notes add: if the source angle is for a Brand/Product/
Category, the entity selection carries through unchanged as "same flow" —
the "if it's just a random angle" continuation is illegible in the photo, so
that half is not transcribed, flagging rather than guessing it. Confirmed
intentional — the scratched-out line under "with angle" (his notes, page
7300) was unrelated, purposely discarded, not a decision to remove this
reachability.

## 5. Storyboard/Script relationship — RESOLVED

Confirmed 2026-09-08: kept as 2 separate cards, matching what shipped on
Studio Home today. The "can be merged with Script" note was conceptual, not
a build instruction.

## 6. Early entity-context ask — CONFIRMED, build now

Applies "on generating whole ad or any asset" (Maalik's words) — an early
with-entity vs. custom/no-entity toggle, ahead of the target-specific flow.
Placement not yet finalized — see "Entity-toggle placement" below; asked for
confirmation before wiring, to avoid guessing wrong on where it inserts.

## 7a. Variation fork — BUILT 2026-09-09, and the shape changed

Built, but **not** as the interstitial fork §7 below proposed. A precedent scan
(Midjourney's Vary vs. Remix, Linear's single quick-create, Figma's
zero-confirmation detach, GitHub/Vercel split buttons) came back consistently
against putting a modal on the fast path: "Generate variation" is trained by
every comparable tool to fire immediately, and Hick's Law is not the real cost
here — the modal interruption is. NN/g also rules out the obvious mitigation, a
"don't ask again" checkbox, for anything that spends credits.

So the fork is **two sibling rows in the menu it was already triggered from**,
not a new decision surface:
- "Forge more like this" — unchanged, fires immediately, lands on Configure.
- "Forge more — adjust first…" — same action, same lineage, same credits; the
  wizard keeps all four steps and stops at Step 2. The trailing ellipsis is
  what distinguishes them.

Mechanically it is `?tweak=1` (`FLOW_PARAM_TWEAK`), URL-borne like every other
piece of flow context so it survives a refresh and a shared link.
`variationTweak` on `WizardState` is the ONE documented opt-out of Rule 1 in
`resolveGenerationSteps`.

**A real defect surfaced while verifying this.** `creative-library`'s
`actions` list in `flowRegistry.ts` did not include `"generate-variation"`,
even though the Library's own ellipsis fires exactly that action.
`resolveFlowContext` rejects any action a module doesn't list, so **every
Library variation resolved to a null flow context**: no banner, no brand
carried over, no prompt carried over, and `isVariation` never set. It only
looked right because `outputActions.ts` hardcodes the `configure` slug — the
Rule-1 landing was the URL, not the rule. One-line fix; verified before/after
in the browser (the banner, Mamaearth, and a 4/3/2 Knowledge Base all appear
now where it previously showed "No brand / No product" and 0/0/0).

**Known nit, not yet fixed:** on the `tweak` path Step 2 shows the suggestion
band reading "not selected yet" while the carried-over brand is in fact already
selected. The band's copy needs to account for an entity that arrived with the
flow.

## 7. Variation fork placement (Q4, confirmed build-now)

"Generate variation" is a single, well-established action id
(`"generate-variation"`) reached from at least two independent entry points,
both of which already converge into the same wizard state:

- **Library** — an output card's ellipsis menu
  (`library/outputActions.ts`, `useOutputCardActions.tsx`) calls
  `varyActionUrl(output, "generate-variation")`.
- **Other Flows** — many flow modules offer it as one of their listed actions
  (`flows/data/flowRegistry.ts`'s `"generate-variation"` entry, used by
  concept, storyboard, trends, campaign-urls and others).

Both paths run through `flows/data/resolveFlowContext.ts`, which sets
`patch.mode = "create-variations"` on wizard state — this is the one place
that already unifies every "generate variation" trigger regardless of which
module it was clicked from. **Proposed insertion point:** the quick-
variation vs. want-to-tweak fork sits right here, before the wizard sets
`isVariation: true` and jumps to Configure — one fork, reused by both entry
paths, rather than duplicating it in Library and Other Flows separately. Confirm
this is the right spot before it gets built.

## 8. Entity-toggle placement (Q5, confirmed build-now)

Maalik already has the exact placement in mind and hasn't stated it yet —
this doc will get updated once he confirms or picks between his own answer
and a suggestion. Scope note: this only matters for FRESH generations
(Studio Home's Mode/Asset cards) — "generate variation" and other-flow
entry points already carry an implied entity from their source, so the
ambiguity this toggle resolves doesn't apply there. Claude's suggestion
pending in-chat: a "For a Brand/Product/Category" vs. "Custom (no entity)"
segmented toggle at the very top of Studio Home, above the Mode grid — the
earliest point in the flow, and it doesn't require touching Library/Other
Flows since those don't have the ambiguity.

## 9. Podcast — RESOLVED: a new Mode (8th), not a target

Maalik's answer: Podcast becomes its own Mode on the roster (alongside
Product Shoot / Brand Ad / Product Ad / Social / Performance Ad), not folded
into an existing target. What makes it need its own Mode rather than reusing
an existing one:
- **Avatar count is optional and unbounded** — 0, 1, or 2 avatars, and MORE
  THAN 2 is explicitly possible. No existing Mode has a variable speaker-
  count dimension; this is a new requirement shape.
- **Entity (Brand/Product/Category) is optional, majority-without** — same
  optionality shape as Social/Script/Concept/Storyboard, but Maalik expects
  most real usage to skip it (more editorial/generic content than
  brand-tied), which is a genuine usage-pattern note, not a hard rule.
- Approach/Concept still applies to Podcast the same as every other target/
  mode (per his original note, "Podcast — as an approach and concept").

**BUILT 2026-09-09, then gated.** The Mode card and the speaker-count field
both exist: `modes.ts` carries a `podcast` entry and
`studio-v4/components/PodcastSpeakersField.tsx` renders a 0-to-unbounded
stepper in Configure (gated on `studioMode === "podcast"`), with a per-speaker
avatar+voice picker reusing `brain/AvatarVoicePicker`. Per-speaker picks are
component-local state, deliberately NOT on `WizardState` — nothing downstream
consumes them yet.

Then Maalik's later call the same day: "podcast abhi coming soon daal do" — so
the card ships `available: false`. Flipping that one flag back to `true` is the
whole of shipping it; nothing else is stubbed.

## 10a. Per-Mode entity rules — RESOLVED 2026-09-09, now code

Maalik, verbatim: "Currently in every mode this B/P/C picker comes with
segmented button. But the correct flow is, it is mandatory to pick brands in
brand Ad or pick product in Product Ad or product shoot (multi select
products), and category in performance with product optional. And in social
they all are optional, either user can pick one or nothing from these 3. Same
goes for animated."

This supersedes the thin, admittedly-unreconciled table in §10 below. It now
lives as DATA on each `ModeOption.entity` (`ModeEntityRule` in `modes.ts`), not
as prose:

| Mode | Tabs offered | Mandatory | Notes |
|---|---|---|---|
| Brand Ad | Brand only | Brand | |
| Product Ad | Product only | Product | |
| Product Shoot | Product only | Product | **multi-select** |
| Performance Ad | Category + Product | Category | product optional, both set at once |
| Social | all three | none | "one or nothing" |
| Animated AI | all three | none | same shape as Social |
| Custom | all three | none | |
| Podcast | all three | none | card is `available: false` for now |

**This forced the Step-2 XOR invariant to be relaxed** — and that is the one
consequence to keep in mind when reading older comments. `brandId` /
`productId` / `categoryId` used to be a strict XOR (picking one cleared the
other two, re-implemented by hand in each of Step2Product's three handlers).
Two of the rules above are impossible under it: Performance Ad needs a category
AND a product simultaneously, and Product Shoot needs several products. So:

- The invariant is now **"only the kinds the active Mode offers may be set"**.
  XOR still holds for every Mode that names no coexisting kinds — Social's "one
  or nothing" behaves exactly as before.
- `entitySelectionPatch()` (useWizard.ts) is now the ONE place that decides
  what a selection clears. Don't hand-roll the clearing again.
- `productIds: string[]` was added for the multi case. `productId` stays the
  PRIMARY product and is always `productIds[0]` when the set is non-empty, so
  the rail, Configure and the credit formula keep reading one product and never
  see an empty one on a multi-select shoot.
- `isEntityRuleSatisfied()` is what gates Continue.
- `?studioMode` and `?scope` are now URL-synced, and this is load-bearing:
  `studioMode` had never been in the URL, so before this every per-Mode rule
  (which tabs, what's mandatory, multi-select, whether step 0 is offered)
  silently reverted to the no-rule default on a refresh or a shared link.
  `?products` carries the multi-select for the same reason.
- `switchTab` was clearing entities too, not just the pick handlers — it wiped
  Performance Ad's category on the walk to the Product tab, before any product
  was chosen. All 10 write sites now go through `entitySelectionPatch`.

## 11a. Approaches — 6 for video, "Auto" replaces "From scratch" (2026-09-09)

Maalik: "Add 1 more approach to increase the count to 6. And remove from
scratch, instead Add auto. and keep it last 6th in order."

Video now offers, in render order: UGC Video · Create Variations · Image to
Video · B-Roll · **Product Demo** (new) · **Auto** (last).

- **Auto** — "Genie picks the approach from your brief and the entity." It
  takes the format-agnostic catch-all slot `scratch` held, in BOTH formats, and
  is `INITIAL_STATE.mode`, so it is the default selection.
- **`scratch` is retired, NOT deleted.** It is still set programmatically by
  the `generate-from-url` flow and by genieRunStore's mode fallback; it is only
  absent from `APPROACHES_BY_FORMAT`. Its "you drive everything" job is now
  covered twice — the "Build custom" tab on this very step, and the Custom Mode
  on Studio home — which is what freed the slot.
- **Product Demo** — product-in-use footage with NO creator on camera. That
  clause is what separates it from UGC Video (creator-led, script-first) and
  B-Roll (cutaway meant to sit under primary content). Video-only, no
  sub-types yet, defaults to the educational angle + detail-macro concept.
- **NINE maps are keyed by approach id, and only THREE are type-checked.** The
  full list, established 2026-09-09: `Mode` union, `MODE_LABEL`
  (`Record<Mode>`, checked) and `APPROACH_SUBTYPES` (`Record<Mode>`, checked)
  — then six the compiler cannot catch: `DEFAULTS` (Partial),
  `APPROACHES_BY_FORMAT`, `ALL_MODES`, AlphaStep3Configure's local
  `MODE_LABEL`, `APPROACH_LABELS`, and `THEME_BY_ID` in `studio-visuals.ts`.
  Miss one and the approach renders blank, unoffered, or with a random preview
  clip. **Proof it bites:** `product-demo` and `auto` shipped in d83a370
  missing from `THEME_BY_ID` and drew random videos until it was caught on
  2026-09-09. Consolidating these is its own cleanup.

## 11c. Approach + app changes — 2026-09-09 (owner)

Owner: "bg remover ko approach se htake, apps me hi rakho, approach me new
approach add krdo koi" + "approach ka UI bhi thik krna pdega, uspe angle ke
tags hone chahiye, and concept ka style name."

- **BG Remover left the Approach step and is now a LIVE Other App.** It was
  already present in `appRegistry.ts` as a coming-soon stub, so it was
  promoted in place — a second entry under the same key would have been
  silently shadowed by `getApp()`'s `.find()`. Its sidebar TOOLS entry had
  already been removed separately, so the old three-way split (approach + nav
  module + app) is fully resolved: the registry is the single home.
  A new `unit: "image"` was added to the cost contract so the breakdown reads
  "1 image", not "1 shot".
- **`genieRunStore.ts` keeps a DUPLICATE app-rate table** whose comment still
  claimed `appRegistry.ts` "doesn't exist yet". Every new app must be priced
  in BOTH places or its credits silently disagree. Comment corrected; the
  duplication itself is still outstanding.
- **Lifestyle Scene** is the replacement approach — image-only, so Image is
  back to 4 offered and Video stays at 6. Product shown in a real setting, in
  use; distinct from Create Variations (iterates an existing creative) and
  Product Demo (video, no creator). Defaults to the `lifestyle` angle +
  `c-morning-ritual`.
- **Approach cards now show what they will actually apply** — one mono chip
  row per card reading off `autoFillForApproach`, the same source Configure
  reads, so the card and the next step cannot drift. `auto` and `resize` show
  "Genie decides" rather than an empty chip. Sub-typed approaches render
  dashed chips, because picking a style can change them — dashed, not greyed,
  since greyed would read as locked.
- Reported, not changed: `StudioV4.tsx`'s `canContinue` whitelist is still
  `mode === "scratch" || "ugc-video"`, now stale for 7 of the 9 approaches.
  Pre-existing, owner's call.

## 11d. Trends is a source of trending ASSETS — 2026-09-09 (owner)

Owner: "Script from trend ka matlab tha, we get trending angles and trending
ads and trending hooks, and other assets in news… ki Trend se bhi chise aa
skti hai."

- `script-from-trend` was mis-named: it promised a Script but was hardcoded
  `source: "none"`, `targets: ["ad"]`. It now MEANS "Use this trend's angle" —
  `source: "angle"`, reaching all four targets — which is what the resolver
  already did (`patch.angleDescription = ref.trendAngle`).
- It could **not** be renamed away or deleted: `TrendActions.tsx` hardcodes
  all three trend action ids, and `resolveFlowContext` rejects any action a
  module doesn't list, producing a null context and a bare wizard. Same class
  of bug as the Creative Library `generate-variation` omission (§7a).
- **`use-hook` is now offered on Trends.** It is `requiresAnalysis`, so
  `trendRef()` sets `analysed: Boolean(t.hook)` — NOT a blanket true, because
  `trendAngle` falls back to headline/excerpt precisely when no hook exists.
  Gating is per-action, so a hookless trend still offers everything else, and
  it carries a `blockedReason` so the row doesn't claim the user skipped an
  "analysis" step Trends does not have.
- Deliberately NOT offered on Trends: `use-script` / `use-concept` /
  `use-storyboard` / `use-framework` (a feed carries a headline, excerpt,
  angle and sometimes a hook — not an analysed script, saved concept, shot
  list or detected framework), and `reference-for-new-ad` (attaches as
  `source: "library"` and seeds neither angle nor prompt — mislabelled and
  half-wired).

## 11e. Framework — never generated, and now never hand-created either

Owner: "Framework abhi bi generate nahi denge, agar kahi bola to galti bol
diya hoga. only save from video sage hi hai abhi bi."

Audited 2026-09-09: the ruling already held everywhere that matters —
`framework` is absent from the `GenerationTarget` union and from
`TARGET_SPECS`, and no flow action claims to produce one. **One contradiction
was found and fixed:** `frameworksType` declared `addForm` + `buildAdded`,
which put a generic "New Framework" button on the Catalogue list page. Both
keys removed, so the only path to a Framework is `SaveFrameworkDialog` in
Video Sage. Avatars already omit those keys for the same reason, so this
follows existing precedent rather than inventing one.

## 11f. Storyboard is a first-class asset — 2026-09-09

Owner: "Storyboard is an asset like other, so if doesn't have one, then add
one… technically kahi bhi pde ho, bs user ko genie me dikhado."

`CatalogueType` gained `"storyboards"` (the 14th type, in the `creative`
group), with 9 seeded records carrying 3–5 scenes each, a registered asset
type and routes. Genie's Assets sub-nav derives from
`groupedAssetTypes()`, so it appeared with no nav edit. This is what unblocks
the Library save path — previously `StoryboardsGeneratedTab` passed
`canSaveToCatalogue={false}` purely because no such type existed, leaving a
visible dead end.

## 11g. Defects the 2026-09-09 review gate caught, and what they teach

The batch failed its first adversarial gate. Every finding below is fixed; they
are recorded because each is a REPEATABLE trap in this codebase, not a one-off.

- **A spread into `wizard.patch` silently drops unknown keys.** Step 3 spread
  `autoFillForApproach`'s `{angleId, conceptIds}` straight into the patch, but
  the state field is `selectedConceptIds` — no excess-property check applies to
  a spread, so **no approach had EVER applied its concept**, including
  long-standing ones. The card chips added this batch are what finally made it
  visible ("Morning Ritual" on the card, "CONCEPT: None" one step later). Both
  commit paths now go through one `approachPatch` helper. **Never spread a
  foreign-shaped object into `patch()`; map the fields.**
- **A UI-only gate is not a gate.** `use-hook`'s analysis requirement was
  enforced in `FlowModuleDetail` only, so a hand-typed URL sailed past it and
  the banner claimed a hook that did not exist. `resolveFlowContext` now
  refuses an analysis-gated action on an unanalysed ref, degrading to plain
  Studio. **Gate in the resolver, decorate in the UI.**
- **A second hardcoded action list.** `TrendActions.tsx` kept its own list of
  "exactly three" trend actions, so the new fourth appeared in the Other Flows
  hub but never on the Trends feed users actually use. Two-way hazard: an id
  missing there is a hub-only action; an id there the module doesn't list is a
  rejected URL and a bare wizard.
- **A carrier field must be chosen, not assumed.** The hook rides in `prompt`,
  NOT `angleDescription` — a hook satisfies neither angle nor concept
  (`SOURCE_CARRIES`), so filing it as the angle would silently answer the
  question Step 3 is about to ask. The trend-angle seed in Configure is now
  gated on the ACTION, not just the module, for the same reason.
- **Raw seed arrays vs `resolve()`.** `CatalogueDetailPage` looked assets up in
  raw imported arrays, so anything saved in-session 404'd on its detail route
  even though it appeared in the list. Every type now resolves through
  `def.resolve()` (seed + session-added + duplicated, minus deleted).
  **`resolve()` is the only correct read.** Seven other section views still use
  raw `.find()` — latent only because those types have no save flow yet.
- **`addForm` implies a creatable asset.** Storyboards declared it with
  `scenes: []` and no field to ever enter a scene, manufacturing a permanently
  broken asset — the exact trap `frameworksType` documents. Both now omit it.
- **A save must respect a delete.** All four save paths returned a cached id
  without checking the delete tombstone, so save-after-delete was a silent
  no-op behind a success toast.
- **The frozen clock.** `NOW` is noon and ISO dates parse at midnight, so
  `Math.round` made a just-saved asset read "Yesterday". `Math.floor` moved 23
  seeded labels, every one toward the truth.
- **Structure is the substance.** A storyboard's scenes and a framework's
  sections rendered nowhere on the finder surface while the card grammar
  advertised "5 scenes". One shared component now serves both surfaces so they
  cannot drift.

## 10. Per-Mode required/optional (from his notes + modes.ts)

**SUPERSEDED by §10a above** — kept only because the Product Shoot
`category: "asset"` observation in it is still unreconciled.

| Mode | Entity (B/P/C) | Notes |
|---|---|---|
| Brand Ad | optional-ish per §3's tree, but Ad's `entityRequired` is true at the target level — picking one of Brand/Product/Category is how that requirement gets satisfied | |
| Product Ad | same as Brand Ad, entity = Product | |
| Product Shoot | **Product**, specifically — not Brand or Category | `category: "asset"` in the code (StudioAlpha.tsx `startWizard`) rather than "ad" — flagging this as a real code detail I haven't fully traced against §1's Ad-target row; don't treat this row as 100% reconciled with the target-level table yet. |
| Social | optional — and per his note (§5, page 7296), Approach/Angle/Concept only differ FROM the Ad case when entity is left blank; the flow must be able to continue with nothing picked | |
| Performance Ad | optional, but this is where Category-level ads run (§3, resolved) | |
| Podcast (new, §9) | optional, majority-without per his answer | avatar count 0/1/2+ is the other free variable |

This table is thinner than §1's target table — it's Mode-level, §1 is
target-level (Ad/Script/Concept/Storyboard), and they're different axes that
intersect (e.g. Brand Ad and Product Ad are both target=Ad, different Mode).
Flag if more per-Mode detail is needed than this.

## 11. Other Apps — additions from your list (page 7294)

Not part of the generation-target logic above, but you asked for this list
specifically saved too. Cross-checked against the live `GENIE_APPS` registry
(`apps/data/appRegistry.ts` — 22 entries, **4 live + 18 coming-soon** as of
2026-09-10, counted from the file. It read 8 live on 2026-09-09, after BG
Remover was promoted from a stub, see §11c; the owner then cut the launch set
to four — Translate Videos, Product Placement, Face Swap, Change Metadata —
and everything else, BG Remover included, went back behind a coming-soon tag
with its declared flow kept dormant) and other places the app already has
similar capability:

**Already live, matches an existing app:** Video translator (Translate
Videos), Video/Image upscale (Upscale Video — registry has no separate
still-image upscaler), Speech cleanup (Speech Cleanup), PDF/PPT to video
(PPT/PDF to Video).

**Was under a DIFFERENT system than Other Apps — RESOLVED 2026-09-09 by
Maalik's "one home" call (see §11b):**
- Remove image bg → was `bg-remover`, a TOOLS-group sidebar module. Now an
  Other App; **removed from the sidebar group**, route kept alive.
- Object remover → same treatment, same reasoning (identical class of one-shot
  stub). Inferred extension — Maalik named only BG Remover.
- Image resizer → added as the `resize-image` app. The `"resize"` Approach id
  in `studio-v4/data/approach-subtypes.ts` **stays** — it does a related but
  different job inside a generation flow, so this is not a duplicate.
- Swap avatar → **NOT added.** The live `face-swap` app already does exactly
  this ("swap an avatar's face onto any video"), which is the distinction
  between "swap" and Avatar Shots' presenter-casting. A new entry would have
  been a near-duplicate.

**Coming-soon already, name overlap worth flagging:** "Video Podcast" is
already a coming-soon app in the registry. §9's Podcast is a Studio **Mode**
(for generating an ad/creative that IS podcast-style), not this app — but the
shared name is worth double-checking isn't meant to be the same feature
before both get built independently.

**Genuinely new — SHIPPED 2026-09-08/09 as coming-soon registry entries:**
Add video caption (`add-video-captions`), Change metadata (`change-metadata`),
Prompt generator/Refine (`prompt-generator`), Thumbnail maker
(`thumbnail-maker`). Stub cards only — no fields, cost or screen yet, same as
every other coming-soon app. Built in a parallel session and adopted here by
patch rather than rebuilt.

**Unclear, need your read:**
- "Animated AI" — no existing match, and the phrase alone isn't enough to
  scope what it does.
- "Retouch" — your photo shows this one crossed out; reading that as
  discarded, not an addition.
- "URL to Ad" — sounds like it may already exist as an Other Flows action
  (`campaign-urls` module, `generate-from-url` action, already wired) rather
  than needing a new Other App — flagging the overlap rather than assuming.
- "Storyboard" listed here — this is a generation target (§1), not an Other
  App; assuming it's listed for cross-reference, not as its own app.

**Added to `appRegistry.ts`:** the 4 "genuinely new" entries above, plus
`bg-remover`, `resize-image` and `object-remover` from the one-home merge — 7
new entries in total. Everything else in this section is reconciliation only:
the already-live matches, the name-overlap flag, and the "unclear" list below
were NOT built.

## 11b. Other Apps has ONE home (2026-09-09)

Maalik: "Remove other apps from sub nav — keeping only on studio, below modes.
and merge them together." So:
- Other Apps is **gone from Genie's sidebar sub-nav**. The `/iq/genie6/apps`
  route stays alive (this repo's convention for retired nav entries).
- It renders only as the "Other Apps" section on Studio home, below the Mode
  cards, showing the **full roster** — live first, coming-soon badged — with
  the "View all" link removed. A subset there would have left the rest
  reachable by URL only, now that the sub-nav entry is gone.
- One-shot tools were pulled OUT of the sidebar TOOLS group into the registry,
  so a utility lives in exactly one place. Video Sage and Copilot stay in the
  sidebar — they are full modules, not one-shot tools.

This one-home merge is also why `bg-remover` already existed in the registry
as a coming-soon stub when §11c came to move it out of the Approach step —
that work PROMOTED the existing key rather than adding a second one, which
`getApp()`'s `.find()` would have silently shadowed.

**When asking "does app X exist", grep `appRegistry.ts` — never quote this
page.** A line here claiming "none of these have been built" survived past the
build and caused a 2026-09-09 audit to report the exact opposite of the code.

---

## Still open

1. **Product Shoot's `category: "asset"` vs §1's Ad-target row (§10)** — a
   real code detail (StudioAlpha.tsx) not yet reconciled against the target
   table above it. Untouched by the 2026-09-09 work.
2. **"URL to Ad" vs. the existing Campaign-URLs flow action (§11)** — same
   feature or a genuinely separate new app? Still unanswered.
3. **"Video Podcast" (existing coming-soon app) vs. Podcast (§9, the Mode)** —
   still two systems carrying one name. Less urgent now that the Podcast Mode
   ships `available: false`, but it will bite whenever that flag flips.
4. ~~**Step 0 is built but not yet wired.**~~ **WIRED 2026-09-09** — for the
   four entity-optional Modes ONLY (Social, Animated AI, Custom, Podcast), per
   Maalik's call, since the four that mandate an entity have no legal "custom"
   answer. Slug `/scope`, `StepNumber` widened to `0|1|2|3|4`, and choosing
   "Custom" removes Step 2 entirely. Three latent zero-falsy bugs had to be
   fixed to get there — `SLUG_TO_STEP[x] &&`, `params.step && …` and
   `if (!patch.step)` all silently discarded a legal step 0 — plus the
   step-plan `useMemo` was missing `studioMode`/`entityMode` from its deps, so
   the plan went stale and the skipped-step redirect bounced past step 0.
   Historical note on the original blocker, kept because the shape still
   applies to any future step insertion: `screens/Step0Entity.tsx` exists to
   the confirmed placement (immediately after the Mode pick), with the
   suggestion band as highlight-only and no "remember my choice". It is NOT
   in the step machine yet: `StepNumber` is a closed `1|2|3|4` union and both
   `startWizard` and `startAssetWizard` hardcode `step: 1`, so wiring it means
   widening those types, adding the step to `resolveGenerationSteps`, a
   `renderStep` branch, and the slug map. Also worth re-reading §10a first —
   now that each Mode declares its own mandatory entity, step zero's
   with-entity-vs-custom question is genuinely redundant for the five Modes
   that mandate one, and only earns its place on Social / Animated AI /
   Custom / Podcast.
5. ~~**Multi-select UI for Product Shoot.**~~ **DONE 2026-09-09** — reused the
   existing `bulkMode` UI (square badges, Hero pill on the primary, outcome
   bar) rather than building a second multi-select, forking only the state so
   it writes `productIds`, which is the field `isEntityRuleSatisfied` gates on.
   Survives a refresh via `?products`.

### Resolved 2026-09-09
- §8 entity-toggle placement: **step zero, straight after the Mode pick.**
- §9 Podcast: built, then gated to coming-soon.
- §11 "Animated AI": **it is a Mode, not an app** — "same as Social, but
  animated video rather than reality type", the "main Hulk hoon re" reel format
  that brands, influencers and performance advertisers all built creative on.
  Built as the 5th Mode card, entity-optional like Social.
- §11 "Retouch": dead. "Retouch is nothing."
- §11 "Swap avatar": **already covered by the live `face-swap` app** ("swap an
  avatar's face onto any video") — deliberately not duplicated.
- §11 "Remove image bg" / "Image resizer": both now Other Apps
  (`bg-remover`, `resize-image`), and `bg-remover` + `object-remover` were
  REMOVED from the sidebar TOOLS group — Other Apps is the single home for
  one-shot tools now. Routes kept alive. The Step-3 `"resize"` Approach stays
  where it is; it does a different job inside a generation.
- Other Apps left the Genie sub-nav entirely and lives only on Studio home,
  below the Modes, now showing the FULL roster (live first, coming-soon badged)
  with no "View all" link.
- Custom is back as the 8th Mode, live this time rather than the
  `available: false` stub that was dropped on 2026-09-08.

Also flagging, not from a question but from reading the photos: two lines
under "with Hook" (page 7298) are scribbled out illegibly — assuming
intentionally discarded, not acted on.

## Resolved (2026-09-08)

- §3 Category routing → Performance Ad (shipped same day).
- §5 Storyboard/Script stay 2 separate cards (no change from shipped state).
- §7 variation fork: confirmed build-now, placement proposed (one shared
  insertion point in `resolveFlowContext.ts`), pending his go-ahead.
- §4 angle→concept reachability: confirmed intentional, stays as coded (was
  split across two sections in this doc — merged into one entry per Maalik's
  "with angle ka data 2 baar hai, merge them"). The crossed-out 4th line
  under "with angle" (page 7300) was purposely scribbled out and unrelated —
  ignore it.
- §8 entity toggle: confirmed build-now, placement pending his answer.
- §9 Podcast: confirmed as a new 8th Mode with a variable avatar-count
  field, majority-without-entity — not yet built, pending go-ahead.

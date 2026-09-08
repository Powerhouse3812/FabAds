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

**Not yet built** — logged here as a confirmed decision; Claude should ask
before adding the actual Mode card + avatar-count field, since this is new
scope, not a copy-edit.

## 10. Per-Mode required/optional (from his notes + modes.ts)

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
(`apps/data/appRegistry.ts`, 7 live + 8 coming-soon) and other places the app
already has similar capability:

**Already live, matches an existing app:** Video translator (Translate
Videos), Video/Image upscale (Upscale Video — registry has no separate
still-image upscaler), Speech cleanup (Speech Cleanup), PDF/PPT to video
(PPT/PDF to Video).

**Already exists, but under a DIFFERENT system than Other Apps — flagging so
a duplicate doesn't get built:**
- Remove image bg → already `bg-remover`, a TOOLS-group sidebar module
  (`src/components/sidebar/modules.ts`), currently "Soon."
- Image resizer → already `"resize"`, one of Step3Approach's Approach ids
  (`studio-v4/data/approach-subtypes.ts`), not an Other App.
- Swap avatar → close to the live `avatar-shots` app (Avatar Shots), but
  "swap" reads like changing which preset avatar is used rather than
  casting one onto footage — **unclear if this is the same feature or a
  distinct one, asking rather than assuming.**

**Coming-soon already, name overlap worth flagging:** "Video Podcast" is
already a coming-soon app in the registry. §9's Podcast is a Studio **Mode**
(for generating an ad/creative that IS podcast-style), not this app — but the
shared name is worth double-checking isn't meant to be the same feature
before both get built independently.

**Genuinely new, no existing match found:** Add video caption, Change
metadata, Prompt generator/Refine, Thumbnail maker.

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

**Not yet added to `appRegistry.ts`** — this section only captures/reconciles
your list; none of these have been built as new registry entries yet.

---

## Still open

1. **Entity-toggle exact placement (§8).** Maalik has a specific answer in
   mind, not yet stated.
2. **Podcast** (§9) — confirmed as a new Mode, not yet built; waiting on
   go-ahead to add the card.
3. **Product Shoot's `category: "asset"` vs §1's Ad-target row (§10)** — a
   real code detail (StudioAlpha.tsx) not yet reconciled against the target
   table above it.
4. **"Animated AI" (§11)** — no existing match, too little to scope from the
   name alone.
5. **"Swap avatar" vs. the live Avatar Shots app (§11)** — same feature or
   different?
6. **"URL to Ad" vs. the existing Campaign-URLs flow action (§11)** — same
   feature or a genuinely separate new app?
7. **"Video Podcast" (existing coming-soon app) vs. Podcast (§9, new Mode)
   (§11)** — same underlying idea surfacing in two different systems, or two
   unrelated things that happen to share a name?

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

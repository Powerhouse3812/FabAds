import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Film,
  Lock,
  Maximize2,
  Mic,
  Package,
  Repeat,
  Scissors,
  Sparkles,
  Target,
  Video,
  Wand2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { HeroHeader } from "../components/HeroHeader";
import { resolveGenerationStepsForState } from "../state/useWizard";
import type {
  ApproachRoute,
  Mode,
  UseWizardReturn,
  WizardState,
} from "../state/useWizard";
import {
  APPROACH_SUBTYPES,
  APPROACHES_BY_FORMAT,
  autoFillForApproach,
  hasSubTypes,
} from "../data/approach-subtypes";
import {
  getAngleVisual,
  getApproachVisual,
  videoForSeed,
} from "../data/studio-visuals";
import { PreviewVideo as PreviewVideoBase } from "../components/PreviewVideo";
// ANGLE_CHIP_LABEL is PromptReferenceBar's one label map for the 20 catalogue
// angle ids (Step 4's chip + ConceptAngleRail both already read off it) —
// reused here instead of a third copy so the Custom route's angle grid can
// never drift from what Configure/Overview show for the same id.
import { ANGLE_CHIP_LABEL } from "../components/PromptReferenceBar";
import { CONCEPTS, getConceptVisuals } from "../data/concepts";

interface Step3Props {
  wizard: UseWizardReturn;
  onAdvance: () => void;
  onBack?: () => void;
}

interface ApproachMode {
  id: Mode;
  Icon: React.ElementType;
  title: string;
  desc: string;
}

/**
 * §5 lists SEVEN approaches and §1 says they "already exist and work — do not
 * rebuild them", so all seven stay here.
 *
 * §21.2's fix for the on-screen contradiction is FILTERING, not deletion, and
 * its own two examples prove which way each one filters: "Format=Image still
 * offers *Image to Video*" (so Image to Video is video-only) and "Format=Video
 * still offers *BG Remover* and *Resize*" (so those two are image-only). That
 * mapping lives in APPROACHES_BY_FORMAT — see its doc comment.
 *
 * An earlier pass read §8's "BG Remover, Resize, Create Variations and Image to
 * Video are tools/apps — not approaches" as an instruction to delete all four
 * and hand off to Other Apps. That produced two worse problems: none of the
 * four is among §8's locked 15 apps, so the hand-off was a dead end and the
 * capabilities existed nowhere; and Format=Image collapsed to a single offered
 * approach, i.e. a step that asks a question with one answer. §8's line governs
 * how the Other Apps registry is built, not what this step offers.
 *
 * A-12.71 (Maalik, MOM 06-05): the Approach step is VISUAL. Each card leads
 * with an autoplay-loop video preview (getApproachVisual) instead of just an
 * icon. The lucide icon survives as a small glass badge on the poster. Modes
 * that branch (ugc-video, create-variations, image-to-video) reveal a "Choose a
 * style" row of sub-type cards instead of advancing immediately; the rest
 * advance on click.
 *
 * Genie 2.0 (owner ruling, 2026-09-08, verbatim): "Approach is nothing but
 * angle + concept", and on what happens to these seven: "ya to approach se
 * select krle, ya custom krke, angle + concept select krle. same screen/step
 * pr hona chahiye ye." So this step is now ONE screen with TWO routes to the
 * same answer — Preset (below, unchanged) or Custom (angle + concept picked
 * directly, further down). The seven are NOT touched by this — they are one
 * of the two routes, not a rival concept to it. See `RouteToggle`,
 * `CustomApproachSection` and the `needsAngle`/`needsConcept` plumbing off
 * `resolveGenerationStepsForState` further down for the rest of the change.
 */
const ALL_MODES: ApproachMode[] = [
  {
    id: "ugc-video",
    Icon: Mic,
    title: "UGC Video",
    desc: "Avatar-led talking-head, script-first.",
  },
  {
    id: "create-variations",
    Icon: Repeat,
    title: "Create Variations",
    desc: "Iterate on existing creatives — keep layout, colors, or copy.",
  },
  {
    id: "image-to-video",
    Icon: Video,
    title: "Image to Video",
    desc: "Animate a static image — subtle motion or full AI.",
  },
  {
    id: "broll",
    Icon: Film,
    title: "B-Roll",
    desc: "Cutaway footage to layer with primary content.",
  },
  {
    id: "product-demo",
    Icon: Package,
    title: "Product Demo",
    // The desc has to earn its place against its two neighbours: UGC Video is
    // creator-led and script-first, B-Roll is footage meant to sit UNDER
    // something else. "No creator on camera" is the line that separates this
    // from both, so it stays in the copy rather than the code comment.
    desc: "Product in use — features and angles, no creator on camera.",
  },
  {
    id: "bg-remover",
    Icon: Scissors,
    title: "BG Remover",
    desc: "Strip backgrounds from product shots.",
  },
  {
    id: "resize",
    Icon: Maximize2,
    title: "Resize",
    desc: "Reformat to platform aspect ratios.",
  },
  {
    id: "scratch",
    Icon: Wand2,
    title: "From scratch",
    desc: "Full flow — prompt, references, angle, model, output count.",
  },
  // Maalik (2026-09-09): replaces "From scratch" in the grid and stays LAST.
  // The two are near-opposites — scratch meant "you drive everything", Auto
  // means "Genie decides" — and scratch's job is now covered twice over by
  // the "Build custom" tab on this step and the Custom Mode on Studio home,
  // which is what freed the slot. Kept last because it is the fallback you
  // reach for after reading the named approaches, not ahead of them.
  {
    id: "auto",
    Icon: Sparkles,
    title: "Auto",
    desc: "Genie picks the approach from your brief and the entity.",
  },
];

/** Path owned by the Apps UI agent (OtherApps.tsx). Not a route I own — just
 *  a Link target, per §6/§8's hand-off for the four removed approaches. */
const OTHER_APPS_PATH = "/iq/genie6/apps";

/** Every catalogue angle id the Custom route can offer — derived from
 *  PromptReferenceBar's ANGLE_CHIP_LABEL (its keys ARE the 20 ids) instead of
 *  a duplicated literal array, so this grid can never list an id that map
 *  doesn't know how to label. */
const ANGLE_IDS = Object.keys(ANGLE_CHIP_LABEL);

/** Shared autoplay-loop video preview (muted + playsInline required for
 *  autoplay). Poster covers slow loads. preload="metadata" keeps it cheap —
 *  the pool is ~8 URLs so the browser caches across every tile. */
function PreviewVideo({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const { poster, video } = getApproachVisual(seed);
  return <PreviewVideoBase src={video} poster={poster} className={className} />;
}

/**
 * SingleApproachCard — the §21.2 "don't ship a one-card grid" handling. Wide,
 * asymmetric row (preview left, copy + CTA right) rather than a grid cell, so
 * it visibly reads as "here is your one path", not "the grid is broken".
 * Explains WHY it's the only option and where the other four approaches went.
 */
function SingleApproachCard({
  mode,
  selected,
  onPick,
}: {
  mode: ApproachMode;
  selected: boolean;
  onPick: () => void;
}) {
  const Icon = mode.Icon;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "v3-glass-card group flex flex-col overflow-hidden rounded-2xl text-left transition-all sm:flex-row",
        selected
          ? "ring-2 ring-primary/40 shadow-[0_8px_32px_rgba(195,235,66,0.18)]"
          : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-auto sm:h-auto sm:w-56 sm:shrink-0">
        <PreviewVideo
          seed={mode.id}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent sm:bg-gradient-to-r" />
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white backdrop-blur-sm">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        {selected && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-4 py-4 sm:px-5">
        <span className="text-[14px] font-bold text-foreground">{mode.title}</span>
        <span className="text-[12px] text-muted-foreground">{mode.desc}</span>
        <span className="mt-1 text-[11px] text-muted-foreground/80">
          The only approach for this format — the full custom flow covers
          everything a still image needs. UGC Video and B-Roll are motion-only.
        </span>
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground">
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

/**
 * RouteToggle — the two routes to the same answer (owner ruling, verbatim in
 * useWizard.ts's `ApproachRoute` doc). Segmented control per DS v1.2: track
 * `bg-muted` (this file's screens use plain shadcn tokens, not the g6-*
 * variant tokens — `bg-muted` is the real class the rest of Step3Approach
 * already uses for a recessed surface), active segment `bg-primary` +
 * `text-primary-foreground`. Only rendered when BOTH angle and concept are
 * being asked — a preset bundles both, so it has nothing to offer once the
 * source has already narrowed the ask to just one of the two (see
 * `needsAngle`/`needsConcept` below).
 */
function RouteToggle({
  value,
  onChange,
}: {
  value: ApproachRoute;
  onChange: (v: ApproachRoute) => void;
}) {
  const options: { id: ApproachRoute; label: string }[] = [
    { id: "preset", label: "Pick a preset" },
    { id: "custom", label: "Build custom" },
  ];
  return (
    <div
      role="tablist"
      aria-label="How do you want to set the approach?"
      className="inline-flex w-fit items-center gap-0.5 self-start rounded-full bg-muted p-0.5"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * AngleGrid — Custom route's angle picker. §5 "Angle cards need real visual
 * weight" (they were being skipped because Concepts carry images and Angles
 * didn't) — same fix ConceptAngleRail already applied to the Configure-step
 * chip: an autoplay-loop video tile per angle, not a text pill. Single-select.
 */
function AngleGrid({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
      {ANGLE_IDS.map((id) => {
        const active = selectedId === id;
        const label = ANGLE_CHIP_LABEL[id] ?? id;
        const v = getAngleVisual(id);
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={active}
              className={cn(
                "v3-glass-card group relative block aspect-[4/5] w-full overflow-hidden rounded-xl text-left transition-all",
                active
                  ? "ring-2 ring-primary/40 shadow-[0_8px_32px_rgba(195,235,66,0.18)]"
                  : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
              )}
            >
              <PreviewVideoBase
                src={v.video}
                poster={v.poster}
                className="transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 px-2 pb-1.5 pt-5">
                <span className="line-clamp-1 text-[11px] font-semibold leading-tight text-white">
                  {label}
                </span>
              </span>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * ConceptGrid — Custom route's concept picker. Multi-select, mirrors
 * ConceptAngleRail's concept tile (video preview + name + 1-line desc) so the
 * visual language matches the identical picker that already exists inside
 * the Configure-step "Concept" chip.
 */
function ConceptGrid({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
      {CONCEPTS.map((c) => {
        const active = selectedIds.includes(c.id);
        const v = getConceptVisuals(c);
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onToggle(c.id)}
              aria-pressed={active}
              className={cn(
                "v3-glass-card group flex h-full w-full flex-col overflow-hidden rounded-xl text-left transition-all",
                active
                  ? "ring-2 ring-primary/40 shadow-[0_8px_32px_rgba(195,235,66,0.18)]"
                  : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
              )}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                <PreviewVideoBase
                  src={videoForSeed(`concept:${c.id}`)}
                  poster={v?.thumbnail}
                  className="transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                {active && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 px-2.5 py-2">
                <span className="line-clamp-1 text-[12px] font-bold text-foreground">
                  {c.name}
                </span>
                <span className="line-clamp-2 text-[10.5px] text-muted-foreground">
                  {c.desc}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Read-only "already known" chip — shown in place of the Angle grid when the
 *  plan says `needsAngle` is false (the source already carries an angle, e.g.
 *  a Script/Storyboard/Concept generation continuing from an Angle hand-off).
 *  Same label fallback order as useWizard.ts's own (unexported) humanizeAngle:
 *  free-text `angleDescription` first, else the catalogue label, else "Hero". */
function KnownAngleChip({ state }: { state: WizardState }) {
  const label = state.angleDescription?.trim()
    ? state.angleDescription.trim()
    : state.angleId
      ? ANGLE_CHIP_LABEL[state.angleId] ?? state.angleId
      : "Hero";
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-[12px] text-muted-foreground">
      <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        Angle <span className="font-semibold text-foreground">{label}</span> —
        carried from where this came from.
      </span>
    </div>
  );
}

/**
 * A short, plain-language explanation of WHY this screen is asking for less
 * than the usual angle+concept pair (or, for a Concept target, why there's no
 * concept field at all). Reads `generationSource`/`generationTarget` off state
 * purely for DISPLAY text — `needsAngle`/`needsConcept` themselves still come
 * from `resolveGenerationStepsForState`'s plan, never re-derived here.
 */
function buildContextNote(
  state: WizardState,
  needsAngle: boolean,
  needsConcept: boolean,
): string | null {
  const notes: string[] = [];
  if (state.generationSource === "framework") {
    notes.push(
      "Your framework only fixes the structure — hook → discovery → CTA → before/after → CTA. Angle and concept still need picking.",
    );
  } else if (state.generationSource === "hook" && needsAngle && needsConcept) {
    notes.push("Continuing from a hook — pick the angle and concept to build it out.");
  } else if (state.generationSource === "angle" && !needsAngle && needsConcept) {
    notes.push("Angle is already set from where this came from — just pick a concept.");
  }
  if (state.generationTarget === "concept" && needsAngle && !needsConcept) {
    notes.push(
      "You're generating a Concept, so there's no concept to pick here — just the angle it's built on.",
    );
  }
  return notes.length ? notes.join(" ") : null;
}

/**
 * CustomApproachSection — the Custom route: angle (+ concept, when both are
 * still needed) picked directly, no preset. Narrows to exactly what the plan
 * says is missing:
 *  - both needed  → Angle grid, then Concept grid, explicit Continue.
 *  - angle only   → Angle grid, commits the instant one is picked (nothing
 *    else to gather — mirrors a leaf preset's immediate advance).
 *  - concept only → a read-only "known angle" chip + Concept grid, explicit
 *    Continue (concept is multi-select, so it can't auto-advance on the
 *    first tap).
 */
function CustomApproachSection({
  wizard,
  needsAngle,
  needsConcept,
  onAdvance,
}: {
  wizard: UseWizardReturn;
  needsAngle: boolean;
  needsConcept: boolean;
  onAdvance: () => void;
}) {
  const { state } = wizard;

  const selectAngle = (id: string) => {
    wizard.set("angleId", id);
    if (!needsConcept) {
      // Angle-only ask (generating a Concept) — nothing else to gather.
      wizard.patch({ approachRoute: "custom" });
      onAdvance();
    }
  };

  const toggleConcept = (id: string) => {
    wizard.set(
      "selectedConceptIds",
      state.selectedConceptIds.includes(id)
        ? state.selectedConceptIds.filter((x) => x !== id)
        : [...state.selectedConceptIds, id],
    );
  };

  const commit = () => {
    wizard.patch({ approachRoute: "custom" });
    onAdvance();
  };

  const canContinue =
    needsConcept &&
    state.selectedConceptIds.length > 0 &&
    (!needsAngle || !!state.angleId);

  return (
    <section className="flex flex-col gap-5">
      {needsAngle ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Angle</h2>
            <span className="text-[11px] text-muted-foreground">pick one</span>
          </div>
          <AngleGrid selectedId={state.angleId} onSelect={selectAngle} />
        </div>
      ) : (
        <KnownAngleChip state={state} />
      )}

      {needsConcept && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Concept</h2>
            <span className="text-[11px] text-muted-foreground">
              pick one or more
              {state.selectedConceptIds.length > 0
                ? ` · ${state.selectedConceptIds.length} selected`
                : ""}
            </span>
          </div>
          <ConceptGrid
            selectedIds={state.selectedConceptIds}
            onToggle={toggleConcept}
          />
          <button
            type="button"
            onClick={commit}
            disabled={!canContinue}
            className={cn(
              "inline-flex w-fit items-center gap-1.5 self-end rounded-full bg-primary px-4 py-2 text-[12px] font-bold text-primary-foreground transition-all",
              "hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100",
            )}
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}

export function Step3Approach({ wizard, onAdvance, onBack }: Step3Props) {
  // Which approach is "open" for sub-type selection. Mirrors wizard.mode for
  // approaches that branch; null when nothing is being chosen.
  const [openMode, setOpenMode] = useState<Mode | null>(null);
  const subTypeRef = useRef<HTMLDivElement | null>(null);

  // Genie 2.0 — "the step must adapt to what's already known." The plan's
  // step-3 entry says exactly which of angle/concept remain unanswered; this
  // screen only ever READS those flags, never re-derives them (useWizard.ts,
  // READ ONLY, is the one place that rule is encoded).
  const plan = resolveGenerationStepsForState(wizard.state);
  const step3Plan = plan.steps.find((s) => s.step === 3);
  const needsAngle = step3Plan?.needsAngle ?? true;
  const needsConcept = step3Plan?.needsConcept ?? true;
  const fullAsk = needsAngle && needsConcept;

  // "Coming from a Concept → both known, so the plan marks step 3 'skipped'
  // and this screen shouldn't be reached at all." Defensive guard for a
  // direct/deep link landing here anyway — hand off immediately instead of
  // rendering a step that has nothing left to ask, same spirit as
  // resolveFlowContext degrading instead of throwing on a bad URL.
  const skipped = step3Plan?.status === "skipped";
  useEffect(() => {
    if (skipped) onAdvance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipped]);

  // Two routes to the same answer (owner ruling, verbatim): a preset (one of
  // the seven) or picking angle+concept directly. `viewRoute` is local UI
  // state — which tab is showing; `wizard.state.approachRoute` is only
  // WRITTEN once the user actually commits an answer (pickApproach/
  // pickSubType below stamp "preset"; CustomApproachSection's commit stamps
  // "custom"). Seeded from any prior commit so Back-then-forward reopens on
  // the route the user was last on.
  const [viewRoute, setViewRoute] = useState<ApproachRoute>(
    wizard.state.approachRoute ?? "preset",
  );
  const showingPreset = fullAsk && viewRoute === "preset";
  const showingCustom = !fullAsk || viewRoute === "custom";

  const contextNote = buildContextNote(wizard.state, needsAngle, needsConcept);

  // §21.2 — Approach filtered by Format. `format` should always be set by the
  // time this step renders (Step 1 precedes it), but fall back to the full
  // list defensively rather than rendering an empty grid.
  const visibleModes = wizard.state.format
    ? ALL_MODES.filter((m) => APPROACHES_BY_FORMAT[wizard.state.format!].includes(m.id))
    : ALL_MODES;
  const isSingleApproach = visibleModes.length === 1;

  // Keep `mode` inside the currently-visible set. Covers first mount (mode
  // defaults to "auto", which is valid for both formats, so this is a no-op)
  // AND the case where the user picks an approach for Video, goes Back to Step
  // 1, switches Format to Image, and returns here — "auto" and Create
  // Variations are the survivors, so a stale video-only mode gets corrected
  // instead of silently pointing at a card that no longer renders. It also
  // catches a run still carrying the retired "scratch" mode. Never
  // auto-advances.
  useEffect(() => {
    if (visibleModes.length > 0 && !visibleModes.some((m) => m.id === wizard.state.mode)) {
      // Prefer "auto" over the first card. The commonest way to land here is a
      // run still carrying the retired "scratch" (the `generate-from-url` flow
      // sets it, so does genieRunStore's fallback) — correcting that to
      // whatever happens to sit first, today Create Variations, silently tells
      // the user to iterate an existing creative when they asked for a fresh
      // one. "Genie decides" is the honest substitute for "no preset".
      const fallback = visibleModes.find((m) => m.id === "auto") ?? visibleModes[0];
      wizard.set("mode", fallback.id);
    }
    // NO dep array on purpose — this enforces an INVARIANT ("mode is always
    // one of the cards on screen"), and a dep list could not see the case that
    // broke it: on a deep link carrying a now-unofferable approach
    // (`?approach=scratch` — which generate-from-url and genieRunStore's
    // fallback both still set) this effect corrected the mode on mount, and
    // then useUrlSync's mount effect — a PARENT effect, so it runs AFTER this
    // child one, in the same flush — patched the retired value straight back.
    // The corrected value therefore never reached a render, so neither
    // `format` nor `mode` ever looked changed and the fix never re-fired:
    // Step 3 settled with NO card selected and `state.mode` still "scratch",
    // which then reads out as "From scratch" on Configure and in the batch
    // label. Re-checking every render is self-terminating (the condition goes
    // false the moment mode is valid) and the check is one array scan.
  });

  // Bring the revealed sub-type section into view once it mounts.
  useEffect(() => {
    if (openMode) {
      subTypeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [openMode]);

  if (skipped) return null;

  // Pick an approach. Branching approaches reveal their sub-types (no advance);
  // leaf approaches set mode + auto-fill and advance immediately. Either way
  // this commits the PRESET route (owner ruling: the seven ARE one of the two
  // routes to angle+concept, not a rival concept to it).
  const pickApproach = (mode: Mode) => {
    if (hasSubTypes(mode)) {
      // Highlight the approach + reveal "Choose a style". Don't auto-fill until
      // a sub-type is chosen so the Configure step receives the precise combo.
      wizard.patch({ mode, approachRoute: "preset" });
      setOpenMode(mode);
      return;
    }
    wizard.patch({
      mode,
      approachSubType: null,
      approachRoute: "preset",
      ...autoFillForApproach(mode, null),
    });
    setOpenMode(null);
    onAdvance();
  };

  // Pick a sub-type within the open approach → patch mode + sub-type + auto-fill
  // (angle + concepts) in one go, then advance. Also a PRESET-route commit.
  const pickSubType = (mode: Mode, subTypeId: string) => {
    wizard.patch({
      mode,
      approachSubType: subTypeId,
      approachRoute: "preset",
      ...autoFillForApproach(mode, subTypeId),
    });
    onAdvance();
  };

  const openApproach = openMode
    ? ALL_MODES.find((m) => m.id === openMode)
    : undefined;

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-8 pb-10">
      {/* Ambient bg — consistent with Step 1 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute inset-0 text-foreground opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,hsl(74_81%_59%/0.08),transparent_70%)]" />
      </div>

      <HeroHeader title="What's your approach?" onBack={onBack} />

      {/* Genie 2.0 — "the step must adapt to what's already known." Explains,
          in plain language, why less is being asked than usual (or why there's
          no concept field for a Concept target). Absent on the ordinary full
          Ad ask, where there's nothing unusual to explain. */}
      {contextNote && (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
          {contextNote}
        </p>
      )}

      {/* Two routes to the same answer — only meaningful when BOTH angle and
          concept are being asked. A preset bundles both, so it has nothing to
          offer once the source has already narrowed the ask to one of them. */}
      {fullAsk && <RouteToggle value={viewRoute} onChange={setViewRoute} />}

      {showingPreset && (
        <>
          {/* §21.2 — a filtered list that comes out to exactly one card is a
              design smell (Format=Image only has "From scratch" left once the
              two video-only approaches are filtered out). Ship an intentional
              single wide card instead of a 1-cell grid that reads as broken. */}
          {isSingleApproach ? (
            <SingleApproachCard
              mode={visibleModes[0]}
              selected={wizard.state.mode === visibleModes[0].id}
              onPick={() => pickApproach(visibleModes[0].id)}
            />
          ) : (
            /* Approach grid — visual cards, 2 cols mobile / 3 cols md. */
            <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {visibleModes.map((m) => {
                const selected = wizard.state.mode === m.id;
                const isOpen = openMode === m.id;
                const Icon = m.Icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pickApproach(m.id)}
                    aria-pressed={selected}
                    className={cn(
                      "v3-glass-card group flex flex-col overflow-hidden rounded-2xl text-left transition-all",
                      selected
                        ? "ring-2 ring-primary/40 shadow-[0_8px_32px_rgba(195,235,66,0.18)]"
                        : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                    )}
                  >
                    {/* Video preview — ~4:3, leads the card. */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      <PreviewVideo
                        seed={m.id}
                        className="transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      {/* Legibility scrim */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                      {/* Lucide icon — small glass badge */}
                      <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white backdrop-blur-sm">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                      {/* Selected check */}
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    {/* Title + 1-line desc */}
                    <div className="flex flex-col gap-0.5 px-3 py-2.5">
                      <span className="flex items-center gap-1 text-[13px] font-bold text-foreground">
                        {m.title}
                        {isOpen && hasSubTypes(m.id) && (
                          <span className="rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-primary">
                            Pick style
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-2 text-[11px] text-muted-foreground">
                        {m.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </section>
          )}

          {/* Format-aware recovery note. BG Remover / Resize are image-only and
              Image to Video / UGC / B-Roll are video-only (APPROACHES_BY_FORMAT),
              so the approach a user remembers may simply be behind the other
              format. The previous note sent them to Other Apps for these — none
              of them is among §8's 15 apps, so that link was a dead end. */}
          {wizard.state.format && (
            <p className="text-center text-[11px] text-muted-foreground">
              {wizard.state.format === "image"
                ? "Looking for Image to Video, UGC Video or B-Roll? "
                : "Looking for BG Remover or Resize? "}
              <button
                type="button"
                onClick={() => wizard.goTo(1)}
                className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                Switch the format on step 1
                <ArrowRight className="h-3 w-3" />
              </button>
            </p>
          )}

          {/* Sub-type reveal — appears below the grid when a branching approach is
              picked. "Choose a style" with smaller visual cards, each with its own
              seeded preview (`${mode}:${subType.id}`). */}
          {openApproach && (
            <section
              ref={subTypeRef}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-4 duration-300 animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Choose a style
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  for {openApproach.title}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {APPROACH_SUBTYPES[openApproach.id].map((sub) => {
                  const subSelected =
                    wizard.state.mode === openApproach.id &&
                    wizard.state.approachSubType === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => pickSubType(openApproach.id, sub.id)}
                      aria-pressed={subSelected}
                      className={cn(
                        "v3-glass-card group flex flex-col overflow-hidden rounded-xl text-left transition-all",
                        subSelected
                          ? "ring-2 ring-primary/40 shadow-[0_8px_32px_rgba(195,235,66,0.18)]"
                          : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                      )}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <PreviewVideo
                          seed={`${openApproach.id}:${sub.id}`}
                          className="transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                      </div>
                      <div className="flex flex-col gap-0.5 px-2.5 py-2">
                        <span className="text-[12px] font-bold text-foreground">
                          {sub.label}
                        </span>
                        <span className="line-clamp-2 text-[10.5px] text-muted-foreground">
                          {sub.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {showingCustom && (
        <CustomApproachSection
          wizard={wizard}
          needsAngle={needsAngle}
          needsConcept={needsConcept}
          onAdvance={onAdvance}
        />
      )}
    </div>
  );
}

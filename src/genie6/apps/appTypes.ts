/**
 * Other Apps — contract types (Genie 2.0 §8).
 *
 * 22 apps. 4 live with full flows, 18 "Coming soon" — the owner's 2026-09-10
 * scope cut ("only 4 we decided to give for now") left Translate Videos,
 * Product Placement, Face Swap and Change Metadata live and moved the rest
 * behind a "coming soon" tag, including five that HAD been live (Avatar
 * Shots, PPT/PDF to Video, Upscale Video, Speech Cleanup and BG Remover —
 * the last of which had gone live on 2026-09-09 when it moved out of
 * Studio's Approach grid). Those five keep their full `sections`/`cost`/
 * `zeroState`/`stages` declared but dormant, so re-shipping one is a
 * `state` flip; see appRegistry.ts. 4 of the coming-soon set
 * (Add Video Captions, Change Metadata, Prompt Generator, Thumbnail Maker)
 * came from Maalik's own additions list, reconciled in GENERATION_TARGETS.md
 * §11 as genuinely new with no existing match. 3 more (BG Remover, Resize
 * Image, Object Remover) arrived later via the "one home for every one-shot
 * tool" consolidation — see the AppKey union below for the full story.
 *
 * WHY THE APPS ARE DECLARATIVE, NOT 7 HAND-WRITTEN SCREENS
 * §8 fixes ONE screen anatomy for every app: a 750px centred setup column,
 * sections divided by rules (Source / Cast / Output), a full-width primary
 * action with the cost beneath it, and a results list below. Seven files each
 * re-implementing that would drift by the third one — so the anatomy lives in
 * AppRunner and each app declares its fields. A new app is a registry entry.
 *
 * RULES THAT OVERRIDE THE LOCKED ARTIFACT FILE (§8)
 *  - Second inputs ALWAYS come from a picker — Catalogue, Library, or the
 *    avatar list. Never a second upload box. Hence `picker-*` field kinds and
 *    the `sources` list on upload fields.
 *  - All app output goes to the central Genie Library. Per-app history is a
 *    VIEW over genieRunStore, not a separate store.
 *  - The artifact's fixed "Estimated 1-2 min remaining" is REPLACED by the
 *    stage-wise progress pattern in src/genie6/progress (§18).
 */
import type { CreditLine } from "../lib/credits";

export type AppKey =
  // Live
  | "translate-videos"
  | "avatar-shots"
  | "ppt-pdf-to-video"
  | "upscale-video"
  | "product-placement"
  | "face-swap"
  | "speech-cleanup"
  // Coming soon
  | "ai-studio"
  | "ai-video-generator"
  | "ai-clipping"
  | "batch-mode"
  | "generate-images"
  | "interactive-video"
  | "video-podcast"
  | "live-avatar"
  // Coming soon — added from Maalik's list, §11
  | "add-video-captions"
  | "change-metadata"
  | "prompt-generator"
  | "thumbnail-maker"
  // Coming soon — folded in from the sidebar TOOLS group (2026-09-09).
  // Maalik's call: Other Apps is now the single home for every one-shot
  // utility tool. BG Remover and Resize Image were the two items on his
  // list that already existed elsewhere under a different system (a "Soon"
  // sidebar module, and the "resize" Step-3 Approach id respectively) —
  // both are still just "Soon" stubs, so state stays "coming-soon" here
  // too; nothing about their underlying build status changed. Object
  // Remover was NOT on his list by name, but it was the identical class of
  // one-shot sidebar stub as BG Remover, so it moved for the same reason
  // rather than being left behind to recreate the two-systems split this
  // consolidation exists to kill. The third item on his list, "Swap
  // avatar", is NOT a new entry — it's already the live `face-swap` app
  // above (casting a different face onto existing footage is exactly what
  // Face Swap does).
  | "bg-remover"
  | "resize-image"
  | "object-remover";

/** Filter tabs on the Other Apps grid. */
export type AppCategory = "create" | "enhance" | "edit" | "live-avatar";

export const APP_CATEGORY_LABELS: Record<AppCategory, string> = {
  create: "Create",
  enhance: "Enhance",
  edit: "Edit",
  "live-avatar": "LiveAvatar",
};

/** Where a picker draws its options from. Never "a second upload box". */
export type PickerSource = "library" | "catalogue" | "avatars" | "voices" | "upload";

/**
 * A field on an app's setup column. Every live app is fully described by an
 * ordered list of these grouped into sections.
 */
export type AppField =
  | {
      kind: "media-picker";
      id: string;
      label: string;
      /** Helper line under the label. */
      hint?: string;
      /** What kind of asset — drives the picker's contents and the accept list. */
      media: "video" | "audio" | "image" | "document" | "product";
      /** Ordered tabs inside the picker. "upload" renders the drop zone. */
      sources: PickerSource[];
      /** Accepted extensions, shown verbatim in the drop zone copy. */
      accept?: string[];
      required: boolean;
    }
  | {
      kind: "avatar-picker";
      id: string;
      label: string;
      hint?: string;
      /**
       * §13 — avatar and voice are decided TOGETHER, so they belong in one
       * step. `withVoice` renders the voice list + audio preview inline.
       */
      withVoice: boolean;
      /** §13 — tone selection, tied to brand voice. */
      withTone: boolean;
      required: boolean;
    }
  | {
      kind: "language-multiselect";
      id: string;
      label: string;
      hint?: string;
      required: boolean;
    }
  | {
      kind: "segmented";
      id: string;
      label: string;
      hint?: string;
      options: { value: string; label: string; desc?: string }[];
      required: boolean;
    }
  | {
      kind: "select";
      id: string;
      label: string;
      hint?: string;
      options: { value: string; label: string; desc?: string }[];
      required: boolean;
    }
  | {
      kind: "aspect-ratio";
      id: string;
      label: string;
      hint?: string;
      required: boolean;
    }
  | {
      /**
       * A quantity. Exists because §15 says "every app states its unit cost"
       * and two of the seven price PER UNIT OF OUTPUT rather than per unit of
       * input: Avatar Shots is "9 credits / shot" and Product Placement is
       * "16 credits / scene". Nothing in the input fields carries that number
       * — a picked avatar doesn't tell you how many shots you want — so
       * without this field their cost preview can only ever floor to 1, and
       * the number under the button would be a lie the moment a user wanted
       * two. Every other app derives its multiplier from its source (duration,
       * page count, language count) and needs no stepper.
       */
      kind: "stepper";
      id: string;
      label: string;
      hint?: string;
      min: number;
      max: number;
      /** Singular/plural noun for the value, e.g. ["shot", "shots"]. */
      unitNoun: [string, string];
      required: boolean;
    };

export interface AppSection {
  /** "Source" / "Cast" / "Output" — sections are divided by rules, not cards. */
  title: string;
  fields: AppField[];
}

/**
 * Unit cost. Every app states its unit (§15): per language per minute, per
 * shot, per slide, per minute, per scene, per image.
 *
 * "image" was added with BG Remover (2026-09-09). The still-image utilities
 * (BG Remover, and Resize Image / Object Remover behind it) have no duration
 * and no page count, so none of the pre-existing units describes them: "shot"
 * and "scene" would price them correctly — both floor to 1 without a `count`
 * field — but the breakdown line would read "1 shot" for a background cutout.
 * The multiplier logic is identical to "shot"; only the noun differs.
 */
export interface AppCost {
  rate: number;
  /** Rendered verbatim, e.g. "6 credits / language / minute". */
  unitLabel: string;
  /** Which field values multiply the rate — used by the live cost preview. */
  unit: "language-minute" | "shot" | "slide" | "minute" | "scene" | "image";
}

export interface GenieApp {
  key: AppKey;
  name: string;
  /** One line under the name on the grid card. */
  tagline: string;
  /** 14px subtitle under the 30px centred title on the app screen. */
  subtitle: string;
  category: AppCategory;
  icon: string;
  state: "live" | "coming-soon";
  /** "New" etc. Only Speech Cleanup carries one today. */
  badge?: string;
  cost?: AppCost;
  sections?: AppSection[];
  /** Zero state: title, one line, three numbered steps (§8 anatomy). */
  zeroState?: { title: string; line: string; steps: [string, string, string] };
  /** Stage names for the run state's step list — done / now / waiting. */
  stages?: string[];
}

/** Values collected from an app's fields. Keyed by field id. */
export type AppFieldValues = Record<string, unknown>;

/** Cost preview for the current field values, with its multipliers shown. */
export interface AppCostPreview {
  lines: CreditLine[];
  total: number;
  /** True when required fields are missing, so the total is a floor not a quote. */
  provisional: boolean;
}

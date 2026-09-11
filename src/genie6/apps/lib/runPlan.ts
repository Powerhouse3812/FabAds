/**
 * Other Apps — turns a filled-in setup form into a `startBatch()` call
 * (Genie 2.0 §8, §10, §15).
 *
 * `previewCost()` (owned by the App Data agent) tells the form what the run
 * will cost; this file turns that same form into the actual batch — how many
 * `RunItem`s it produces and what each one is charged, so the two can never
 * quietly disagree. Every live app — Translate Videos included — is a
 * single-item batch.
 *
 * Translate Videos used to fan out one output item PER target language (so
 * each language could fail/retry independently) back when its language field
 * was a multiselect. Owner ruling 2026-09-09 made language selection
 * single-only everywhere, so that field now holds at most one code — the
 * fan-out degenerates to exactly 1 item and the loop it used to need is gone.
 * What this costs: per-language retry granularity (§21.3) no longer applies
 * here — noted in appTypes.ts's `language-select` doc comment too.
 */
import type { AppCostPreview, AppFieldValues, GenieApp } from "../appTypes";
import type { RunItem } from "../../lib/genieRunTypes";
import { languageLabel } from "../../lib/languages";
import {
  type AvatarPickerValue,
  type MediaPickerValue,
  firstFieldOfKind,
  pickedThumbnail,
} from "./fieldHelpers";

function mediaTitle(v: MediaPickerValue | undefined): string {
  if (!v) return "your file";
  if (v.item) return v.item.title;
  if (v.product) return v.product.name;
  if (v.fileName) return v.fileName;
  return "your file";
}

export interface RunPlan {
  /** How many RunItems the batch will contain. */
  count: number;
  /** Nominal per-item rate (used for retry-with-a-different-model pricing). */
  creditsPerItem: number;
  /** The previewed total, charged EXACTLY — the store distributes it across
   *  items so submit can never contradict the cost line under the button. */
  creditsTotal: number;
  /** Human label shown above the batch (Batch ID sits alongside it). */
  label: string;
  /** Per-item seed handed to `startBatch({ itemSeed })`. */
  itemSeed: (i: number) => Partial<RunItem>;
  /** Snapshot for the batch's `config` (Library detail: "how this was made"). */
  config: NonNullable<import("../../lib/genieRunTypes").RunBatch["config"]>;
}

/** Builds the {count, creditsPerItem, label, itemSeed, config} a `startBatch`
 *  call needs, from the app's own field values + its cost preview. */
export function buildRunPlan(app: GenieApp, values: AppFieldValues, preview: AppCostPreview): RunPlan {
  const total = Math.max(1, preview.total);
  const thumbnail = pickedThumbnail(app, values);

  const langField = firstFieldOfKind(app, "language-select");
  const mediaField = firstFieldOfKind(app, "media-picker");
  const avatarField = firstFieldOfKind(app, "avatar-picker");
  const aspectField = firstFieldOfKind(app, "aspect-ratio");

  const mediaValue = mediaField ? (values[mediaField.id] as MediaPickerValue | undefined) : undefined;
  const avatarValue = avatarField ? (values[avatarField.id] as AvatarPickerValue | undefined) : undefined;
  const aspectRatio = aspectField ? (values[aspectField.id] as string | undefined) : undefined;

  // Translate Videos: single-select language field, so this is always a
  // single-item batch now — no fan-out loop needed (see file header).
  if (langField) {
    const code = values[langField.id] as string | undefined;
    const lbl = code ? languageLabel(code) : "your language";
    const sourceTitle = mediaTitle(mediaValue);
    return {
      count: 1,
      creditsPerItem: total,
      creditsTotal: total,
      label: `${app.name} · ${lbl}`,
      itemSeed: () => ({
        title: `${sourceTitle} — ${lbl}`,
        summary: `Dubbed into ${lbl}, lip-synced to the source video.`,
        tags: code ? [code.toUpperCase()] : undefined,
        thumbnail,
      }),
      config: { language: code, aspectRatio, promptSnippet: sourceTitle },
    };
  }

  // Every other live app: a single-item batch.
  const creditsPerItem = total;
  let title = app.name;
  let summary = `${app.name} output.`;
  let productName: string | undefined;

  switch (app.key) {
    case "avatar-shots": {
      const who = avatarValue?.avatarId ? "your chosen avatar" : "the avatar";
      title = `${app.name} — ${who}`;
      summary = "Presenter/cinematic shot generated with the selected avatar and voice.";
      break;
    }
    case "ppt-pdf-to-video": {
      const docTitle = mediaTitle(mediaValue);
      title = docTitle;
      summary = `Slide deck turned into a narrated video.`;
      break;
    }
    case "upscale-video": {
      const videoTitle = mediaTitle(mediaValue);
      title = videoTitle;
      summary = "Upscaled to a higher resolution and frame rate.";
      break;
    }
    case "product-placement": {
      productName = mediaValue?.product?.name;
      title = productName ?? "Product scene";
      summary = "Product composited into a generated scene with your avatar.";
      break;
    }
    case "face-swap": {
      const videoTitle = mediaTitle(mediaValue);
      title = videoTitle;
      summary = "Face swapped onto the target video.";
      break;
    }
    case "speech-cleanup": {
      const audioTitle = mediaTitle(mediaValue);
      title = audioTitle;
      summary = "Background noise removed, voice levelled.";
      break;
    }
    case "bg-remover": {
      const imageTitle = mediaTitle(mediaValue);
      title = imageTitle;
      summary = "Background removed, subject cut out.";
      break;
    }
    default: {
      title = app.name;
      summary = `${app.name} output.`;
    }
  }

  // Avatar Shots ("Shots" stepper) and Product Placement ("Scenes" stepper)
  // are priced per unit by previewCost(); they must PRODUCE that many items
  // too. Previously 5 shots were quoted at 45 credits and rendered as ONE
  // RunItem carrying all 45 — billed for five, shown one.
  const unitLabel =
    app.key === "avatar-shots" ? "Shot" : app.key === "product-placement" ? "Scene" : null;
  const unitCount = unitLabel ? Math.max(1, Math.floor(Number(values.count)) || 1) : 1;
  const perItem = unitCount > 1 ? Math.max(1, Math.round(total / unitCount)) : creditsPerItem;

  return {
    count: unitCount,
    creditsPerItem: perItem,
    creditsTotal: total,
    label:
      unitCount > 1
        ? `${app.name} · ${title} · ${unitCount} ${unitLabel!.toLowerCase()}s`
        : `${app.name} · ${title}`,
    itemSeed: (i) => ({
      title: unitCount > 1 ? `${title} — ${unitLabel} ${i + 1}` : title,
      summary,
      thumbnail,
    }),
    config: { aspectRatio, productName },
  };
}

/** Caption line under the language field — selection state + cost
 *  implication (§8: "the cost implication (6 credits per language per
 *  minute is the whole reason this field is expensive)"). Single-select: the
 *  field holds 0 or 1 languages, never a count, so this reports which. */
export function languageCostNote(ratePerLanguageMinute: number | undefined, hasLanguage: boolean): string {
  const status = hasLanguage ? "1 of 175 languages selected" : "0 of 175 languages selected";
  if (!ratePerLanguageMinute) return status;
  return `${status} · ${ratePerLanguageMinute} credits / language / minute`;
}


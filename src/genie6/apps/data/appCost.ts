/**
 * Other Apps — live cost preview (Genie 2.0 §8, §15, §21.2).
 *
 * §15: "the cost of an action is shown on the action" — every app states its
 * unit cost, and the number under the primary button has to move as the
 * user fills the form in, not just appear once at the end. §21.2: "Credits
 * need a breakdown, not just a number" — Configure showing `Generate (4
 * credits)` while Results said `Generate (24 credits)` was a 6× jump with no
 * explanation, so `previewCost` returns the `CreditLine[]` that produced the
 * total, not just the total.
 *
 * WHY THIS IS GENERIC INSTEAD OF ONE BRANCH PER APP
 * Seven apps, five unit shapes (language-minute / shot / slide / minute /
 * scene). A hand-written branch per app would drift the moment an eighth
 * live app is added. Instead this reads `app.cost.unit` and walks
 * `app.sections` to find the field whose *kind* supplies the multiplier —
 * a `language-multiselect` for language count, a `media-picker` for source
 * duration or slide count — so a new live app only has to declare its
 * fields correctly; it never needs a new cost branch.
 *
 * THE VALUE SHAPE A `media-picker` FIELD IS EXPECTED TO CARRY
 * `AppFieldValues` is `Record<string, unknown>` (locked in appTypes.ts), so
 * this file cannot demand a type at the contract level — but for the preview
 * math to work, whatever the Apps UI puts at `values[field.id]` for a
 * media-picker field must carry `durationSec` (video/audio) or `pageCount`
 * (document) directly on the value, the same shape `PickerItem` already
 * uses (see appPickerData.ts). A freshly uploaded file with unknown length
 * should still shape its value this way once the browser reads its
 * metadata — string-only values (e.g. just an id) are treated as unknown
 * duration/pages, which falls through to the provisional floor below.
 *
 * PROVISIONAL = A FLOOR, NOT A QUOTE
 * `provisional: true` whenever any field marked `required` is still empty.
 * While provisional, every missing multiplier defaults to 1 (never 0) so
 * the number shown is "at least this many credits", never a misleading
 * ₹0-reading total.
 *
 * THE QUANTITY GAP (documented in appRegistry.ts's file header too)
 * Avatar Shots ("9 credits / shot") and Product Placement ("16 credits /
 * scene") have no field in §8's table that carries a count. Until the Apps
 * UI adds one, this reads an optional numeric `values.count` (default 1) —
 * wire a quantity stepper to the field id `"count"` for those two apps and
 * the preview picks it up with no change here.
 */
import type { AppField, AppFieldValues, AppCostPreview, GenieApp } from "../appTypes";
import { type CreditLine, computeBreakdown } from "../../lib/credits";

/** Anything a media-picker value might carry for duration/page multipliers. */
interface MediaLikeValue {
  durationSec?: number;
  pageCount?: number;
}

function asMediaValue(v: unknown): MediaLikeValue | undefined {
  if (v && typeof v === "object") return v as MediaLikeValue;
  return undefined;
}

function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function allFields(app: GenieApp): AppField[] {
  return (app.sections ?? []).flatMap((s) => s.fields);
}

/** True once every required field on the app's setup column has a value. */
function requiredFieldsMissing(app: GenieApp, values: AppFieldValues): boolean {
  return allFields(app).some((f) => f.required && isEmptyValue(values[f.id]));
}

function findField(app: GenieApp, pred: (f: AppField) => boolean): AppField | undefined {
  return allFields(app).find(pred);
}

/**
 * Minutes are billed rounded UP — a 91-second video is 2 minutes, not 1.5.
 * Say so on the line's `note` too, so a user watching the number jump from
 * "1 min" to "2 min" at 0:60 isn't left assuming a display bug.
 */
function minutesFromSeconds(sec: number): number {
  return Math.ceil(sec / 60);
}

function pluralise(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

/** The source media field for a "minute"/"language-minute" unit — video or audio. */
function findDurationField(app: GenieApp): AppField | undefined {
  return findField(
    app,
    (f) => f.kind === "media-picker" && (f.media === "video" || f.media === "audio"),
  );
}

export function previewCost(app: GenieApp, values: AppFieldValues): AppCostPreview {
  if (!app.cost) return { lines: [], total: 0, provisional: true };
  const { rate, unit } = app.cost;
  const provisional = requiredFieldsMissing(app, values);

  const lines: CreditLine[] = [{ label: app.cost.unitLabel, factor: rate, op: "base" }];

  switch (unit) {
    case "language-minute": {
      const langField = findField(app, (f) => f.kind === "language-multiselect");
      const languages = (langField && (values[langField.id] as string[] | undefined)) ?? [];
      const langCount = Math.max(languages.length, 1);

      const durField = findDurationField(app);
      const media = durField ? asMediaValue(values[durField.id]) : undefined;
      const minutes = Math.max(media?.durationSec ? minutesFromSeconds(media.durationSec) : 1, 1);

      lines.push({ label: pluralise(langCount, "language"), factor: langCount, op: "multiply" });
      lines.push({
        label: pluralise(minutes, "min"),
        factor: minutes,
        op: "multiply",
        note: "rounded up to the nearest minute",
      });
      break;
    }
    case "shot": {
      const count = Math.max(Number(values.count ?? 1) || 1, 1);
      lines.push({ label: pluralise(count, "shot"), factor: count, op: "multiply" });
      break;
    }
    case "slide": {
      const docField = findField(app, (f) => f.kind === "media-picker" && f.media === "document");
      const doc = docField ? asMediaValue(values[docField.id]) : undefined;
      const slides = Math.max(doc?.pageCount ?? 1, 1);
      lines.push({ label: pluralise(slides, "slide"), factor: slides, op: "multiply" });
      break;
    }
    case "minute": {
      const durField = findDurationField(app);
      const media = durField ? asMediaValue(values[durField.id]) : undefined;
      const minutes = Math.max(media?.durationSec ? minutesFromSeconds(media.durationSec) : 1, 1);
      lines.push({
        label: pluralise(minutes, "min"),
        factor: minutes,
        op: "multiply",
        note: "rounded up to the nearest minute",
      });
      break;
    }
    case "scene": {
      const count = Math.max(Number(values.count ?? 1) || 1, 1);
      lines.push({ label: pluralise(count, "scene"), factor: count, op: "multiply" });
      break;
    }
  }

  const { total } = computeBreakdown(lines);
  return { lines, total, provisional };
}

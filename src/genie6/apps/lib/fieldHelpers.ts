/**
 * Other Apps — field value shapes + shared helpers (Genie 2.0 §8).
 *
 * `AppFieldValues` (appTypes.ts) is intentionally `Record<string, unknown>` —
 * the registry doesn't know the shape a UI will choose for each field kind.
 * This file is that choice, made once so every field renderer + AppRunner
 * agree on it.
 *
 * Fields are looked up by KIND, not by a guessed field `id`, wherever the
 * logic needs to reason about "the language field" or "the picked video" —
 * `src/genie6/apps/data/appRegistry.ts` is owned by a different agent and its
 * exact `id` strings aren't part of the contract, only the `AppField` shape
 * is. Kind-based lookup is what survives that agent choosing ids we didn't
 * predict.
 */
import type { AppField, AppFieldValues, AppSection, GenieApp } from "../appTypes";
import type { PickerItem } from "../data/appPickerData";
import type { Product } from "@/genie6/types/entities";

/**
 * Value stored for a `media-picker` field.
 *
 * `durationSec`/`pageCount` are duplicated here at the TOP LEVEL (not just
 * nested inside `item`) because `appCost.ts` (owned by the App Data agent)
 * reads `values[field.id]` and casts the whole thing to a
 * `{ durationSec?; pageCount? }` shape to compute the live cost preview — it
 * has no knowledge of this `MediaPickerValue`/`PickerItem` split, so the
 * multiplier fields must live where appCost.ts's `asMediaValue()` looks for
 * them. An uploaded mock file carries neither (no real file-metadata read
 * exists here), which appCost.ts already treats as "unknown, floor to 1".
 */
export interface MediaPickerValue {
  source: "upload" | "library" | "catalogue" | "avatars" | "voices";
  /** Picked from a Library-style tab (video/audio/doc). */
  item?: PickerItem;
  /** Picked from the Catalogue (media: "product"). */
  product?: Product;
  /** Upload tab — mock: filename only, no real file storage. */
  fileName?: string;
  /** Mirrors `item.durationSec` — read by appCost.ts's "minute"/"language-minute" math. */
  durationSec?: number;
  /** Mirrors `item.pageCount` — read by appCost.ts's "slide" math. */
  pageCount?: number;
}

/** Value stored for an `avatar-picker` field. */
export interface AvatarPickerValue {
  avatarId: string | null;
  voiceId?: string | null;
  tone?: string | null;
}

export function mediaPickerHasValue(v: MediaPickerValue | undefined | null): boolean {
  return !!(v && (v.fileName || v.item || v.product));
}

/** Does this field currently satisfy its own `required` flag? */
export function isFieldFilled(field: AppField, value: unknown): boolean {
  switch (field.kind) {
    case "media-picker":
      return mediaPickerHasValue(value as MediaPickerValue | undefined | null);
    case "avatar-picker":
      return !!(value as AvatarPickerValue | undefined | null)?.avatarId;
    case "language-multiselect":
      return Array.isArray(value) && value.length > 0;
    case "segmented":
    case "select":
    case "aspect-ratio":
      return typeof value === "string" && value.length > 0;
    case "stepper":
      // A stepper is never genuinely empty: it renders its `min` when the
      // stored value is undefined, and StepperField writes that default back
      // on mount. Requiring a number here would leave a `required: true`
      // stepper permanently unmet and disable the primary action forever —
      // which is exactly the trap the "say WHICH field is missing" gate would
      // then report, on a field the user can see a value in.
      return value === undefined || typeof value === "number";
    default:
      return false;
  }
}

/** First unmet required field, in section/field order — drives the disabled
 *  primary-action reason. Null when the form is complete. */
export function firstMissingRequiredField(
  sections: AppSection[] | undefined,
  values: AppFieldValues,
): AppField | null {
  for (const section of sections ?? []) {
    for (const field of section.fields) {
      if (field.required && !isFieldFilled(field, values[field.id])) return field;
    }
  }
  return null;
}

/** True once every required field across every section has a value. */
export function isFormComplete(sections: AppSection[] | undefined, values: AppFieldValues): boolean {
  return firstMissingRequiredField(sections, values) === null;
}

export function fieldsOfKind<K extends AppField["kind"]>(
  app: GenieApp,
  kind: K,
): Extract<AppField, { kind: K }>[] {
  const out: Extract<AppField, { kind: K }>[] = [];
  for (const section of app.sections ?? []) {
    for (const field of section.fields) {
      if (field.kind === kind) out.push(field as Extract<AppField, { kind: K }>);
    }
  }
  return out;
}

export function firstFieldOfKind<K extends AppField["kind"]>(
  app: GenieApp,
  kind: K,
): Extract<AppField, { kind: K }> | undefined {
  return fieldsOfKind(app, kind)[0];
}

/** "3:24" from seconds. Empty string when unknown. */
export function formatDurationShort(sec?: number): string {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Realistic non-round fallback used when a picked asset carries no duration
 *  metadata (an uploaded mock file, e.g.) — deliberately not round per the
 *  design-system "never round demo numbers" rule. */
const DEFAULT_MEDIA_MINUTES = 2.4;

export function minutesFromSeconds(sec?: number): number {
  if (!sec || sec <= 0) return DEFAULT_MEDIA_MINUTES;
  return Math.max(0.5, Math.round((sec / 60) * 10) / 10);
}

/** Slide count parsed out of a PickerItem's `meta` line (e.g. "18 slides ·
 *  4.2 MB"). Falls back to a realistic non-round default. */
const DEFAULT_SLIDE_COUNT = 11;

export function slideCountFromMeta(meta?: string): number {
  if (!meta) return DEFAULT_SLIDE_COUNT;
  const m = meta.match(/(\d+)\s*slide/i);
  return m ? Math.max(1, parseInt(m[1], 10)) : DEFAULT_SLIDE_COUNT;
}

/** "2h ago" / "Yesterday" / "3d ago" — matches the idiom in
 *  studio-v4/screens/StudioHome.tsx's HistoryCard. */
export function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  return `${wk}w ago`;
}

/** Best-effort thumbnail for a batch/item, pulled from whatever media the
 *  user picked (falls back to undefined — callers render a themed poster). */
export function pickedThumbnail(app: GenieApp, values: AppFieldValues): string | undefined {
  const mediaField = firstFieldOfKind(app, "media-picker");
  if (mediaField) {
    const v = values[mediaField.id] as MediaPickerValue | undefined;
    if (v?.item?.thumbnail) return v.item.thumbnail;
    if (v?.product?.thumbnail) return v.product.thumbnail;
  }
  return undefined;
}

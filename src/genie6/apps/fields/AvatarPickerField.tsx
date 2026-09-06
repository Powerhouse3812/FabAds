import { AvatarVoicePicker } from "@/genie6/brain/AvatarVoicePicker";
import type { AppField } from "../appTypes";
import type { AvatarPickerValue } from "../lib/fieldHelpers";

type AvatarPickerFieldSpec = Extract<AppField, { kind: "avatar-picker" }>;

interface AvatarPickerFieldProps {
  field: AvatarPickerFieldSpec;
  value: AvatarPickerValue | undefined;
  onChange: (value: AvatarPickerValue) => void;
}

/**
 * avatar-picker field renderer — a thin adapter over the Brain's
 * `AvatarVoicePicker`, per §8/§11/§13: avatar, voice and tone are decided
 * together in ONE component everywhere Genie needs a face, so this step's
 * environment/personality browsing can never diverge from `GenieBrain`'s.
 *
 * `AvatarVoicePicker` already accepts `withVoice`/`withTone` (both default
 * true, hiding the voice column when false) — Face Swap's "face" field sets
 * `withVoice: false, withTone: false` and gets exactly that, with no
 * separate avatar-only component to keep in sync.
 */
export function AvatarPickerField({ field, value, onChange }: AvatarPickerFieldProps) {
  return (
    <AvatarVoicePicker
      avatarId={value?.avatarId ?? null}
      voiceId={value?.voiceId ?? null}
      tone={value?.tone ?? null}
      withVoice={field.withVoice}
      withTone={field.withTone}
      onChange={(v) =>
        onChange({
          avatarId: v.avatarId !== undefined ? v.avatarId : (value?.avatarId ?? null),
          voiceId: v.voiceId !== undefined ? v.voiceId : (value?.voiceId ?? null),
          tone: v.tone !== undefined ? v.tone : (value?.tone ?? null),
        })
      }
    />
  );
}

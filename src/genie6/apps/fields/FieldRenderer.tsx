import type { AppField } from "../appTypes";
import type { AvatarPickerValue, MediaPickerValue } from "../lib/fieldHelpers";
import { MediaPickerField } from "./MediaPickerField";
import { AvatarPickerField } from "./AvatarPickerField";
import { LanguageMultiselectField } from "./LanguageMultiselectField";
import { SegmentedField } from "./SegmentedField";
import { SelectField } from "./SelectField";
import { AspectRatioField } from "./AspectRatioField";
import { StepperField } from "./StepperField";

interface FieldRendererProps {
  field: AppField;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Only meaningful for `language-multiselect` — the app's per-language rate. */
  ratePerLanguageMinute?: number;
}

/** Dispatches an `AppField` to its renderer by `kind`. The one place
 *  `AppRunner` needs to know about, instead of a switch per section. */
export function FieldRenderer({ field, value, onChange, ratePerLanguageMinute }: FieldRendererProps) {
  switch (field.kind) {
    case "media-picker":
      return (
        <MediaPickerField
          field={field}
          value={value as MediaPickerValue | undefined}
          onChange={(v) => onChange(v)}
        />
      );
    case "avatar-picker":
      return (
        <AvatarPickerField
          field={field}
          value={value as AvatarPickerValue | undefined}
          onChange={(v) => onChange(v)}
        />
      );
    case "language-multiselect":
      return (
        <LanguageMultiselectField
          value={value as string[] | undefined}
          onChange={(v) => onChange(v)}
          ratePerLanguageMinute={ratePerLanguageMinute}
        />
      );
    case "segmented":
      return <SegmentedField field={field} value={value as string | undefined} onChange={(v) => onChange(v)} />;
    case "select":
      return <SelectField field={field} value={value as string | undefined} onChange={(v) => onChange(v)} />;
    case "aspect-ratio":
      return <AspectRatioField value={value as string | undefined} onChange={(v) => onChange(v)} />;
    case "stepper":
      return <StepperField field={field} value={value as number | undefined} onChange={(v) => onChange(v)} />;
    default:
      return null;
  }
}

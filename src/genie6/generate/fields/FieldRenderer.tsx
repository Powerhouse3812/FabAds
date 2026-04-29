import type { FieldType } from "../modeConfigs";
import { AnglePicker } from "./AnglePicker";
import { AudiencePicker } from "./AudiencePicker";
import { AvatarPicker } from "./AvatarPicker";
import { BrandPicker } from "./BrandPicker";
import { CountPicker } from "./CountPicker";
import { FormatPicker } from "./FormatPicker";
import { OutputTypePicker } from "./OutputTypePicker";
import { ProductPicker } from "./ProductPicker";
import { PromptOverride } from "./PromptOverride";
import { ReferencesPanel } from "./ReferencesPanel";
import { ScriptInput } from "./ScriptInput";
import { SourceImagePicker } from "./SourceImagePicker";
import { SourceWinnerPicker } from "./SourceWinnerPicker";
import { SubMethodPicker } from "./SubMethodPicker";
import { TonePicker } from "./TonePicker";
import { URLInput } from "./URLInput";
import { VoicePicker } from "./VoicePicker";

export function FieldRenderer({ type }: { type: FieldType }) {
  switch (type) {
    case "angle-picker":
      return <AnglePicker />;
    case "audience-picker":
      return <AudiencePicker />;
    case "avatar-picker":
      return <AvatarPicker />;
    case "brand-picker":
      return <BrandPicker />;
    case "count-picker":
      return <CountPicker />;
    case "format-picker":
      return <FormatPicker />;
    case "output-type-picker":
      return <OutputTypePicker />;
    case "product-picker":
      return <ProductPicker />;
    case "prompt-override":
      return <PromptOverride />;
    case "references-panel":
      return <ReferencesPanel />;
    case "script-input":
      return <ScriptInput />;
    case "source-image-picker":
      return <SourceImagePicker />;
    case "source-winner-picker":
      return <SourceWinnerPicker />;
    case "sub-method-picker":
      return <SubMethodPicker />;
    case "tone-picker":
      return <TonePicker />;
    case "url-input":
      return <URLInput />;
    case "voice-picker":
      return <VoicePicker />;
    default:
      return null;
  }
}

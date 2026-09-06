/**
 * Barrel for the Genie Brain module (Genie 2.0 §11, §13).
 *
 * `GenieBrain` is the client-facing page (route: `/iq/genie6/settings/brain`,
 * owned by the wiring agent). `AvatarVoicePicker` + the taxonomy it reads
 * from are the shared surface every other Genie 2.0 avatar-selection step
 * imports — Studio, Avatar Shots, PPT/PDF to Video, Product Placement, Face
 * Swap. One implementation; nobody re-forks it (§11: "the two must not
 * diverge").
 */
export { GenieBrain } from "./GenieBrain";
export { AvatarVoicePicker, type AvatarVoicePickerProps } from "./AvatarVoicePicker";
export { AssetCard, type AssetCardProps } from "./AssetCard";
export {
  AVATAR_ENVIRONMENTS,
  AVATAR_PERSONALITIES,
  VOICE_TONES,
  environmentLabel,
  personalityLabel,
  toneLabel,
  toneDesc,
  classifyTones,
  matchBrandTone,
  TONE_CONFLICTS,
  type TaxonomyOption,
  type EnvironmentId,
  type PersonalityId,
  type ToneId,
  type BrandToneMatch,
} from "./avatarTaxonomy";

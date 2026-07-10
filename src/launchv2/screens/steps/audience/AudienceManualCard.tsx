/**
 * AudienceManualCard — single bordered "manual audience" card.
 *
 * A self-contained, controlled leaf that edits the core targeting spec in a
 * 2-column grid (Figma: manual audience card). Field order:
 *   Row 1 — Age range (min/max pill steppers)      | Gender (All / Male / Female radios)
 *   Row 2 — Devices (Desktop / Mobile / iOS)        | OS (All / Android / iOS)
 *   Row 3 — Including Location                       | Excluding Location
 *   Row 4 — Language (full width, removable chips)
 *
 * The individual fields now live in ./targetingFields as standalone,
 * chrome-less components; this card just composes them inside its outer
 * rounded-2xl surface + SAC banner. Net visual output is unchanged.
 *
 * Writes to: targeting.ageMin, ageMax, genders, devicePlatforms, userOs,
 * geoLocations, excludedGeoLocations, locales — always via
 * onChange({ ...targeting, <field>: <next> }) (mirrors AgeGenderRow).
 *
 * Special ad category: Devices / OS / Location / Language are locked (reduced
 * opacity + non-interactive) with a single amber restriction banner, since
 * Special Ad Categories restrict this targeting.
 */

import { AlertTriangle } from "lucide-react";
import type { TargetingSpec } from "../../../types";
import {
  AgeField,
  GenderField,
  DevicesField,
  OsField,
  IncludeLocationField,
  ExcludeLocationField,
  LanguageField,
} from "./targetingFields";

interface AudienceManualCardProps {
  targeting: TargetingSpec;
  onChange: (next: TargetingSpec) => void;
  specialAdCategoryActive?: boolean;
}

export default function AudienceManualCard({ targeting, onChange, specialAdCategoryActive }: AudienceManualCardProps) {
  const locked = specialAdCategoryActive === true;

  return (
    <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] p-4 space-y-4">
      {locked && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            Special Ad Categories restrict age, gender, device, OS, location, and language targeting. Age is fixed
            at 13–65 and gender is set to All; these fields are locked.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* Row 1 · A — Age range */}
        <AgeField targeting={targeting} onChange={onChange} disabled={locked} />

        {/* Row 1 · B — Gender */}
        <GenderField targeting={targeting} onChange={onChange} disabled={locked} />

        {/* Row 2 · A — Devices */}
        <DevicesField targeting={targeting} onChange={onChange} disabled={locked} />

        {/* Row 2 · B — OS */}
        <OsField targeting={targeting} onChange={onChange} disabled={locked} />

        {/* Row 3 · A — Including Location */}
        <IncludeLocationField targeting={targeting} onChange={onChange} disabled={locked} />

        {/* Row 3 · B — Excluding Location */}
        <ExcludeLocationField targeting={targeting} onChange={onChange} disabled={locked} />

        {/* Row 4 — Language (full width) */}
        <LanguageField targeting={targeting} onChange={onChange} disabled={locked} className="md:col-span-2" />
      </div>
    </div>
  );
}

/**
 * AudienceEditorV2Chips — ultra-compact chip-summary-row variant of the
 * audience editor for Launch v2 Step 2.
 *
 * Renders a single row of editable pill chips (Location · Age · Gender · A+)
 * instead of the full AudienceEditor form. Clicking a chip expands an inline
 * edit panel below the row; clicking again collapses it.
 *
 * Design system: FabFunnel v1.2 — Geist Mono, lime tokens, rounded-full chips.
 * localStorage key for advanced-settings expansion: "lv2:aud:v2:advanced"
 */

import { useState, useEffect } from "react";
import {
  MapPin,
  Users,
  Users2,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Lock,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TargetingSpec } from "../../../types";
import LocationPicker from "./LocationPicker";
import AgeGenderRow from "./AgeGenderRow";
import TargetingTemplateModal from "./TargetingTemplateModal";

// ---- Types ----------------------------------------------------------------

export interface AudienceEditorV2ChipsProps {
  targeting: TargetingSpec;
  onChange: (t: TargetingSpec) => void;
  specialAdCategoryActive?: boolean;
}

type EditingField = "location" | "age" | "gender" | null;

// ---- Helpers ---------------------------------------------------------------

/** Returns the first human-readable geo name from a targeting spec, or null. */
function firstGeoName(targeting: TargetingSpec): string | null {
  const { geoLocations } = targeting;
  if (geoLocations.countries.length > 0) {
    // Countries are stored as ISO codes; try to display a readable name via a
    // small lookup. Only common ones needed for now — real implementation wires
    // to the same MOCK_LOCATIONS list in LocationPicker.
    const COUNTRY_NAMES: Record<string, string> = {
      IN: "India",
      US: "United States",
      GB: "United Kingdom",
      AE: "UAE",
      SG: "Singapore",
      AU: "Australia",
      CA: "Canada",
      DE: "Germany",
      FR: "France",
      JP: "Japan",
    };
    const code = geoLocations.countries[0];
    return COUNTRY_NAMES[code] ?? code;
  }
  if (geoLocations.cities.length > 0) return geoLocations.cities[0].name ?? null;
  if (geoLocations.regions.length > 0) return geoLocations.regions[0].name ?? null;
  if (geoLocations.geoMarkets.length > 0) return geoLocations.geoMarkets[0].name ?? null;
  if (geoLocations.zips.length > 0) return geoLocations.zips[0].name ?? null;
  return null;
}

/** Returns true if the targeting spec has no non-default configuration. */
function isTargetingEmpty(targeting: TargetingSpec): boolean {
  const { geoLocations, ageMin, ageMax, genders, customAudiences, flexibleSpec } = targeting;
  const hasGeo =
    geoLocations.countries.length > 0 ||
    geoLocations.cities.length > 0 ||
    geoLocations.regions.length > 0 ||
    geoLocations.zips.length > 0 ||
    geoLocations.geoMarkets.length > 0 ||
    geoLocations.customLocations.length > 0;
  const hasNonDefaultAge = (ageMin && ageMin !== 18) || (ageMax && ageMax !== 65);
  const hasGender = genders.length > 0;
  const hasAudiences = customAudiences.length > 0;
  const hasInterests = flexibleSpec.some(
    (g) => g.interests.length > 0 || g.behaviors.length > 0 || g.demographics.length > 0
  );
  return !hasGeo && !hasNonDefaultAge && !hasGender && !hasAudiences && !hasInterests;
}

// ---- Component -------------------------------------------------------------

export default function AudienceEditorV2Chips({
  targeting,
  onChange,
  specialAdCategoryActive = false,
}: AudienceEditorV2ChipsProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(() => {
    try {
      return localStorage.getItem("lv2:aud:v2:advanced") === "true";
    } catch {
      return false;
    }
  });
  const [modalOpen, setModalOpen] = useState(false);

  // Persist advanced state
  useEffect(() => {
    try {
      localStorage.setItem("lv2:aud:v2:advanced", String(showAdvanced));
    } catch {
      // localStorage unavailable (SSR / private mode) — no-op
    }
  }, [showAdvanced]);

  const locked = specialAdCategoryActive === true;

  // ---- Derived labels -------------------------------------------------------

  const geoName = firstGeoName(targeting);
  const isEmpty = isTargetingEmpty(targeting);

  const ageMin = targeting.ageMin || 18;
  const ageMax = targeting.ageMax || 65;
  const isDefaultAge = ageMin === 18 && ageMax === 65;

  const genderLabel: string = (() => {
    if (locked) return "All genders";
    const g = targeting.genders;
    if (!g || g.length === 0) return "All genders";
    if (g.length === 1 && g[0] === "male") return "Men only";
    if (g.length === 1 && g[0] === "female") return "Women only";
    return "All genders";
  })();

  const aPlus = targeting.advantageAudience;

  // ---- Toggle helpers -------------------------------------------------------

  function toggleField(field: "location" | "age" | "gender") {
    setEditingField((prev) => (prev === field ? null : field));
  }

  function closeEdit() {
    setEditingField(null);
  }

  // ---- Location change handlers (forwarded to TargetingSpec) ----------------

  function handleChangeIncluded(g: import("../../../types").GeoLocations) {
    onChange({ ...targeting, geoLocations: g });
  }

  function handleChangeExcluded(g: Partial<import("../../../types").GeoLocations>) {
    onChange({ ...targeting, excludedGeoLocations: g });
  }

  // ---- Chip rendering -------------------------------------------------------

  // Location chip
  const hasGeo = !!geoName;
  const locationLabel = hasGeo ? geoName! : "+ Location";
  const locationIsEditing = editingField === "location";

  const locationChip = (
    <button
      type="button"
      onClick={() => toggleField("location")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer",
        !hasGeo
          ? "border-dashed border-border text-muted-foreground hover:border-[#8FB821]/50"
          : locationIsEditing
          ? "border-[#8FB821] bg-[#1D2A09] text-[#C3E165]"
          : cn(
              "border-border bg-background text-foreground hover:border-[#8FB821]/50",
              aPlus && "opacity-70"
            )
      )}
      title={
        specialAdCategoryActive
          ? "Location (Special Ad Category active — zip codes and small radii restricted)"
          : undefined
      }
    >
      <MapPin className="h-3 w-3 shrink-0" />
      <span>{locationLabel}</span>
      {specialAdCategoryActive && hasGeo && (
        <span className="ml-0.5 text-[10px] font-mono text-muted-foreground">(SAC)</span>
      )}
    </button>
  );

  // Age chip — forced 18-65 + lock icon when SAC
  const ageLabel = locked ? "18 – 65" : isDefaultAge ? "+ Age" : `${ageMin} – ${ageMax}`;
  const hasCustomAge = !isDefaultAge && !locked;
  const ageIsEditing = editingField === "age";

  const ageChip = (
    <button
      type="button"
      onClick={() => {
        if (!locked) toggleField("age");
      }}
      disabled={locked}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-colors",
        locked
          ? "cursor-not-allowed border-border text-muted-foreground opacity-60"
          : !hasCustomAge
          ? "border-dashed border-border text-muted-foreground hover:border-[#8FB821]/50 cursor-pointer"
          : ageIsEditing
          ? "border-[#8FB821] bg-[#1D2A09] text-[#C3E165] cursor-pointer"
          : "border-border bg-background text-foreground hover:border-[#8FB821]/50 cursor-pointer"
      )}
    >
      {locked ? (
        <Lock className="h-3 w-3 shrink-0" />
      ) : (
        <Users className="h-3 w-3 shrink-0" />
      )}
      <span>{ageLabel}</span>
    </button>
  );

  // Gender chip — forced All + locked when SAC
  const hasCustomGender = !locked && targeting.genders.length > 0;
  const genderIsEditing = editingField === "gender";

  const genderChip = (
    <button
      type="button"
      onClick={() => {
        if (!locked) toggleField("gender");
      }}
      disabled={locked}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-colors",
        locked
          ? "cursor-not-allowed border-border text-muted-foreground opacity-60"
          : !hasCustomGender
          ? "border-dashed border-border text-muted-foreground hover:border-[#8FB821]/50 cursor-pointer"
          : genderIsEditing
          ? "border-[#8FB821] bg-[#1D2A09] text-[#C3E165] cursor-pointer"
          : "border-border bg-background text-foreground hover:border-[#8FB821]/50 cursor-pointer"
      )}
    >
      {locked ? (
        <Lock className="h-3 w-3 shrink-0" />
      ) : (
        <Users2 className="h-3 w-3 shrink-0" />
      )}
      <span>{genderLabel}</span>
    </button>
  );

  // Advantage+ chip — toggle immediately, no expand
  const advantagePlusChip = (
    <button
      type="button"
      onClick={() => onChange({ ...targeting, advantageAudience: !aPlus })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer",
        aPlus
          ? "border-[#495522] bg-[#1D2A09] text-[#C3E165] hover:border-[#8FB821]/80"
          : "border-border bg-background text-muted-foreground hover:border-[#8FB821]/50"
      )}
      title={
        aPlus
          ? "Advantage+ Audience ON — targeting acts as suggestions"
          : "Advantage+ Audience OFF — hard targeting constraints"
      }
    >
      <Zap
        className={cn("h-3 w-3 shrink-0", aPlus ? "text-[#C3E165]" : "text-muted-foreground")}
      />
      <span>{aPlus ? "A+ ON" : "A+ OFF"}</span>
    </button>
  );

  // Size indicator — static placeholder, real data wired later
  const sizeIndicator = (
    <div className="inline-flex items-center gap-1 ml-1">
      <div
        style={{
          width: "40px",
          height: "4px",
          background: "#2a2a2a",
          borderRadius: "4px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "65%",
            height: "100%",
            background: "#8FB821",
            borderRadius: "4px",
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground ml-1">~68M</span>
    </div>
  );

  // Advanced settings toggle
  const advancedToggleButton = (
    <button
      type="button"
      onClick={() => setShowAdvanced((v) => !v)}
      className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      Advanced
      {showAdvanced ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )}
    </button>
  );

  // ---- Empty state ghost chips (no geo + no targeting configured) -----------

  if (isEmpty && !editingField) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Ghost: Location */}
          <button
            type="button"
            onClick={() => setEditingField("location")}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:border-[#8FB821]/50 transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Location
          </button>
          {/* Ghost: Age */}
          <button
            type="button"
            onClick={() => !locked && setEditingField("age")}
            disabled={locked}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:border-[#8FB821]/50 transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Age
          </button>
          {/* Ghost: Gender */}
          <button
            type="button"
            onClick={() => !locked && setEditingField("gender")}
            disabled={locked}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:border-[#8FB821]/50 transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Gender
          </button>
          {/* A+ chip — always real even in empty state */}
          {advantagePlusChip}
        </div>

        {/* Inline edit panel when a ghost chip was clicked */}
        {editingField && (
          <div className="rounded-2xl border border-border bg-background p-3 relative">
            <button
              type="button"
              onClick={closeEdit}
              className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {editingField === "location" && (
              <LocationPicker
                geoLocations={targeting.geoLocations}
                excludedGeoLocations={targeting.excludedGeoLocations}
                onChangeIncluded={handleChangeIncluded}
                onChangeExcluded={handleChangeExcluded}
                specialAdCategoryActive={specialAdCategoryActive}
              />
            )}
            {(editingField === "age" || editingField === "gender") && (
              <AgeGenderRow
                targeting={targeting}
                onChange={onChange}
                specialAdCategoryActive={specialAdCategoryActive}
              />
            )}
          </div>
        )}

        <TargetingTemplateModal
          open={modalOpen}
          targeting={targeting}
          onChange={onChange}
          onClose={() => setModalOpen(false)}
          specialAdCategoryActive={specialAdCategoryActive}
        />
      </div>
    );
  }

  // ---- Populated / partial state --------------------------------------------

  return (
    <div className="space-y-2">
      {/* Chip row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {locationChip}
        {ageChip}
        {genderChip}
        {advantagePlusChip}
        {sizeIndicator}
        {advancedToggleButton}
      </div>

      {/* Inline edit panel */}
      {editingField && (
        <div className="rounded-2xl border border-border bg-background p-3 relative">
          <button
            type="button"
            onClick={closeEdit}
            className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {editingField === "location" && (
            <LocationPicker
              geoLocations={targeting.geoLocations}
              excludedGeoLocations={targeting.excludedGeoLocations}
              onChangeIncluded={handleChangeIncluded}
              onChangeExcluded={handleChangeExcluded}
              specialAdCategoryActive={specialAdCategoryActive}
            />
          )}

          {(editingField === "age" || editingField === "gender") && (
            <AgeGenderRow
              targeting={targeting}
              onChange={onChange}
              specialAdCategoryActive={specialAdCategoryActive}
            />
          )}
        </div>
      )}

      {/* Advanced settings expand */}
      {showAdvanced && (
        <div className="rounded-xl border border-border bg-background px-3 py-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Edit full targeting →
          </button>
        </div>
      )}

      <TargetingTemplateModal
        open={modalOpen}
        targeting={targeting}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        specialAdCategoryActive={specialAdCategoryActive}
      />
    </div>
  );
}

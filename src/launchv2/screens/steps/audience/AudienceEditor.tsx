/**
 * AudienceEditor — main composite audience editing surface for Launch v2.
 *
 * Decision 29: Full Meta-parity audience editor.
 * Decision 30: Designed for embedding in:
 *   - Step 2 §3 Audience section → use compact={true}
 *     Shows: locations + age/gender + advantage+ toggle + minimal size bar + Advanced Settings expandable
 *   - Review NodeEditPane for ad-set level nodes → use compact={false}
 *     Shows: all inline fields + detailed targeting link + full modal
 *
 * Decision 32: special_ad_category cascade
 *   When specialAdCategoryActive === true, shows top-level amber banner
 *   and passes the flag down to all child components, which enforce:
 *     - Age: forced 18–65
 *     - Gender: forced All
 *     - No zip codes, min 25km radius
 *     - No lookalike audiences
 *     - No detailed targeting
 *
 * NOTE: Import is handled by Wave 2 (Step2Setup) and Wave 4 (NodeEditPane)
 * in a separate integration step. This file is standalone and self-contained.
 */

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TargetingSpec } from "../../../types";
import LocationPicker from "./LocationPicker";
import AgeGenderRow from "./AgeGenderRow";
import CustomLookalikeRow from "./CustomLookalikeRow";
import AudienceSizeMeter from "./AudienceSizeMeter";
import TargetingTemplateModal from "./TargetingTemplateModal";
import AudienceEditorV2Chips from "./AudienceEditorV2Chips";

export interface AudienceEditorProps {
  /** Current targeting state from plan */
  targeting: TargetingSpec;
  /** Write back on any change */
  onChange: (t: TargetingSpec) => void;
  /** Gates certain fields per Meta policy for Special Ad Categories */
  specialAdCategoryActive?: boolean;
  /**
   * Compact mode for inline use in Step 2 §3 Audience section.
   * Shows: locations + age/gender + advantage+ toggle + minimal size bar + Advanced Settings expandable.
   * Does NOT show CustomLookalikeRow or DetailedTargeting inline.
   *
   * Full mode (compact=false): all inline fields + "Edit detailed targeting" link + modal.
   * Use in Review NodeEditPane at ad-set level.
   */
  compact?: boolean;
}

export default function AudienceEditor({
  targeting,
  onChange,
  specialAdCategoryActive,
  compact = false,
}: AudienceEditorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(() => {
    try { return localStorage.getItem("lv2:aud:advanced") === "1"; } catch { return false; }
  });
  const [layoutVariant, setLayoutVariant] = useState<"standard" | "chips">(() => {
    try { return (localStorage.getItem("lv2:aud:layout") as "standard" | "chips") || "standard"; }
    catch { return "standard"; }
  });

  const locked = specialAdCategoryActive === true;

  function switchLayout(v: "standard" | "chips") {
    setLayoutVariant(v);
    try { localStorage.setItem("lv2:aud:layout", v); } catch {}
  }

  // Advantage+ audience toggle
  function toggleAdvantageAudience(on: boolean) {
    onChange({ ...targeting, advantageAudience: on });
  }

  // Location write-backs
  function handleLocationsChange(g: TargetingSpec["geoLocations"]) {
    onChange({ ...targeting, geoLocations: g });
  }

  function handleExcludedLocationsChange(g: Partial<TargetingSpec["geoLocations"]>) {
    onChange({ ...targeting, excludedGeoLocations: g });
  }

  function toggleAdvanced() {
    const next = !advancedOpen;
    setAdvancedOpen(next);
    try { localStorage.setItem("lv2:aud:advanced", next ? "1" : "0"); } catch {}
  }

  // Advantage+ info chip — reused in Advanced Settings (compact) or inline (full)
  const advantageInfoChip = targeting.advantageAudience ? (
    <div className="flex items-center gap-1.5 rounded-xl bg-[#F5FBE2] dark:bg-[#1D2A09] border border-[#749818]/30 dark:border-[#C3E165]/20 px-3 py-1.5">
      <Info className="h-3.5 w-3.5 shrink-0 text-[#5B7611] dark:text-[#C3E165]" />
      <p className="text-[11px] font-mono text-[#5B7611] dark:text-[#C3E165]">
        Meta will automatically expand your audience for best results. Manual targeting below acts as suggestions.
      </p>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      {/* V1 / V2 layout toggle (compact mode only) */}
      {compact && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            Audience
          </span>
          <div className="inline-flex items-center rounded-full bg-muted p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => switchLayout("standard")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-mono transition-colors",
                layoutVariant === "standard"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => switchLayout("chips")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-mono transition-colors",
                layoutVariant === "chips"
                  ? "bg-[#1D2A09] text-[#C3E165] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Chips
            </button>
          </div>
        </div>
      )}

      {/* V2 chips variant — compact mode only */}
      {compact && layoutVariant === "chips" && (
        <AudienceEditorV2Chips
          targeting={targeting}
          onChange={onChange}
          specialAdCategoryActive={specialAdCategoryActive}
        />
      )}

      {/* V1 standard variant — always in full mode, or when standard selected in compact */}
      {(!compact || layoutVariant === "standard") && <>

      {/* Special Ad Category top-level banner */}
      {locked && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-0.5">
            <p className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">
              Special Ad Category restrictions apply
            </p>
            <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
              Some targeting options are limited per Meta policy. Age is fixed at 18–65, gender is All, zip codes are unavailable, lookalike audiences are disabled, and detailed targeting is restricted.
            </p>
          </div>
        </div>
      )}

      {/* Advantage+ Audience toggle */}
      <div className="rounded-2xl border border-border bg-background px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Advantage+ Audience</p>
            <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
              Let Meta automatically find the best audience based on your ad and pixel data.
            </p>
          </div>
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={targeting.advantageAudience}
            onClick={() => toggleAdvantageAudience(!targeting.advantageAudience)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] transition-colors focus:outline-none focus:ring-4 focus:ring-[#8FB821]/30",
              targeting.advantageAudience
                ? "border-[#8FB821] bg-[#8FB821]"
                : "border-border bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                targeting.advantageAudience ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        {/* In full mode, show A+ info chip inline */}
        {!compact && advantageInfoChip}
      </div>

      {/* Manual targeting fields — shown when advantage+ is OFF, or always as suggestions when ON */}
      <div
        className={cn(
          "space-y-4",
          targeting.advantageAudience && "opacity-70"
        )}
      >
        {targeting.advantageAudience && (
          <p className="text-[11px] font-mono text-muted-foreground px-1">
            Targeting below acts as audience suggestions when Advantage+ is on.
          </p>
        )}

        {/* §1 Locations */}
        <div className="space-y-2">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">Locations</p>
          <LocationPicker
            geoLocations={targeting.geoLocations}
            excludedGeoLocations={targeting.excludedGeoLocations}
            onChangeIncluded={handleLocationsChange}
            onChangeExcluded={handleExcludedLocationsChange}
            specialAdCategoryActive={specialAdCategoryActive}
          />
        </div>

        {/* §2 Age & Gender */}
        <div className="space-y-2">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            Age &amp; Gender
          </p>
          <AgeGenderRow
            targeting={targeting}
            onChange={onChange}
            specialAdCategoryActive={specialAdCategoryActive}
          />
        </div>

        {/* §3 Custom & Lookalike — only in full mode */}
        {!compact && (
          <div className="space-y-2">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
              Custom &amp; Lookalike Audiences
            </p>
            <CustomLookalikeRow
              customAudiences={targeting.customAudiences}
              excludedCustomAudiences={targeting.excludedCustomAudiences}
              onChangeAudiences={(a) => onChange({ ...targeting, customAudiences: a })}
              onChangeExcluded={(a) => onChange({ ...targeting, excludedCustomAudiences: a })}
              specialAdCategoryActive={specialAdCategoryActive}
            />
          </div>
        )}
      </div>

      {/* Audience size — full card in full mode, minimal bar in compact mode */}
      {!compact ? (
        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <AudienceSizeMeter targeting={targeting} />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-1">
          <div className="h-1 w-10 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[65%] rounded-full bg-[#8FB821]" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">~68M est.</span>
        </div>
      )}

      {/* "Edit detailed targeting" link — full mode only (outside Advanced Settings) */}
      {!compact && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-[13px] font-mono text-[#5B7611] dark:text-[#C3E165] hover:underline underline-offset-2 transition-colors"
        >
          Edit detailed targeting
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Advanced settings expandable — compact mode only */}
      {compact && (
        <div>
          <button
            type="button"
            onClick={toggleAdvanced}
            className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Advanced settings</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                advancedOpen && "rotate-180"
              )}
            />
          </button>

          {advancedOpen && (
            <div className="mt-2 space-y-3 rounded-xl border border-border bg-background px-3 py-3">
              {/* A+ info chip (only when advantage+ is on) */}
              {advantageInfoChip}

              {/* Edit targeting link */}
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 text-[12px] font-mono text-[#5B7611] dark:text-[#C3E165] hover:underline underline-offset-2 transition-colors"
              >
                Edit full targeting
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full-screen targeting modal */}
      <TargetingTemplateModal
        open={modalOpen}
        targeting={targeting}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
        specialAdCategoryActive={specialAdCategoryActive}
      />

      </>}
    </div>
  );
}

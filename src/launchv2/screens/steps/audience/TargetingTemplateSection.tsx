/**
 * TargetingTemplateSection — unified template picker + inline audience editor.
 *
 * Replaces the Step 2 template-picker + AudienceEditor combo with a single
 * surface that handles:
 *   1. Template combobox (search + filter via popover from Step2Setup)
 *   2. Info chips row (when template selected)
 *   3. Feature toggles — Advantage+ Audience + Advantage+ Creative
 *   4. Light demographic preview (read-only 1-liner)
 *   5. Expand-to-edit button
 *   6. Inline edit area (LocationPicker + AgeGenderRow)
 *   7. TargetingTemplateModal (advanced settings)
 */

import { useState } from "react";
import {
  MapPin,
  Calendar,
  Users,
  Zap,
  ChevronDown,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanV2 } from "../../../types";
import { TARGETING_TEMPLATES, getTemplate } from "../../../data";
import TargetingTemplateModal from "./TargetingTemplateModal";

interface TargetingTemplateSectionProps {
  plan: PlanV2;
  onPatch: (partial: Partial<PlanV2>) => void;
  specialAdCategoryActive?: boolean;
  /** Rendered between A+ Creative card and Advanced configurations button */
  placementsSlot?: React.ReactNode;
}

// ── helpers ────────────────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India", US: "United States", GB: "United Kingdom", AU: "Australia",
  CA: "Canada", DE: "Germany", FR: "France", BR: "Brazil", AE: "UAE", SG: "Singapore",
};

function genderLabel(genders: ("male" | "female")[]): string {
  if (!genders || genders.length === 0) return "All";
  if (genders.length === 1) return genders[0] === "male" ? "Men" : "Women";
  return "All";
}

function firstGeoName(plan: PlanV2): string {
  const { geoLocations } = plan.targeting;
  if (geoLocations.countries.length > 0) {
    const code = geoLocations.countries[0];
    return COUNTRY_NAMES[code] ?? code;
  }
  if (geoLocations.cities.length > 0) return geoLocations.cities[0].name ?? geoLocations.cities[0].key;
  if (geoLocations.regions.length > 0) return geoLocations.regions[0].name ?? geoLocations.regions[0].key;
  return "Worldwide";
}

// ── chip component ──────────────────────────────────────────────────────────

function InfoChip({
  icon: Icon,
  label,
  lime,
}: {
  icon: React.ElementType;
  label: string;
  lime?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
      <Icon
        className={cn(
          "h-3 w-3 shrink-0",
          lime && "text-[#8FB821] dark:text-[#C3E165]",
        )}
      />
      {label}
    </span>
  );
}

// ── main component ──────────────────────────────────────────────────────────

export default function TargetingTemplateSection({
  plan,
  onPatch,
  specialAdCategoryActive,
  placementsSlot,
}: TargetingTemplateSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [tplSearch, setTplSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeTpl = getTemplate(plan.targetingTemplateId);

  // ── apply template ────────────────────────────────────────────────────────

  function applyTemplate(tplId: string) {
    const tpl = getTemplate(tplId);
    if (!tpl) return;

    // Build a minimal GeoLocations update from template settings.locations string
    // (matches the pattern from Step2Setup: only patch templateId; no deep geo parsing here
    //  since the template data uses a string label, not a GeoLocations object)
    onPatch({
      targetingTemplateId: tplId,
      advantageAudience: tpl.advantageAudience,
      advantageCreative: tpl.advantageCreative,
      targeting: {
        ...plan.targeting,
        ageMin: tpl.settings.ageMin,
        ageMax: tpl.settings.ageMax,
        genders:
          tpl.settings.gender === "men"
            ? ["male"]
            : tpl.settings.gender === "women"
            ? ["female"]
            : [],
        advantageAudience: tpl.advantageAudience,
      },
    });
  }

  function clearTemplate() {
    onPatch({ targetingTemplateId: null });
    setPickerOpen(false);
  }

  // ── demographic preview ────────────────────────────────────────────────

  const previewGeo = firstGeoName(plan);
  const previewAge = `${plan.targeting.ageMin}–${plan.targeting.ageMax}`;
  const previewGender = genderLabel(plan.targeting.genders);

  // ── filtered template list ─────────────────────────────────────────────

  const filteredTpls = TARGETING_TEMPLATES.filter((t) =>
    tplSearch
      ? t.name.toLowerCase().includes(tplSearch.toLowerCase()) ||
        t.summary.some((s) => s.toLowerCase().includes(tplSearch.toLowerCase()))
      : true,
  );

  return (
    <div className="space-y-3">
      {/* ── 1. Template picker row ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Combobox trigger */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-[28px] border border-border bg-background px-3 py-2 text-[13px] shadow-sm transition-colors",
              "hover:border-[#8FB821]/60 focus:outline-none focus:ring-4 focus:ring-[#8FB821]/20",
              !activeTpl && "text-muted-foreground",
            )}
          >
            <span className="truncate">
              {activeTpl ? activeTpl.name : "No template — custom setup"}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </button>

          {/* Dropdown */}
          {pickerOpen && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-2xl border border-border bg-[#FFFFFF] dark:bg-[#1E1E23] shadow-md overflow-hidden">
              {/* Search */}
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search templates…"
                  value={tplSearch}
                  onChange={(e) => setTplSearch(e.target.value)}
                  className="w-full bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                {tplSearch && (
                  <button
                    type="button"
                    onClick={() => setTplSearch("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Template list */}
              <div className="max-h-52 overflow-y-auto py-1">
                {filteredTpls.length === 0 ? (
                  <div className="px-3 py-3 text-center text-[11px] font-mono text-muted-foreground">
                    No templates match
                  </div>
                ) : (
                  filteredTpls.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        applyTemplate(t.id);
                        setPickerOpen(false);
                        setTplSearch("");
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-muted/50",
                        plan.targetingTemplateId === t.id && "bg-[#F5FBE2] dark:bg-[#1D2A09] font-medium text-[#5B7611] dark:text-[#C3E165]",
                      )}
                    >
                      <span className="block font-medium">{t.name}</span>
                      <span className="block text-[10px] font-mono text-muted-foreground">
                        {t.summary.join(" · ")}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Template CTAs — shown when a template is active */}
        {activeTpl && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={clearTemplate}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-[#8FB821]/40 bg-[#F5FBE2] px-2.5 text-[11px] font-mono text-[#5B7611] transition-colors hover:bg-[#EBF6BF] dark:bg-[#1D2A09] dark:border-[#C3E165]/30 dark:text-[#C3E165] dark:hover:bg-[#2C3F10]"
            >
              New template
            </button>
          </div>
        )}
      </div>

      {/* Backdrop dismisser */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setPickerOpen(false);
            setTplSearch("");
          }}
        />
      )}

      {/* ── 2. Info chips row (template selected) ─────────────────────── */}
      {activeTpl && (
        <div className="flex flex-wrap gap-1.5">
          <InfoChip
            icon={MapPin}
            label={activeTpl.settings.locations}
          />
          <InfoChip
            icon={Calendar}
            label={`${activeTpl.settings.ageMin}–${activeTpl.settings.ageMax}`}
          />
          <InfoChip
            icon={Users}
            label={
              activeTpl.settings.gender === "men"
                ? "Men"
                : activeTpl.settings.gender === "women"
                ? "Women"
                : "All"
            }
          />
          <InfoChip
            icon={Zap}
            label={activeTpl.advantageAudience ? "A+ ON" : "A+ OFF"}
            lime={activeTpl.advantageAudience}
          />
        </div>
      )}

      {/* ── 3. Advantage+ Audience — full-width card with inline summary ── */}
      <div className={cn(
        "rounded-2xl border bg-background transition-colors",
        plan.advantageAudience
          ? "border-[#8FB821]/40 bg-[#F5FBE2] dark:bg-[#1D2A09]"
          : "border-border"
      )}>
        {/* Toggle row */}
        <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Advantage+ Audience</p>
            <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
              Meta expands your audience to find people likely to convert.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={plan.advantageAudience}
            onClick={() => {
              onPatch({
                advantageAudience: !plan.advantageAudience,
                targeting: {
                  ...plan.targeting,
                  advantageAudience: !plan.advantageAudience,
                },
              });
            }}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] transition-colors focus:outline-none focus:ring-4 focus:ring-[#8FB821]/30",
              plan.advantageAudience
                ? "border-[#8FB821] bg-[#8FB821]"
                : "border-border bg-muted",
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                plan.advantageAudience ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>

        {/* Summary strip — inside the card */}
        <div className={cn(
          "flex flex-col gap-2 border-t px-4 pb-3 pt-2.5",
          plan.advantageAudience ? "border-[#8FB821]/20" : "border-border/40"
        )}>
          {plan.advantageAudience ? (
            /* A+ ON: info message */
            <div className="flex items-start gap-1.5">
              <Info className="h-3 w-3 shrink-0 mt-0.5 text-[#5B7611] dark:text-[#C3E165]" />
              <p className="text-[11px] font-mono text-[#5B7611] dark:text-[#C3E165]">
                Meta will automatically expand beyond your targeting suggestions for best results.
              </p>
            </div>
          ) : (
            /* A+ OFF: demographic preview */
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-muted-foreground">{previewGeo}</span>
              <span className="text-[10px] font-mono text-muted-foreground">·</span>
              <span className="text-[10px] font-mono text-muted-foreground">{previewAge}</span>
              <span className="text-[10px] font-mono text-muted-foreground">·</span>
              <span className="text-[10px] font-mono text-muted-foreground">{previewGender} genders</span>
            </div>
          )}

          {/* Est. reach — always shown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">Est. reach</span>
            <div className="h-1 w-16 overflow-hidden rounded-full bg-muted/60">
              <div className={cn(
                "h-full rounded-full transition-all",
                plan.advantageAudience ? "w-[85%] bg-[#8FB821]" : "w-[55%] bg-[#8FB821]/70"
              )} />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {plan.advantageAudience ? "~120M" : "~68M"}
            </span>
          </div>
        </div>
      </div>

      {/* Placement slot — injected by parent when A+ Audience is OFF */}
      {placementsSlot}

      {/* ── 5. Advanced configurations — opens modal ─────────────────── */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 text-[11px] font-mono text-[#5B7611] dark:text-[#C3E165] hover:underline"
      >
        <ChevronRight className="h-3.5 w-3.5" />
        Advanced configurations
      </button>

      {/* ── 6. TargetingTemplateModal (advanced settings) ─────────────── */}
      <TargetingTemplateModal
        open={modalOpen}
        targeting={plan.targeting}
        onChange={(t) => onPatch({ targeting: t, targetingTemplateId: null })}
        onClose={() => setModalOpen(false)}
        specialAdCategoryActive={specialAdCategoryActive}
      />
    </div>
  );
}

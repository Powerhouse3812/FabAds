/**
 * TargetingTemplateModal — full-screen modal for editing the complete targeting spec.
 *
 * Sections:
 *   1. Locations        — LocationPicker (full version)
 *   2. Demographics     — age/gender + language multi-select
 *   3. Audiences        — CustomLookalikeRow
 *   4. Detailed Targeting — DetailedTargetingPanel
 *   5. Connections      — mock: page like checkbox (display only)
 *
 * Header: "Edit Targeting" + AudienceSizeMeter + [Cancel] [Save] buttons
 * Save → calls onChange(editedTargeting); Cancel → discards local edits
 */

import { useState, useEffect } from "react";
import { X, Check, Globe, Users, Target, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TargetingSpec, TargetingTermRef } from "../../../types";
import LocationPicker from "./LocationPicker";
import AgeGenderRow from "./AgeGenderRow";
import CustomLookalikeRow from "./CustomLookalikeRow";
import DetailedTargetingPanel from "./DetailedTargetingPanel";
import AudienceSizeMeter from "./AudienceSizeMeter";

interface TargetingTemplateModalProps {
  open: boolean;
  targeting: TargetingSpec;
  onChange: (t: TargetingSpec) => void;
  onClose: () => void;
  specialAdCategoryActive?: boolean;
  /** Optional: called when user wants to persist current edits as a new template. */
  onSaveAsNew?: (targeting: TargetingSpec) => void;
}

const LANGUAGE_OPTIONS: TargetingTermRef[] = [
  { id: "6", name: "English" },
  { id: "21", name: "Hindi" },
  { id: "56", name: "Tamil" },
  { id: "85", name: "Telugu" },
  { id: "23", name: "Kannada" },
  { id: "13", name: "Bengali" },
  { id: "42", name: "Marathi" },
  { id: "32", name: "Gujarati" },
  { id: "68", name: "Punjabi" },
];

const SECTIONS = [
  { id: "locations", label: "Locations", icon: Globe },
  { id: "demographics", label: "Demographics", icon: Users },
  { id: "audiences", label: "Audiences", icon: Users },
  { id: "detailed", label: "Detailed Targeting", icon: Target },
  { id: "connections", label: "Connections", icon: Link2 },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function TargetingTemplateModal({
  open,
  targeting,
  onChange,
  onClose,
  specialAdCategoryActive,
  onSaveAsNew,
}: TargetingTemplateModalProps) {
  // Local draft — changes are not applied until Save
  const [draft, setDraft] = useState<TargetingSpec>(targeting);
  const [activeSection, setActiveSection] = useState<SectionId>("locations");

  // Sync draft when modal opens with latest targeting
  useEffect(() => {
    if (open) setDraft(targeting);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function handleSave() {
    onChange(draft);
    onClose();
  }

  function handleCancel() {
    setDraft(targeting); // discard local edits
    onClose();
  }

  function handleSaveAndApply() {
    onChange(draft);
    onClose();
  }

  function handleSaveAsNew() {
    if (onSaveAsNew) {
      onSaveAsNew(draft);
    } else {
      // Placeholder — save-as-new wiring is deferred
      console.log("[TargetingTemplateModal] Save as new template — not yet wired", draft);
      onClose();
    }
  }

  function toggleLanguage(locale: TargetingTermRef) {
    const exists = draft.locales.some((l) => l.id === locale.id);
    if (exists) {
      setDraft({ ...draft, locales: draft.locales.filter((l) => l.id !== locale.id) });
    } else {
      setDraft({ ...draft, locales: [...draft.locales, locale] });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative flex h-[90vh] w-[780px] max-w-[95vw] flex-col rounded-2xl bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-[19px] font-bold tracking-[-0.01em] text-foreground">Edit Targeting</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-full bg-[#8FB821] px-4 py-1.5 text-[13px] font-medium text-[#121212] transition-colors hover:bg-[#AACF32]"
            >
              <Check className="h-4 w-4" />
              Save targeting
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Audience size meter — below header */}
        <div className="border-b border-border px-6 py-3 shrink-0">
          <AudienceSizeMeter targeting={draft} />
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 min-h-0">
          {/* Section sidebar */}
          <nav className="flex w-44 shrink-0 flex-col gap-0.5 border-r border-border bg-muted/20 px-2 py-3">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors",
                    activeSection === s.id
                      ? "bg-[#F5FBE2] text-[#5B7611] dark:bg-[#2C3F10] dark:text-[#C3E165]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Section content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* §1 Locations */}
            {activeSection === "locations" && (
              <div className="space-y-3">
                <h3 className="text-[15px] font-bold tracking-[-0.01em]">Locations</h3>
                <LocationPicker
                  geoLocations={draft.geoLocations}
                  excludedGeoLocations={draft.excludedGeoLocations}
                  onChangeIncluded={(g) => setDraft({ ...draft, geoLocations: g })}
                  onChangeExcluded={(g) => setDraft({ ...draft, excludedGeoLocations: g })}
                  specialAdCategoryActive={specialAdCategoryActive}
                />
              </div>
            )}

            {/* §2 Demographics */}
            {activeSection === "demographics" && (
              <div className="space-y-4">
                <h3 className="text-[15px] font-bold tracking-[-0.01em]">Demographics</h3>

                <div className="space-y-2">
                  <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Age &amp; Gender</p>
                  <AgeGenderRow
                    targeting={draft}
                    onChange={(t) => setDraft(t)}
                    specialAdCategoryActive={specialAdCategoryActive}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Languages</p>
                  <p className="text-[12px] font-mono text-muted-foreground">
                    Leave blank to show to all languages (recommended for broader reach).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const active = draft.locales.some((l) => l.id === lang.id);
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                            active
                              ? "border-[#8FB821] bg-[#F5FBE2] text-[#5B7611] dark:bg-[#2C3F10] dark:text-[#C3E165]"
                              : "border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {lang.name}
                        </button>
                      );
                    })}
                  </div>

                  {draft.locales.length > 0 && (
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Targeting {draft.locales.map((l) => l.name).join(", ")} speakers only.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* §3 Audiences */}
            {activeSection === "audiences" && (
              <div className="space-y-3">
                <h3 className="text-[15px] font-bold tracking-[-0.01em]">Custom &amp; Lookalike Audiences</h3>
                <CustomLookalikeRow
                  customAudiences={draft.customAudiences}
                  excludedCustomAudiences={draft.excludedCustomAudiences}
                  onChangeAudiences={(a) => setDraft({ ...draft, customAudiences: a })}
                  onChangeExcluded={(a) => setDraft({ ...draft, excludedCustomAudiences: a })}
                  specialAdCategoryActive={specialAdCategoryActive}
                />
              </div>
            )}

            {/* §4 Detailed Targeting */}
            {activeSection === "detailed" && (
              <div className="space-y-3">
                <h3 className="text-[15px] font-bold tracking-[-0.01em]">Detailed Targeting</h3>
                <p className="text-[12px] font-mono text-muted-foreground">
                  Include people based on interests, behaviors, and demographics. These work as OR conditions within a group, and AND between groups.
                </p>
                <DetailedTargetingPanel
                  flexibleSpec={draft.flexibleSpec}
                  exclusions={draft.exclusions}
                  onChangeFlexibleSpec={(spec) => setDraft({ ...draft, flexibleSpec: spec })}
                  onChangeExclusions={(excl) => setDraft({ ...draft, exclusions: excl })}
                  specialAdCategoryActive={specialAdCategoryActive}
                />
              </div>
            )}

            {/* §5 Connections */}
            {activeSection === "connections" && (
              <div className="space-y-4">
                <h3 className="text-[15px] font-bold tracking-[-0.01em]">Connections</h3>
                <p className="text-[12px] font-mono text-muted-foreground">
                  Refine your audience based on their connection to your Page, app, or event.
                </p>

                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 space-y-3">
                  <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Page connections</p>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-[#8FB821]"
                      disabled
                    />
                    <span className="text-[13px] text-muted-foreground">People who like your Page</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                      Mock — not wired
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-[#8FB821]"
                      disabled
                    />
                    <span className="text-[13px] text-muted-foreground">Friends of people who like your Page</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                      Mock — not wired
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-[#8FB821]"
                      disabled
                    />
                    <span className="text-[13px] text-muted-foreground">Exclude people who like your Page</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                      Mock — not wired
                    </span>
                  </label>
                </div>

                <p className="text-[11px] font-mono text-muted-foreground">
                  Connections API wiring is deferred. These controls are display-only.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border bg-[#FAFAF7] dark:bg-[#1E1E23] px-6 py-3 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-border px-4 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAsNew}
            className="rounded-full border border-border bg-background px-4 py-2 text-[12px] font-mono text-foreground hover:bg-muted transition-colors"
          >
            Save as new template
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="flex items-center gap-1.5 rounded-full bg-[#8FB821] px-4 py-2 text-[12px] font-mono text-[#121212] font-semibold hover:bg-[#AACF32] transition-colors"
          >
            <Check className="h-4 w-4" />
            Save &amp; apply
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * TargetingTemplateModal — full-screen modal for editing the complete targeting spec.
 *
 * Tab IA (Figma: fileKey 1A3Nl99HIjBi0HgNaLmOFh, "Edit Targeting"):
 *   1. Audience          — Age & gender, Location, Languages
 *   2. Placements        — Advantage+ / manual placement accordion tree
 *   3. Detailed targeting — Location / Interest / Behaviour accordion
 *
 * Header: title + subtitle + X. Footer: Cancel / Save as new / Save template.
 * Save → calls onChange(editedTargeting) [+ onChangePlacementMode/onChangePlacements
 * when the caller supplies plan-level placement props]; Cancel discards local edits.
 */

import { useState, useEffect } from "react";
import { X, Check, Users, Send, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TargetingSpec, TargetingTermRef, PlacementSelection } from "../../../types";
import { DEFAULT_PLACEMENTS } from "../../../data";
import LocationPicker from "./LocationPicker";
import AgeGenderRow from "./AgeGenderRow";
import DetailedTargetingPanel from "./DetailedTargetingPanel";
import PlacementsPanel from "./PlacementsPanel";
import AudienceSizeMeter from "./AudienceSizeMeter";

interface TargetingTemplateModalProps {
  open: boolean;
  targeting: TargetingSpec;
  onChange: (t: TargetingSpec) => void;
  onClose: () => void;
  specialAdCategoryActive?: boolean;
  /** Optional: called when user wants to persist current edits as a new template. */
  onSaveAsNew?: (targeting: TargetingSpec) => void;
  /** Optional plan-level placement slice — Placements tab degrades to local-only state if omitted. */
  placementMode?: "advantage" | "manual";
  onChangePlacementMode?: (mode: "advantage" | "manual") => void;
  placements?: PlacementSelection;
  onChangePlacements?: (next: PlacementSelection) => void;
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
  { id: "3", name: "Spanish" },
  { id: "9", name: "German" },
];

const SECTIONS = [
  { id: "audience", label: "Audience", icon: Users },
  { id: "placements", label: "Placements", icon: Send },
  { id: "detailed", label: "Detailed targeting", icon: Target },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/* ── Shared bordered card shell — matches Figma's "*Input* / Textarea" container ── */
function Section({
  title,
  helper,
  children,
}: {
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] overflow-hidden">
      <div className="px-4 py-3">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        {helper && <p className="mt-1 text-[11px] font-mono text-muted-foreground">{helper}</p>}
      </div>
      <div className="border-t border-[#e7e5dc] dark:border-[#2a2a2a] px-4 py-4">{children}</div>
    </div>
  );
}

/* ── Languages — search + removable pill picker (mirrors LocationPicker's pattern) ── */
function LanguagePicker({
  selected,
  onAdd,
  onRemove,
}: {
  selected: TargetingTermRef[];
  onAdd: (l: TargetingTermRef) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selectedIds = new Set(selected.map((l) => l.id));
  const filtered = LANGUAGE_OPTIONS.filter(
    (l) => !selectedIds.has(l.id) && l.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex items-center gap-2 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#8FB821]/30 transition-shadow">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Select language"
            className="w-full bg-transparent text-[13px] text-foreground placeholder-muted-foreground focus:outline-none"
          />
        </div>
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] shadow-md">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-[12px] font-mono text-muted-foreground">
                {query ? `No results for "${query}"` : "All languages added"}
              </p>
            ) : (
              filtered.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    onAdd(l);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-[13px] hover:bg-muted transition-colors"
                >
                  {l.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-1.5 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-3 py-1 text-sm"
            >
              <span className="text-[12px] text-foreground">{l.name}</span>
              <button
                type="button"
                onClick={() => onRemove(l.id)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TargetingTemplateModal({
  open,
  targeting,
  onChange,
  onClose,
  specialAdCategoryActive,
  onSaveAsNew,
  placementMode,
  onChangePlacementMode,
  placements,
  onChangePlacements,
}: TargetingTemplateModalProps) {
  // Local draft — changes are not applied until Save
  const [draft, setDraft] = useState<TargetingSpec>(targeting);
  const [draftPlacementMode, setDraftPlacementMode] = useState<"advantage" | "manual">(placementMode ?? "advantage");
  const [draftPlacements, setDraftPlacements] = useState<PlacementSelection>(placements ?? DEFAULT_PLACEMENTS);
  const [activeSection, setActiveSection] = useState<SectionId>("audience");

  // Sync draft when modal opens with latest targeting / placements
  useEffect(() => {
    if (open) {
      setDraft(targeting);
      setDraftPlacementMode(placementMode ?? "advantage");
      setDraftPlacements(placements ?? DEFAULT_PLACEMENTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function commit() {
    onChange(draft);
    onChangePlacementMode?.(draftPlacementMode);
    onChangePlacements?.(draftPlacements);
  }

  function handleSave() {
    commit();
    onClose();
  }

  function handleCancel() {
    setDraft(targeting); // discard local edits
    setDraftPlacementMode(placementMode ?? "advantage");
    setDraftPlacements(placements ?? DEFAULT_PLACEMENTS);
    onClose();
  }

  function handleSaveAsNew() {
    if (onSaveAsNew) {
      onSaveAsNew(draft);
    } else {
      // Placeholder — save-as-new wiring is deferred
      console.log("[TargetingTemplateModal] Save as new template — not yet wired", draft);
    }
  }

  function addLanguage(locale: TargetingTermRef) {
    if (draft.locales.some((l) => l.id === locale.id)) return;
    setDraft({ ...draft, locales: [...draft.locales, locale] });
  }

  function removeLanguage(id: string) {
    setDraft({ ...draft, locales: draft.locales.filter((l) => l.id !== id) });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative flex h-[88vh] max-h-[760px] w-[840px] max-w-[95vw] flex-col rounded-2xl bg-white dark:bg-[#1E1E23] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#e7e5dc] dark:border-[#2a2a2a] px-6 py-4 shrink-0">
          <div className="flex flex-col min-w-0">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-foreground">Edit Targeting</h2>
            <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
              Choose who sees this ad set and where your ads appear
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 min-h-0">
          {/* Section sidebar */}
          <nav
            className="relative flex w-52 shrink-0 flex-col gap-0.5 border-r border-[#e7e5dc] dark:border-[#2a2a2a] px-3 py-4 overflow-hidden"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 160px 110px at 30% 30%, rgba(212,240,117,0.16), rgba(212,240,117,0) 75%)",
            }}
          >
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "relative z-10 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors",
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
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {/* Tab 1: Audience */}
            {activeSection === "audience" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#F5FBE2] dark:bg-[#1D2A09] px-4 py-3">
                  <AudienceSizeMeter targeting={draft} />
                </div>

                <Section title="Age &amp; gender">
                  <AgeGenderRow
                    targeting={draft}
                    onChange={(t) => setDraft(t)}
                    specialAdCategoryActive={specialAdCategoryActive}
                  />
                </Section>

                <Section title="Location">
                  <LocationPicker
                    geoLocations={draft.geoLocations}
                    excludedGeoLocations={draft.excludedGeoLocations}
                    onChangeIncluded={(g) => setDraft({ ...draft, geoLocations: g })}
                    onChangeExcluded={(g) => setDraft({ ...draft, excludedGeoLocations: g })}
                    specialAdCategoryActive={specialAdCategoryActive}
                  />
                </Section>

                <Section
                  title="Languages"
                  helper="Leave blank to show to all languages (recommended for broader reach)."
                >
                  <LanguagePicker selected={draft.locales} onAdd={addLanguage} onRemove={removeLanguage} />
                </Section>
              </div>
            )}

            {/* Tab 2: Placements */}
            {activeSection === "placements" && (
              <PlacementsPanel
                placementMode={draftPlacementMode}
                onChangeMode={setDraftPlacementMode}
                placements={draftPlacements}
                onChangePlacements={setDraftPlacements}
              />
            )}

            {/* Tab 3: Detailed targeting */}
            {activeSection === "detailed" && (
              <DetailedTargetingPanel
                flexibleSpec={draft.flexibleSpec}
                exclusions={draft.exclusions}
                onChangeFlexibleSpec={(spec) => setDraft({ ...draft, flexibleSpec: spec })}
                onChangeExclusions={(excl) => setDraft({ ...draft, exclusions: excl })}
                specialAdCategoryActive={specialAdCategoryActive}
                geoLocations={draft.geoLocations}
                excludedGeoLocations={draft.excludedGeoLocations}
                onChangeGeoIncluded={(g) => setDraft({ ...draft, geoLocations: g })}
                onChangeGeoExcluded={(g) => setDraft({ ...draft, excludedGeoLocations: g })}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B] px-6 py-3 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-4 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveAsNew}
              className="rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-4 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Save as new
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-full bg-[#8FB821] dark:bg-[#90BA24] px-5 py-1.5 text-[13px] font-medium text-[#121212] transition-colors hover:brightness-95"
            >
              <Check className="h-3.5 w-3.5" />
              Save template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

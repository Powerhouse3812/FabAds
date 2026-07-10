/**
 * targetingFields — container-agnostic Step-2 Targeting field components.
 *
 * These are the extracted, "chrome-less" building blocks that back the manual
 * audience editor. Each field renders JUST its label + control (no outer card,
 * no border) so that multiple Step-2 layout variants can compose the SAME
 * fields inside their own surfaces without card-in-card stacking.
 *
 * Shared contract — every field takes:
 *   { targeting: TargetingSpec; onChange: (next: TargetingSpec) => void; disabled?: boolean; className?: string }
 * where `disabled` drives the Special-Ad-Category lock (age+gender forced &
 * disabled; devices / OS / location / language dimmed + non-interactive) and
 * `className` is forwarded to the field's <Field> shell (e.g. md:col-span-2).
 *
 * Behaviour is identical to the previous inline implementation in
 * AudienceManualCard — including the NumberPill local-draft-commit-on-blur,
 * peer-focus-visible rings, and the SAC forced 13–65 / gender=All display.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TargetingSpec, DevicePlatform, UserOs, TargetingTermRef } from "../../../types";
import LocationPicker from "./LocationPicker";

/* ── Constants ──────────────────────────────────────────────────────────── */

export const AGE_MIN = 13;
export const AGE_MAX = 65;

export function clampAge(v: number) {
  if (Number.isNaN(v)) return AGE_MIN;
  return Math.min(AGE_MAX, Math.max(AGE_MIN, v));
}

export type GenderValue = "male" | "female";

export const GENDER_OPTIONS: { label: string; value: GenderValue | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

export const DEVICE_OPTIONS: { label: string; value: DevicePlatform }[] = [
  { label: "Desktop", value: "desktop" },
  { label: "Mobile", value: "mobile" },
  { label: "iOS", value: "ios" },
];

export const OS_OPTIONS: { label: string; value: UserOs }[] = [
  { label: "Android", value: "android" },
  { label: "iOS", value: "ios" },
];

export const LANGUAGE_OPTIONS: TargetingTermRef[] = [
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

/** Shared prop contract for every chrome-less targeting field. */
export interface TargetingFieldProps {
  targeting: TargetingSpec;
  onChange: (next: TargetingSpec) => void;
  /** Special-Ad-Category lock: forces/disables the control. */
  disabled?: boolean;
  /** Forwarded to the field's <Field> shell (e.g. "md:col-span-2"). */
  className?: string;
}

/** Applied to the control wrapper when the field is locked (SAC). */
function lockedControlClass(disabled?: boolean) {
  return cn(disabled && "pointer-events-none select-none opacity-40");
}

/* ── Field shell — 13px label + control ─────────────────────────────────── */
export function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[13px] text-foreground">{label}</p>
      {children}
    </div>
  );
}

/* ── Pill number input with up/down stepper (Age range) ─────────────────── */
export function NumberPill({
  value,
  onChange,
  ariaLabel,
  placeholder,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const display = value >= AGE_MAX ? "65+" : String(value);
  // Local draft string so typing isn't clamped/committed on every keystroke
  // (e.g. clearing the field to retype no longer snaps back to AGE_MIN).
  const [draft, setDraft] = useState<string | null>(null);

  function commit(raw: string) {
    if (raw === "") {
      onChange(clampAge(value));
    } else {
      onChange(clampAge(Number(raw)));
    }
    setDraft(null);
  }

  return (
    <div className="flex h-9 items-center overflow-hidden rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] focus-within:ring-2 focus-within:ring-[#8FB821]/30 transition-shadow">
      <input
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={draft ?? display}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={(e) => commit(e.target.value.replace(/[^\d]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit((e.target as HTMLInputElement).value.replace(/[^\d]/g, ""));
        }}
        className="min-w-0 flex-1 bg-transparent px-3.5 text-[13px] font-mono tabular-nums text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
      />
      <div className="flex h-full flex-col border-l border-[#e7e5dc] dark:border-[#2a2a2a]">
        <button
          type="button"
          aria-label={`Increase ${ariaLabel}`}
          disabled={disabled}
          onClick={() => onChange(clampAge(value + 1))}
          className="flex h-1/2 w-6 items-center justify-center text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed"
        >
          <ChevronUp className="h-2.5 w-2.5" />
        </button>
        <button
          type="button"
          aria-label={`Decrease ${ariaLabel}`}
          disabled={disabled}
          onClick={() => onChange(clampAge(value - 1))}
          className="flex h-1/2 w-6 items-center justify-center border-t border-[#e7e5dc] dark:border-[#2a2a2a] text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed"
        >
          <ChevronDown className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Checkbox option (Devices / OS) — dark #121212 fill + white check ───── */
export function CheckOption({
  checked,
  label,
  onToggle,
  disabled,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex items-center gap-2", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={onToggle} />
      <span
        className={cn(
          "peer-focus-visible:ring-2 peer-focus-visible:ring-[#8FB821]/40 peer-focus-visible:ring-offset-1",
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors",
          checked
            ? "border-[#121212] bg-[#121212] text-white dark:border-white dark:bg-white dark:text-[#121212]"
            : "border-[#e7e5dc] dark:border-[#2a2a2a]"
        )}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path
              d="M1 3.5L3.2 5.5L8 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-[13px] text-foreground">{label}</span>
    </label>
  );
}

/* ── Language multiselect — search + removable pill chips ───────────────── */
export function LanguagePicker({
  selected,
  onAdd,
  onRemove,
  disabled,
}: {
  selected: TargetingTermRef[];
  onAdd: (l: TargetingTermRef) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selectedIds = new Set(selected.map((l) => l.id));
  const filtered = LANGUAGE_OPTIONS.filter(
    (l) => !selectedIds.has(l.id) && l.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-2">
      <div ref={wrapRef} className="relative">
        <div className="flex items-center gap-2 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#8FB821]/30 transition-shadow">
          <input
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => !disabled && setOpen(true)}
            placeholder="Select language"
            className="w-full bg-transparent text-[13px] text-foreground placeholder-muted-foreground focus:outline-none disabled:cursor-not-allowed"
          />
        </div>
        {open && !disabled && (
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
              className="flex items-center gap-1.5 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#1E1E23] px-3 py-1 text-sm"
            >
              <span className="text-[13px] text-foreground">{l.name}</span>
              <button
                type="button"
                onClick={() => onRemove(l.id)}
                disabled={disabled}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border hover:text-foreground disabled:cursor-not-allowed"
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

/* ── Field components — chrome-less (label + control only) ──────────────── */

/** Age range — two NumberPills. When locked, shows forced AGE_MIN / AGE_MAX. */
export function AgeField({ targeting, onChange, disabled, className }: TargetingFieldProps) {
  const displayAgeMin = disabled ? AGE_MIN : targeting.ageMin;
  const displayAgeMax = disabled ? AGE_MAX : targeting.ageMax;

  function setAgeMin(val: number) {
    if (disabled) return;
    const safeMin = clampAge(val);
    const safeMax = Math.max(safeMin, targeting.ageMax);
    onChange({ ...targeting, ageMin: safeMin, ageMax: safeMax });
  }
  function setAgeMax(val: number) {
    if (disabled) return;
    const safeMax = Math.max(targeting.ageMin, clampAge(val));
    onChange({ ...targeting, ageMax: safeMax });
  }

  return (
    <Field label="Age range" className={className}>
      <div className="grid grid-cols-2 gap-2">
        <NumberPill
          ariaLabel="Minimum age"
          value={displayAgeMin}
          onChange={setAgeMin}
          placeholder="Enter min age"
          disabled={disabled}
        />
        <NumberPill
          ariaLabel="Maximum age"
          value={displayAgeMax}
          onChange={setAgeMax}
          placeholder="Enter max age"
          disabled={disabled}
        />
      </div>
    </Field>
  );
}

/** Gender — All / Male / Female radios. When locked, forces "All". */
export function GenderField({ targeting, onChange, disabled, className }: TargetingFieldProps) {
  const currentGender: GenderValue | "all" = targeting.genders.length === 1 ? targeting.genders[0] : "all";

  function setGender(val: GenderValue | "all") {
    if (disabled) return;
    const genders: GenderValue[] = val === "all" ? [] : [val];
    onChange({ ...targeting, genders });
  }

  return (
    <Field label="Gender" className={className}>
      <div className="flex h-9 items-center gap-4">
        {GENDER_OPTIONS.map((opt) => {
          const isActive = disabled ? opt.value === "all" : currentGender === opt.value;
          return (
            <label
              key={opt.value}
              className={cn("flex items-center gap-2", disabled ? "cursor-not-allowed" : "cursor-pointer")}
              title={disabled ? "Gender is fixed to All for Special Ad Categories" : undefined}
            >
              <input
                type="radio"
                name="audience-gender"
                className="peer sr-only"
                checked={isActive}
                disabled={disabled}
                onChange={() => setGender(opt.value)}
              />
              <span
                className={cn(
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-[#8FB821]/40 peer-focus-visible:ring-offset-1",
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                  isActive
                    ? "border-[#121212] bg-[#FAFAF7] dark:border-white dark:bg-[#2A2A2A]"
                    : "border-[#e7e5dc] dark:border-[#2a2a2a]"
                )}
              >
                {isActive && <span className="h-2 w-2 rounded-full bg-[#121212] dark:bg-white" />}
              </span>
              <span className="text-[13px] text-foreground">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}

/** Devices — Desktop / Mobile / iOS checkboxes → targeting.devicePlatforms. */
export function DevicesField({ targeting, onChange, disabled, className }: TargetingFieldProps) {
  function toggleDevice(v: DevicePlatform) {
    const has = targeting.devicePlatforms.includes(v);
    const next = has ? targeting.devicePlatforms.filter((d) => d !== v) : [...targeting.devicePlatforms, v];
    onChange({ ...targeting, devicePlatforms: next });
  }

  return (
    <Field label="Devices" className={className}>
      <div className={cn("flex h-9 flex-wrap items-center gap-x-4 gap-y-2", lockedControlClass(disabled))}>
        {DEVICE_OPTIONS.map((opt) => (
          <CheckOption
            key={opt.value}
            label={opt.label}
            checked={targeting.devicePlatforms.includes(opt.value)}
            onToggle={() => toggleDevice(opt.value)}
            disabled={disabled}
          />
        ))}
      </div>
    </Field>
  );
}

/** OS — All / Android / iOS checkboxes → targeting.userOs (All = empty array). */
export function OsField({ targeting, onChange, disabled, className }: TargetingFieldProps) {
  const osAll = targeting.userOs.length === 0;
  function toggleOs(v: UserOs) {
    const has = targeting.userOs.includes(v);
    const next = has ? targeting.userOs.filter((o) => o !== v) : [...targeting.userOs, v];
    onChange({ ...targeting, userOs: next });
  }

  return (
    <Field label="OS" className={className}>
      <div className={cn("flex h-9 flex-wrap items-center gap-x-4 gap-y-2", lockedControlClass(disabled))}>
        <CheckOption
          label="All"
          checked={osAll}
          onToggle={() => onChange({ ...targeting, userOs: [] })}
          disabled={disabled}
        />
        {OS_OPTIONS.map((opt) => (
          <CheckOption
            key={opt.value}
            label={opt.label}
            checked={targeting.userOs.includes(opt.value)}
            onToggle={() => toggleOs(opt.value)}
            disabled={disabled}
          />
        ))}
      </div>
    </Field>
  );
}

/** Language — wraps LanguagePicker → targeting.locales. */
export function LanguageField({ targeting, onChange, disabled, className }: TargetingFieldProps) {
  function addLanguage(locale: TargetingTermRef) {
    if (targeting.locales.some((l) => l.id === locale.id)) return;
    onChange({ ...targeting, locales: [...targeting.locales, locale] });
  }
  function removeLanguage(id: string) {
    onChange({ ...targeting, locales: targeting.locales.filter((l) => l.id !== id) });
  }

  return (
    <Field label="Language" className={className}>
      <div className={lockedControlClass(disabled)}>
        <LanguagePicker
          selected={targeting.locales}
          onAdd={addLanguage}
          onRemove={removeLanguage}
          disabled={disabled}
        />
      </div>
    </Field>
  );
}

/**
 * Including Location — convenience wrapper around <LocationPicker variant="include-only">
 * that maps onChangeIncluded/onChangeExcluded onto the onChange(next TargetingSpec) contract.
 */
export function IncludeLocationField({ targeting, onChange, disabled, className }: TargetingFieldProps) {
  return (
    <Field label="Including Location" className={className}>
      <div className={lockedControlClass(disabled)}>
        <LocationPicker
          variant="include-only"
          geoLocations={targeting.geoLocations}
          excludedGeoLocations={targeting.excludedGeoLocations}
          onChangeIncluded={(g) => onChange({ ...targeting, geoLocations: g })}
          onChangeExcluded={(g) => onChange({ ...targeting, excludedGeoLocations: g })}
          specialAdCategoryActive={disabled}
        />
      </div>
    </Field>
  );
}

/**
 * Excluding Location — convenience wrapper around <LocationPicker variant="exclude-only">.
 * See IncludeLocationField.
 */
export function ExcludeLocationField({ targeting, onChange, disabled, className }: TargetingFieldProps) {
  return (
    <Field label="Excluding Location" className={className}>
      <div className={lockedControlClass(disabled)}>
        <LocationPicker
          variant="exclude-only"
          geoLocations={targeting.geoLocations}
          excludedGeoLocations={targeting.excludedGeoLocations}
          onChangeIncluded={(g) => onChange({ ...targeting, geoLocations: g })}
          onChangeExcluded={(g) => onChange({ ...targeting, excludedGeoLocations: g })}
          specialAdCategoryActive={disabled}
        />
      </div>
    </Field>
  );
}

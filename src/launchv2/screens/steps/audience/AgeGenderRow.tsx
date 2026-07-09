/**
 * AgeGenderRow — age min/max stepper inputs + gender radio group.
 *
 * Writes to: targeting.ageMin, targeting.ageMax, targeting.genders
 *
 * Special ad category behaviour:
 *   - Forces age 18–65, gender "All" (empty array)
 *   - Disables all inputs with tooltip explanation
 *   - Shows amber restriction banner
 */

import { ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TargetingSpec } from "../../../types";

interface AgeGenderRowProps {
  targeting: TargetingSpec;
  onChange: (t: TargetingSpec) => void;
  specialAdCategoryActive?: boolean;
}

const AGE_MIN = 18;
const AGE_MAX = 65;

type GenderValue = "male" | "female";
const GENDER_OPTIONS: { label: string; value: GenderValue | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

function clamp(v: number) {
  if (Number.isNaN(v)) return AGE_MIN;
  return Math.min(AGE_MAX, Math.max(AGE_MIN, v));
}

function AgeStepper({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  label: string;
}) {
  const display = value >= AGE_MAX ? "65+" : String(value);

  return (
    <div
      className={cn(
        "flex h-9 items-center overflow-hidden rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23]",
        disabled && "opacity-40"
      )}
    >
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={display}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          if (raw === "") return;
          onChange(clamp(Number(raw)));
        }}
        className="w-12 bg-transparent px-3 text-[13px] font-mono tabular-nums text-foreground focus:outline-none disabled:cursor-not-allowed"
      />
      <div className="flex h-full flex-col border-l border-[#e7e5dc] dark:border-[#2a2a2a]">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(clamp(value + 1))}
          className="flex h-1/2 w-6 items-center justify-center text-muted-foreground hover:bg-muted disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp className="h-2.5 w-2.5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(clamp(value - 1))}
          className="flex h-1/2 w-6 items-center justify-center border-t border-[#e7e5dc] dark:border-[#2a2a2a] text-muted-foreground hover:bg-muted disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}

export default function AgeGenderRow({ targeting, onChange, specialAdCategoryActive }: AgeGenderRowProps) {
  const locked = specialAdCategoryActive === true;

  const currentGender: GenderValue | "all" =
    targeting.genders.length === 0
      ? "all"
      : targeting.genders.length === 1
      ? targeting.genders[0]
      : "all";

  function setAgeMin(val: number) {
    if (locked) return;
    const safeMin = Math.max(AGE_MIN, val);
    const safeMax = Math.max(safeMin, targeting.ageMax);
    onChange({ ...targeting, ageMin: safeMin, ageMax: safeMax });
  }

  function setAgeMax(val: number) {
    if (locked) return;
    const safeMax = Math.max(targeting.ageMin, val);
    onChange({ ...targeting, ageMax: safeMax });
  }

  function setGender(val: GenderValue | "all") {
    if (locked) return;
    const genders: GenderValue[] = val === "all" ? [] : [val];
    onChange({ ...targeting, genders });
  }

  return (
    <div className="space-y-3">
      {locked && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            Age and gender targeting is restricted for Special Ad Categories. Age is fixed at 18–65 and gender is set to All.
          </p>
        </div>
      )}

      {/* Age range */}
      <div className="space-y-1.5">
        <p className="text-[13px] text-foreground">Age range</p>
        <div className="flex items-center gap-3.5">
          <AgeStepper
            label="Minimum age"
            value={locked ? AGE_MIN : targeting.ageMin}
            onChange={setAgeMin}
            disabled={locked}
          />
          <span className="text-[11px] text-muted-foreground">to</span>
          <AgeStepper
            label="Maximum age"
            value={locked ? AGE_MAX : targeting.ageMax}
            onChange={setAgeMax}
            disabled={locked}
          />
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-1.5">
        <p className="text-[13px] text-foreground">Gender</p>
        <div className="flex items-center gap-4">
          {GENDER_OPTIONS.map((opt) => {
            const isActive = locked ? opt.value === "all" : currentGender === opt.value;
            return (
              <label
                key={opt.value}
                className={cn("flex items-center gap-2 cursor-pointer", locked && "cursor-not-allowed opacity-40")}
                title={locked ? "Gender is fixed to All for Special Ad Categories" : undefined}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                    isActive ? "border-[#8FB821] dark:border-[#90BA24]" : "border-[#e7e5dc] dark:border-[#2a2a2a]"
                  )}
                >
                  {isActive && <span className="h-2 w-2 rounded-full bg-[#8FB821] dark:bg-[#90BA24]" />}
                </span>
                <span className="text-[13px] text-foreground">{opt.label}</span>
                <input
                  type="radio"
                  name="gender"
                  className="sr-only"
                  checked={isActive}
                  disabled={locked}
                  onChange={() => setGender(opt.value)}
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

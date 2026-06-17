/**
 * AgeGenderRow — inline age min/max + gender chip selector.
 *
 * Writes to: targeting.ageMin, targeting.ageMax, targeting.genders
 *
 * Special ad category behaviour:
 *   - Forces age 18–65, gender "All" (empty array)
 *   - Disables all inputs with tooltip explanation
 *   - Shows amber restriction banner
 */

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TargetingSpec } from "../../../types";

interface AgeGenderRowProps {
  targeting: TargetingSpec;
  onChange: (t: TargetingSpec) => void;
  specialAdCategoryActive?: boolean;
}

const AGE_MIN_OPTIONS = Array.from({ length: 48 }, (_, i) => i + 18); // 18–65
const AGE_MAX_OPTIONS = [...Array.from({ length: 48 }, (_, i) => i + 18), 65]; // 18–65, then "65+"

type GenderValue = "male" | "female";
const GENDER_CHIPS: { label: string; value: GenderValue | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Men", value: "male" },
  { label: "Women", value: "female" },
];

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
    const safeMin = Math.max(18, val);
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

  const inputBase =
    "h-8 rounded-[28px] border border-border bg-background px-3 text-[13px] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#8FB821]/40 transition-shadow";

  return (
    <div className="space-y-2.5">
      {locked && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            Age and gender targeting is restricted for Special Ad Categories. Age is fixed at 18–65 and gender is set to All.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {/* Age min */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">Age</span>
          <div className="relative">
            <select
              value={locked ? 18 : targeting.ageMin}
              onChange={(e) => setAgeMin(Number(e.target.value))}
              disabled={locked}
              title={locked ? "Age is fixed at 18–65 for Special Ad Categories" : undefined}
              className={cn(
                inputBase,
                "appearance-none pr-6",
                locked && "cursor-not-allowed opacity-40"
              )}
            >
              {AGE_MIN_OPTIONS.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">▾</span>
          </div>
          <span className="text-[11px] text-muted-foreground">–</span>
          {/* Age max */}
          <div className="relative">
            <select
              value={locked ? 65 : targeting.ageMax}
              onChange={(e) => setAgeMax(Number(e.target.value))}
              disabled={locked}
              title={locked ? "Age is fixed at 18–65 for Special Ad Categories" : undefined}
              className={cn(
                inputBase,
                "appearance-none pr-6",
                locked && "cursor-not-allowed opacity-40"
              )}
            >
              {AGE_MAX_OPTIONS.map((age, i) => {
                const isLast = i === AGE_MAX_OPTIONS.length - 1;
                return (
                  <option key={`max-${age}-${i}`} value={age}>
                    {isLast ? "65+" : age}
                  </option>
                );
              })}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">▾</span>
          </div>
        </div>

        {/* Gender chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">Gender</span>
          <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5">
            {GENDER_CHIPS.map((chip) => {
              const isActive =
                locked
                  ? chip.value === "all"
                  : currentGender === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setGender(chip.value)}
                  disabled={locked}
                  title={locked ? "Gender is fixed to All for Special Ad Categories" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                    isActive
                      ? "bg-[#F5FBE2] text-[#5B7611] dark:bg-[#2C3F10] dark:text-[#C3E165]"
                      : "text-muted-foreground hover:bg-muted",
                    locked && "cursor-not-allowed opacity-40"
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

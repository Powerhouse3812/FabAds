/**
 * LaunchNomenclatureModal — Settings modal for configuring the launch name
 * prefix format (objective token, date token, separator, custom text).
 *
 * Exports:
 *   loadNomenclatureSettings()  — reads from localStorage, returns defaults
 *   computePrefix()             — builds the prefix string from settings
 *   LaunchNomenclatureModal     — default export React component
 *
 * Storage key: "fabads.launch.nomenclature"
 */

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────────────────── */

export type DateFormat = "MMM YYYY" | "MM/YY" | "YYYY-MM";
export type Separator = "·" | "-" | "_";

export interface NomenclatureSettings {
  showObjective: boolean;
  showDate: boolean;
  dateFormat: DateFormat;
  separator: Separator;
  customPrefix: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/* ── Constants ──────────────────────────────────────────────────────────────── */

const STORAGE_KEY = "fabads.launch.nomenclature";

const DEFAULT_SETTINGS: NomenclatureSettings = {
  showObjective: true,
  showDate: true,
  dateFormat: "MMM YYYY",
  separator: "·",
  customPrefix: "",
};

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: "MMM YYYY", label: "Jun 2026" },
  { value: "MM/YY", label: "06/26" },
  { value: "YYYY-MM", label: "2026-06" },
];

const SEPARATOR_OPTIONS: { value: Separator; label: string }[] = [
  { value: "·", label: "·" },
  { value: "-", label: "-" },
  { value: "_", label: "_" },
];

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

export function loadNomenclatureSettings(): NomenclatureSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<NomenclatureSettings>;
    return {
      showObjective: parsed.showObjective ?? DEFAULT_SETTINGS.showObjective,
      showDate: parsed.showDate ?? DEFAULT_SETTINGS.showDate,
      dateFormat: parsed.dateFormat ?? DEFAULT_SETTINGS.dateFormat,
      separator: parsed.separator ?? DEFAULT_SETTINGS.separator,
      customPrefix: parsed.customPrefix ?? DEFAULT_SETTINGS.customPrefix,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function formatDate(fmt: DateFormat): string {
  const now = new Date();
  switch (fmt) {
    case "MMM YYYY":
      return format(now, "MMM yyyy");
    case "MM/YY":
      return format(now, "MM/yy");
    case "YYYY-MM":
      return format(now, "yyyy-MM");
    default:
      return format(now, "MMM yyyy");
  }
}

function objectiveToLabel(objective: string): string {
  const stripped = objective.startsWith("OUTCOME_")
    ? objective.slice("OUTCOME_".length)
    : objective;
  if (!stripped) return "";
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase();
}

export function computePrefix(
  objective: string,
  settings: NomenclatureSettings
): string {
  const tokens: string[] = [];

  if (settings.showObjective) {
    const label = objectiveToLabel(objective);
    if (label) tokens.push(label);
  }

  if (settings.showDate) {
    tokens.push(formatDate(settings.dateFormat));
  }

  if (settings.customPrefix.trim()) {
    tokens.push(settings.customPrefix.trim());
  }

  if (tokens.length === 0) return "";

  const sep = ` ${settings.separator} `;
  return tokens.join(sep) + sep;
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

interface ToggleRowProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, hint, checked, onChange }: ToggleRowProps) {
  const id = `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={id}
          className="text-[13px] font-medium leading-[21px] text-[rgba(15,15,12,0.92)] cursor-pointer select-none"
        >
          {label}
        </label>
        <span className="font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.55)]">
          {hint}
        </span>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8FB821]/30",
          checked
            ? "bg-[#8FB821] border-[#8FB821]"
            : "bg-[#e7e5dc] border-[#e7e5dc]"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

interface PillGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: PillGroupProps<T>) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-8 px-4 rounded-full font-mono text-[11px] font-semibold leading-none transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8FB821]/30",
              active
                ? "bg-[#8FB821] text-[#121212] border border-[#8FB821]"
                : "bg-transparent text-[rgba(15,15,12,0.62)] border border-[#e7e5dc] hover:border-[#8FB821]/60 hover:text-[rgba(15,15,12,0.92)]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */

export default function LaunchNomenclatureModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<NomenclatureSettings>(() =>
    loadNomenclatureSettings()
  );

  // Re-load from storage each time modal opens so local state is fresh
  useEffect(() => {
    if (open) {
      setSettings(loadNomenclatureSettings());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const set = useCallback(
    <K extends keyof NomenclatureSettings>(
      key: K,
      value: NomenclatureSettings[K]
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage unavailable — fail silently
    }
    onClose();
  }, [settings, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const preview = computePrefix("OUTCOME_SALES", settings);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nomenclature-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col"
        style={{ maxHeight: "calc(100vh - 48px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e7e5dc]">
          <div>
            <h2
              id="nomenclature-modal-title"
              className="text-[15px] font-bold leading-[23px] tracking-[-0.01em] text-[rgba(15,15,12,0.92)]"
            >
              Name prefix format
            </h2>
            <p className="font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.55)] mt-0.5">
              Applied to campaigns, ad sets and ads on launch
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center w-8 h-8 rounded-full text-[rgba(15,15,12,0.55)] hover:text-[rgba(15,15,12,0.92)] hover:bg-[#F0F0EC] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8FB821]/30"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6">
          {/* Section: Prefix tokens */}
          <div className="border-b border-[#e7e5dc]">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] pt-4 pb-1">
              Prefix tokens
            </p>
            <ToggleRow
              label="Objective name"
              hint="Sales, Leads, Traffic…"
              checked={settings.showObjective}
              onChange={(v) => set("showObjective", v)}
            />
            <ToggleRow
              label="Month + Year"
              hint={formatDate(settings.dateFormat)}
              checked={settings.showDate}
              onChange={(v) => set("showDate", v)}
            />
          </div>

          {/* Section: Date format (conditional) */}
          {settings.showDate && (
            <div className="border-b border-[#e7e5dc] py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] mb-3">
                Date format
              </p>
              <PillGroup
                options={DATE_FORMAT_OPTIONS}
                value={settings.dateFormat}
                onChange={(v) => set("dateFormat", v)}
              />
            </div>
          )}

          {/* Section: Separator */}
          <div className="border-b border-[#e7e5dc] py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] mb-3">
              Separator
            </p>
            <PillGroup
              options={SEPARATOR_OPTIONS}
              value={settings.separator}
              onChange={(v) => set("separator", v)}
            />
          </div>

          {/* Section: Custom text */}
          <div className="border-b border-[#e7e5dc] py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] mb-3">
              Custom text
            </p>
            <input
              type="text"
              value={settings.customPrefix}
              onChange={(e) => set("customPrefix", e.target.value)}
              placeholder="e.g. Retargeting, TopFunnel"
              maxLength={40}
              className="w-full h-9 px-3.5 rounded-[28px] border border-[#e7e5dc] bg-transparent font-mono text-[12px] text-[rgba(15,15,12,0.92)] placeholder:text-[rgba(15,15,12,0.35)] focus:outline-none focus:border-[#8FB821] transition-colors duration-150"
              style={{
                boxShadow: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 0 4px rgba(143,184,33,0.18)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <p className="font-mono text-[10px] leading-[15px] text-[rgba(15,15,12,0.55)] mt-2">
              Appended after objective / date. Optional.
            </p>
          </div>

          {/* Section: Preview */}
          <div className="py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] mb-2">
              Preview
            </p>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F5FBE2] border border-[#e7e5dc]">
              {preview ? (
                <span className="font-mono text-[12px] text-[rgba(15,15,12,0.92)] tracking-[-0.01em]">
                  <span className="text-[#5B7611]">[</span>
                  {preview.replace(/\s$/, "")}
                  <span className="text-[#5B7611]">]</span>
                  <span className="text-[rgba(15,15,12,0.35)] ml-1">
                    Campaign name
                  </span>
                </span>
              ) : (
                <span className="font-mono text-[12px] text-[rgba(15,15,12,0.35)]">
                  No prefix — campaign name only
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-b-2xl bg-[#fbfbf9] border-t border-[#e7e5dc]">
          <button
            onClick={handleCancel}
            className="h-8 px-4 rounded-full text-[13px] font-medium text-[rgba(15,15,12,0.62)] hover:text-[rgba(15,15,12,0.92)] hover:bg-[#F0F0EC] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8FB821]/30"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-8 px-5 rounded-full text-[13px] font-medium bg-[#8FB821] text-[#121212] hover:bg-[#AACF32] active:bg-[#5B7611] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8FB821]/30"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

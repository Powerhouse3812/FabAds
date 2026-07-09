/**
 * LaunchSettings — Global defaults for all new launches.
 *
 * Two-column layout:
 *   Left  — Budget & Intent · Advantage+ · Attribution · UTM
 *   Right — Nomenclature builder (Campaign / Ad Set / Ad)
 *
 * Persisted via defaultsService (localStorage).
 * No dependency on the live flow state machine — self-contained.
 */

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  loadDefaults,
  saveDefaults,
  resetDefaults,
  type LaunchDefaults,
} from "../../services/defaultsService";
import type { BidStrategy } from "../../types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/* ─────────────────────────────────────────────────────────────────── */
/*  Nomenclature sub-component (inline — no flow dependency)          */
/* ─────────────────────────────────────────────────────────────────── */

interface NomToken {
  key: string;
  desc: string;
}

const CAMPAIGN_TOKENS: NomToken[] = [
  { key: "{brand}", desc: "account brand prefix" },
  { key: "{objective}", desc: "e.g. sales" },
  { key: "{intent}", desc: "test / scale / custom" },
  { key: "{date}", desc: "launch date YYYY-MM-DD" },
];

const ADSET_TOKENS: NomToken[] = [
  { key: "{brand}", desc: "account brand prefix" },
  { key: "{objective}", desc: "e.g. sales" },
  { key: "{intent}", desc: "test / scale / custom" },
  { key: "{date}", desc: "launch date YYYY-MM-DD" },
];

const AD_TOKENS: NomToken[] = [
  { key: "{brand}", desc: "account brand prefix" },
  { key: "{intent}", desc: "test / scale / custom" },
  { key: "{date}", desc: "launch date YYYY-MM-DD" },
  { key: "{adset}", desc: "ad set number (01, 02…)" },
  { key: "{n}", desc: "sequential ad number" },
];

// Sample values for live preview
const PREVIEW_VALS: Record<string, string> = {
  "{brand}": "Mamaearth",
  "{objective}": "sales",
  "{intent}": "scale",
  "{date}": new Date().toISOString().slice(0, 10),
  "{adset}": "IN-Metro",
  "{n}": "1",
};

function resolvePreview(pattern: string): string {
  return Object.entries(PREVIEW_VALS).reduce(
    (acc, [token, val]) => acc.split(token).join(val),
    pattern,
  );
}

interface NomRowProps {
  label: string;
  value: string;
  tokens: NomToken[];
  onChange: (v: string) => void;
}

function NomRow({ label, value, tokens, onChange }: NomRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const insertToken = (token: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value + token);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.setSelectionRange(start + token.length, start + token.length);
      el.focus();
    });
  };

  const preview = resolvePreview(value);

  return (
    <div className="space-y-2">
      {/* Sub-label */}
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        {label}
      </span>

      {/* Token chips */}
      <div className="flex flex-wrap gap-1.5">
        {tokens.map((t) => (
          <button
            key={t.key}
            type="button"
            title={t.desc}
            onClick={() => insertToken(t.key)}
            className={cn(
              "rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] transition-colors cursor-pointer",
              "border-[#749818] bg-[#F5FBE2] text-[#5B7611]",
              "dark:border-[#C3E165] dark:bg-[#1D2A09] dark:text-[#C3E165]",
              "hover:bg-[#EBF6BF] dark:hover:bg-[#2C3F10]",
            )}
          >
            {t.key}
          </button>
        ))}
      </div>

      {/* Pattern input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="{brand}_{objective}_{date}"
        className={cn(
          "h-8 w-full rounded-[28px] border px-3 font-mono text-[12px] outline-none transition-all",
          "border-[#e7e5dc] bg-[#FAFAF7] text-[rgba(15,15,12,0.92)]",
          "dark:border-[#2a2a2a] dark:bg-[#18181B] dark:text-[rgba(255,255,255,0.92)]",
          "focus:ring-[3px] focus:ring-[rgba(143,184,33,0.25)] focus:border-[#8FB821]",
          "hover:border-[#8FB821]",
          "placeholder:text-[rgba(15,15,12,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)]",
        )}
        aria-label={`${label} naming pattern`}
      />

      {/* Live preview */}
      <div className="flex items-center gap-2 pl-1">
        <span className="font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
          Preview:
        </span>
        <span className="font-mono text-[11px] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] truncate">
          {preview}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Shared form atoms                                                  */
/* ─────────────────────────────────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] pb-1 border-b border-[#e7e5dc] dark:border-[#2a2a2a]">
      {children}
    </h3>
  );
}

interface FieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, htmlFor, children, hint }: FieldProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] pl-0.5">
          {hint}
        </p>
      )}
    </div>
  );
}

const inputCls = cn(
  "h-9 w-full rounded-[28px] border px-3 font-mono text-[13px] outline-none transition-all",
  "border-[#e7e5dc] bg-[#FAFAF7] text-[rgba(15,15,12,0.92)]",
  "dark:border-[#2a2a2a] dark:bg-[#18181B] dark:text-[rgba(255,255,255,0.92)]",
  "focus:ring-[3px] focus:ring-[rgba(143,184,33,0.25)] focus:border-[#8FB821]",
  "hover:border-[#8FB821]",
  "placeholder:text-[rgba(15,15,12,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)]",
);

const selectCls = cn(
  "h-9 w-full rounded-[28px] border px-3 font-mono text-[12px] outline-none transition-all appearance-none cursor-pointer",
  "border-[#e7e5dc] bg-[#FAFAF7] text-[rgba(15,15,12,0.92)]",
  "dark:border-[#2a2a2a] dark:bg-[#18181B] dark:text-[rgba(255,255,255,0.92)]",
  "focus:ring-[3px] focus:ring-[rgba(143,184,33,0.25)] focus:border-[#8FB821]",
  "hover:border-[#8FB821]",
);

/* ─────────────────────────────────────────────────────────────────── */
/*  Segmented control (ABO / CBO)                                     */
/* ─────────────────────────────────────────────────────────────────── */

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="inline-flex rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] p-0.5 gap-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-4 py-1.5 font-mono text-[11px] font-semibold transition-all",
              active
                ? "bg-[#F5FBE2] dark:bg-[#1D2A09] text-[#5B7611] dark:text-[#C3E165] shadow-sm"
                : "text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] hover:text-[rgba(15,15,12,0.80)] dark:hover:text-[rgba(255,255,255,0.80)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Switch row                                                         */
/* ─────────────────────────────────────────────────────────────────── */

interface SwitchRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="space-y-0.5">
        <Label
          htmlFor={id}
          className="text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] cursor-pointer"
        >
          {label}
        </Label>
        <p className="font-mono text-[10px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "data-[state=checked]:bg-[#8FB821]",
        )}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main screen                                                        */
/* ─────────────────────────────────────────────────────────────────── */

export function LaunchSettings() {
  const [form, setForm] = useState<LaunchDefaults>(() => loadDefaults());
  const [saved, setSaved] = useState(false);

  const patch = (partial: Partial<LaunchDefaults>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const patchAttribution = (partial: Partial<LaunchDefaults["attribution"]>) =>
    setForm((prev) => ({
      ...prev,
      attribution: { ...prev.attribution, ...partial },
    }));

  const handleSave = () => {
    saveDefaults(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetDefaults();
    setForm(loadDefaults());
  };

  return (
    <div className="h-full overflow-y-auto bg-[#FAFAF7] dark:bg-[#18181B]">
      {/* ── Page header ── */}
      <div className="border-b border-[#e7e5dc] dark:border-[#2a2a2a] px-8 py-6">
        <h1 className="text-[19px] font-bold tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
          Launch Settings
        </h1>
        <p className="mt-1 font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
          Global defaults for all new launches — applied when a new plan is
          created
        </p>
      </div>

      {/* ── Two-column body ── */}
      <div className="px-8 py-6 grid grid-cols-[1fr_420px] gap-6 items-start max-w-[1280px]">
        {/* ══ LEFT COLUMN — Defaults form ══ */}
        <div className="space-y-5">
          {/* ── Section 1: Budget & Intent ── */}
          <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B] p-5 space-y-4">
            <SectionHeading>Budget &amp; Intent</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              {/* Budget amount */}
              <Field label="Default budget / day" htmlFor="budgetAmount" hint="₹ per day — applied to each new plan">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[12px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] select-none pointer-events-none">
                    ₹
                  </span>
                  <input
                    id="budgetAmount"
                    type="number"
                    min={0}
                    step={100}
                    value={form.budgetAmount}
                    onChange={(e) =>
                      patch({ budgetAmount: Number(e.target.value) })
                    }
                    className={cn(inputCls, "pl-7")}
                  />
                </div>
              </Field>

              {/* Intent */}
              <Field label="Default intent" htmlFor="intent">
                <select
                  id="intent"
                  value={form.intent}
                  onChange={(e) =>
                    patch({
                      intent: e.target.value as LaunchDefaults["intent"],
                    })
                  }
                  className={selectCls}
                >
                  <option value="test">Test</option>
                  <option value="scale">Scale</option>
                  <option value="custom">Custom</option>
                </select>
              </Field>
            </div>

            {/* Budget mode segmented */}
            <Field label="Budget mode">
              <div className="pt-0.5">
                <Segmented
                  options={[
                    { value: "ABO", label: "ABO" },
                    { value: "CBO", label: "CBO" },
                  ]}
                  value={form.budgetMode}
                  onChange={(v) => patch({ budgetMode: v })}
                />
              </div>
            </Field>

            {/* Bid strategy */}
            <Field label="Bid strategy" htmlFor="bidStrategy">
              <select
                id="bidStrategy"
                value={form.bidStrategy}
                onChange={(e) =>
                  patch({ bidStrategy: e.target.value as BidStrategy })
                }
                className={selectCls}
              >
                <option value="LOWEST_COST_WITHOUT_CAP">
                  Lowest cost without cap
                </option>
                <option value="COST_CAP">Cost cap</option>
                <option value="LOWEST_COST_WITH_MIN_ROAS">
                  Lowest cost with min ROAS
                </option>
              </select>
            </Field>
          </div>

          {/* ── Section 3: Attribution ── */}
          <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B] p-5 space-y-4">
            <SectionHeading>Attribution</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Click window" htmlFor="clickWindow">
                <select
                  id="clickWindow"
                  value={form.attribution.clickWindow}
                  onChange={(e) =>
                    patchAttribution({ clickWindow: Number(e.target.value) })
                  }
                  className={selectCls}
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={28}>28 days</option>
                </select>
              </Field>

              <Field label="View window" htmlFor="viewWindow">
                <select
                  id="viewWindow"
                  value={form.attribution.viewWindow}
                  onChange={(e) =>
                    patchAttribution({ viewWindow: Number(e.target.value) })
                  }
                  className={selectCls}
                >
                  <option value={0}>None (0 days)</option>
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                </select>
              </Field>
            </div>
          </div>

          {/* ── Section 4: UTM ── */}
          <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B] p-5 space-y-4">
            <SectionHeading>UTM (optional)</SectionHeading>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="UTM source"
                htmlFor="utmSource"
                hint="e.g. facebook, instagram"
              >
                <input
                  id="utmSource"
                  type="text"
                  value={form.utmSource}
                  onChange={(e) => patch({ utmSource: e.target.value })}
                  placeholder="facebook"
                  className={inputCls}
                />
              </Field>

              <Field label="UTM medium" htmlFor="utmMedium">
                <input
                  id="utmMedium"
                  type="text"
                  value={form.utmMedium}
                  onChange={(e) => patch({ utmMedium: e.target.value })}
                  placeholder="paid-social"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN — Nomenclature builder ══ */}
        <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B] p-5 space-y-5 sticky top-6">
          {/* Header */}
          <div className="space-y-0.5">
            <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
              Naming patterns
            </h2>
            <p className="font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
              Click a token chip to append it at the cursor position
            </p>
          </div>

          <div className="divide-y divide-[#efeee7] dark:divide-[#1f1f1f] space-y-0">
            {/* Campaign */}
            <div className="pb-5">
              <NomRow
                label="Campaign"
                value={form.campaignNamePattern}
                tokens={CAMPAIGN_TOKENS}
                onChange={(v) => patch({ campaignNamePattern: v })}
              />
            </div>

            {/* Ad Set */}
            <div className="py-5">
              <NomRow
                label="Ad Set"
                value={form.adSetNamePattern}
                tokens={ADSET_TOKENS}
                onChange={(v) => patch({ adSetNamePattern: v })}
              />
            </div>

            {/* Ad */}
            <div className="pt-5">
              <NomRow
                label="Ad"
                value={form.adNamePattern}
                tokens={AD_TOKENS}
                onChange={(v) => patch({ adNamePattern: v })}
              />
            </div>
          </div>

          {/* Hint row */}
          <div className="rounded-xl bg-[#F5FBE2] dark:bg-[#1D2A09] border border-[#749818]/30 dark:border-[#C3E165]/20 px-3 py-2">
            <p className="font-mono text-[10px] text-[#5B7611] dark:text-[#C3E165] leading-[16px]">
              Preview uses sample values: brand=Mamaearth, objective=sales,
              intent=scale, date={new Date().toISOString().slice(0, 10)},
              adset=IN-Metro, n=1
            </p>
          </div>
        </div>
      </div>

      {/* ── Sticky footer with Save / Reset ── */}
      <div className="sticky bottom-0 z-10 border-t border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7]/90 dark:bg-[#18181B]/90 backdrop-blur-sm px-8 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          className={cn(
            "rounded-full px-5 py-2 text-[13px] font-medium transition-colors",
            "text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]",
            "hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)]",
            "hover:bg-[#F0F0EC] dark:hover:bg-[#1B1B1F]",
          )}
        >
          Reset to defaults
        </button>

        <button
          type="button"
          onClick={handleSave}
          className={cn(
            "rounded-full px-6 py-2 text-[13px] font-semibold transition-all",
            saved
              ? "bg-[#5B7611] dark:bg-[#75932D] text-white"
              : "bg-[#8FB821] hover:bg-[#AACF32] active:-translate-y-px text-[#121212]",
            "shadow-sm",
          )}
        >
          {saved ? "Saved!" : "Save defaults"}
        </button>
      </div>
    </div>
  );
}

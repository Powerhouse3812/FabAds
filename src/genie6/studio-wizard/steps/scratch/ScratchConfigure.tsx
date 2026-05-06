import { useMemo, useState } from "react";
import {
  ChevronDown,
  Image as ImageIcon,
  Lightbulb,
  Target,
  Users,
  Video,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AspectRatioMulti,
  type AspectRatio,
} from "@/genie6/generate-v3/forms/components/AspectRatioMulti";
import { ANGLES } from "@/genie6/generate-v3/forms/components/AnglePicker";
import { audiences as allAudiences } from "@/genie6/generate-v3/mocks/audiences";
import {
  savedConcepts,
  newConcepts,
} from "@/genie6/generate-v3/mocks/concepts";
import {
  SUB_MODE_PROFILES,
  type ActiveColumnInput,
  type Output,
  type StudioV4Form,
} from "@/genie6/v4-shared/types";

/**
 * ScratchConfigure — body of Step 4 when path = "scratch".
 *
 * Renders trigger rows for the heavy column-input fields (audience,
 * angle, concepts, references) plus inline rows for format / aspect /
 * advanced. The wizard's right column owns the actual picker UIs.
 *
 * Each trigger row shows the live selection as compact pills so the user
 * can audit choices without bouncing between columns.
 */

export interface ScratchConfigureProps {
  form: StudioV4Form;
  update: <K extends keyof StudioV4Form>(key: K, value: StudioV4Form[K]) => void;
  setActiveColumnInput: (next: ActiveColumnInput) => void;
}

export function ScratchConfigure({
  form,
  update,
  setActiveColumnInput,
}: ScratchConfigureProps) {
  const profile = SUB_MODE_PROFILES[form.subMode];
  const fields = profile.fields;
  const has = (id: string) =>
    fields === "all" || (Array.isArray(fields) && fields.includes(id));

  const audienceLookup = useMemo(
    () => Object.fromEntries(allAudiences.map((a) => [a.id, a.name])),
    [],
  );
  const angleLookup = useMemo(
    () => Object.fromEntries(ANGLES.map((a) => [a.id, a.label])),
    [],
  );
  const conceptLookup = useMemo(() => {
    const all = [...savedConcepts, ...newConcepts];
    return Object.fromEntries(all.map((c) => [c.id, c.name]));
  }, []);

  const lockOutput = profile.lockOutput;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">
          Configure your generation
        </h1>
        <p className="text-sm text-muted-foreground">
          Tap any field to edit it in the right column. Defaults are
          pre-filled — only change what you need.
        </p>
      </header>

      {/* Format + Aspect */}
      {(has("output") || has("aspect")) && (
        <div className="rounded-xl border border-border bg-card/40 p-3 space-y-3">
          {has("output") && (
            <div className="flex items-center gap-3">
              <p className="w-24 shrink-0 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Format
              </p>
              <FormatToggle
                value={form.output}
                onChange={(o) => update("output", o)}
                locked={!!lockOutput}
              />
            </div>
          )}
          {has("aspect") && (
            <div className="flex items-start gap-3">
              <p className="w-24 shrink-0 pt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Aspect
              </p>
              <AspectRatioMulti
                value={form.aspectRatios as AspectRatio[]}
                onChange={(next) => update("aspectRatios", next)}
              />
            </div>
          )}
        </div>
      )}

      {/* Audience */}
      {has("audience") && (
        <TriggerRow
          icon={Users}
          label="Audience"
          hint="Who is this ad for?"
          selectionPills={form.audienceIds.map(
            (id) => audienceLookup[id] ?? id,
          )}
          emptyLabel="Pick audiences →"
          onClick={() => setActiveColumnInput("audience")}
        />
      )}

      {/* Angle */}
      {has("angle") && (
        <TriggerRow
          icon={Target}
          label="Angle"
          hint="What story does the ad tell?"
          selectionPills={form.angleIds.map((id) => angleLookup[id] ?? id)}
          emptyLabel="Pick angles →"
          onClick={() => setActiveColumnInput("angle")}
        />
      )}

      {/* Concepts */}
      {has("concept") && (
        <TriggerRow
          icon={Lightbulb}
          label="Concepts"
          hint="Specific ideas to anchor the render"
          selectionPills={form.conceptIds.map(
            (id) => conceptLookup[id] ?? id,
          )}
          emptyLabel="Pick concepts →"
          onClick={() => setActiveColumnInput("concept")}
        />
      )}

      {/* References */}
      {has("references") && (
        <TriggerRow
          icon={Layers}
          label="References"
          hint="Inspiration from Pinterest or your uploads"
          selectionPills={[]}
          emptyLabel="Browse Pinterest →"
          onClick={() => setActiveColumnInput("pinterest")}
        />
      )}

      {/* Advanced */}
      <AdvancedSection
        form={form}
        update={update}
        showBrandIntensity={has("brandIntensity")}
        showScript={form.output === "video" && has("script")}
        showVoiceTone={form.subMode === "ugc-video" && has("voiceTone")}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function FormatToggle({
  value,
  onChange,
  locked,
}: {
  value: Output;
  onChange: (next: Output) => void;
  locked: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Output format"
      className={cn(
        "inline-flex rounded-md border border-border bg-card p-0.5",
        locked && "opacity-60",
      )}
    >
      {(["image", "video"] as const).map((opt) => {
        const active = value === opt;
        const Icon = opt === "video" ? Video : ImageIcon;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={locked}
            onClick={() => onChange(opt)}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded px-2.5 text-[11px] font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3 w-3" />
            {opt === "image" ? "Image" : "Video"}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

interface TriggerRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  selectionPills: string[];
  emptyLabel: string;
  onClick: () => void;
}

function TriggerRow({
  icon: Icon,
  label,
  hint,
  selectionPills,
  emptyLabel,
  onClick,
}: TriggerRowProps) {
  const hasSelection = selectionPills.length > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 rounded-xl border bg-card/40 px-3 py-2.5 text-left transition-all",
        "hover:border-primary/40 hover:bg-card",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        hasSelection ? "border-primary/40" : "border-border",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md mt-0.5",
          hasSelection
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-foreground">{label}</p>
          {!hasSelection && (
            <span className="text-[11px] font-medium text-primary">
              {emptyLabel}
            </span>
          )}
        </div>
        {hasSelection ? (
          <div className="flex flex-wrap gap-1">
            {selectionPills.map((p) => (
              <span
                key={p}
                className="inline-flex h-5 items-center rounded-full bg-primary/15 px-2 text-[10px] font-medium text-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground leading-snug">
            {hint}
          </p>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */

interface AdvancedSectionProps {
  form: StudioV4Form;
  update: <K extends keyof StudioV4Form>(key: K, value: StudioV4Form[K]) => void;
  showBrandIntensity: boolean;
  showScript: boolean;
  showVoiceTone: boolean;
}

function AdvancedSection({
  form,
  update,
  showBrandIntensity,
  showScript,
  showVoiceTone,
}: AdvancedSectionProps) {
  const [open, setOpen] = useState(false);
  const visible = showBrandIntensity || showScript || showVoiceTone;
  if (!visible) return null;

  return (
    <div className="rounded-xl border border-border bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <p className="text-[12px] font-semibold text-foreground">Advanced</p>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {showBrandIntensity && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Brand intensity
              </p>
              <SegmentedChips
                options={[
                  { id: "minimal", label: "Minimal" },
                  { id: "moderate", label: "Moderate" },
                  { id: "strong", label: "Strong" },
                ]}
                value={form.brandIntensity}
                onChange={(v) =>
                  update(
                    "brandIntensity",
                    v as StudioV4Form["brandIntensity"],
                  )
                }
              />
            </div>
          )}

          {showVoiceTone && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Voice tone
              </p>
              <SegmentedChips
                options={[
                  { id: "Warm", label: "Warm" },
                  { id: "Bold", label: "Bold" },
                  { id: "Calm", label: "Calm" },
                  { id: "Witty", label: "Witty" },
                ]}
                value={form.voiceTone ?? "Warm"}
                onChange={(v) => update("voiceTone", v)}
              />
            </div>
          )}

          {showScript && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Script
              </p>
              <textarea
                value={form.scriptText}
                onChange={(e) => update("scriptText", e.target.value)}
                placeholder="Drop a line or let AI write one…"
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary/40"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SegmentedChips({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-md border border-border bg-card p-0.5">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "h-7 rounded px-2.5 text-[11px] font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

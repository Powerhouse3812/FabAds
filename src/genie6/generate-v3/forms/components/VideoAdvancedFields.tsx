import { Sparkles, Camera, Compass, Mountain, Eye, Wand2, Gauge, Captions } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * VideoAdvancedFields — Studio v3 video output Advanced.
 *
 * A-11.24 update: voice tone field REMOVED. Tone now lives inside the
 * <AiModelCard /> in the main form (single source of truth — no
 * duplication risk). Advanced still owns visual direction / bg scene /
 * POV / camera / motion / speed / subtitles.
 */

export const VISUAL_DIRECTIONS = [
  "Editorial",
  "Documentary",
  "Cinematic",
  "Studio",
  "Street",
  "Surreal",
] as const;
export type VisualDirection = typeof VISUAL_DIRECTIONS[number];

export const BG_SCENES = [
  "Studio",
  "Home",
  "Office",
  "Outdoor",
  "Travel",
  "Abstract",
] as const;
export type BgScene = typeof BG_SCENES[number];

export const POV_OPTS = [
  "Talking head",
  "Over-the-shoulder",
  "Top-down",
  "Wide",
  "Close-up",
] as const;
export type Pov = typeof POV_OPTS[number];

export const CAMERA_ANGLES = [
  "Eye-level",
  "Low",
  "High",
  "Dutch",
  "Drone",
] as const;
export type CameraAngle = typeof CAMERA_ANGLES[number];

export const MOTION_OPTS = [
  "Static",
  "Subtle",
  "Dynamic",
  "Cinematic move",
] as const;
export type Motion = typeof MOTION_OPTS[number];

export const SPEED_OPTS = [
  "Slow",
  "Real-time",
  "Fast-cut",
  "Time-lapse",
] as const;
export type Speed = typeof SPEED_OPTS[number];

export interface VideoAdvancedValues {
  visualDirection: VisualDirection | null;
  bgScene: BgScene | null;
  pov: Pov | null;
  cameraAngle: CameraAngle | null;
  motion: Motion | null;
  speed: Speed | null;
  subtitles: boolean;
}

export interface VideoAdvancedFieldsProps {
  values: VideoAdvancedValues;
  onChange: (next: Partial<VideoAdvancedValues>) => void;
}

export function VideoAdvancedFields({
  values,
  onChange,
}: VideoAdvancedFieldsProps) {
  return (
    <div className="space-y-3">
      <FieldRow icon={Compass} label="Visual direction">
        <ChipRow
          options={VISUAL_DIRECTIONS}
          value={values.visualDirection}
          onChange={(v) => onChange({ visualDirection: v })}
        />
      </FieldRow>
      <FieldRow icon={Mountain} label="Background scene">
        <ChipRow
          options={BG_SCENES}
          value={values.bgScene}
          onChange={(v) => onChange({ bgScene: v })}
        />
      </FieldRow>
      <FieldRow icon={Eye} label="POV">
        <ChipRow
          options={POV_OPTS}
          value={values.pov}
          onChange={(v) => onChange({ pov: v })}
        />
      </FieldRow>
      <FieldRow icon={Camera} label="Camera angle">
        <ChipRow
          options={CAMERA_ANGLES}
          value={values.cameraAngle}
          onChange={(v) => onChange({ cameraAngle: v })}
        />
      </FieldRow>
      <FieldRow icon={Wand2} label="Motion">
        <ChipRow
          options={MOTION_OPTS}
          value={values.motion}
          onChange={(v) => onChange({ motion: v })}
        />
      </FieldRow>
      <FieldRow icon={Gauge} label="Speed">
        <ChipRow
          options={SPEED_OPTS}
          value={values.speed}
          onChange={(v) => onChange({ speed: v })}
        />
      </FieldRow>
      <FieldRow icon={Captions} label="Subtitles">
        <SubtitleToggle
          enabled={values.subtitles}
          onToggle={(b) => onChange({ subtitles: b })}
        />
      </FieldRow>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Sparkles;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 sm:items-start">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
        <Icon className="h-3 w-3 text-muted-foreground" />
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (next: T | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? null : opt)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition-colors",
              active
                ? "bg-primary text-primary-foreground font-medium"
                : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SubtitleToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onToggle(!enabled)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-card px-2 py-0.5 transition-colors",
        enabled
          ? "border-primary/40 bg-primary/10"
          : "border-border hover:border-foreground/30",
      )}
    >
      <span
        className={cn(
          "relative h-4 w-7 rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-card shadow transition-transform",
            enabled && "translate-x-3",
          )}
        />
      </span>
      <span className="text-[11px] font-medium text-foreground">
        {enabled ? "On" : "Off"}
      </span>
    </button>
  );
}

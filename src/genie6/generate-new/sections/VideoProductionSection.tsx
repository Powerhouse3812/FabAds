import { useState } from "react";
import { Video, User, Mic, FileText, Link as LinkIcon, Sparkles, Bookmark, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UgcSubMethod, I2vSubMethod } from "../types";

/**
 * VideoProductionSection — universal section on Brand/Product/Affiliate forms.
 *
 * Per Form Specs §0.5: appears in any form when Output=Video. Sub-sections:
 *   - Avatar picker (default selected — last-used or system default)
 *   - Voice picker (default selected)
 *   - Script source toggle (6 options)
 *   - Format chips (two grouped rows):
 *       Row 1 — UGC sub-methods (avatar-led / script-first / product-demo /
 *               testimonial / talking-head / reaction / B-roll-only)
 *       Row 2 — Image-to-Video sub-methods (subtle-motion / camera /
 *               element / full-AI)
 *
 * Required:
 *   Avatar/Voice required for UGC sub-methods (except B-roll-only)
 *   Avatar/Voice optional for B-roll-only and all I2V sub-methods
 *
 * Mock data: 3 avatars + 3 voices in scope=A. Real avatar/voice library +
 * upload + consent gate land per Master Doc §5.6 in iter-8+.
 */

const MOCK_AVATARS = [
  { id: "avatar-female-25-pro", label: "Aanya · 25 · Professional" },
  { id: "avatar-male-30-casual", label: "Rohan · 30 · Casual" },
  { id: "avatar-female-22-cheerful", label: "Sara · 22 · Cheerful" },
];

const MOCK_VOICES = [
  { id: "voice-en-female-warm", label: "Indian English · Female · Warm" },
  { id: "voice-hi-male-pro", label: "Hindi · Male · Professional" },
  { id: "voice-en-female-energetic", label: "Indian English · Female · Energetic" },
];

const SCRIPT_SOURCES = [
  { id: "paste", label: "Paste", icon: FileText },
  { id: "link-fetch", label: "Link fetch", icon: LinkIcon },
  { id: "brand-derived", label: "Brand-derived", icon: Sparkles },
  { id: "prompt-only", label: "Prompt only", icon: FileText },
  { id: "saved-script", label: "Saved script", icon: Bookmark },
  { id: "insights-script", label: "Insights script", icon: TrendingUp },
] as const;

const UGC_SUB_METHODS: { id: UgcSubMethod; label: string }[] = [
  { id: "avatar-led", label: "Avatar-led" },
  { id: "script-first", label: "Script-first" },
  { id: "product-demo", label: "Product demo" },
  { id: "testimonial", label: "Testimonial" },
  { id: "talking-head", label: "Talking head" },
  { id: "reaction", label: "Reaction" },
  { id: "b-roll-only", label: "B-roll only" },
];

const I2V_SUB_METHODS: { id: I2vSubMethod; label: string }[] = [
  { id: "subtle-motion", label: "Subtle motion" },
  { id: "camera", label: "Camera move" },
  { id: "element", label: "Element animate" },
  { id: "full-ai", label: "Full AI" },
];

export interface VideoProductionSectionProps {
  /** Default-open state — UGC Video preset auto-expands. */
  defaultOpen?: boolean;
}

export function VideoProductionSection({ defaultOpen = true }: VideoProductionSectionProps) {
  const [avatarId, setAvatarId] = useState<string>(MOCK_AVATARS[0].id);
  const [voiceId, setVoiceId] = useState<string>(MOCK_VOICES[0].id);
  const [scriptSource, setScriptSource] = useState<typeof SCRIPT_SOURCES[number]["id"]>("brand-derived");
  const [subMethod, setSubMethod] = useState<UgcSubMethod | I2vSubMethod>("avatar-led");

  // Required-state derivation per spec
  const isUgc = UGC_SUB_METHODS.some((m) => m.id === subMethod);
  const avatarVoiceRequired = isUgc && subMethod !== "b-roll-only";

  return (
    <section className="rounded-md border border-primary/30 bg-primary/5 p-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <Video className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-foreground">
          Video Production
        </h2>
        <span className="text-[10px] text-muted-foreground">· auto-shown when Output = Video</span>
      </div>

      {/* Avatar + Voice row */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <PickerSelect
          label="Avatar"
          icon={User}
          value={avatarId}
          onChange={setAvatarId}
          options={MOCK_AVATARS}
          required={avatarVoiceRequired}
        />
        <PickerSelect
          label="Voice"
          icon={Mic}
          value={voiceId}
          onChange={setVoiceId}
          options={MOCK_VOICES}
          required={avatarVoiceRequired}
        />
      </div>

      {/* Script source toggle */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Script source
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {SCRIPT_SOURCES.map((s) => {
            const Icon = s.icon;
            const active = scriptSource === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScriptSource(s.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <Icon className="h-2.5 w-2.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Format chips — Row 1: UGC sub-methods */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Format · UGC
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {UGC_SUB_METHODS.map((m) => (
            <SubMethodChip
              key={m.id}
              label={m.label}
              active={subMethod === m.id}
              onClick={() => setSubMethod(m.id)}
            />
          ))}
        </div>
      </div>

      {/* Format chips — Row 2: Image-to-Video sub-methods */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Format · Image-to-Video
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {I2V_SUB_METHODS.map((m) => (
            <SubMethodChip
              key={m.id}
              label={m.label}
              active={subMethod === m.id}
              onClick={() => setSubMethod(m.id)}
            />
          ))}
        </div>
      </div>

      {!avatarVoiceRequired && (
        <p className="text-[10px] text-muted-foreground italic">
          Avatar and Voice optional for this sub-method.
        </p>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

interface PickerSelectProps<T extends string> {
  label: string;
  icon: typeof User;
  value: T;
  onChange: (next: T) => void;
  options: { id: T; label: string }[];
  required: boolean;
}

function PickerSelect<T extends string>({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  required,
}: PickerSelectProps<T>) {
  return (
    <label className="block space-y-1">
      <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="h-2.5 w-2.5" />
        {label}
        {required && <span className="text-destructive">·</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="block h-9 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground hover:border-primary/40 focus:border-primary/40 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubMethodChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-foreground font-medium"
          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

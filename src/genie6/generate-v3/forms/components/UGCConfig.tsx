import { Video, User, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UGCConfig — toggle + avatar picker + tone selector for Product Shoot
 * when Output=Video (A-11.19).
 *
 * Spec from Maalik:
 *   - UGC toggle (when Video output is picked)
 *   - When UGC ON:
 *       Avatar = OPTIONAL (user can pick or leave blank for system default)
 *       Tone = pre-filled from Product KB / guidelines, fallback to Brand
 *              defaults. User can override.
 *   - Tone enum: warm, friendly, bold, professional, playful, premium
 */

const MOCK_AVATARS = [
  { id: "avatar-female-25-pro", label: "Aanya · 25 · Pro" },
  { id: "avatar-male-30-casual", label: "Rohan · 30 · Casual" },
  { id: "avatar-female-22-cheerful", label: "Sara · 22 · Cheerful" },
];

export const TONE_OPTIONS = [
  "Warm",
  "Friendly",
  "Bold",
  "Professional",
  "Playful",
  "Premium",
] as const;
export type Tone = typeof TONE_OPTIONS[number];

export interface UGCConfigProps {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  avatarId: string | null;
  onAvatarChange: (id: string | null) => void;
  tone: Tone;
  onToneChange: (next: Tone) => void;
  /** Optional source label shown next to tone — "from {brand} KB" / "default". */
  toneSource?: string;
}

export function UGCConfig({
  enabled,
  onToggle,
  avatarId,
  onAvatarChange,
  tone,
  onToneChange,
  toneSource,
}: UGCConfigProps) {
  return (
    <div className="space-y-3">
      {/* UGC toggle row */}
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        aria-pressed={enabled}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors",
          enabled
            ? "border-primary/40 bg-primary/10 text-foreground"
            : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
        )}
      >
        <Video className="h-3 w-3" />
        UGC video {enabled ? "on" : "off"}
      </button>

      {enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          {/* Avatar — optional */}
          <label className="block space-y-1">
            <span className="flex items-center gap-1 text-[11px] font-medium text-foreground">
              <User className="h-3 w-3 text-muted-foreground" />
              Avatar
              <span className="text-[10px] font-normal text-muted-foreground">· optional</span>
            </span>
            <select
              value={avatarId ?? ""}
              onChange={(e) => onAvatarChange(e.target.value || null)}
              className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none"
            >
              <option value="">System default</option>
              {MOCK_AVATARS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>

          {/* Tone — pre-filled from KB */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Mic className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] font-medium text-foreground">Tone</span>
              {toneSource && (
                <span className="text-[10px] font-mono text-muted-foreground italic">
                  · {toneSource}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {TONE_OPTIONS.map((t) => {
                const active = tone === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onToneChange(t)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

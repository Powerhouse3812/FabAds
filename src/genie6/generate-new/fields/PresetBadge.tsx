import { Camera, Video } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PresetBadge — small lime context badge shown in the top zone when the user
 * entered a Type form via a Preset CTA (Product Shoot or UGC Video).
 *
 * Per Form Specs §5, §6: preset CTAs route through the gate with ?preset=…
 * markers. The badge confirms to the user which preset they picked.
 */

export type PresetMarker = "shoot" | "ugc-video";

const META: Record<PresetMarker, { label: string; icon: typeof Camera }> = {
  shoot: { label: "Studio shoot", icon: Camera },
  "ugc-video": { label: "UGC Video", icon: Video },
};

export function PresetBadge({ preset, className }: { preset: PresetMarker; className?: string }) {
  const meta = META[preset];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-foreground",
        className,
      )}
      title={`Entered through the ${meta.label} preset`}
    >
      <Icon className="h-2.5 w-2.5 text-primary" />
      Preset · {meta.label}
    </span>
  );
}

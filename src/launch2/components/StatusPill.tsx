import { cn } from "@/lib/utils";
import type { LaunchStatus } from "../types";

interface StatusMeta {
  label: string;
  dot: string; // fill class
  text: string;
  bg: string;
  pulse?: boolean;
}

export const LAUNCH_STATUS_META: Record<LaunchStatus, StatusMeta> = {
  draft: { label: "Draft", dot: "bg-muted-foreground/50", text: "text-muted-foreground", bg: "bg-muted" },
  queued: { label: "Queued", dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted" },
  launching: { label: "Launching", dot: "bg-[#faad14]", text: "text-[hsl(var(--warning-text))]", bg: "bg-[#faad14]/10", pulse: true },
  live: { label: "Live", dot: "bg-[#52c41a]", text: "text-[hsl(var(--success-text))]", bg: "bg-[#52c41a]/10" },
  complete: { label: "Complete", dot: "bg-[#52c41a]", text: "text-[hsl(var(--success-text))]", bg: "bg-[#52c41a]/10" },
  partial: { label: "Partial", dot: "bg-[#faad14]", text: "text-[hsl(var(--warning-text))]", bg: "bg-[#faad14]/10" },
  rejected: { label: "Rejected", dot: "bg-[#ff4d4f]", text: "text-[hsl(var(--error-text))]", bg: "bg-[#ff4d4f]/10" },
};

export function StatusPill({ status, className }: { status: LaunchStatus; className?: string }) {
  const m = LAUNCH_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        m.bg,
        m.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot, m.pulse && "animate-pulse")} />
      {m.label}
    </span>
  );
}

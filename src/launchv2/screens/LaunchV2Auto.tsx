import { Zap } from "lucide-react";

export default function LaunchV2Auto() {
  return (
    <div
      className="flex h-full items-center justify-center"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(143,184,33,0.06) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B] p-10 text-center max-w-sm space-y-5">
        {/* Coming soon badge */}
        <div className="flex justify-center">
          <span
            className="font-mono text-[10px] uppercase tracking-widest bg-[#F5FBE2] dark:bg-[#1D2A09] text-[#5B7611] dark:text-[#C3E165] rounded-full px-2.5 py-0.5"
          >
            Coming Soon
          </span>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-[#F5FBE2] dark:bg-[#1D2A09] flex items-center justify-center">
            <Zap className="h-6 w-6 text-[#5B7611] dark:text-[#C3E165]" />
          </div>
        </div>

        {/* Heading */}
        <h2
          className="font-bold text-foreground"
          style={{ fontSize: "19px", letterSpacing: "-0.01em" }}
        >
          Auto Launch
        </h2>

        {/* Description */}
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
          Schedule and automate re-launches from a previous run. Pick a
          strategy, set a schedule, and let Genie handle the rest.
        </p>

        {/* Capability pills */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide border border-[#e7e5dc] dark:border-[#2a2a2a] rounded-full px-3 py-1 text-muted-foreground">
            Re-launch from history
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wide border border-[#e7e5dc] dark:border-[#2a2a2a] rounded-full px-3 py-1 text-muted-foreground">
            Schedule recurring
          </span>
        </div>
      </div>
    </div>
  );
}

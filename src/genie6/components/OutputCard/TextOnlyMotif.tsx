/**
 * Placeholder shown in the thumbnail area when mediaType === 'text-only'.
 * Lime dot grid backdrop + "TXT" label in Geist Mono.
 */
export function TextOnlyMotif() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-g6-primary-bg">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--g6-color-primary-active) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          opacity: 0.18,
        }}
      />
      <span className="relative font-g6-mono text-g6-xs font-semibold uppercase tracking-[0.2em] text-g6-primary-active">
        Txt
      </span>
    </div>
  );
}

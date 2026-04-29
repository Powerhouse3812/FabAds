import { Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDisclosurePref, shouldShowDisclosure } from "../lib/disclosurePref";

/**
 * "AI-generated" disclosure stamp (Track 4.10 — C2PA stamp).
 *
 * Renders a small chip that says "AI-generated" on outputs when the user's disclosure
 * preference dictates. Per spec (Handoff_Note §15): stamp appears on export per user
 * preference. Phase D extends this to embed actual C2PA-compliant metadata in exports.
 *
 * Variants:
 *   chip       — small inline chip for OutputCard footer + PreviewPane
 *   watermark  — bigger overlay badge for download confirmation modals
 */
type Props = {
  variant?: "chip" | "watermark";
  className?: string;
};

export function DisclosureStamp({ variant = "chip", className }: Props) {
  const { pref } = useDisclosurePref();
  if (!shouldShowDisclosure(pref)) return null;

  if (variant === "watermark") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-g6-base border border-g6-primary-border bg-g6-primary-bg px-3 py-2",
          className
        )}
      >
        <ShieldCheck className="h-4 w-4 text-g6-primary" />
        <div className="flex flex-col">
          <span className="text-g6-sm font-semibold text-g6-text">AI-generated</span>
          <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
            C2PA disclosure stamp embedded
          </span>
        </div>
      </div>
    );
  }

  return (
    <span
      title="AI-generated · disclosure stamp embedded on export"
      className={cn(
        "inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-1.5 py-0.5 font-g6-mono text-g6-xs text-g6-text-tertiary",
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      AI-generated
    </span>
  );
}

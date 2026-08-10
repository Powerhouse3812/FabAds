import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  /**
   * Two-letter monogram, e.g. "CL" for Claude, "CG" for ChatGPT.
   */
  monogram: string;
  /**
   * Brand hex for the avatar chip ONLY. This is the SOLE exception to the
   * no-raw-hex rule — these are third-party brand marks (Claude's orange,
   * ChatGPT's green, etc.) that must look identical across light and dark
   * themes. Never use inline hex elsewhere; it must always come from
   * design tokens.
   */
  brandHex: string;
  /**
   * Visual size variant.
   * - sm: h-8 w-8, rounded-lg, text-[10px]
   * - md: h-9 w-9, rounded-lg, text-[11px]
   * - lg: h-12 w-12, rounded-xl, text-sm
   */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * AgentAvatar — rounded-square monogram chip for an AI agent.
 *
 * Displays a two-letter code (agent name) centered on the agent's brand
 * colour. Marked aria-hidden because the agent name is always rendered as
 * real text beside it — the avatar is decorative.
 */
export function AgentAvatar({
  monogram,
  brandHex,
  size = "md",
  className,
}: AgentAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 rounded-lg text-[10px]",
    md: "h-9 w-9 rounded-lg text-[11px]",
    lg: "h-12 w-12 rounded-xl text-sm",
  };

  return (
    <div
      className={cn(
        "grid place-items-center font-semibold text-white",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: brandHex }}
      aria-hidden="true"
    >
      {monogram}
    </div>
  );
}

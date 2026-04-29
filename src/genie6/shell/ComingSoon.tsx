import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Placeholder for Genie 6.0 surfaces not yet built. Replaced as each phase lands.
 * Composed empty pattern (motif + label + back link) — never bare "Coming soon".
 */
export function ComingSoon({ phase, surface }: { phase: "A" | "B" | "C"; surface: string }) {
  return (
    <div className="relative flex min-h-full items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          phase {phase} · scheduled
        </p>
        <h1 className="mt-2 font-g6-sans text-g6-h2 font-bold text-g6-text">{surface}</h1>
        <p className="mt-3 text-g6-base text-g6-text-secondary">
          This surface lands in Phase {phase}. The shell is live — content arrives next.
        </p>
        <Link
          to="/iq/genie6"
          className="mt-6 inline-flex items-center gap-1.5 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-3 py-1.5 text-g6-sm text-g6-text-secondary transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
      </div>
    </div>
  );
}

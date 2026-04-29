import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Wizard ↔ Form toggle.
 * Renders ONLY on /generate/:mode/(wizard|form) routes.
 * Switching swaps the route segment and persists pref to localStorage.
 */
const STORAGE_KEY = "genie6-wizard-form-pref";

export function WizardFormToggle() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Match /iq/genie6/generate/:mode/(wizard|form)
  const match = pathname.match(/^\/iq\/genie6\/generate\/([^/]+)\/(wizard|form)(?:\/.*)?$/);
  if (!match) return null;

  const [, mode, current] = match;
  const isWizard = current === "wizard";

  const switchTo = (next: "wizard" | "form") => {
    if (next === current) return;
    window.localStorage.setItem(STORAGE_KEY, next);
    navigate(pathname.replace(/\/(wizard|form)(\/.*)?$/, `/${next}$2`));
  };

  return (
    <div
      role="tablist"
      aria-label="Generation flow type"
      className="inline-flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container p-0.5 text-g6-sm font-medium"
    >
      <button
        type="button"
        role="tab"
        aria-selected={isWizard}
        onClick={() => switchTo("wizard")}
        className={cn(
          "rounded-g6-pill px-3 py-1 transition-colors",
          isWizard ? "bg-g6-primary text-g6-text-on-accent" : "text-g6-text-secondary hover:text-g6-text"
        )}
      >
        Wizard
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!isWizard}
        onClick={() => switchTo("form")}
        className={cn(
          "rounded-g6-pill px-3 py-1 transition-colors",
          !isWizard ? "bg-g6-primary text-g6-text-on-accent" : "text-g6-text-secondary hover:text-g6-text"
        )}
      >
        Form
      </button>
    </div>
  );
}

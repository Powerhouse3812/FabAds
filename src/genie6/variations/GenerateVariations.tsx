import { cn } from "@/lib/utils";
import { VariationsFlowA } from "./VariationsFlowA";
import { VariationsFlowB } from "./VariationsFlowB";
import { useVariationsFlow } from "./state/useVariationsFlow";
import { UI_VERSION_META, useVariationsUiVersion } from "./state/useVariationsUiVersion";
import type { VariationsUiVersion } from "./types";

/**
 * Generate Variations — the route entry (Part 1: WHOLE AD).
 *
 * Reached from the Studio Home Mode card that replaced "Custom". Owns the one
 * flow-state instance and hands it to whichever UI version `?ui` selects, so
 * switching versions compares two layouts against the SAME run rather than
 * restarting. Both versions are the real screen; neither is a harness.
 */
export function GenerateVariations() {
  const flow = useVariationsFlow();
  const { version, setVersion } = useVariationsUiVersion();
  const showToggle = import.meta.env.DEV;

  return (
    <div className="relative min-h-full bg-g6-bg-base text-g6-text">
      {/* In-flow, not a fixed corner pill. Both versions put a primary CTA in
          the bottom-right (A's sticky rail, B's footer), and the app shell
          scrolls in an inner container — so a fixed pill there silently steals
          the click target from Generate however much padding is reserved. */}
      {showToggle && (
        <div className="flex justify-end px-6 pt-3">
          <UiVersionToggle version={version} onChange={setVersion} />
        </div>
      )}
      {version === "a" ? <VariationsFlowA flow={flow} /> : <VariationsFlowB flow={flow} />}
    </div>
  );
}

/**
 * Dev-only version switcher. Mirrors StudioLayoutToggle's fixed bottom-right
 * pill, but writes `?ui` instead of localStorage so the choice is shareable.
 */
function UiVersionToggle({
  version,
  onChange,
}: {
  version: VariationsUiVersion;
  onChange: (next: VariationsUiVersion) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-g6-border bg-g6-bg-container p-1 shadow-g6-sm">
      <span className="px-2 font-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary">
        UI
      </span>
      {(["a", "b"] as const).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          title={UI_VERSION_META[key].hint}
          aria-pressed={version === key}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            version === key
              ? "bg-primary/[0.18] text-primary"
              : "text-g6-text-secondary hover:bg-g6-bg-muted",
          )}
        >
          {UI_VERSION_META[key].label}
        </button>
      ))}
    </div>
  );
}

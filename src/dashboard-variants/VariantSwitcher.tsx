import { Link } from "react-router-dom";

/**
 * VariantSwitcher — fixed bottom-right floating pill group shown on every
 * dashboard-variants page. Deliberately self-contained: literal Tailwind
 * arbitrary values only, no design-system tokens (no bg-card, text-foreground,
 * etc.) so it reads correctly regardless of which variant page it floats on
 * top of — light Editorial, dark Terminal, tonal, or classic-dark.
 */

type VariantKey = "editorial" | "terminal" | "tonal" | "classic";

interface VariantSwitcherProps {
  current: VariantKey;
}

const VARIANTS: Array<{ key: VariantKey; label: string; to: string }> = [
  { key: "editorial", label: "Editorial", to: "/dashboard-variants/editorial" },
  { key: "terminal", label: "Terminal", to: "/dashboard-variants/terminal" },
  { key: "tonal", label: "Tonal", to: "/dashboard-variants/tonal" },
  { key: "classic", label: "Classic", to: "/dashboard-variants/classic" },
];

const PILL_BASE =
  "inline-flex items-center h-[26px] px-3 rounded-full font-mono text-[11px] font-medium uppercase tracking-wide leading-none whitespace-nowrap transition-colors duration-150";

export function VariantSwitcher({ current }: VariantSwitcherProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="flex items-center gap-0.5 p-1 rounded-full bg-[#1A1A18]/95 backdrop-blur-md border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
        {VARIANTS.map((v) => {
          const active = v.key === current;
          return (
            <Link
              key={v.key}
              to={v.to}
              className={`${PILL_BASE} ${
                active
                  ? "text-white bg-white/15"
                  : "text-white/60 hover:text-white/85"
              }`}
            >
              {v.label}
            </Link>
          );
        })}

        {/* Divider */}
        <span aria-hidden className="inline-block w-px h-3.5 mx-0.5 bg-white/10" />

        <Link to="/dashboard" className={`${PILL_BASE} text-white/60 hover:text-white/85`}>
          Exit
        </Link>
      </div>
    </div>
  );
}

export default VariantSwitcher;

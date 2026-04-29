import { useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  size?: "default" | "lg";
}

const DEFAULT_SUGGESTIONS = [
  "12 product ads for Mamaearth Onion Shampoo",
  "UGC video script with Priya for Boat Airdopes",
  "Forge 10 variants from my best winner",
];

/**
 * Focal hero prompt input — used on Home (zero-data), ModePicker, NewGenerationOverlay.
 * Modern AI-tool feel: large textarea, lime focus halo, prompt chips, floating submit.
 */
export function HeroPromptInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  suggestions = DEFAULT_SUGGESTIONS,
  className,
  size = "default",
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const isLg = size === "lg";

  return (
    <div className={cn("relative", className)}>
      {/* Lime halo backdrop on focus */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-8 transition-opacity duration-500",
          focused ? "opacity-100" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(195,235,66,0.25) 0%, rgba(195,235,66,0.08) 35%, transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      {/* Input card */}
      <div
        className={cn(
          "relative rounded-g6-2xl border bg-g6-bg-container transition-all duration-300",
          focused
            ? "border-g6-primary-border shadow-g6-glow"
            : "border-g6-border-secondary shadow-g6-md"
        )}
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          <Sparkles
            className={cn(
              "shrink-0 transition-colors",
              isLg ? "h-5 w-5 mt-1" : "h-4 w-4 mt-0.5",
              focused ? "text-g6-primary" : "text-g6-text-tertiary"
            )}
          />
          <textarea
            ref={ref}
            rows={isLg ? 3 : 2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder={placeholder ?? "describe what you want to generate or paste a URL"}
            className={cn(
              "w-full flex-1 resize-none bg-transparent text-g6-text placeholder:text-g6-text-tertiary focus:outline-none",
              isLg ? "font-g6-sans text-g6-lg leading-7" : "font-g6-sans text-g6-base leading-relaxed"
            )}
          />
        </div>

        {/* Suggestion chips + submit button row */}
        <div className="flex items-center gap-2 border-t border-g6-border-secondary px-3 py-2">
          <div className="scrollbar-none flex flex-1 items-center gap-1.5 overflow-x-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  ref.current?.focus();
                }}
                className="shrink-0 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-2.5 py-1 text-g6-xs font-medium text-g6-text-secondary transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
              >
                {s}
              </button>
            ))}
          </div>

          <kbd className="hidden rounded-g6-base bg-g6-bg-spotlight px-1.5 py-0.5 font-g6-mono text-g6-xs text-g6-text-tertiary sm:inline-flex">
            ⌘↵
          </kbd>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim()}
            aria-label="Submit prompt"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-g6-base transition-all",
              value.trim()
                ? "bg-g6-primary text-g6-text-on-accent shadow-g6-primary-btn hover:bg-g6-primary-hover"
                : "bg-g6-bg-spotlight text-g6-text-disabled cursor-not-allowed"
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useAuthV2Variant } from "@/auth-v2/shared/useAuthV2Variant";

/**
 * VariantToggle — floating dev-only pill (bottom-right), mirrors the exact
 * visual pattern of src/auth-concepts/shared/ConceptSwitcher.tsx. Lets
 * Maalik flip between the 2 final candidate designs (Dark Stage / Living
 * Split) without a URL change. Not user-facing.
 */
export function VariantToggle() {
  const { variant, setVariant } = useAuthV2Variant();

  const options: { key: "dark-stage" | "living-split"; label: string; title: string }[] = [
    { key: "dark-stage", label: "A", title: "Dark Stage" },
    { key: "living-split", label: "B", title: "Living Split" },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[999] flex gap-1 rounded-xl border border-black/10 bg-white/90 p-1.5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-black/80">
      {options.map((opt) => {
        const isActive = opt.key === variant;
        return (
          <button
            key={opt.key}
            type="button"
            title={opt.title}
            onClick={() => setVariant(opt.key)}
            className={
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors " +
              (isActive
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

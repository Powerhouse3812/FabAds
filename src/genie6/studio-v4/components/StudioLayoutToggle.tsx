import { useStudioLayoutVariant, type StudioLayoutVariant } from "../state/useStudioLayoutVariant";

/**
 * StudioLayoutToggle — floating dev-only pill (bottom-right), mirrors the
 * exact visual pattern of src/auth-v2/shared/VariantToggle.tsx. Lets Maalik
 * flip between the 2 candidate Studio wizard layouts (Rail / Linear) without
 * a URL change. Not user-facing.
 */
export function StudioLayoutToggle() {
  const { variant, setVariant } = useStudioLayoutVariant();

  const options: { key: StudioLayoutVariant; label: string; title: string }[] = [
    { key: "rail", label: "Rail", title: "Rail — Overview as a right-side panel" },
    { key: "linear", label: "Linear", title: "Linear — Overview above the prompt bar" },
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

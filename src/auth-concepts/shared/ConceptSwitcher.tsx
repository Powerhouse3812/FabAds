import { Link } from "react-router-dom";
import { AUTH_CONCEPTS } from "@/auth-concepts/shared/formSpec";

/**
 * ConceptSwitcher — floating pill nav (bottom-right, mirrors the StatePicker
 * pattern already used on the real /auth screens) so every one of the 10
 * exploration directions is one click away, without returning to the
 * gallery or hand-editing the URL each time. Uses react-router `Link` (not
 * window.location) so switching between concepts is an instant client-side
 * nav, not a full page reload.
 */
export function ConceptSwitcher({ active }: { active: string }) {
  return (
    <div className="fixed bottom-4 right-4 z-[999] flex max-w-[280px] flex-wrap justify-end gap-1 rounded-xl border border-black/10 bg-white/90 p-1.5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-black/80">
      <Link
        to="/auth-concepts"
        className="rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        Gallery
      </Link>
      {AUTH_CONCEPTS.map((c) => {
        const isActive = c.slug === active;
        return (
          <Link
            key={c.slug}
            to={`/auth-concepts/${c.slug}`}
            className={
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors " +
              (isActive
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white")
            }
          >
            {String(c.number).padStart(2, "0")}
          </Link>
        );
      })}
    </div>
  );
}

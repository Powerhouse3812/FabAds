import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { categories } from "../mocks/categories";

export function CategorySettings() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        to="/iq/genie6/settings"
        className="mb-4 inline-flex items-center gap-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary hover:text-g6-text"
      >
        <ChevronLeft className="h-3 w-3" /> Settings
      </Link>

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-g6-sans text-g6-h2 font-bold text-g6-text">Category Settings</h1>
          <p className="mt-1 text-g6-base text-g6-text-secondary">
            Per-category knowledge bases drive what AI considers a winning angle and how compliance
            applies.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover"
        >
          <Plus className="h-4 w-4" /> Add category
        </button>
      </header>

      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              to={`/iq/genie6/settings/categories/${c.id}`}
              className="group flex items-center gap-4 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg"
            >
              <div className="flex-1">
                <h2 className="font-g6-sans text-g6-base font-semibold text-g6-text">{c.name}</h2>
                <p className="mt-1 font-g6-mono text-g6-xs text-g6-text-tertiary">
                  {c.winnerCount} winners · {c.feedbackCount} feedback entries · {c.referenceUrls.length} references
                </p>
                <p className="mt-1 truncate text-g6-sm text-g6-text-secondary">{c.instruction}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-g6-text-tertiary group-hover:text-g6-text" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

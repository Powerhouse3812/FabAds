import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { TemplatesTab } from "../library/tabs/TemplatesTab";

export function TemplateLibrarySettings() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        to="/iq/genie6/settings"
        className="mb-4 inline-flex items-center gap-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary hover:text-g6-text"
      >
        <ChevronLeft className="h-3 w-3" /> Settings
      </Link>

      <header className="mb-6">
        <h1 className="font-g6-sans text-g6-h2 font-bold text-g6-text">Templates</h1>
        <p className="mt-1 text-g6-base text-g6-text-secondary">
          Visual layouts saved from winning ads. Apply to future generations to keep composition
          consistent across products.
        </p>
      </header>

      <TemplatesTab />
    </div>
  );
}

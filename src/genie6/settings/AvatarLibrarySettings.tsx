import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AvatarsTab } from "../library/tabs/AvatarsTab";

export function AvatarLibrarySettings() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        to="/iq/genie6/settings"
        className="mb-4 inline-flex items-center gap-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary hover:text-g6-text"
      >
        <ChevronLeft className="h-3 w-3" /> Settings
      </Link>

      <header className="mb-6">
        <h1 className="font-g6-sans text-g6-h2 font-bold text-g6-text">Avatar Library</h1>
        <p className="mt-1 text-g6-base text-g6-text-secondary">
          Personas for UGC Video mode. Match demographic to audience for native-feeling output.
        </p>
      </header>

      <AvatarsTab search="" />
    </div>
  );
}

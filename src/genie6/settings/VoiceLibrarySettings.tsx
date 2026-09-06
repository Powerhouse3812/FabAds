import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, Play } from "lucide-react";
import { voices } from "../mocks";

export function VoiceLibrarySettings() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        to="/iq/genie6/settings"
        className="mb-4 inline-flex items-center gap-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary hover:text-g6-text"
      >
        <ChevronLeft className="h-3 w-3" /> Settings
      </Link>

      <header className="mb-6">
        <h1 className="font-g6-sans text-g6-h2 font-bold text-g6-text">Voice Library</h1>
        <p className="mt-1 text-g6-base text-g6-text-secondary">
          Voice samples per language. Pair with avatars in UGC Video for native-language output.
        </p>
        <Link
          to="/iq/genie6/settings/brain"
          className="mt-3 inline-flex items-center gap-1.5 rounded-g6-pill bg-g6-primary px-4 py-2 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover"
        >
          Preview and pick voices in Genie Brain
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <ul className="space-y-2">
        {voices.map((v) => (
          <li
            key={v.id}
            className="flex items-center gap-4 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4"
          >
            {/* This was a lime primary button with NO onClick — a dead
                control that looked like the most important thing on the row.
                §13's real audio preview ("a play control while choosing, so
                the voice can be heard before it is committed to a render")
                is built in the Genie Brain's AvatarVoicePicker, where avatar
                and voice are chosen together. Rather than fake a second
                player here, the row points at the surface that has one. */}
            <span
              aria-hidden
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-g6-bg-spotlight text-g6-text-tertiary"
            >
              <Play className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <h2 className="font-g6-sans text-g6-base font-semibold text-g6-text">{v.name}</h2>
              <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{v.language}</p>
              <p className="mt-1 text-g6-sm text-g6-text-secondary">{v.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { Link } from "react-router-dom";
import { ChevronLeft, Play } from "lucide-react";
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
        {/* §12 (authoritative revision): Genie Brain is an internal-only
            FabFunnel admin surface with no shared navigation and no shared
            entry point from any client surface. This page used to link there
            ("Preview and pick voices in Genie Brain") — that CTA is removed,
            and nothing on this client-facing Settings page should replace it.
            The real audio preview this used to point at still exists (in
            Genie Brain's AvatarVoicePicker), it's just not reachable from
            here anymore. */}
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
                is built in Genie Brain's AvatarVoicePicker, where avatar and
                voice are chosen together — but per §12 that page is now
                internal-only with no entry point from this client surface,
                so this row no longer links there either. Rather than fake a
                second player here (or relink to a page this client can't
                reach), it stays an inert icon — a real per-row preview on
                this page is future scope, not this fix. */}
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

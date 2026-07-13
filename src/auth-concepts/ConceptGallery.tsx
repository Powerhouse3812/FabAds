import { Link } from "react-router-dom";
import { AUTH_CONCEPTS } from "@/auth-concepts/shared/formSpec";

/**
 * ConceptGallery — index for the auth-concepts exploration track (10
 * visually distinct login-screen directions, per Maalik's "let's decide 10
 * versions" brief). Public, no app shell — this is a design-review surface,
 * not a real route in the product. See shared/formSpec.ts for the canonical
 * field set every concept restyles around.
 */
export default function ConceptGallery() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
          Auth exploration track
        </p>
        <h1 className="mt-2 text-3xl font-bold">11 directions</h1>
        <p className="mt-2 max-w-xl text-sm text-white/60">
          Same login fields throughout — only the visual system, layout, and motion change.
          Separate track, doesn't touch the live /auth screens.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUTH_CONCEPTS.map((c) => (
            <Link
              key={c.slug}
              to={`/auth-concepts/${c.slug}`}
              className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
            >
              <span className="text-xs font-mono text-white/40">
                {String(c.number).padStart(2, "0")}
              </span>
              <span className="text-lg font-semibold">{c.name}</span>
              <span className="text-xs font-medium uppercase tracking-wide text-white/50">
                {c.tagline}
              </span>
              <p className="mt-1 text-sm text-white/60">{c.description}</p>
              <span className="mt-3 text-sm font-medium text-white/80 group-hover:text-white">
                View concept →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

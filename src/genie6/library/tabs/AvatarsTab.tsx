import { Play } from "lucide-react";
import { avatars } from "../../mocks";
import { EmptyState } from "../../components/EmptyState";

type Props = { search: string };

export function AvatarsTab({ search }: Props) {
  const filtered = avatars.filter(
    (a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.demographic.toLowerCase().includes(search.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No avatars in your library"
        description="Avatars power UGC Video mode. Default seed library covers Indian + global demographics — tune voice + script per generation."
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {filtered.map((a) => (
        <li
          key={a.id}
          className="group relative flex flex-col gap-2 overflow-hidden rounded-g6-card border border-g6-border-secondary bg-g6-bg-container transition-colors hover:border-g6-border"
        >
          <div className="relative aspect-square w-full bg-g6-bg-spotlight">
            {/* Real face thumbnails come with the avatar pipeline; for now show initials motif */}
            <div className="flex h-full w-full items-center justify-center font-g6-sans text-g6-h2 font-bold text-g6-text-secondary">
              {a.name[0]}
            </div>
            <button
              type="button"
              aria-label={`Preview ${a.name}`}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-g6-bg-base/85 text-g6-text opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="px-3 pb-3">
            <p className="font-g6-sans text-g6-base font-semibold text-g6-text">{a.name}</p>
            <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{a.demographic}</p>
            <p className="mt-1 flex flex-wrap gap-1 font-g6-mono text-g6-xs text-g6-text-tertiary">
              {a.language.map((lang) => (
                <span key={lang} className="rounded-g6-pill bg-g6-bg-spotlight px-1.5 py-0.5">
                  {lang}
                </span>
              ))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

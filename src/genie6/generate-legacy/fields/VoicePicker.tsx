import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { voices } from "../../mocks/library";

/**
 * VoicePicker — horizontal-scroll voice cards (iter-5 P-4).
 *
 * Vertical list -> snap-to-card row matching AvatarPicker / SourceWinnerPicker.
 * Each card: name, description, language tag. Click toggles selection.
 */
export function VoicePicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Voice</label>
      <p className="text-g6-xs text-g6-text-tertiary">How should the avatar sound?</p>
      <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {voices.map((v) => {
          const active = draft.voiceId === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() =>
                dispatch({ type: "SET_VOICE", voiceId: active ? null : v.id })
              }
              className={cn(
                "flex w-[180px] shrink-0 snap-start flex-col gap-1 rounded-g6-base border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary-bg"
                  : "border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-g6-sm font-semibold text-g6-text">{v.name}</span>
                <span className="font-g6-mono text-[10px] text-g6-text-tertiary shrink-0">
                  {v.language}
                </span>
              </div>
              <span className="text-[11px] text-g6-text-secondary leading-snug line-clamp-2">
                {v.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

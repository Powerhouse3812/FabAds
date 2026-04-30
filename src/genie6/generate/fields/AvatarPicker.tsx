import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { avatars } from "../../mocks/library";

/**
 * AvatarPicker — horizontal-scroll strip (iter-5 O-5). Was a 4-col grid that
 * grew tall as more avatars were added; now a fixed-height row that scrolls
 * sideways. Same selection UX, half the vertical real estate.
 */
export function AvatarPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Avatar</label>
      <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {avatars.map((a) => {
          const active = draft.avatarId === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() =>
                dispatch({ type: "SET_AVATAR", avatarId: active ? null : a.id })
              }
              className={cn(
                "flex w-[96px] shrink-0 snap-start flex-col items-center gap-1 rounded-g6-base border p-2 text-center transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary-bg"
                  : "border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-g6-sm font-semibold",
                  active
                    ? "bg-g6-primary text-g6-text-on-accent"
                    : "bg-g6-bg-spotlight text-g6-text-secondary"
                )}
              >
                {a.name[0]}
              </div>
              <span className="w-full truncate text-g6-xs font-medium text-g6-text">
                {a.name}
              </span>
              <span className="w-full truncate text-[10px] text-g6-text-tertiary">
                {a.demographic}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

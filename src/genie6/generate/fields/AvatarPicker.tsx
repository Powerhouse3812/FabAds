import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { avatars } from "../../mocks/library";

export function AvatarPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Avatar</label>
      <div className="grid grid-cols-4 gap-2">
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
                "flex flex-col items-center gap-1.5 rounded-g6-base border p-2 text-center transition-colors",
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
              <span className="text-g6-xs font-medium text-g6-text">{a.name}</span>
              <span className="text-g6-xs text-g6-text-tertiary">{a.demographic}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

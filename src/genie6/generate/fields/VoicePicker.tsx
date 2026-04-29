import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { voices } from "../../mocks/library";

export function VoicePicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Voice</label>
      <div className="flex flex-col gap-1.5">
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
                "flex items-start justify-between rounded-g6-base border px-3 py-2 text-left transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary-bg"
                  : "border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              <div className="flex flex-col">
                <span className="text-g6-sm font-medium text-g6-text">{v.name}</span>
                <span className="text-g6-xs text-g6-text-tertiary">{v.description}</span>
              </div>
              <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{v.language}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

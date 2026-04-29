import { useDraft } from "../../stores/draftStore";
import { audiences } from "../../mocks/library";

export function AudiencePicker() {
  const { draft, dispatch } = useDraft();

  const relevant = draft.brandId
    ? audiences.filter((a) => !a.brandId || a.brandId === draft.brandId)
    : audiences;

  return (
    <div className="space-y-2">
      <label htmlFor="audience-picker" className="text-g6-sm font-medium text-g6-text">
        Audience
      </label>
      <select
        id="audience-picker"
        value={draft.audienceFreeform}
        onChange={(e) => dispatch({ type: "SET_AUDIENCE", audienceFreeform: e.target.value })}
        className="h-g6-lg w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 text-g6-base text-g6-text focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      >
        <option value="">Select or type below…</option>
        {relevant.map((a) => (
          <option key={a.id} value={a.segment}>
            {a.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="or describe freeform — e.g. Urban women 28-40"
        value={draft.audienceFreeform}
        onChange={(e) => dispatch({ type: "SET_AUDIENCE", audienceFreeform: e.target.value })}
        className="h-g6-lg w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 text-g6-base text-g6-text placeholder:text-g6-text-disabled focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      />
    </div>
  );
}

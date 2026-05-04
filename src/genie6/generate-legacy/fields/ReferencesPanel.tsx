import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useDraft } from "../../stores/draftStore";

export function ReferencesPanel() {
  const { draft, dispatch } = useDraft();
  const [input, setInput] = useState("");

  const add = () => {
    const url = input.trim();
    if (!url) return;
    dispatch({ type: "ADD_REFERENCE", url });
    setInput("");
  };

  return (
    <div className="space-y-3">
      <label className="text-g6-sm font-medium text-g6-text">References</label>

      <div className="flex gap-2">
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Paste a reference URL or winner link…"
          className="h-g6-lg flex-1 rounded-g6-base border border-g6-border bg-g6-bg-container px-3 font-g6-mono text-g6-sm text-g6-text placeholder:text-g6-text-disabled focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
        />
        <button
          type="button"
          onClick={add}
          className="flex h-g6-lg items-center gap-1 rounded-g6-base border border-g6-border bg-g6-bg-container px-3 text-g6-sm text-g6-text-secondary transition-colors hover:border-g6-border hover:text-g6-text"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {draft.references.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {draft.references.map((ref, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-3 py-1.5"
            >
              <span className="flex-1 truncate font-g6-mono text-g6-xs text-g6-text-secondary">
                {ref}
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_REFERENCE", index: i })}
                className="text-g6-text-tertiary transition-colors hover:text-g6-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

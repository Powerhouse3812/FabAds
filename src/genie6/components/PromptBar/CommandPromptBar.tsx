import { PromptBarContent } from "./PromptBarContent";

/**
 * Command variant of the prompt bar — flat ops-table footer with mono
 * status strip above. Matches the Command ops-dashboard idiom.
 */
export function CommandPromptBar() {
  return (
    <div className="sticky bottom-0 border-t border-g6-border-secondary bg-g6-bg-base px-5">
      <div className="border-b border-g6-border-secondary py-1">
        <span className="font-g6-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary">
          <span className="text-g6-success">●</span> command · prompt bar · ready
        </span>
      </div>
      <PromptBarContent generateLabel="Submit batch ▸" />
    </div>
  );
}

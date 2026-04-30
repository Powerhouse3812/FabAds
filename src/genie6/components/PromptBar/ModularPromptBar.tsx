import { PromptBarContent } from "./PromptBarContent";

/**
 * Modular variant of the prompt bar — glass module card with > module
 * header, matching the Modular composable-workbench idiom.
 */
export function ModularPromptBar() {
  return (
    <div className="g6-glass rounded-g6-card p-4">
      <p className="font-g6-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary mb-1">
        <span className="text-g6-primary">&gt;</span> generate.prompt
      </p>
      <PromptBarContent density="tight" generateLabel="Generate ▶" />
    </div>
  );
}

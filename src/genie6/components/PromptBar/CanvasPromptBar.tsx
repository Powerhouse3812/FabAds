import { PromptBarContent } from "./PromptBarContent";

/**
 * Canvas variant of the prompt bar — floating frosted-glass dock with
 * heavy backdrop blur, matching the Canvas Photoshop-floor aesthetic.
 * Sits absolute-positioned at the bottom of the canvas viewport.
 */
export function CanvasPromptBar() {
  return (
    <div className="absolute inset-x-4 bottom-4 z-20 rounded-g6-2xl border border-g6-border-secondary bg-g6-bg-container/85 px-4 shadow-g6-lg backdrop-blur-xl">
      <PromptBarContent density="tight" />
    </div>
  );
}

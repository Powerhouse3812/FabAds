import { PromptBarContent } from "./PromptBarContent";

/**
 * Studio variant of the prompt bar — clean elevated card matching the
 * Studio agency-desk idiom. Sits in the form's sticky footer.
 */
export function StudioPromptBar() {
  return (
    <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 border-t border-g6-border-secondary bg-g6-bg-base/95 px-5 backdrop-blur-md">
      <PromptBarContent />
    </div>
  );
}

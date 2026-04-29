import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioGenerateForm } from "../variants/studio/StudioGenerateForm";
import { CanvasGenerateForm } from "../variants/canvas/CanvasGenerateForm";
import { CommandGenerateForm } from "../variants/command/CommandGenerateForm";
import { ModularGenerateForm } from "../variants/modular/ModularGenerateForm";

/**
 * FormScaffold — variant-aware router for the Generate form surface.
 *
 * Reads the current architectural variant from `useGenie6Theme()` and renders
 * the matching variant implementation. Each variant is a fundamentally
 * different layout (3-column workspace / canvas-editor / ops-dashboard /
 * modular-workbench), not a styling difference.
 *
 * The variants share the same underlying state (useDraft) and field renderer,
 * so switching variants preserves user input — only the chrome around the
 * fields changes.
 */
export function FormScaffold() {
  const { variant } = useGenie6Theme();

  switch (variant) {
    case "canvas":
      return <CanvasGenerateForm />;
    case "command":
      return <CommandGenerateForm />;
    case "modular":
      return <ModularGenerateForm />;
    case "studio":
    default:
      return <StudioGenerateForm />;
  }
}

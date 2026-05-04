import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioProgressScreen } from "../variants/studio/StudioProgressScreen";
import { CanvasProgressScreen } from "../variants/canvas/CanvasProgressScreen";
import { CommandProgressScreen } from "../variants/command/CommandProgressScreen";
import { ModularProgressScreen } from "../variants/modular/ModularProgressScreen";

/**
 * ProgressScreen — variant-aware router. Each architectural variant has its
 * own implementation of the generation-in-progress screen with mental-model-
 * appropriate chrome.
 */
export function ProgressScreen() {
  const { variant } = useGenie6Theme();
  switch (variant) {
    case "canvas":
      return <CanvasProgressScreen />;
    case "command":
      return <CommandProgressScreen />;
    case "modular":
      return <ModularProgressScreen />;
    case "studio":
    default:
      return <StudioProgressScreen />;
  }
}

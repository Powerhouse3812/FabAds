import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioResultsScreen } from "../variants/studio/StudioResultsScreen";
import { CanvasResultsScreen } from "../variants/canvas/CanvasResultsScreen";
import { CommandResultsScreen } from "../variants/command/CommandResultsScreen";
import { ModularResultsScreen } from "../variants/modular/ModularResultsScreen";

/**
 * ResultsScreen — variant-aware router. Each architectural variant has its
 * own implementation of the generation-results screen with mental-model-
 * appropriate chrome (panels / canvas / ops table / module cards).
 */
export function ResultsScreen() {
  const { variant } = useGenie6Theme();
  switch (variant) {
    case "canvas":
      return <CanvasResultsScreen />;
    case "command":
      return <CommandResultsScreen />;
    case "modular":
      return <ModularResultsScreen />;
    case "studio":
    default:
      return <StudioResultsScreen />;
  }
}

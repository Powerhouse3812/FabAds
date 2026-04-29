import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioModePicker } from "../variants/studio/StudioModePicker";
import { CanvasModePicker } from "../variants/canvas/CanvasModePicker";
import { CommandModePicker } from "../variants/command/CommandModePicker";
import { ModularModePicker } from "../variants/modular/ModularModePicker";

/**
 * ModePicker — variant-aware router for the Generate index surface.
 *
 * Each architectural variant has its own ModePicker implementation in
 * src/genie6/variants/. Mounted at /iq/genie6/generate (the index route).
 *
 *   studio   — centered hero + balanced 4+2 mode grid
 *   canvas   — vertical mode rail + center canvas with hovered-mode preview
 *   command  — compact prompt + mode picker as dense table with usage stats
 *   modular  — prompt_module + modes_module + hovered preview module on dark cosmic
 */
export function ModePicker() {
  const { variant } = useGenie6Theme();

  switch (variant) {
    case "canvas":
      return <CanvasModePicker />;
    case "command":
      return <CommandModePicker />;
    case "modular":
      return <ModularModePicker />;
    case "studio":
    default:
      return <StudioModePicker />;
  }
}

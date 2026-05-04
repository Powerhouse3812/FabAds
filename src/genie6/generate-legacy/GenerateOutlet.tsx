import { Outlet } from "react-router-dom";
import { DraftProvider } from "../stores/draftStore";

/**
 * Wraps all /generate/* routes with DraftProvider so form state
 * persists across wizard ↔ form toggle and progress → results navigation.
 */
export function GenerateOutlet() {
  return (
    <DraftProvider>
      <Outlet />
    </DraftProvider>
  );
}

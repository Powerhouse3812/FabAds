import { PlanModalV2 } from "./PlanModalV2";

/**
 * Route wrapper for `/plans-v2`.
 *
 * Renders the modal over a subtle backdrop. Closing the X navigates back
 * via history (handled inside PlanModalV2). The page itself has no
 * underlying chrome — it's intentionally a clean takeover so a new user
 * can't get distracted.
 *
 * Same nav rail (AppLayout) is still visible behind the backdrop —
 * matches Maalik's "modal opens for new user" framing where the user
 * sees the rail dimly visible but the modal is the only thing
 * interactive.
 */
export function PlanModalV2Page() {
  return <PlanModalV2 />;
}

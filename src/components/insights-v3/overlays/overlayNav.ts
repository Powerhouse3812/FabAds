/**
 * OWNER: orchestrator. Props every detail overlay receives from
 * InsightsOverlayHost — wire straight into the shared <DetailOverlay>:
 *   <DetailOverlay open={nav.open} backLabel={nav.backLabel} onBack={nav.onBack} onClose={nav.onClose} …>
 */
export interface OverlayNav {
  open: boolean;
  /** Set only when nested: label of the layer underneath. */
  backLabel?: string;
  onBack?: () => void;
  /** Closes the whole stack. */
  onClose: () => void;
}

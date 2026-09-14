import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProductPickerPanel, ProductSheet } from "../../variations/components/ProductSheet";
import { SwapCardShell } from "./SwapCardShell";
import type { ProductSwapCardState } from "./swapTypes";

/**
 * Product Swap's stage-3 card — REUSE, NOT REBUILD: `ProductSheet` already IS
 * the owner's asked-for resting-state affordance ("Variation by default" —
 * see that file's own header comment), so this card is just `SwapCardShell`
 * + `ProductSheet` + the picker it already ships (`ProductPickerPanel`)
 * opened in a Dialog. `VariationCard` mounts that same panel inside its own
 * rail switchboard; there is no such switchboard here, so a plain Dialog is
 * the host — outside-click dismiss is already disabled at the `DialogContent`
 * primitive (see components/ui/dialog.tsx), `onInteractOutside` below is
 * belt-and-braces per the house rule.
 */
export function ProductSwapCardView({
  card,
  index,
  onChange,
}: {
  card: ProductSwapCardState;
  index: number;
  onChange: (patch: Partial<ProductSwapCardState>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <SwapCardShell index={index} eyebrow={`Scene ${index + 1}`}>
      <ProductSheet
        productId={card.productId}
        onOpen={() => setOpen(true)}
        onRemove={() => onChange({ productId: null })}
        hint={`Brand and name show here — scene ${index + 1} is composited around it.`}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="h-[70vh] max-w-lg gap-0 overflow-hidden p-0"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Names the SCENE, not the action — `ProductPickerPanel` already
              renders a visible "Attach a product" heading, so repeating it
              here made the dialog announce itself twice. */}
          <DialogTitle className="sr-only">{`Product for scene ${index + 1}`}</DialogTitle>
          <ProductPickerPanel
            value={card.productId}
            onPick={(id) => {
              onChange({ productId: id });
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </SwapCardShell>
  );
}

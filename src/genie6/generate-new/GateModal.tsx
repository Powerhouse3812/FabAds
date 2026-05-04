import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, ShoppingBag, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OutsideCtaDescriptor, TypeId } from "./types";

/**
 * GateModal — pre-flight confirmation modal for outside CTAs (A-11.3).
 *
 * Per Form Specs §0.4 + Rule 1:
 *   - Shown for 5 of 6 outside CTAs (skipped only for Variations).
 *   - Shows pre-fills (Type / Output / Preset) and a single Confirm button.
 *   - For UGC Video preset: user picks the Type (Brand / Product / Affiliate)
 *     via a radio group; Output=Video is locked.
 *   - For Product Shoot preset: locked to Type=Product Ad + Output=Image +
 *     preset=shoot/staging.
 *   - For Type CTAs (Brand/Product/Affiliate): minimal gate — confirms the
 *     Type choice and routes to the form.
 *
 * Centered, dimmed, Esc to close (shadcn Dialog default behavior).
 */

interface GateModalProps {
  cta: OutsideCtaDescriptor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GateModal({ cta, open, onOpenChange }: GateModalProps) {
  const navigate = useNavigate();

  // For UGC Video preset: user picks the Type via radio.
  // Default: Product Ad (most common UGC use-case).
  const [ugcType, setUgcType] = useState<TypeId>("product-ad");

  // Reset radio when the modal opens for a different CTA.
  useEffect(() => {
    if (cta?.id === "ugc-video") setUgcType("product-ad");
  }, [cta?.id]);

  if (!cta) return null;

  const handleConfirm = () => {
    if (cta.id === "product-shoot") {
      // Form Specs §5: Product Shoot preset → Product Ad with shoot/staging.
      navigate("/iq/genie6/generate/product-ad?output=product-shoot&preset=shoot");
    } else if (cta.id === "ugc-video") {
      // Form Specs §6: UGC Video preset → user-picked Type with Output=Video.
      navigate(`/iq/genie6/generate/${ugcType}?output=video`);
    } else {
      // Type CTA — direct route, gate just confirms.
      navigate(`/iq/genie6/generate/${cta.id}`);
    }
    onOpenChange(false);
  };

  const isUgcVideo = cta.id === "ugc-video";
  const isProductShoot = cta.id === "product-shoot";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cta.label}</DialogTitle>
          <DialogDescription>{cta.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isUgcVideo && (
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Apply UGC Video to which Type?
              </Label>
              <RadioGroup value={ugcType} onValueChange={(v) => setUgcType(v as TypeId)} className="space-y-1.5">
                <UgcRadioOption value="brand-ad" label="Brand Ad" sub="Hero brand UGC" icon="Sparkles" current={ugcType} />
                <UgcRadioOption value="product-ad" label="Product Ad" sub="UGC anchored to a product" icon="ShoppingBag" current={ugcType} />
                <UgcRadioOption value="affiliate-ad" label="Affiliate Ad" sub="UGC for category / landing page" icon="Target" current={ugcType} />
              </RadioGroup>
            </div>
          )}

          {/* Pre-fill summary */}
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Pre-filled
            </p>
            <div className="space-y-1 text-xs">
              {isProductShoot && (
                <>
                  <PrefillRow label="Type" value="Product Ad" />
                  <PrefillRow label="Output" value="Image" />
                  <PrefillRow label="Preset" value="Studio shoot · clean staging · no text overlay" />
                </>
              )}
              {isUgcVideo && (
                <>
                  <PrefillRow label="Type" value={typeLabelFor(ugcType)} />
                  <PrefillRow label="Output" value="Video" />
                  <PrefillRow label="Section" value="Video Production auto-expanded" />
                </>
              )}
              {!isProductShoot && !isUgcVideo && (
                <>
                  <PrefillRow label="Type" value={cta.label} />
                  <PrefillRow label="Output" value="Whole Adcopy (default)" />
                  <PrefillRow label="Advanced" value="Blank — fill on the form" />
                </>
              )}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Override anything on the form. This gate is just a 1-click confirmation.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Continue to form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────── */

function PrefillRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 min-w-[60px]">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

const RADIO_ICONS = { Sparkles, ShoppingBag, Target } as const;

function UgcRadioOption({
  value,
  label,
  sub,
  icon,
  current,
}: {
  value: TypeId;
  label: string;
  sub: string;
  icon: keyof typeof RADIO_ICONS;
  current: TypeId;
}) {
  const Icon = RADIO_ICONS[icon];
  const active = value === current;
  return (
    <Label
      htmlFor={`ugc-type-${value}`}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
      )}
    >
      <RadioGroupItem value={value} id={`ugc-type-${value}`} className="mt-0.5" />
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </Label>
  );
}

function typeLabelFor(t: TypeId): string {
  switch (t) {
    case "brand-ad":
      return "Brand Ad";
    case "product-ad":
      return "Product Ad";
    case "affiliate-ad":
      return "Affiliate Ad";
    case "variation":
      return "Variations";
  }
}

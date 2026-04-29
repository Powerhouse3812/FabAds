import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageIcon, FileText, ShoppingBag, Megaphone, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export type IntentType = "creative-image" | "creative-video" | "adcopy";
export type PurposeType = "ecommerce" | "affiliate";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (intent: IntentType, purpose: PurposeType) => void;
}

type BaseIntent = "creative" | "adcopy";

const intentOptions = [
  { value: "creative" as const, label: "Creative (Image/Video)", desc: "Generate ad images or videos", icon: ImageIcon },
  { value: "adcopy" as const, label: "Ad Copy", desc: "Generate full ad copy with creative, headline, text & description", icon: FileText },
];

const creativeSubOptions = [
  { value: "creative-image" as IntentType, label: "Image", icon: ImageIcon },
  { value: "creative-video" as IntentType, label: "Video", icon: Video },
];

const purposeOptions = [
  { value: "ecommerce" as const, label: "E-commerce", desc: "Sell a specific product or brand", icon: ShoppingBag },
  { value: "affiliate" as const, label: "Affiliate", desc: "Promote an offer, idea, or angle", icon: Megaphone },
];

export function Genie2IntentModal({ open, onClose, onConfirm }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [baseIntent, setBaseIntent] = useState<BaseIntent | null>(null);
  const [creativeSubType, setCreativeSubType] = useState<IntentType>("creative-image");
  const [purpose, setPurpose] = useState<PurposeType | null>(null);

  const handleClose = () => {
    setStep(1);
    setBaseIntent(null);
    setCreativeSubType("creative-image");
    setPurpose(null);
    onClose();
  };

  const resolvedIntent: IntentType | null = baseIntent === "creative" ? creativeSubType : baseIntent === "adcopy" ? "adcopy" : null;

  const handleContinue = () => {
    if (step === 1 && resolvedIntent) {
      setStep(2);
    } else if (step === 2 && resolvedIntent && purpose) {
      onConfirm(resolvedIntent, purpose);
      setStep(1);
      setBaseIntent(null);
      setCreativeSubType("creative-image");
      setPurpose(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {step === 1 ? "What do you want to create?" : "What is it for?"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {step === 1 ? (
            <>
              {intentOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = baseIntent === opt.value;
                return (
                  <div key={opt.value}>
                    <button
                      onClick={() => setBaseIntent(opt.value)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary/60 hover:bg-accent/40",
                        isSelected && "border-primary bg-primary/5 ring-1 ring-primary/30"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                    {/* Sub-selection chips for Creative */}
                    {opt.value === "creative" && isSelected && (
                      <div className="flex gap-2 mt-2 ml-14">
                        {creativeSubOptions.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <button
                              key={sub.value}
                              onClick={() => setCreativeSubType(sub.value)}
                              className={cn(
                                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                                creativeSubType === sub.value
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:border-primary/40"
                              )}
                            >
                              <SubIcon className="h-3 w-3" />
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            purposeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = purpose === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPurpose(opt.value as PurposeType)}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary/60 hover:bg-accent/40",
                    isSelected && "border-primary bg-primary/5 ring-1 ring-primary/30"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {step === 2 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
          ) : <span />}
          <Button
            size="sm"
            disabled={step === 1 ? !resolvedIntent : !purpose}
            onClick={handleContinue}
          >
            {step === 2 ? "Continue" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

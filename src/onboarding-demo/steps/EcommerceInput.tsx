import { useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepNav } from "../components/StepNav";

interface EcommerceInputProps {
  onBack: () => void;
  onContinue: (data: { brandUrl: string }) => void;
}

/**
 * Step 2 — E-commerce input. Single field: Brand URL. The wizard infers
 * brand name, description, voice, colours, typography etc. from the URL
 * in Step 3, so we don't ask the user for any of that up front.
 */
export function EcommerceInput({ onBack, onContinue }: EcommerceInputProps) {
  const [brandUrl, setBrandUrl] = useState("");

  const submit = () => {
    onContinue({
      brandUrl: brandUrl.trim() || "aurora-apparel.com",
    });
  };

  return (
    <div className="bg-background">
      <StepNav active={1} onBack={onBack} backLabel="Back to Quick Start" />
      <div className="max-w-[640px] mx-auto px-6 pt-2 pb-10">
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-wider font-mono mb-3 bg-primary/10 border-primary/30 text-foreground"
        >
          Step 2 · Input
        </Badge>
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-foreground shrink-0">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Tell us about your store
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1.5">
              Paste your URL — we'll auto-pull your brand, colors, voice,
              typography, and audience.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 mt-7">
          <label
            htmlFor="ecom-brand-url"
            className="block text-[13px] font-semibold text-foreground"
          >
            Brand URL <span className="text-rose-500">*</span>
          </label>
          <Input
            id="ecom-brand-url"
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
            placeholder="https://yourstore.com"
            className="mt-2 h-10"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Works with Shopify, WooCommerce, Amazon, and most platforms.
          </p>
        </div>

        <div className="flex items-center justify-between mt-7">
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <Button onClick={submit} className="gap-1.5">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

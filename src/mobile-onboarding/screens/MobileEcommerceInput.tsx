import { useState } from "react";
import { Input } from "@/components/ui/input";
import { MobileFlowShell } from "../components/MobileFlowShell";

export interface MobileEcommerceInputProps {
  onClose: () => void;
  onBack: () => void;
  onContinue: (data: { brandUrl: string }) => void;
  /** Retains the typed value across a Back → forward round trip. */
  initialBrandUrl?: string;
  stepIndex: number;
  stepCount: number;
}

/** Same fallback the web step uses when the field is left blank. */
const FALLBACK_BRAND_URL = "aurora-apparel.com";

/**
 * Genie step 3 (ecom) — Brand URL. Single field, exactly like
 * `src/onboarding-demo/steps/EcommerceInput.tsx`: everything else (name,
 * voice, colours, typography, audience) is inferred during Processing, so
 * asking for it here would be redundant work on a phone keyboard.
 *
 * Mobile-specific input hygiene: `type="url"`, `inputMode="url"`, and
 * autocapitalize/autocorrect off — an iOS keyboard that capitalises the first
 * letter of a URL is a real, common failure on this exact field.
 */
export function MobileEcommerceInput({
  onClose,
  onBack,
  onContinue,
  initialBrandUrl = "",
  stepIndex,
  stepCount,
}: MobileEcommerceInputProps) {
  const [brandUrl, setBrandUrl] = useState(initialBrandUrl);

  return (
    <MobileFlowShell
      eyebrow="Genie setup"
      stepIndex={stepIndex}
      stepCount={stepCount}
      stepLabel="Your store"
      title="Tell us about your store"
      subtitle="Paste your URL — we'll auto-pull your brand, colors, voice, typography, and audience."
      onBack={onBack}
      onClose={onClose}
      primaryLabel="Continue"
      onPrimary={() => onContinue({ brandUrl: brandUrl.trim() || FALLBACK_BRAND_URL })}
      footerNote="Works with Shopify, WooCommerce, Amazon, and most platforms."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <label
          htmlFor="mob-onb-brand-url"
          className="block text-[13px] font-semibold text-foreground"
        >
          Brand URL
        </label>
        <Input
          id="mob-onb-brand-url"
          value={brandUrl}
          onChange={(e) => setBrandUrl(e.target.value)}
          placeholder="https://yourstore.com"
          className="mt-2 h-12 text-[15px]"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby="mob-onb-brand-url-hint"
        />
        <p
          id="mob-onb-brand-url-hint"
          className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground"
        >
          Leave it blank to walk through with our sample store,{" "}
          <span className="font-mono text-foreground/80">{FALLBACK_BRAND_URL}</span>.
        </p>
      </div>
    </MobileFlowShell>
  );
}

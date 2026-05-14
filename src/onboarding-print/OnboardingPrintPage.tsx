import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChooseMode } from "@/onboarding-demo/steps/ChooseMode";
import { EcommerceInput } from "@/onboarding-demo/steps/EcommerceInput";
import { AffiliateInput } from "@/onboarding-demo/steps/AffiliateInput";
import { Processing } from "@/onboarding-demo/steps/Processing";
import { Done } from "@/onboarding-demo/steps/Done";

/**
 * Public print-friendly export of the first-login onboarding flow.
 *
 * URL: /onboarding-print/:step
 *
 * Step values:
 *   choose-mode             — Step 1 (mode picker)
 *   ecom-input              — Step 2 e-commerce
 *   ecom-processing         — Step 3 e-commerce
 *   ecom-done               — Step 4 e-commerce (Brand Ready!)
 *   affiliate-input         — Step 2 affiliate
 *   affiliate-processing    — Step 3 affiliate
 *   affiliate-done          — Step 4 affiliate (Category Ready!)
 *
 * Renders the modal composition inline — no DialogPrimitive.Portal —
 * so design-importer tools (html.to.design, Anima, Locofy) can scrape
 * the page DOM cleanly. The dimmed backdrop is rendered as a regular
 * absolute div instead of fixed/portal so it lives in document flow.
 *
 * All step-component handlers are no-op. Brand URL / category get
 * sensible demo defaults so the Done step renders a fully populated
 * card.
 */

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap";

function usePrintEnvironment() {
  useEffect(() => {
    const id = "onboarding-print-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
    const prev = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyMargin: document.body.style.margin,
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    return () => {
      document.documentElement.style.overflow = prev.htmlOverflow;
      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.margin = prev.bodyMargin;
    };
  }, []);
}

const noop = () => {};

function renderStep(step: string) {
  switch (step) {
    case "choose-mode":
      return <ChooseMode onPick={noop} onSkip={noop} onLogin={noop} />;
    case "ecom-input":
      return <EcommerceInput onBack={noop} onContinue={noop} />;
    case "ecom-processing":
      return (
        <Processing mode="ecom" onBack={noop} onDone={noop} />
      );
    case "ecom-done":
      return (
        <Done
          mode="ecom"
          brandUrl="aurora-apparel.com"
          onBack={noop}
          onStart={noop}
          onRestart={noop}
        />
      );
    case "affiliate-input":
      return <AffiliateInput onBack={noop} onContinue={noop} />;
    case "affiliate-processing":
      return (
        <Processing mode="affiliate" onBack={noop} onDone={noop} />
      );
    case "affiliate-done":
      return (
        <Done
          mode="affiliate"
          category="Auto Insurance"
          onBack={noop}
          onStart={noop}
          onRestart={noop}
        />
      );
    default:
      return <ChooseMode onPick={noop} onSkip={noop} onLogin={noop} />;
  }
}

export function OnboardingPrintPage() {
  usePrintEnvironment();
  const { step = "choose-mode" } = useParams<{ step: string }>();

  return (
    <div
      className="relative min-h-screen w-full bg-background"
      style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
      data-design-export="onboarding-modal"
    >
      {/* Dimmed backdrop — replicates the in-app feed-behind-modal look.
          Using a plain absolute div instead of fixed/portal so it lives
          in document flow and html.to.design captures it. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/70"
        style={{ backdropFilter: "blur(4px)" }}
      />

      {/* Modal card — inline, native dimensions, no Dialog wrapper, no
          Portal. Matches the in-app 720px width + scrollable inner. */}
      <div className="relative z-10 flex items-start justify-center pt-8 px-4">
        <article
          className="w-full max-w-[720px] max-h-[calc(100vh-64px)] flex flex-col bg-background rounded-2xl border border-border shadow-2xl overflow-hidden"
          data-design-export="onboarding-card"
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            {renderStep(step)}
          </div>
        </article>
      </div>
    </div>
  );
}

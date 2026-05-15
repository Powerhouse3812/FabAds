import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { PlanningShell } from "@/planning/PlanningShell";
import type { Billing, Tier, View } from "@/planning/data";

/**
 * Public print-friendly variant of the pricing page.
 *
 * URL: /planning-print/:slug
 *
 * Slug values (6 valid combinations):
 *   ai-direct-monthly
 *   ai-direct-annual
 *   ai-trial-monthly
 *   ai-trial-annual
 *   growth-monthly       (growth has no direct view)
 *   growth-annual
 *
 * Renders the full PlanningShell with state derived from the slug
 * (no URL writes, no toasts on CTA, no PlanContext mutation). Public,
 * no auth, no shell — mirrors brand-book-print + onboarding-print so
 * html.to.design / Anima / Locofy can scrape the page at native
 * dimensions.
 */

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";

function usePrintEnvironment() {
  useEffect(() => {
    const id = "planning-print-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
    const prev = {
      bodyMargin: document.body.style.margin,
    };
    document.body.style.margin = "0";
    return () => {
      document.body.style.margin = prev.bodyMargin;
    };
  }, []);
}

function parseSlug(slug: string): {
  tier: Tier;
  view: View;
  billing: Billing;
} {
  const parts = slug.split("-");
  const tier: Tier = parts[0] === "growth" ? "growth" : "ai";
  // Growth has no direct view — always trial. AI defaults to direct.
  let view: View;
  let billing: Billing;
  if (tier === "growth") {
    view = "trial";
    billing = parts[1] === "annual" ? "annual" : "monthly";
  } else {
    view = parts[1] === "trial" ? "trial" : "direct";
    billing = parts[2] === "annual" ? "annual" : "monthly";
  }
  return { tier, view, billing };
}

export function PlanningPrintPage() {
  usePrintEnvironment();
  const { slug = "ai-direct-monthly" } = useParams<{ slug: string }>();
  const state = parseSlug(slug);

  return (
    <main
      className="min-h-screen w-full bg-background"
      data-design-export="planning-print"
    >
      <PlanningShell printMode printState={state} />
    </main>
  );
}

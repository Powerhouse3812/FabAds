/** OWNER: orchestrator. */
import type { DetailTarget } from "@/lib/insights-v3/types";
import { getAdvertiser, getElement, getLandingPage } from "@/lib/insights-v3/data";

/** Short human label for a stack entry, used by the back chip. */
export function labelForTarget(t: DetailTarget): string {
  switch (t.kind) {
    case "advertiser":
      return getAdvertiser(t.id)?.name ?? (t.advertiserKind === "domain" ? "Domain" : "Page");
    case "element":
      return getElement(t.elementType, t.id)?.label ?? "Element";
    case "landing-page": {
      const lp = getLandingPage(t.id);
      return lp?.title ?? lp?.domain ?? "Landing page";
    }
    case "offer":
      return t.id;
    case "ad":
      return "Ad";
  }
}

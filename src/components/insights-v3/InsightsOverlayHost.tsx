/**
 * InsightsOverlayHost — the ONE place that turns URL params into layers.
 * Every Industry Insights V2 page renders it exactly once.
 *
 *   detail=<token>~<token>   → detail overlay for the TOP of the stack
 *                              (back chip pops to the previous token)
 *   modal=save&target=…      → Save to board (agent D)
 *   ad=<id>                  → ad drawer, mounted LAST so its portal stacks
 *                              above any overlay and Esc closes it first
 *
 * Overlay components (owned by agents B/C) render their own <DetailOverlay>
 * from the shared kit and receive `nav` for the header's back chip + close.
 * The view-more modal is NOT here: its groups are page-specific, so each page
 * mounts <ViewMoreModal> itself.
 */
import type { DetailTarget } from "@/lib/insights-v3/types";
import { useAdDrawer, useDetailStack } from "@/components/insights-v3/shared";
import { AdvertiserDetail } from "./overlays/AdvertiserDetail";
import { ElementDetail } from "./overlays/ElementDetail";
import { LandingPageDetail } from "./overlays/LandingPageDetail";
import { OfferDetail } from "./overlays/OfferDetail";
import { AdDrawer } from "./ad-drawer/AdDrawer";
import { SaveToBoardModal } from "./boards/SaveToBoardModal";
import type { OverlayNav } from "./overlays/overlayNav";
import { labelForTarget } from "./overlays/labelForTarget";

function renderTarget(t: DetailTarget, nav: OverlayNav) {
  switch (t.kind) {
    case "advertiser":
      return <AdvertiserDetail key={`${t.advertiserKind}:${t.id}`} kind={t.advertiserKind} id={t.id} nav={nav} />;
    case "element":
      return <ElementDetail key={`${t.elementType}:${t.id}`} elementType={t.elementType} id={t.id} nav={nav} />;
    case "landing-page":
      return <LandingPageDetail key={`lp:${t.id}`} id={t.id} nav={nav} />;
    case "offer":
      return <OfferDetail key={`offer:${t.id}`} id={t.id} nav={nav} />;
    case "ad":
      // Ads never live in the detail stack (they use the `ad` param).
      return null;
  }
}

export function InsightsOverlayHost() {
  const { stack, pop, close } = useDetailStack();
  const drawer = useAdDrawer();

  const top = stack[stack.length - 1];
  const below = stack[stack.length - 2];
  const nav: OverlayNav = {
    open: true,
    backLabel: below ? labelForTarget(below) : undefined,
    onBack: below ? pop : undefined,
    onClose: close,
  };

  return (
    <>
      {top && renderTarget(top, nav)}
      <SaveToBoardModal />
      {drawer.adId && <AdDrawer adId={drawer.adId} onClose={drawer.close} />}
    </>
  );
}

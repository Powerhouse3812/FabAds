import { describe, expect, it } from "vitest";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { getAds, getElement } from "@/lib/insights-v3/data";
import type { ElementType } from "@/lib/insights-v3/types";
import { DEFAULT_SCOPE } from "@/lib/insights-v3/types";
import { flowSearchParams, type FlowActionId } from "@/genie6/flows/flowTypes";
import { getFlowModule } from "@/genie6/flows/data/flowRegistry";
import { DEFAULT_BRAND_ID, getFlowSource, v2InsightsRefId } from "@/genie6/flows/data/flowSources";
import { flowInitialPatch, resolveFlowContext } from "@/genie6/flows/data/resolveFlowContext";
import { isWinner } from "@/lib/insights-v3/selectors";
import {
  AD_GENIE_ACTION,
  DEFAULT_GENIE_ACTION,
  buildGenieHandoff,
  defaultAdAction,
  elementValueOf,
  exampleAdForElement,
} from "./genieHandoff";

/** Every action the V2 UI fires: element defaults, both ad defaults, and the drawer's overrides. */
const FIRED: FlowActionId[] = [
  ...new Set([...Object.values(DEFAULT_GENIE_ACTION), ...Object.values(AD_GENIE_ACTION), "use-storyboard" as FlowActionId]),
];

const ctxFor = (adId: string, act: FlowActionId) =>
  resolveFlowContext(flowSearchParams("industry-insights", v2InsightsRefId(adId), act));

const ads = getAds();
const richAd = ads.find((a) => a.analysis.hookText && a.analysis.angle && a.analysis.framework && a.analysis.concept)!;

describe("V2 → Genie: registry contract", () => {
  it("every action V2 fires is listed by the industry-insights module", () => {
    const mod = getFlowModule("industry-insights")!;
    for (const act of FIRED) expect(mod.actions, act).toContain(act);
  });

  it("resolveFlowContext returns a context for an iiv2: ref with each fired action", () => {
    for (const act of FIRED) {
      const ctx = ctxFor(richAd.id, act);
      expect(ctx, act).not.toBeNull();
      expect(ctx!.ref.id).toBe(`iiv2:${richAd.id}`);
      expect(ctx!.module.key).toBe("industry-insights");
    }
  });

  it("§7.2: competitor-owned, highlights the user's own brand, never the source page", () => {
    const ctx = ctxFor(richAd.id, "use-hook")!;
    expect(ctx.competitorOwned).toBe(true);
    expect(ctx.highlight).toMatchObject({ kind: "brand", id: DEFAULT_BRAND_ID });
    expect(ctx.ref.sourceBrandName).toBe(richAd.pageName);
    expect(ctx.ref.detectedEntity).toBeUndefined();
    expect(ctx.preselect).toBe(false);
  });

  it("builds the ref from the V2 ad (title, subtitle, format, metrics without likes)", () => {
    const ref = getFlowSource(v2InsightsRefId(richAd.id))!;
    expect(ref.title).toBe(richAd.headline);
    expect(ref.subtitle).toContain(richAd.pageName);
    expect(ref.sourceFormat).toBe(richAd.mediaKind);
    expect(ref.analysed).toBe(true);
    expect(ref.metrics!.map((m) => m.label)).toEqual(["Days live", "Clones", "AI score"]);
    expect(ref.hook).toBe(richAd.analysis.hookText);
  });

  it("namespacing: an unknown iiv2 id is unresolved, and a bare V2 id never resolves as V2", () => {
    expect(getFlowSource("iiv2:nope")).toBeUndefined();
    expect(resolveFlowContext(flowSearchParams("industry-insights", "iiv2:nope", "use-hook"))).toBeNull();
    expect(getFlowSource(richAd.id)?.id?.startsWith("iiv2:") ?? false).toBe(false);
  });
});

describe("V2 → Genie: the element value is carried", () => {
  it("use-hook carries the verbatim hook line", () => {
    const ctx = ctxFor(richAd.id, "use-hook")!;
    expect(flowInitialPatch(ctx).prompt).toContain(richAd.analysis.hookText!);
  });

  it("use-angle carries the angle into angleDescription + prompt", () => {
    const ctx = ctxFor(richAd.id, "use-angle")!;
    const label = getElement("angle", richAd.analysis.angle!)!.label;
    const patch = flowInitialPatch(ctx);
    expect(patch.angleDescription).toBe(label);
    expect(patch.prompt).toContain(label);
  });

  it("use-framework and use-concept carry their labels in the prompt", () => {
    expect(flowInitialPatch(ctxFor(richAd.id, "use-framework")!).prompt).toContain(
      getElement("framework", richAd.analysis.framework!)!.label,
    );
    expect(flowInitialPatch(ctxFor(richAd.id, "use-concept")!).prompt).toContain(
      getElement("concept", richAd.analysis.concept!)!.label,
    );
  });

  it("winner-as-reference attaches the whole ad as an industry-insights reference", () => {
    const patch = flowInitialPatch(ctxFor(richAd.id, "winner-as-reference")!);
    expect(patch.attachedReferences).toEqual([
      expect.objectContaining({ id: `iiv2:${richAd.id}`, source: "industry-insights", label: richAd.headline }),
    ]);
    expect(patch.brandId).toBeUndefined();
  });
});

describe("V2 → Genie: hand-off builder", () => {
  // QA-02 — one Winner definition everywhere.
  const winner = ads.find(isWinner)!;
  const nonWinner = ads.find((a) => !isWinner(a))!;

  it("a winner ad defaults to winner-as-reference", () => {
    expect(defaultAdAction(winner)).toBe("winner-as-reference");
    const a = buildGenieHandoff({ type: "ad", id: winner.id });
    expect(a).toMatchObject({ ok: true, action: "winner-as-reference", adId: winner.id });
    if ("path" in a) {
      expect(a.path).toMatch(/^\/iq\/genie6\/studio-alpha\/(format|product|configure)\?/);
      expect(a.path).toContain("src=industry-insights");
      expect(a.path).toContain(`ref=iiv2%3A${winner.id}&`);
    }
  });

  it("a non-winner ad defaults to generate-variation, never 'winner'", () => {
    expect(defaultAdAction(nonWinner)).toBe("generate-variation");
    const a = buildGenieHandoff({ type: "ad", id: nonWinner.id });
    expect(a).toMatchObject({ ok: true, action: "generate-variation", adId: nonWinner.id });
    if ("path" in a) expect(a.path).not.toContain("winner-as-reference");
  });

  it("an explicit action still wins over the default", () => {
    expect(buildGenieHandoff({ type: "ad", id: nonWinner.id }, { action: "winner-as-reference" })).toMatchObject({
      ok: true,
      action: "winner-as-reference",
    });
    expect(buildGenieHandoff({ type: "ad", id: winner.id }, { action: "generate-variation" })).toMatchObject({
      ok: true,
      action: "generate-variation",
    });
    expect(buildGenieHandoff({ type: "ad", id: richAd.id }, { action: "use-storyboard" })).toMatchObject({
      ok: true,
      action: "use-storyboard",
    });
  });

  it("element target uses its top example ad and act=use-<type>", () => {
    const types: ElementType[] = ["framework", "hook", "angle", "concept"];
    for (const type of types) {
      const id = elementValueOf(richAd, type)!;
      const h = buildGenieHandoff({ type, id }, { scope: DEFAULT_SCOPE });
      expect(h, type).toMatchObject({ ok: true, action: `use-${type}` });
      if ("adId" in h) {
        const ex = ads.find((a) => a.id === h.adId)!;
        expect(elementValueOf(ex, type)).toBe(id);
        if (type === "hook") expect(ex.analysis.hookText).toBeTruthy();
        expect(h.path).toContain(`ref=iiv2%3A${ex.id}%40${type}&`);
      }
    }
  });

  it("QA-12: an element hand-off names the element in the banner's reference", () => {
    const types: ElementType[] = ["framework", "hook", "angle", "concept"];
    const typeLabel = { framework: "Framework", hook: "Hook", angle: "Angle", concept: "Concept" } as const;
    for (const type of types) {
      const label = getElement(type, elementValueOf(richAd, type)!)!.label;
      const ctx = resolveFlowContext(
        flowSearchParams("industry-insights", v2InsightsRefId(richAd.id, type), `use-${type}` as FlowActionId),
      );
      expect(ctx, type).not.toBeNull();
      expect(ctx!.ref.title).toBe(`${typeLabel[type]} · ${label} — from "${richAd.headline}"`);
      expect(ctx!.ref.sourceNote).toContain(`${typeLabel[type]} · ${label}`);
      // The element value still travels exactly as for a plain ad ref.
      expect(flowInitialPatch(ctx!).prompt).toBeTruthy();
    }
    // Plain ad refs are untouched.
    expect(getFlowSource(v2InsightsRefId(richAd.id))!.title).toBe(richAd.headline);
  });

  it("QA-12: a bad element suffix degrades to no ref, never throws", () => {
    for (const bad of [`iiv2:${richAd.id}@nope`, `iiv2:${richAd.id}@toString`, `iiv2:${richAd.id}@hook@angle`]) {
      expect(getFlowSource(bad), bad).toBeUndefined();
      expect(resolveFlowContext(flowSearchParams("industry-insights", bad, "use-hook"))).toBeNull();
    }
    const noAngle = ads.find((a) => !a.analysis.angle)!;
    expect(getFlowSource(v2InsightsRefId(noAngle.id, "angle"))).toBeUndefined();
  });

  it("an empty scope falls back to the whole universe instead of failing", () => {
    const id = richAd.analysis.angle!;
    const ex = exampleAdForElement("angle", id, { ...DEFAULT_SCOPE, industry: "no-such-industry" });
    expect(ex).not.toBeNull();
  });

  it("unknown items and unlisted actions fail with a reason, never a path", () => {
    expect(buildGenieHandoff({ type: "ad", id: "ad-9999999" })).toMatchObject({ ok: false });
    expect(buildGenieHandoff({ type: "hook", id: "no-such-hook" })).toMatchObject({ ok: false });
    expect(buildGenieHandoff({ type: "ad", id: richAd.id }, { action: "use-script" })).toMatchObject({ ok: false });
    expect(buildGenieHandoff({ type: "domain", id: "x" })).toMatchObject({ ok: false });
  });
});

describe("old Industry Insights refs are unchanged", () => {
  const old = DUMMY_ADS[3];

  it("a dummy-ad ref resolves exactly as before", () => {
    const ref = getFlowSource(old.id)!;
    expect(ref.id).toBe(old.id);
    expect(ref.module).toBe("industry-insights");
    expect(ref.title).toBe(old.primaryText || old.headline);
    expect(ref.sourceBrandName).toBe(old.brand);
    expect(ref.analysed).toBe(old.analysed);
    expect(ref.metrics!.map((m) => m.label)).toEqual(["Impressions", "Spend", "Active"]);
    expect(ref.elements).toBeUndefined();
    expect(ref.competitorOwned).toBeUndefined();
    expect(ref.hook).toBeUndefined();
  });

  it("use-angle / use-framework on an old analysed ref still carries nothing", () => {
    const analysed = DUMMY_ADS.find((a) => a.analysed)!;
    for (const act of ["use-angle", "use-framework", "use-concept"] as FlowActionId[]) {
      const ctx = resolveFlowContext(flowSearchParams("industry-insights", analysed.id, act))!;
      expect(ctx, act).not.toBeNull();
      const patch = flowInitialPatch(ctx);
      expect(patch.angleDescription, act).toBeUndefined();
      expect(patch.prompt, act).toBeUndefined();
    }
  });
});

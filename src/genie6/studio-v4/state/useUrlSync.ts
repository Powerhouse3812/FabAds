import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { UseWizardReturn, WizardState, Mode, Format } from "./useWizard";

/**
 * useStudioAlphaUrlSync — bidirectional sync between wizard state and URL
 * query params. Called once at the StudioAlpha shell level.
 *
 * URL params owned here:
 *   ?format       image | video
 *   ?brand        brandId
 *   ?product      productId
 *   ?category     categoryId
 *   ?approach     mode (scratch / ugc-video / etc.)
 *   ?angle        angleId
 *   ?ratio        1:1 | 4:5 | 9:16 | 16:9
 *   ?count        N
 *   ?model        modelId
 *   ?resolution   720p | 1080p | 4K (only encoded when not default 1080p)
 *   ?audio        off (toggle is "on" by default — only encode when "off")
 *   ?bg           off (toggle is "on" by default — only encode when "off")
 *   ?kb           off (same)
 *
 * Hydration: on mount, URL → wizard state.
 * After mount: wizard state → URL on every relevant field change (replace).
 *
 * Step segment + picker modal + accordion expand state are owned by other
 * sync code in StudioAlpha.tsx + AlphaStep3Configure.tsx — DO NOT duplicate
 * those here.
 */
export function useStudioAlphaUrlSync(wizard: UseWizardReturn) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = wizard;

  // URL → state on mount.
  useEffect(() => {
    const patches: Partial<WizardState> = {};
    const format = searchParams.get("format");
    if (format === "image" || format === "video") patches.format = format as Format;
    const brand = searchParams.get("brand");
    if (brand) patches.brandId = brand;
    const product = searchParams.get("product");
    if (product) patches.productId = product;
    const category = searchParams.get("category");
    if (category) patches.categoryId = category;
    const approach = searchParams.get("approach");
    if (approach) patches.mode = approach as Mode;
    const angle = searchParams.get("angle");
    if (angle) patches.angleId = angle;
    const ratio = searchParams.get("ratio");
    if (ratio === "1:1" || ratio === "4:5" || ratio === "9:16" || ratio === "16:9")
      patches.aspectRatio = ratio;
    const count = searchParams.get("count");
    if (count) {
      const n = parseInt(count, 10);
      if (!Number.isNaN(n)) patches.count = n;
    }
    const model = searchParams.get("model");
    if (model) patches.modelId = model;
    const resolution = searchParams.get("resolution");
    if (resolution === "720p" || resolution === "1080p" || resolution === "4K")
      patches.videoResolution = resolution;
    const audio = searchParams.get("audio");
    if (audio === "off") patches.videoAudio = false;
    const bg = searchParams.get("bg");
    if (bg === "on" || bg === "off") patches.useBrandGuidelines = bg === "on";
    const kb = searchParams.get("kb");
    if (kb === "on" || kb === "off") patches.useKnowledgeBase = kb === "on";
    if (Object.keys(patches).length > 0) wizard.patch(patches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // state → URL.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const setOrDelete = (key: string, value: string | null | undefined) => {
          if (value === null || value === undefined || value === "") next.delete(key);
          else next.set(key, value);
        };
        setOrDelete("format", state.format);
        setOrDelete("brand", state.brandId);
        setOrDelete("product", state.productId);
        setOrDelete("category", state.categoryId);
        setOrDelete("approach", state.mode);
        setOrDelete("angle", state.angleId);
        setOrDelete("ratio", state.aspectRatio);
        setOrDelete("count", String(state.count));
        setOrDelete("model", state.modelId);
        if (state.videoResolution !== "1080p") next.set("resolution", state.videoResolution);
        else next.delete("resolution");
        if (!state.videoAudio) next.set("audio", "off");
        else next.delete("audio");
        if (!state.useBrandGuidelines) next.set("bg", "off");
        else next.delete("bg");
        if (!state.useKnowledgeBase) next.set("kb", "off");
        else next.delete("kb");
        return next;
      },
      { replace: true },
    );
  }, [
    state.format,
    state.brandId,
    state.productId,
    state.categoryId,
    state.mode,
    state.angleId,
    state.aspectRatio,
    state.count,
    state.modelId,
    state.videoResolution,
    state.videoAudio,
    state.useBrandGuidelines,
    state.useKnowledgeBase,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);
}

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "../../lib/languages";
import { isKnownConceptId } from "../data/concepts";
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
 *   ?lang         output language code (lib/languages.ts LANGUAGES[].code —
 *                 §5 "Language selector added to Configure"). Only encoded
 *                 when it isn't DEFAULT_LANGUAGE ("en-IN"), same discipline as
 *                 ?resolution.
 *   ?bulkProducts comma-separated productIds (§9 bulk product selection for
 *                 Category Ad / Product Ad — state.bulkProductIds). Only
 *                 encoded when non-empty. NOTE for the Step-2 agent: this is
 *                 the param name to read/write for that picker.
 *   ?concepts     comma-separated concept ids — state.selectedConceptIds.
 *                 §12's "Use concept to generate" and its multi-select
 *                 ("one ad per concept, all in a single batch") hand off to
 *                 Studio through this param. Ids from EITHER concept universe
 *                 are accepted; data/concepts.ts's getConceptById bridges the
 *                 Studio-native `c-*` ids and the shared `concept-*` / `kc-*`
 *                 ids. Unknown ids are dropped on read rather than carried
 *                 into state, so a stale link selects what still exists
 *                 instead of silently poisoning the credit maths with
 *                 phantom concepts.
 *   ?productImage state.uploadedProductImage (§21.2 Product Shoot: brand +
 *                 ONE uploaded image, no Catalogue product required). Only
 *                 encoded when non-null. This is a short opaque TOKEN, not a
 *                 data: or blob: URL — blob: URLs don't survive a reload
 *                 anyway, and a data: URL would blow past a sane URL length
 *                 fast. The token is minted by `registerUploadedImage()`
 *                 (src/genie6/lib/uploaded-image-store.ts) at the point of
 *                 upload (Step2Product.tsx) and resolved back to the actual
 *                 image only where something needs to paint it —
 *                 `resolveUploadedImage()` returns undefined once the
 *                 in-memory store no longer has it (e.g. after a reload),
 *                 and every read site must treat that as "needs
 *                 re-uploading," never render it as a broken <img src>.
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
    const lang = searchParams.get("lang");
    if (lang) patches.language = lang;
    const bulkProducts = searchParams.get("bulkProducts");
    if (bulkProducts) {
      patches.bulkProductIds = bulkProducts.split(",").filter(Boolean);
    }
    const productImage = searchParams.get("productImage");
    if (productImage) patches.uploadedProductImage = productImage;
    const conceptsParam = searchParams.get("concepts");
    if (conceptsParam) {
      const ids = conceptsParam.split(",").filter(Boolean).filter(isKnownConceptId);
      if (ids.length > 0) patches.selectedConceptIds = ids;
    }
    if (Object.keys(patches).length > 0) wizard.patch(patches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // state → URL.
  useEffect(() => {
    setSearchParams(
      () => {
        // NOT `prev`: react-router hands the functional updater the
        // searchParams of the RENDER that created setSearchParams, so two
        // writers in one commit both see the same stale copy and the last one
        // wins. Step 5's mount effect sets ?batch= a few effects before this
        // one runs; rebuilding from `prev` silently dropped it, leaving the
        // Results screen in its "about to start" shimmer forever. Reading the
        // live URL picks up whatever was just committed (same fix StudioAlpha's
        // step→URL effect already relies on).
        const next = new URLSearchParams(window.location.search);
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
        // §5 language selector — only encoded when non-default, same
        // discipline as ?resolution, so a plain English-market URL stays
        // exactly as short as it is today.
        if (state.language !== DEFAULT_LANGUAGE) next.set("lang", state.language);
        else next.delete("lang");
        // §9 bulk product selection — comma-joined, only when non-empty.
        if (state.bulkProductIds.length > 0) next.set("bulkProducts", state.bulkProductIds.join(","));
        else next.delete("bulkProducts");
        // §21.2 Product Shoot — brand + one uploaded image, no product id.
        setOrDelete("productImage", state.uploadedProductImage);
        // §12 — concepts ride the URL so a multi-concept batch is linkable and
        // survives a refresh, same discipline as ?bulkProducts.
        if (state.selectedConceptIds.length > 0)
          next.set("concepts", state.selectedConceptIds.join(","));
        else next.delete("concepts");
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
    state.language,
    state.bulkProductIds,
    state.uploadedProductImage,
    state.selectedConceptIds,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);
}

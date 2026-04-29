import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown, Trash2, Plus, X, Eye, Image, Video, ChevronLeft, ChevronRight, Grid3X3,
} from "lucide-react";
import MediaPickerSection, { type MediaAsset } from "./MediaPickerSection";

const AD_FORMATS = [
  { value: "single_image", label: "Static Image" },
  { value: "single_video", label: "Video" },
  { value: "carousel", label: "Carousel" },
  { value: "collection", label: "Collection" },
];

const CTA_OPTIONS = [
  "Learn More", "Shop Now", "Sign Up", "Book Now", "Download",
  "Get Offer", "Contact Us", "Apply Now", "Subscribe", "Watch More",
];

export interface CarouselCard {
  image_url: string;
  headline: string;
  description: string;
  link_url: string;
  /** Structured media asset metadata */
  media_asset?: MediaAsset | null;
}

export interface OfferAdData {
  id?: string;
  name: string;
  ad_format: string;
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
  destination_url: string;
  display_link: string;
  media_type: string;
  media_urls: string[];
  carousel_cards: CarouselCard[];
  collection_config: Record<string, unknown>;
  // Flexible Creative variation arrays
  primary_texts: string[];
  headlines: string[];
  descriptions: string[];
  // Carousel shared destination toggle
  carousel_shared_destination: boolean;
  // Structured media assets for picker
  media_assets?: MediaAsset[];
}

interface Props {
  ad: OfferAdData;
  index: number;
  flexibleCreative: boolean;
  onChange: (ad: OfferAdData) => void;
  onDelete: () => void;
}

export default function OfferAdCard({ ad, index, flexibleCreative, onChange, onDelete }: Props) {
  const [open, setOpen] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const update = (fields: Partial<OfferAdData>) => onChange({ ...ad, ...fields });

  // ─── Carousel card helpers ───
  const updateCard = (cardIndex: number, fields: Partial<CarouselCard>) => {
    const cards = [...ad.carousel_cards];
    cards[cardIndex] = { ...cards[cardIndex], ...fields };
    update({ carousel_cards: cards });
  };

  const addCard = () => {
    if (ad.carousel_cards.length >= 10) return;
    update({
      carousel_cards: [...ad.carousel_cards, { image_url: "", headline: "", description: "", link_url: "" }],
    });
  };

  const removeCard = (cardIndex: number) => {
    if (ad.carousel_cards.length <= 2) return;
    update({ carousel_cards: ad.carousel_cards.filter((_, i) => i !== cardIndex) });
  };

  // ─── Variation helpers (for Flexible Creative) ───
  const addVariation = (field: "primary_texts" | "headlines" | "descriptions") => {
    const arr = ad[field] || [""];
    if (arr.length >= 5) return;
    update({ [field]: [...arr, ""] });
  };

  const updateVariation = (field: "primary_texts" | "headlines" | "descriptions", idx: number, value: string) => {
    const arr = [...(ad[field] || [""])];
    arr[idx] = value;
    const singularMap = { primary_texts: "primary_text", headlines: "headline", descriptions: "description" } as const;
    const sync: Partial<OfferAdData> = { [field]: arr };
    if (idx === 0) (sync as any)[singularMap[field]] = value;
    update(sync);
  };

  const removeVariation = (field: "primary_texts" | "headlines" | "descriptions", idx: number) => {
    const arr = [...(ad[field] || [""])];
    if (arr.length <= 1) return;
    const updated = arr.filter((_, i) => i !== idx);
    const singularMap = { primary_texts: "primary_text", headlines: "headline", descriptions: "description" } as const;
    const sync: Partial<OfferAdData> = { [field]: updated };
    (sync as any)[singularMap[field]] = updated[0] || "";
    update(sync);
  };

  // ─── Media asset helpers ───
  const mediaAssets: MediaAsset[] = ad.media_assets || (ad.media_urls || []).filter(Boolean).map((url) => ({
    url,
    file_name: url.split("/").pop() || "media",
    file_type: ad.ad_format === "single_video" ? "video" : "image",
  }));

  const handleMediaChange = (newAssets: MediaAsset[]) => {
    update({
      media_assets: newAssets,
      media_urls: newAssets.map((a) => a.url),
      media_type: newAssets.length > 0 ? newAssets[0].file_type : ad.media_type,
    });
  };

  const handleCardMediaChange = (cardIndex: number, newAssets: MediaAsset[]) => {
    const asset = newAssets[0] || null;
    updateCard(cardIndex, {
      image_url: asset?.url || "",
      media_asset: asset,
    });
  };

  const formatLabel = AD_FORMATS.find((f) => f.value === ad.ad_format)?.label || ad.ad_format;
  const isCarousel = ad.ad_format === "carousel";
  const isCollection = ad.ad_format === "collection";
  const isImageOrVideo = ad.ad_format === "single_image" || ad.ad_format === "single_video";
  const mediaAcceptType = ad.ad_format === "single_video" ? "video" as const : ad.ad_format === "single_image" ? "image" as const : "all" as const;

  return (
    <Card className="border border-border">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <CollapsibleTrigger asChild>
            <button type="button" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
              {ad.name || `Ad ${index + 1}`}
              <span className="text-xs text-muted-foreground ml-1">({formatLabel})</span>
              {flexibleCreative && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Flexible</span>
              )}
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPreview(!showPreview)} title="Toggle preview">
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <CardContent className="pt-4 space-y-0">

            {/* ─── SECTION: AD IDENTITY ─── */}
            <SectionLabel>Ad Identity</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mb-1">
              <div className="space-y-1">
                <Label className="text-xs">Ad Name</Label>
                <Input value={ad.name} onChange={(e) => update({ name: e.target.value })} placeholder="Ad name" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ad Format</Label>
                <Select value={ad.ad_format} onValueChange={(v) => update({ ad_format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AD_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-3" />

            {/* ─── SECTION: CREATIVE ─── */}
            <SectionLabel>Creative</SectionLabel>
            <div className="space-y-2 mb-1">
              {isImageOrVideo && (
                <MediaPickerSection
                  assets={mediaAssets}
                  onChange={handleMediaChange}
                  acceptType={mediaAcceptType}
                  max={flexibleCreative ? 10 : 1}
                  label={flexibleCreative ? `Media Assets` : ad.ad_format === "single_video" ? "Video" : "Image"}
                  required
                />
              )}

              {isImageOrVideo && flexibleCreative && (
                <p className="text-xs text-muted-foreground">
                  Add multiple {ad.ad_format === "single_video" ? "videos" : "images"} for Meta to test.
                </p>
              )}

              {isCollection && (
                <MediaPickerSection
                  assets={mediaAssets}
                  onChange={handleMediaChange}
                  acceptType="all"
                  max={1}
                  label="Cover Media"
                />
              )}

              {isCarousel && (
                <p className="text-xs text-muted-foreground">Per-card media is configured in the Cards section below.</p>
              )}
            </div>

            <Separator className="my-3" />

            {/* ─── SECTION: COPY ─── */}
            <SectionLabel>Copy</SectionLabel>
            <div className="space-y-3 mb-1">
              {!flexibleCreative ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Primary Text <span className="text-destructive">*</span></Label>
                    <Textarea value={ad.primary_text} onChange={(e) => update({ primary_text: e.target.value })} placeholder="Main ad copy" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Headline <span className="text-destructive">*</span></Label>
                      <Input value={ad.headline} onChange={(e) => update({ headline: e.target.value })} placeholder="Ad headline" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input value={ad.description} onChange={(e) => update({ description: e.target.value })} placeholder="Ad description" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Meta will mix & test variations at delivery time.</p>

                  {/* Primary Text Variations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Primary Text Variations ({(ad.primary_texts || []).length}/5) <span className="text-destructive">*</span></Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addVariation("primary_texts")} disabled={(ad.primary_texts || []).length >= 5} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add Variation
                      </Button>
                    </div>
                    {(ad.primary_texts || [""]).map((text, i) => (
                      <div key={i} className="flex gap-2">
                        <Textarea value={text} onChange={(e) => updateVariation("primary_texts", i, e.target.value)} placeholder={`Primary text ${i + 1}`} rows={2} className="flex-1" />
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 mt-1" onClick={() => removeVariation("primary_texts", i)} disabled={(ad.primary_texts || []).length <= 1}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Headline Variations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Headline Variations ({(ad.headlines || []).length}/5) <span className="text-destructive">*</span></Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addVariation("headlines")} disabled={(ad.headlines || []).length >= 5} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add Variation
                      </Button>
                    </div>
                    {(ad.headlines || [""]).map((text, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={text} onChange={(e) => updateVariation("headlines", i, e.target.value)} placeholder={`Headline ${i + 1}`} className="flex-1" />
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeVariation("headlines", i)} disabled={(ad.headlines || []).length <= 1}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Description Variations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Description Variations ({(ad.descriptions || []).length}/5)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addVariation("descriptions")} disabled={(ad.descriptions || []).length >= 5} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add Variation
                      </Button>
                    </div>
                    {(ad.descriptions || [""]).map((text, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={text} onChange={(e) => updateVariation("descriptions", i, e.target.value)} placeholder={`Description ${i + 1}`} className="flex-1" />
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeVariation("descriptions", i)} disabled={(ad.descriptions || []).length <= 1}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Separator className="my-3" />

            {/* ─── SECTION: DESTINATION ─── */}
            <SectionLabel>Destination</SectionLabel>
            <div className="space-y-3 mb-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">CTA <span className="text-destructive">*</span></Label>
                  <Select value={ad.cta || "Learn More"} onValueChange={(v) => update({ cta: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Display Link</Label>
                  <Input value={ad.display_link} onChange={(e) => update({ display_link: e.target.value })} placeholder="example.com" />
                </div>
              </div>

              {isCarousel ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Use same destination for all cards</Label>
                    <Switch
                      checked={ad.carousel_shared_destination}
                      onCheckedChange={(v) => update({ carousel_shared_destination: v })}
                    />
                  </div>
                  {ad.carousel_shared_destination && (
                    <div className="space-y-1">
                      <Label className="text-xs">Shared Destination URL <span className="text-destructive">*</span></Label>
                      <Input value={ad.destination_url} onChange={(e) => update({ destination_url: e.target.value })} placeholder="https://..." />
                    </div>
                  )}
                  {!ad.carousel_shared_destination && (
                    <p className="text-xs text-muted-foreground">Per-card destination URLs are configured in the Cards section below.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">Destination URL <span className="text-destructive">*</span></Label>
                  <Input value={ad.destination_url} onChange={(e) => update({ destination_url: e.target.value })} placeholder="https://..." />
                </div>
              )}
            </div>

            {/* ─── SECTION: CARDS (carousel only) ─── */}
            {isCarousel && (
              <>
                <Separator className="my-3" />
                <SectionLabel>Cards</SectionLabel>
                <div className="space-y-2 mb-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Carousel Cards ({ad.carousel_cards.length}/10)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCard} disabled={ad.carousel_cards.length >= 10} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add Card
                    </Button>
                  </div>
                  {ad.carousel_cards.map((card, i) => {
                    const cardMediaAssets: MediaAsset[] = card.media_asset
                      ? [card.media_asset]
                      : card.image_url
                        ? [{ url: card.image_url, file_name: card.image_url.split("/").pop() || "image", file_type: "image" }]
                        : [];

                    return (
                      <div key={i} className="border border-border rounded-md p-3 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Card {i + 1}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCard(i)} disabled={ad.carousel_cards.length <= 2}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Card media picker */}
                        <MediaPickerSection
                          assets={cardMediaAssets}
                          onChange={(newAssets) => handleCardMediaChange(i, newAssets)}
                          acceptType="image"
                          max={1}
                          label="Card Image"
                          required
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Headline <span className="text-destructive">*</span></Label>
                            <Input value={card.headline} onChange={(e) => updateCard(i, { headline: e.target.value })} placeholder="Card headline" className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Description</Label>
                            <Input value={card.description} onChange={(e) => updateCard(i, { description: e.target.value })} placeholder="Card description" className="h-8 text-xs" />
                          </div>
                        </div>
                        {!ad.carousel_shared_destination && (
                          <div className="space-y-1">
                            <Label className="text-[10px]">Link URL <span className="text-destructive">*</span></Label>
                            <Input value={card.link_url} onChange={(e) => updateCard(i, { link_url: e.target.value })} placeholder="https://..." className="h-8 text-xs" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ─── SECTION: COLLECTION CONFIG ─── */}
            {isCollection && (
              <>
                <Separator className="my-3" />
                <SectionLabel>Collection Config</SectionLabel>
                <div className="grid grid-cols-2 gap-3 mb-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Instant Experience ID</Label>
                    <Input
                      value={(ad.collection_config?.instant_experience_id as string) || ""}
                      onChange={(e) => update({ collection_config: { ...ad.collection_config, instant_experience_id: e.target.value } })}
                      placeholder="Enter ID"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Product Set ID</Label>
                    <Input
                      value={(ad.collection_config?.product_set_id as string) || ""}
                      onChange={(e) => update({ collection_config: { ...ad.collection_config, product_set_id: e.target.value } })}
                      placeholder="Enter ID"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ─── PREVIEW ─── */}
            {showPreview && (
              <>
                <Separator className="my-3" />
                <AdPreview ad={ad} flexibleCreative={flexibleCreative} />
              </>
            )}

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/* ─── Section Label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{children}</p>
  );
}

/* ─── Ad Preview (Meta-style, format + flexible aware) ─── */
function AdPreview({ ad, flexibleCreative }: { ad: OfferAdData; flexibleCreative: boolean }) {
  const [variationIndex, setVariationIndex] = useState(0);

  const primaryTexts = flexibleCreative ? (ad.primary_texts || [ad.primary_text || ""]) : [ad.primary_text || ""];
  const headlinesArr = flexibleCreative ? (ad.headlines || [ad.headline || ""]) : [ad.headline || ""];
  const descriptionsArr = flexibleCreative ? (ad.descriptions || [ad.description || ""]) : [ad.description || ""];

  const maxVariations = Math.max(primaryTexts.length, headlinesArr.length, descriptionsArr.length, 1);
  const safeIdx = variationIndex % maxVariations;

  const currentPrimary = primaryTexts[Math.min(safeIdx, primaryTexts.length - 1)] || "";
  const currentHeadline = headlinesArr[Math.min(safeIdx, headlinesArr.length - 1)] || "";
  const currentDescription = descriptionsArr[Math.min(safeIdx, descriptionsArr.length - 1)] || "";

  const mediaAssets = ad.media_assets || (ad.media_urls || []).filter(Boolean).map((url) => ({ url, file_name: "", file_type: ad.ad_format === "single_video" ? "video" : "image" }));
  const mediaAsset = mediaAssets[flexibleCreative ? Math.min(safeIdx, mediaAssets.length - 1) : 0];
  const mediaUrl = mediaAsset?.url;
  const isVideo = mediaAsset?.file_type === "video" || ad.ad_format === "single_video";

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ad Preview</span>
        {flexibleCreative && maxVariations > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVariationIndex((v) => (v - 1 + maxVariations) % maxVariations)}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-muted-foreground">Variation {safeIdx + 1}/{maxVariations}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVariationIndex((v) => (v + 1) % maxVariations)}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        {flexibleCreative && (
          <p className="text-[10px] text-muted-foreground italic">Meta will mix & test variations at delivery time.</p>
        )}

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground">P</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Page Name</p>
            <p className="text-[10px] text-muted-foreground">Sponsored</p>
          </div>
        </div>

        {/* Primary text */}
        {currentPrimary && <p className="text-xs text-foreground">{currentPrimary}</p>}

        {/* Media area */}
        {ad.ad_format === "carousel" ? (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {ad.carousel_cards.map((card, i) => {
              const cardAsset = card.media_asset;
              return (
                <div key={i} className="flex-shrink-0 w-32 border border-border rounded overflow-hidden">
                  <div className="w-full h-24 bg-muted flex items-center justify-center">
                    {(cardAsset?.url || card.image_url) ? (
                      <img src={cardAsset?.url || card.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="text-[10px] font-medium text-foreground truncate">{card.headline || "Headline"}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{card.description || "Description"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : ad.ad_format === "collection" ? (
          <div className="w-full h-48 bg-muted rounded flex items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Grid3X3 className="h-8 w-8" />
              <span className="text-xs">Collection Preview</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-48 bg-muted rounded flex items-center justify-center">
            {mediaUrl ? (
              isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center bg-muted rounded">
                  <Video className="h-10 w-10 text-muted-foreground" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-foreground/20 flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-foreground border-b-[8px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <img src={mediaUrl} alt="" className="w-full h-full object-cover rounded" />
              )
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                {isVideo ? <Video className="h-8 w-8" /> : <Image className="h-8 w-8" />}
                <span className="text-xs">No media</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-border pt-2">
          <div className="flex-1 min-w-0">
            {ad.display_link && <p className="text-[10px] text-muted-foreground uppercase truncate">{ad.display_link}</p>}
            <p className="text-xs font-semibold text-foreground truncate">{currentHeadline || "Headline"}</p>
            {currentDescription && <p className="text-[10px] text-muted-foreground truncate">{currentDescription}</p>}
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-7 ml-2 flex-shrink-0">
            {ad.cta || "Learn More"}
          </Button>
        </div>
      </div>
    </div>
  );
}

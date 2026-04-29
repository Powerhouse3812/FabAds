import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FolderAd {
  name: string;
  primary_text: string | null;
  headline: string | null;
  description: string | null;
  cta: string | null;
  destination_url: string | null;
  display_link: string | null;
  media_urls: string[];
  media_type: string | null;
}

/**
 * Given a CL folder ID, fetches all folder items (media + adgroups),
 * resolves their linked text fields and media, and returns an array
 * of pre-filled ad objects ready for launch_ads insertion.
 */
export function useFolderAds(folderId: string | null) {
  return useQuery({
    queryKey: ["folder-ads", folderId],
    enabled: !!folderId,
    queryFn: async () => {
      if (!folderId) return [] as FolderAd[];

      // 1. Fetch folder items
      const { data: items, error: itemsErr } = await (supabase as any)
        .from("cl_folder_items")
        .select("*")
        .eq("folder_id", folderId);
      if (itemsErr) throw itemsErr;
      if (!items || items.length === 0) return [] as FolderAd[];

      const mediaItemIds = items.filter((i: any) => i.item_type === "media").map((i: any) => i.item_id);
      const adgroupItemIds = items.filter((i: any) => i.item_type === "adgroup").map((i: any) => i.item_id);

      // 2. Fetch media assets and adgroups in parallel
      const [mediaRes, adgroupRes] = await Promise.all([
        mediaItemIds.length
          ? (supabase as any).from("creative_assets").select("*").in("id", mediaItemIds)
          : { data: [], error: null },
        adgroupItemIds.length
          ? (supabase as any).from("cl_adgroups").select("*").in("id", adgroupItemIds)
          : { data: [], error: null },
      ]);
      if (mediaRes.error) throw mediaRes.error;
      if (adgroupRes.error) throw adgroupRes.error;

      const mediaAssets: any[] = mediaRes.data || [];
      const adgroups: any[] = adgroupRes.data || [];

      // 3. Collect text IDs from adgroups to resolve
      const textIds = {
        headline: adgroups.map((ag: any) => ag.headline_id).filter(Boolean),
        primary_text: adgroups.map((ag: any) => ag.primary_text_id).filter(Boolean),
        description: adgroups.map((ag: any) => ag.description_id).filter(Boolean),
      };

      // Also collect media IDs from adgroups
      const adgroupMediaIds = adgroups.flatMap((ag: any) => ag.media_ids || []).filter(Boolean);
      const allAdgroupMediaIds = [...new Set(adgroupMediaIds)];

      const [headlinesRes, primaryTextsRes, descriptionsRes, adgroupMediaRes] = await Promise.all([
        textIds.headline.length
          ? (supabase as any).from("cl_headlines").select("id, text").in("id", textIds.headline)
          : { data: [], error: null },
        textIds.primary_text.length
          ? (supabase as any).from("cl_primary_texts").select("id, text").in("id", textIds.primary_text)
          : { data: [], error: null },
        textIds.description.length
          ? (supabase as any).from("cl_descriptions").select("id, text").in("id", textIds.description)
          : { data: [], error: null },
        allAdgroupMediaIds.length
          ? (supabase as any).from("creative_assets").select("id, url, file_type").in("id", allAdgroupMediaIds)
          : { data: [], error: null },
      ]);

      const headlineMap = Object.fromEntries((headlinesRes.data || []).map((h: any) => [h.id, h.text]));
      const primaryTextMap = Object.fromEntries((primaryTextsRes.data || []).map((p: any) => [p.id, p.text]));
      const descriptionMap = Object.fromEntries((descriptionsRes.data || []).map((d: any) => [d.id, d.text]));
      const adgroupMediaMap = Object.fromEntries((adgroupMediaRes.data || []).map((m: any) => [m.id, m]));

      // 4. Build folder ads
      const folderAds: FolderAd[] = [];

      // Media items -> 1 ad each
      for (const asset of mediaAssets) {
        const mediaType = asset.file_type?.startsWith("video") ? "video" : "image";
        folderAds.push({
          name: asset.file_name || `Media Ad ${folderAds.length + 1}`,
          primary_text: null,
          headline: null,
          description: null,
          cta: null,
          destination_url: null,
          display_link: null,
          media_urls: [asset.url],
          media_type: mediaType,
        });
      }

      // Adgroup items -> 1 ad each
      for (const ag of adgroups) {
        const agMediaUrls = (ag.media_ids || [])
          .map((mid: string) => adgroupMediaMap[mid]?.url)
          .filter(Boolean);
        const firstMedia = agMediaUrls.length > 0 ? adgroupMediaMap[(ag.media_ids || [])[0]] : null;
        const mediaType = firstMedia?.file_type?.startsWith("video") ? "video" : agMediaUrls.length > 0 ? "image" : null;

        folderAds.push({
          name: ag.name || `Adgroup Ad ${folderAds.length + 1}`,
          primary_text: ag.primary_text_id ? primaryTextMap[ag.primary_text_id] || null : null,
          headline: ag.headline_id ? headlineMap[ag.headline_id] || null : null,
          description: ag.description_id ? descriptionMap[ag.description_id] || null : null,
          cta: ag.cta || null,
          destination_url: ag.destination_url || null,
          display_link: ag.display_link || null,
          media_urls: agMediaUrls,
          media_type: mediaType,
        });
      }

      return folderAds;
    },
  });
}

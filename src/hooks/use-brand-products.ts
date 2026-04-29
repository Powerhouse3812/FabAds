import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import { toast } from "sonner";
import { DEMO_MODE, fakeSleep } from "@/lib/demo-mode";

export interface BrandProduct {
  id: string;
  brand_id: string;
  workspace_id: string;
  name: string;
  url: string | null;
  image_url: string | null;
  price: string | null;
  sku: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/* ── Demo data ───────────────────────────────────────────────── */
const DEMO_PRODUCTS: Record<string, BrandProduct[]> = {
  "demo-b1": [
    { id: "dp-1", brand_id: "demo-b1", workspace_id: "", name: "Air Max 270", url: "https://nike.com/air-max-270", image_url: "https://picsum.photos/seed/nike-am270/200/200", price: "$150", sku: "NK-AM270", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "dp-2", brand_id: "demo-b1", workspace_id: "", name: "Dunk Low Retro", url: "https://nike.com/dunk-low", image_url: "https://picsum.photos/seed/nike-dunk/200/200", price: "$110", sku: "NK-DL01", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "dp-3", brand_id: "demo-b1", workspace_id: "", name: "Pegasus 41", url: "https://nike.com/pegasus-41", image_url: "https://picsum.photos/seed/nike-peg/200/200", price: "$130", sku: "NK-PG41", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  "demo-b2": [
    { id: "dp-4", brand_id: "demo-b2", workspace_id: "", name: "Radiance Serum", url: "https://glowskin.co/radiance", image_url: "https://picsum.photos/seed/gs-serum/200/200", price: "$49", sku: "GS-RS01", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "dp-5", brand_id: "demo-b2", workspace_id: "", name: "Night Cream", url: "https://glowskin.co/night-cream", image_url: "https://picsum.photos/seed/gs-nc/200/200", price: "$39", sku: "GS-NC01", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  "demo-b3": [
    { id: "dp-6", brand_id: "demo-b3", workspace_id: "", name: "NovaX Earbuds", url: "https://technova.io/novax", image_url: "https://picsum.photos/seed/tn-buds/200/200", price: "$89", sku: "TN-NX01", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "dp-7", brand_id: "demo-b3", workspace_id: "", name: "ProCharge 65W", url: "https://technova.io/procharge", image_url: "https://picsum.photos/seed/tn-chg/200/200", price: "$45", sku: "TN-PC65", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  "demo-b4": [
    { id: "dp-8", brand_id: "demo-b4", workspace_id: "", name: "Multivitamin Pro", url: "https://vitaboost.com/multi", image_url: "https://picsum.photos/seed/vb-multi/200/200", price: "$29", sku: "VB-MV01", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  "demo-b5": [
    { id: "dp-9", brand_id: "demo-b5", workspace_id: "", name: "Cold Brew Classic", url: "https://brewcraft.co/classic", image_url: "https://picsum.photos/seed/bc-cold/200/200", price: "$5", sku: "BC-CB01", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "dp-10", brand_id: "demo-b5", workspace_id: "", name: "Oat Milk Latte", url: "https://brewcraft.co/oat-latte", image_url: "https://picsum.photos/seed/bc-oat/200/200", price: "$6", sku: "BC-OL01", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
};

const SYNC_NEW_PRODUCTS: Record<string, BrandProduct[]> = {
  "demo-b1": [
    { id: "dp-s1", brand_id: "demo-b1", workspace_id: "", name: "Air Force 1 '07", url: "https://nike.com/af1", image_url: "https://picsum.photos/seed/nike-af1/200/200", price: "$110", sku: "NK-AF107", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  "demo-b2": [
    { id: "dp-s2", brand_id: "demo-b2", workspace_id: "", name: "Vitamin C Drops", url: "https://glowskin.co/vitc", image_url: "https://picsum.photos/seed/gs-vitc/200/200", price: "$35", sku: "GS-VC01", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  "demo-b3": [
    { id: "dp-s3", brand_id: "demo-b3", workspace_id: "", name: "SmartWatch Ultra", url: "https://technova.io/watch", image_url: "https://picsum.photos/seed/tn-watch/200/200", price: "$299", sku: "TN-SWU1", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
};

export function useBrandProducts(brandId: string | null | undefined) {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["brand-products", workspaceId, brandId],
    queryFn: async () => {
      if (!workspaceId || !brandId) return [];

      // Demo brand
      if (brandId.startsWith("demo-")) {
        return DEMO_PRODUCTS[brandId] || [];
      }

      const { data, error } = await supabase
        .from("brand_products")
        .select("*")
        .eq("brand_id", brandId)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BrandProduct[];
    },
    enabled: !!workspaceId && !!brandId,
  });
}

export function useAddBrandProduct() {
  const workspaceId = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { brand_id: string; name: string; url?: string; price?: string; sku?: string; image_url?: string }) => {
      if (!workspaceId) throw new Error("No workspace");

      if (params.brand_id.startsWith("demo-")) {
        await fakeSleep(500, 1000);
        const newProduct: BrandProduct = {
          id: `dp-manual-${Date.now()}`,
          brand_id: params.brand_id,
          workspace_id: "",
          name: params.name,
          url: params.url || null,
          image_url: params.image_url || `https://picsum.photos/seed/${params.name.replace(/\s/g, "-")}/200/200`,
          price: params.price || null,
          sku: params.sku || null,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        // Add to demo data
        if (!DEMO_PRODUCTS[params.brand_id]) DEMO_PRODUCTS[params.brand_id] = [];
        DEMO_PRODUCTS[params.brand_id].unshift(newProduct);
        return newProduct;
      }

      const { data, error } = await supabase
        .from("brand_products")
        .insert({
          brand_id: params.brand_id,
          workspace_id: workspaceId,
          name: params.name,
          url: params.url || null,
          price: params.price || null,
          sku: params.sku || null,
          image_url: params.image_url || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BrandProduct;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["brand-products"] });
      toast.success("Product added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSyncBrandProducts() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => {
      // Simulate syncing — adds new products after a delay
      await fakeSleep(1500, 3000);

      if (brandId.startsWith("demo-")) {
        const newOnes = SYNC_NEW_PRODUCTS[brandId];
        if (newOnes && newOnes.length > 0) {
          if (!DEMO_PRODUCTS[brandId]) DEMO_PRODUCTS[brandId] = [];
          // Only add if not already present
          for (const p of newOnes) {
            if (!DEMO_PRODUCTS[brandId].find((x) => x.id === p.id)) {
              DEMO_PRODUCTS[brandId].push({ ...p, created_at: new Date().toISOString() });
            }
          }
          // Clear so next sync doesn't add duplicates — add different ones
          SYNC_NEW_PRODUCTS[brandId] = [];
          return newOnes.length;
        }
        return 0;
      }

      // Real mode — would call an edge function
      return 0;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["brand-products"] });
      if (count > 0) {
        toast.success(`Synced ${count} new product${count > 1 ? "s" : ""}`);
      } else {
        toast.info("No new products found");
      }
    },
    onError: () => toast.error("Sync failed"),
  });
}

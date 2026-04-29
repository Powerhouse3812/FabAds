import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DEMO_MODE, fakeSleep, fakeImageUrl } from "@/lib/demo-mode";

export interface GenieGeneration {
  id: string;
  workspace_id: string;
  created_by: string;
  parent_id: string | null;
  prompt: string;
  reference_image_ids: string[];
  reference_mode: string;
  output_url: string;
  storage_path: string;
  settings: Record<string, any>;
  status: string;
  created_at: string;
}

export interface GenieSettings {
  sentiment?: string;
  aspect_ratio?: string;
  quality?: string;
  background?: string;
  model?: string;
  category?: string;
  traffic_sources?: string[];
  template_id?: string;
  override_ai_metadata?: boolean;
  num_variations?: number;
}

export interface BatchState {
  id: string;
  prompt: string;
  total: number;
  completed: number;
  failed: number;
  failReason?: "credits_exhausted" | "generic";
  settings: GenieSettings;
  referenceMode: string;
  status: "generating" | "completed";
  completedIds: string[];
  startedAt: string;
}

export function useGenieGenerations(filter: "my" | "all" = "my") {
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["genie-generations", workspaceId, filter, user?.id],
    queryFn: async () => {
      if (!workspaceId) return [];
      let q = supabase
        .from("genie_generations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (filter === "my" && user?.id) {
        q = q.eq("created_by", user.id);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as GenieGeneration[];
    },
    enabled: !!workspaceId,
  });
}

async function generateSingleImage(params: {
  prompt: string;
  settings: GenieSettings;
  referenceImages: string[];
  referenceMode: string;
  parentId?: string;
  workspaceId: string;
  userId: string;
}): Promise<GenieGeneration> {
  const { prompt, settings, referenceImages = [], referenceMode = "merge", parentId, workspaceId, userId } = params;

  let publicUrl: string;
  let fileName: string;

  if (DEMO_MODE) {
    // --- Demo mode: fake delay + Picsum image ---
    await fakeSleep(1500, 4000);
    publicUrl = fakeImageUrl(prompt, settings.aspect_ratio);
    fileName = "demo";
  } else {
    // --- Real mode: call AI gateway ---
    let fullPrompt = prompt;
    if (settings.sentiment && settings.sentiment !== "auto") {
      fullPrompt += `. Style: ${settings.sentiment}`;
    }
    if (settings.aspect_ratio && settings.aspect_ratio !== "auto") {
      fullPrompt += `. Aspect ratio: ${settings.aspect_ratio}`;
    }
    if (settings.background === "transparent") {
      fullPrompt += ". Transparent background, on a solid white background.";
    }
    if (settings.quality === "high") {
      fullPrompt += ". High quality, detailed.";
    }

    let model = "google/gemini-3.1-flash-image-preview";
    if (settings.model && settings.model !== "auto") {
      model = settings.model;
    } else if (settings.quality === "high") {
      model = "google/gemini-3-pro-image-preview";
    }

    // Upload base64 reference images to storage
    const resolvedRefs: string[] = [];
    for (const imgUrl of referenceImages) {
      if (imgUrl.startsWith("data:")) {
        const match = imgUrl.match(/^data:image\/(\w+);base64,/);
        const ext = match?.[1] || "png";
        const base64Data = imgUrl.replace(/^data:image\/\w+;base64,/, "");
        const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const refFileName = `genie/${workspaceId}/ref-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const { error: refUploadErr } = await supabase.storage
          .from("creative-assets")
          .upload(refFileName, bytes, { contentType: `image/${ext}`, upsert: false });
        if (refUploadErr) throw refUploadErr;
        const { data: refUrlData } = supabase.storage.from("creative-assets").getPublicUrl(refFileName);
        resolvedRefs.push(refUrlData.publicUrl);
      } else {
        resolvedRefs.push(imgUrl);
      }
    }

    const messages: any[] = [];
    if (resolvedRefs.length > 0) {
      const content: any[] = [{ type: "text", text: fullPrompt }];
      for (const refUrl of resolvedRefs) {
        content.push({ type: "image_url", image_url: { url: refUrl } });
      }
      messages.push({ role: "user", content });
    } else {
      messages.push({ role: "user", content: fullPrompt });
    }

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) throw new Error("Not authenticated — please sign in again");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const resp = await fetch(`${supabaseUrl}/functions/v1/copilot-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        messages,
        generate_image: true,
        settings: { model },
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || "Image generation failed");
    }

    const data = await resp.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("No image was generated");

    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const ext = "png";
    fileName = `genie/${workspaceId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("creative-assets")
      .upload(fileName, bytes, { contentType: `image/${ext}`, upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("creative-assets").getPublicUrl(fileName);
    publicUrl = urlData.publicUrl;
  }

  const { data: gen, error: insertError } = await supabase
    .from("genie_generations")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      parent_id: parentId || null,
      prompt,
      reference_image_ids: referenceImages.length > 0 ? referenceImages : [],
      reference_mode: referenceMode,
      output_url: publicUrl,
      storage_path: fileName,
      settings,
      status: "completed",
    } as any)
    .select()
    .single();

  if (insertError) throw insertError;
  return gen as unknown as GenieGeneration;
}

export function useGenerateImage() {
  const workspaceId = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      prompt: string;
      settings: GenieSettings;
      referenceImages?: string[];
      referenceMode?: string;
      parentId?: string;
    }) => {
      if (!workspaceId || !user) throw new Error("Not authenticated");
      return generateSingleImage({
        ...params,
        referenceImages: params.referenceImages || [],
        referenceMode: params.referenceMode || "merge",
        workspaceId,
        userId: user.id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genie-generations"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
}

export function useBatchGenerate() {
  const workspaceId = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [batches, setBatches] = useState<BatchState[]>([]);
  const batchIdRef = useRef(0);

  const generate = useCallback(
    (params: {
      prompt: string;
      settings: GenieSettings;
      referenceImages?: string[];
      referenceMode?: string;
      parentId?: string;
    }) => {
      if (!workspaceId || !user) {
        toast.error("Not authenticated");
        return;
      }

      const count = params.settings.num_variations || 1;
      const batchId = `batch-${++batchIdRef.current}`;

      const batch: BatchState = {
        id: batchId,
        prompt: params.prompt,
        total: count,
        completed: 0,
        failed: 0,
        settings: params.settings,
        referenceMode: params.referenceMode || "merge",
        status: "generating",
        completedIds: [],
        startedAt: new Date().toISOString(),
      };

      setBatches((prev) => [batch, ...prev]);

      const promises = Array.from({ length: count }, () =>
        generateSingleImage({
          ...params,
          referenceImages: params.referenceImages || [],
          referenceMode: params.referenceMode || "merge",
          workspaceId,
          userId: user.id,
        })
          .then((gen) => {
            setBatches((prev) =>
              prev.map((b) => (b.id === batchId ? { ...b, completed: b.completed + 1, completedIds: [...b.completedIds, gen.id] } : b))
            );
            qc.invalidateQueries({ queryKey: ["genie-generations"] });
          })
          .catch((err: any) => {
            const isCredits = err?.message?.toLowerCase().includes("credits exhausted") || err?.message?.includes("402");
            setBatches((prev) =>
              prev.map((b) => (b.id === batchId ? { ...b, failed: b.failed + 1, failReason: isCredits ? "credits_exhausted" : (b.failReason || "generic") } : b))
            );
          })
      );

      Promise.allSettled(promises).then(() => {
        setBatches((prev) =>
          prev.map((b) => (b.id === batchId ? { ...b, status: "completed" } : b))
        );
      });
    },
    [workspaceId, user, qc]
  );

  const dismissBatch = useCallback((batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
  }, []);

  return { generate, activeBatches: batches, dismissBatch };
}

export function useDeleteGenieGeneration() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("genie_generations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["genie-generations"] });
      toast.success("Image deleted");
    },
    onError: () => toast.error("Failed to delete image"),
  });
}

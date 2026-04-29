import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export function useMediaUpload() {
  const workspaceId = useWorkspace();
  const [uploading, setUploading] = useState(false);

  const upload = async (launchId: string, adId: string, files: File[]): Promise<string[]> => {
    if (!workspaceId) throw new Error("No workspace");
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${workspaceId}/${launchId}/${adId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("launch-media").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: urlData, error: signError } = await supabase.storage
          .from("launch-media")
          .createSignedUrl(path, 3600);
        if (signError) throw signError;
        urls.push(urlData.signedUrl);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "./use-workspace";
import { DEMO_MODE } from "@/lib/demo-mode";
import { getDummyVideos, fakeAnalyseVideo, type DummyVideo, type VideoSageAnalysis } from "@/lib/video-sage-dummy-data";

export interface VideoSageVideo {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  storage_path: string | null;
  duration_seconds: number;
  language: string;
  status: string;
  analysis: VideoSageAnalysis | null;
  created_at: string;
  updated_at: string;
}

export function useVideoSageVideos() {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["video-sage-videos", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<VideoSageVideo[]> => {
      if (DEMO_MODE) {
        const dummies = getDummyVideos();
        return dummies.map((d) => ({
          id: d.id,
          workspace_id: workspaceId!,
          created_by: "demo",
          title: d.title,
          thumbnail_url: d.thumbnail_url,
          video_url: d.video_url,
          storage_path: null,
          duration_seconds: d.duration_seconds,
          language: d.language,
          status: d.status,
          analysis: d.analysis,
          created_at: d.created_at,
          updated_at: d.created_at,
        }));
      }
      const { data, error } = await supabase
        .from("video_sage_videos")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as VideoSageVideo[];
    },
  });
}

export function useVideoSageDetail(videoId: string | undefined) {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["video-sage-detail", videoId],
    enabled: !!videoId && !!workspaceId,
    queryFn: async (): Promise<VideoSageVideo | null> => {
      if (DEMO_MODE) {
        const dummies = getDummyVideos();
        const found = dummies.find((d) => d.id === videoId);
        if (!found) return null;
        return {
          id: found.id,
          workspace_id: workspaceId!,
          created_by: "demo",
          title: found.title,
          thumbnail_url: found.thumbnail_url,
          video_url: found.video_url,
          storage_path: null,
          duration_seconds: found.duration_seconds,
          language: found.language,
          status: found.status,
          analysis: found.analysis,
          created_at: found.created_at,
          updated_at: found.created_at,
        };
      }
      const { data, error } = await supabase
        .from("video_sage_videos")
        .select("*")
        .eq("id", videoId!)
        .single();
      if (error) throw error;
      return data as unknown as VideoSageVideo;
    },
  });
}

export interface AnalysingJob {
  id: string;
  title: string;
  status: "analysing" | "analysed" | "failed";
}

export function useAnalyseVideo() {
  const { user } = useAuth();
  const workspaceId = useWorkspace();
  const qc = useQueryClient();
  const [jobs, setJobs] = useState<AnalysingJob[]>([]);

  const dismissJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const analyse = useCallback(
    async (file: File) => {
      if (!user || !workspaceId) return;
      const jobId = crypto.randomUUID();
      const title = file.name.replace(/\.[^.]+$/, "");
      setJobs((prev) => [...prev, { id: jobId, title, status: "analysing" }]);

      try {
        if (DEMO_MODE) {
          const analysis = await fakeAnalyseVideo();
          setJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, status: "analysed" } : j))
          );
          qc.invalidateQueries({ queryKey: ["video-sage-videos"] });
          return jobId;
        }

        // Real path: upload then insert
        const ext = file.name.split(".").pop();
        const path = `${workspaceId}/video-sage/${jobId}.${ext}`;
        await supabase.storage.from("creative-assets").upload(path, file, { upsert: true });
        const { data: urlData } = supabase.storage.from("creative-assets").getPublicUrl(path);

        await supabase.from("video_sage_videos").insert({
          id: jobId,
          workspace_id: workspaceId,
          created_by: user.id,
          title,
          video_url: urlData.publicUrl,
          storage_path: path,
          status: "analysing",
        } as any);

        const analysis = await fakeAnalyseVideo();
        await supabase
          .from("video_sage_videos")
          .update({ status: "analysed", analysis: analysis as any } as any)
          .eq("id", jobId);

        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: "analysed" } : j))
        );
        qc.invalidateQueries({ queryKey: ["video-sage-videos"] });
        return jobId;
      } catch {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: "failed" } : j))
        );
      }
    },
    [user, workspaceId, qc]
  );

  return { analyse, jobs, dismissJob };
}

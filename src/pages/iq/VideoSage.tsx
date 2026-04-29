import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVideoSageVideos, useVideoSageDetail, useAnalyseVideo } from "@/hooks/use-video-sage";
import VideoUploadSection from "@/components/video-sage/VideoUploadSection";
import VideoCard from "@/components/video-sage/VideoCard";
import VideoStatusBar from "@/components/video-sage/VideoStatusBar";
import VideoSageDetail from "@/components/video-sage/VideoSageDetail";
import { Skeleton } from "@/components/ui/skeleton";

export default function VideoSage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: videos, isLoading } = useVideoSageVideos();
  const { data: detailVideo } = useVideoSageDetail(id);
  const { analyse, jobs, dismissJob } = useAnalyseVideo();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    await analyse(file);
    setUploading(false);
  };

  // Detail view
  if (id && detailVideo) {
    return (
      <div className="p-6">
        <VideoSageDetail video={detailVideo} onBack={() => navigate("/iq/video-sage")} />
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Status bar */}
      <VideoStatusBar
        jobs={jobs}
        onDismiss={dismissJob}
        onViewDetails={(jobId) => navigate(`/iq/video-sage/${jobId}`)}
      />

      {/* Upload section */}
      <VideoUploadSection onFileSelected={handleFile} uploading={uploading} />

      {/* Recently Analysed */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Recently Analysed Videos</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos?.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onOpen={(vid) => navigate(`/iq/video-sage/${vid}`)}
              />
            ))}
            {videos?.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-12">
                No videos analysed yet. Upload a video to get started.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

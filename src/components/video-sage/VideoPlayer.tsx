import { useRef, useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  src?: string | null;
  poster?: string | null;
}

export default function VideoPlayer({ src, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrent(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    const onEnd = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause();
    else v.play();
    setPlaying(!playing);
  };

  const seek = (val: number[]) => {
    const v = videoRef.current;
    if (v) v.currentTime = val[0];
  };

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta));
  };

  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const hasSrc = !!src;

  return (
    <div className="rounded-lg overflow-hidden bg-black flex flex-col">
      <div className="relative aspect-video">
        {hasSrc ? (
          <video
            ref={videoRef}
            src={src!}
            poster={poster || undefined}
            className="w-full h-full object-contain"
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {poster ? (
              <img src={poster} alt="Video thumbnail" className="w-full h-full object-cover opacity-70" />
            ) : (
              <Play className="w-12 h-12 text-white/40" />
            )}
          </div>
        )}

        {!playing && (
          <button
            onClick={toggle}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="px-3 py-2 bg-black/90 space-y-1">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={seek}
          className="h-1"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-white/80 hover:bg-white/10" onClick={() => skip(-5)}>
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-white/80 hover:bg-white/10" onClick={toggle}>
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-white/80 hover:bg-white/10" onClick={() => skip(5)}>
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] text-white/70 ml-2">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-white/50" />
            <Maximize className="w-3.5 h-3.5 text-white/50 ml-1 cursor-pointer" onClick={() => videoRef.current?.requestFullscreen()} />
          </div>
        </div>
      </div>
    </div>
  );
}

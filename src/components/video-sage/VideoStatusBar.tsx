import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysingJob } from "@/hooks/use-video-sage";

interface Props {
  jobs: AnalysingJob[];
  onDismiss: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export default function VideoStatusBar({ jobs, onDismiss, onViewDetails }: Props) {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div
          key={job.id}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
            job.status === "analysing"
              ? "bg-primary/5 border border-primary/20"
              : job.status === "analysed"
              ? "bg-emerald-500/5 border border-emerald-500/20"
              : "bg-destructive/5 border border-destructive/20"
          }`}
        >
          {job.status === "analysing" && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
          {job.status === "analysed" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {job.status === "failed" && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}

          <span className="truncate flex-1 text-foreground">
            {job.status === "analysing" && `Analysing "${job.title}"…`}
            {job.status === "analysed" && `"${job.title}" analysed successfully`}
            {job.status === "failed" && `Analysis failed for "${job.title}"`}
          </span>

          {job.status === "analysed" && onViewDetails && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onViewDetails(job.id)}>
              View details
            </Button>
          )}
          {job.status === "failed" && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-destructive">
              Retry
            </Button>
          )}

          <button onClick={() => onDismiss(job.id)} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

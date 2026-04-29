import { useState } from "react";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "./VideoPlayer";
import SummaryTab from "./SummaryTab";
import FrameworkTab from "./FrameworkTab";
import StoryboardTab from "./StoryboardTab";
import ScriptTab from "./ScriptTab";
import ScriptConceptsTab from "./ScriptConceptsTab";
import GenerateScriptModal from "./GenerateScriptModal";
import EditScriptDrawer from "./EditScriptDrawer";
import { useVideoSageScripts } from "@/hooks/use-video-sage-scripts";
import type { VideoSageVideo } from "@/hooks/use-video-sage";
import type { ScriptConcept } from "@/lib/video-sage-dummy-data";

interface Props {
  video: VideoSageVideo;
  onBack: () => void;
}

export default function VideoSageDetail({ video, onBack }: Props) {
  const analysis = video.analysis;
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<ScriptConcept | null>(null);

  const { concepts, generating, editing, generateConcept, editScript, deleteConcept } =
    useVideoSageScripts(video.id);

  const handleEditConcept = (concept: ScriptConcept) => {
    setEditingConcept(concept);
    setEditDrawerOpen(true);
  };

  // For editing the original script from ScriptTab
  const handleEditOriginal = () => {
    if (!analysis) return;
    const originalConcept: ScriptConcept = {
      id: "__original__",
      framework: analysis.framework.name,
      frameworkFull: analysis.framework.fullName,
      script: analysis.script,
      createdAt: video.created_at,
      status: "ready",
    };
    setEditingConcept(originalConcept);
    setEditDrawerOpen(true);
  };

  // Keep editingConcept in sync with concepts state
  const activeConcept = editingConcept
    ? editingConcept.id === "__original__"
      ? editingConcept
      : concepts.find((c) => c.id === editingConcept.id) ?? editingConcept
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{video.title}</h1>
          <p className="text-xs text-muted-foreground">{video.language} · {video.duration_seconds}s</p>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-[320px_1fr_200px] gap-4 items-start">
        {/* Left: Video Player */}
        <div className="sticky top-4">
          <VideoPlayer
            src={video.video_url || undefined}
            poster={video.thumbnail_url}
          />
        </div>

        {/* Center: Tabs */}
        <div className="min-w-0">
          {analysis ? (
            <Tabs defaultValue="summary">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="summary">Visual Summary</TabsTrigger>
                <TabsTrigger value="framework">Framework</TabsTrigger>
                <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="concepts">
                  Concepts{concepts.length > 0 && ` (${concepts.length})`}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-4">
                <SummaryTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="framework" className="mt-4">
                <FrameworkTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="storyboard" className="mt-4">
                <StoryboardTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="script" className="mt-4">
                <ScriptTab analysis={analysis} onEditWithAI={handleEditOriginal} />
              </TabsContent>
              <TabsContent value="concepts" className="mt-4">
                <ScriptConceptsTab
                  concepts={concepts}
                  onEdit={handleEditConcept}
                  onDelete={deleteConcept}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              {video.status === "analysing" ? "Analysis in progress…" : "No analysis data available."}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-3 sticky top-4">
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Save className="w-3.5 h-3.5" /> Save Analysis
          </Button>
          <Button size="sm" className="w-full gap-1.5" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="w-3.5 h-3.5" /> Generate New Script
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">02 credits per generation</p>
        </div>
      </div>

      {/* Generate Modal */}
      <GenerateScriptModal
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        generating={generating}
        onGenerate={generateConcept}
      />

      {/* Edit Drawer */}
      <EditScriptDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        concept={activeConcept}
        editing={editing}
        onEdit={editScript}
      />
    </div>
  );
}

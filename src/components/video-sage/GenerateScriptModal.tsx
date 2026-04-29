import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  generating: boolean;
  onGenerate: (framework: string) => Promise<void>;
}

const FRAMEWORKS = [
  { value: "PAS", label: "PAS — Problem-Agitate-Solution" },
  { value: "AIDA", label: "AIDA — Attention-Interest-Desire-Action" },
  { value: "BAB", label: "BAB — Before-After-Bridge" },
  { value: "FAB", label: "FAB — Features-Advantages-Benefits" },
];

export default function GenerateScriptModal({ open, onOpenChange, generating, onGenerate }: Props) {
  const [framework, setFramework] = useState("PAS");

  const handleGenerate = async () => {
    await onGenerate(framework);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Generate new Script</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* AI Model */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">AI Model</Label>
            <Select defaultValue="auto">
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Recommended)</SelectItem>
                <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
                <SelectItem value="gpt">GPT-5 Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Framework */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Framework</Label>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORKS.map((fw) => (
                  <SelectItem key={fw.value} value={fw.value}>
                    {fw.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Source</Label>
            <RadioGroup defaultValue="original" className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="original" id="src-original" />
                <Label htmlFor="src-original" className="text-sm font-normal cursor-pointer">
                  Original from video
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate new Script (02 credit)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

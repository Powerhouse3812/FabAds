import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Settings2 } from "lucide-react";
import { useState } from "react";
import { FastLaunchDrawer } from "./FastLaunchDrawer";

interface FolderLaunchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
}

export function FolderLaunchModal({ open, onOpenChange, folderId, folderName }: FolderLaunchModalProps) {
  const navigate = useNavigate();
  const [showFastLaunch, setShowFastLaunch] = useState(false);

  const handleAdvanced = () => {
    onOpenChange(false);
    navigate(`/launch/new?folderId=${folderId}`);
  };

  const handleClose = (v: boolean) => {
    if (!v) setShowFastLaunch(false);
    onOpenChange(v);
  };

  if (showFastLaunch) {
    return (
      <FastLaunchDrawer
        open={open}
        onOpenChange={handleClose}
        folderId={folderId}
        folderName={folderName}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Launch "{folderName}"</DialogTitle>
          <DialogDescription className="text-xs">
            Choose how you'd like to launch this folder's creatives.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Card
            className="cursor-pointer hover:border-primary/60 hover:shadow-sm transition-all group"
            onClick={() => setShowFastLaunch(true)}
          >
            <CardContent className="flex flex-col items-center text-center gap-2 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Fast Launch</span>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Single page, pick Campaign URLs & ad accounts, launch instantly.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/60 hover:shadow-sm transition-all group"
            onClick={handleAdvanced}
          >
            <CardContent className="flex flex-col items-center text-center gap-2 p-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Advanced Launch</span>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Full wizard with targeting, creative editing, and review steps.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

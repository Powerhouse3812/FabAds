import { Zap } from "lucide-react";

export default function LaunchV2Auto() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-2 text-center">
        <Zap className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">Auto launch</p>
        <p className="text-xs text-muted-foreground">Re-launch from a previous campaign. Coming soon.</p>
      </div>
    </div>
  );
}

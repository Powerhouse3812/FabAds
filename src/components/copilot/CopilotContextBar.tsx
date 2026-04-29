import { useCopilot } from "@/contexts/CopilotContext";
import { Badge } from "@/components/ui/badge";
import { MODULE_QUICK_ACTIONS } from "@/lib/copilot-prompts";
import { LayoutDashboard, Rocket, BarChart3, Image, Eye, Shield, Link2 } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  creative_library: "Creative Library",
  insights: "Industry Insights",
  launch: "Launch",
  reports: "Reports",
  dashboard: "Dashboard",
  rrm: "RRM",
  campaign_urls: "Campaign URLs",
  settings: "Settings",
  default: "General",
};

const MODULE_ICONS: Record<string, any> = {
  creative_library: Image,
  insights: Eye,
  launch: Rocket,
  reports: BarChart3,
  dashboard: LayoutDashboard,
  rrm: Shield,
  campaign_urls: Link2,
};

export function CopilotContextBar() {
  const { currentModule, selectedItems } = useCopilot();
  const Icon = MODULE_ICONS[currentModule] || LayoutDashboard;
  const label = MODULE_LABELS[currentModule] || "General";

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {selectedItems.length > 0 && (
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
          {selectedItems.length} selected
        </Badge>
      )}
    </div>
  );
}

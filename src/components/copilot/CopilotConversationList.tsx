import { useState } from "react";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { MessageSquare, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCopilotConversations } from "@/hooks/use-copilot-conversations";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODULE_LABELS: Record<string, string> = {
  creative_library: "Creatives",
  insights: "Insights",
  launch: "Launch",
  reports: "Reports",
  dashboard: "Dashboard",
  rrm: "RRM",
  campaign_urls: "URLs",
  settings: "Settings",
  default: "General",
};

interface CopilotConversationListProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function groupConversations(conversations: any[]) {
  const today: any[] = [];
  const yesterday: any[] = [];
  const older: any[] = [];

  for (const c of conversations) {
    const d = new Date(c.updated_at);
    if (isToday(d)) today.push(c);
    else if (isYesterday(d)) yesterday.push(c);
    else older.push(c);
  }

  return { today, yesterday, older };
}

export function CopilotConversationList({ activeId, onSelect, onNew }: CopilotConversationListProps) {
  const { conversations, isLoading, deleteConversation } = useCopilotConversations();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  const filtered = conversations.filter((c: any) => {
    const matchesSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === "all" || c.module_context === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const { today, yesterday, older } = groupConversations(filtered);

  const renderRow = (c: any) => {
    const isActive = activeId === c.id;
    const moduleLabel = MODULE_LABELS[c.module_context || "default"] || "General";

    return (
      <div
        key={c.id}
        className={cn(
          "group flex items-start gap-2 px-2.5 py-2 rounded-md cursor-pointer text-xs transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
        onClick={() => onSelect(c.id)}
      >
        <MessageSquare className="h-3 w-3 flex-shrink-0 mt-0.5 opacity-60" />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-[11px]">{c.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 shrink-0">
              {moduleLabel}
            </Badge>
            <span className="text-[9px] text-muted-foreground">
              {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            deleteConversation(c.id);
          }}
        >
          <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
        </Button>
      </div>
    );
  };

  const renderGroup = (label: string, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label}>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground px-2.5 pt-2.5 pb-1">
          {label}
        </p>
        <div className="space-y-0.5">{items.map(renderRow)}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Conversations
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onNew}
          title="New conversation"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-2 pb-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      {/* Module filter */}
      <div className="px-2 pb-1.5">
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="All modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            <SelectItem value="creative_library">Creatives</SelectItem>
            <SelectItem value="insights">Insights</SelectItem>
            <SelectItem value="launch">Launch</SelectItem>
            <SelectItem value="reports">Reports</SelectItem>
            <SelectItem value="dashboard">Dashboard</SelectItem>
            <SelectItem value="rrm">RRM</SelectItem>
            <SelectItem value="campaign_urls">URLs</SelectItem>
            <SelectItem value="default">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground px-2 py-3">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-3">
              {search || moduleFilter !== "all" ? "No matches" : "No conversations yet"}
            </p>
          ) : (
            <>
              {renderGroup("Today", today)}
              {renderGroup("Yesterday", yesterday)}
              {renderGroup("Older", older)}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

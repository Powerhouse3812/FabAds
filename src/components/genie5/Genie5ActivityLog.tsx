import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Pencil, RefreshCw, Settings, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ─── Types ────────────────────────────────────────────────── */

interface LogEntry {
  id: string;
  type: "generation" | "edit" | "regenerate" | "settings_change";
  status: "success" | "failed" | "partial";
  summary: string;
  detail?: string;
  user: { name: string; initial: string };
  timestamp: Date;
}

/* ─── Dummy data generator (deterministic seed from entityId) ─ */

const USERS = [
  { name: "Sarah K.", initial: "S" },
  { name: "Mike R.", initial: "M" },
  { name: "Alex T.", initial: "A" },
  { name: "Priya D.", initial: "P" },
];

const STRATEGIES = ["Before/After", "Social Proof", "Urgency Flash", "Comparison", "Storytelling", "Problem/Solution", "UGC Style", "Testimonial"];

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  };
}

function generateDummyLogs(entityType: "brand" | "category", entityId: string): LogEntry[] {
  const rng = seededRandom(entityId);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const now = Date.now();
  const dayMs = 86400000;
  const spanDays = entityType === "brand" ? 14 : 7;
  const count = entityType === "brand" ? 10 : 12;

  const entries: LogEntry[] = [];

  for (let i = 0; i < count; i++) {
    const hoursAgo = Math.floor(rng() * spanDays * 24);
    const ts = new Date(now - hoursAgo * 3600000);
    const user = pick(USERS);
    const strategy = pick(STRATEGIES);
    const r = rng();

    if (r < 0.35) {
      // Generation
      const total = Math.floor(rng() * 6) + 2;
      const statusR = rng();
      const status: LogEntry["status"] = statusR < 0.6 ? "success" : statusR < 0.85 ? "partial" : "failed";
      const completed = status === "success" ? total : status === "partial" ? Math.floor(total * 0.6) : 0;
      entries.push({
        id: `${entityId}-log-${i}`,
        type: "generation",
        status,
        summary: `Generated ${total} ad copies using ${strategy} strategy`,
        detail: status === "success"
          ? `✅ ${completed}/${total} completed successfully`
          : status === "partial"
          ? `⚠️ ${completed}/${total} completed — ${total - completed} failed due to content policy`
          : `❌ API timeout after ${Math.floor(rng() * 30 + 15)}s`,
        user,
        timestamp: ts,
      });
    } else if (r < 0.55) {
      // Edit
      const cardNum = Math.floor(rng() * 6) + 1;
      const field = pick(["headline", "primary text", "CTA", "description"]);
      entries.push({
        id: `${entityId}-log-${i}`,
        type: "edit",
        status: "success",
        summary: `Edited ${field} on Card #${cardNum} via chat`,
        user,
        timestamp: ts,
      });
    } else if (r < 0.75) {
      // Regenerate
      const cardNum = Math.floor(rng() * 6) + 1;
      entries.push({
        id: `${entityId}-log-${i}`,
        type: "regenerate",
        status: "success",
        summary: `Regenerated Card #${cardNum} — ${strategy}`,
        user,
        timestamp: ts,
      });
    } else {
      // Settings change
      const changes = [
        "Updated system prompt",
        `Changed ${entityType === "brand" ? "industry" : "niche"} to "${pick(["Health & Wellness", "Weight Loss", "Skincare", "Fitness", "E-commerce"])}"`,
        `Added ${Math.floor(rng() * 3) + 1} reference URLs`,
        "Updated brand guidelines",
        `Changed tone to "${pick(["Bold & Direct", "Friendly & Warm", "Professional", "Playful"])}"`,
        "Updated knowledge base content",
      ];
      entries.push({
        id: `${entityId}-log-${i}`,
        type: "settings_change",
        status: "success",
        summary: pick(changes),
        user,
        timestamp: ts,
      });
    }
  }

  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/* ─── Render helpers ───────────────────────────────────────── */

const typeIcons: Record<LogEntry["type"], React.ReactNode> = {
  generation: <Sparkles className="h-3.5 w-3.5" />,
  edit: <Pencil className="h-3.5 w-3.5" />,
  regenerate: <RefreshCw className="h-3.5 w-3.5" />,
  settings_change: <Settings className="h-3.5 w-3.5" />,
};

const statusBadge: Record<LogEntry["status"], { label: string; variant: "default" | "destructive" | "secondary"; icon: React.ReactNode }> = {
  success: { label: "Success", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: "Failed", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  partial: { label: "Partial", variant: "secondary", icon: <AlertTriangle className="h-3 w-3" /> },
};

function isImportantEvent(entry: LogEntry) {
  return entry.type === "generation";
}

/* ─── Component ────────────────────────────────────────────── */

interface Props {
  entityType: "brand" | "category";
  entityId: string;
}

export function Genie5ActivityLog({ entityType, entityId }: Props) {
  const logs = generateDummyLogs(entityType, entityId);

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((entry, idx) => {
        const important = isImportantEvent(entry);
        const sb = statusBadge[entry.status];
        const isLast = idx === logs.length - 1;

        if (important) {
          return (
            <div key={entry.id} className="relative pl-6">
              {/* Timeline connector */}
              {!isLast && (
                <div className="absolute left-[11px] top-[calc(100%)] w-px h-4 bg-border" />
              )}
              {idx > 0 && (
                <div className="absolute left-[11px] bottom-[calc(100%)] w-px h-4 bg-border" />
              )}
              {/* Dot */}
              <div className="absolute left-0 top-4 h-[22px] w-[22px] rounded-full border-2 border-background bg-primary/10 flex items-center justify-center">
                <div className={`h-2 w-2 rounded-full ${entry.status === "failed" ? "bg-destructive" : entry.status === "partial" ? "bg-yellow-500" : "bg-primary"}`} />
              </div>

              <Card className="mb-4 mt-4">
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-primary">{typeIcons[entry.type]}</span>
                      <p className="text-sm font-medium">{entry.summary}</p>
                    </div>
                    <Badge variant={sb.variant} className="text-[10px] h-5 px-2 gap-1 shrink-0">
                      {sb.icon} {sb.label}
                    </Badge>
                  </div>
                  {entry.detail && (
                    <p className="text-xs text-muted-foreground pl-5">{entry.detail}</p>
                  )}
                  <div className="flex items-center gap-2 pl-5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px] bg-muted">{entry.user.initial}</AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] text-muted-foreground">{entry.user.name}</span>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(entry.timestamp, { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }

        // Minor event — timeline entry
        return (
          <div key={entry.id} className="relative pl-6">
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[11px] top-full w-px h-2 bg-border" />
            )}
            {idx > 0 && (
              <div className="absolute left-[11px] bottom-full w-px h-2 bg-border" />
            )}
            {/* Small dot */}
            <div className="absolute left-[7px] top-[10px] h-2.5 w-2.5 rounded-full bg-border" />

            <div className="flex items-center gap-2 py-2 min-h-[32px]">
              <span className="text-muted-foreground">{typeIcons[entry.type]}</span>
              <span className="text-xs text-foreground">{entry.summary}</span>
              <span className="text-[11px] text-muted-foreground ml-auto shrink-0 flex items-center gap-1.5">
                {entry.user.name} · {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Launch v2 — internal Feedback panel (/launchv2/feedback-panel).
 *
 * A hidden operator dashboard (reached by long-pressing the avatar) for triaging
 * Bug / Problem / Suggestion / Praise reports filed by internal testers of the
 * Launch 2.0 prototype. Master-detail layout: a compact list on the left, a full
 * telemetry + screenshot + reproduction view on the right. Reads via
 * fetchFeedback(); triages optimistically via updateFeedbackStatus().
 *
 * No name is ever asked of testers, so the operator leans on visitor_id + IP +
 * device + geo to tell reports apart — all surfaced here in Geist Mono.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bug,
  Download,
  ExternalLink,
  Inbox,
  Lightbulb,
  Link2,
  MessageSquare,
  MessageSquareWarning,
  MousePointerClick,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/launch2/utils/time";
import {
  clearAll,
  exportAllAsJson,
  fetchFeedback,
  fetchTesters,
  importJson,
  updateFeedbackStatus,
} from "./service";
import type {
  FeedbackCategory,
  FeedbackRecord,
  FeedbackStatus,
  TesterRecord,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Category + status presentation                                     */
/* ------------------------------------------------------------------ */

/** Which top-level view the panel is showing. */
type PanelView = "feedback" | "testers";

type CatMeta = {
  label: string;
  icon: typeof Bug;
  /** token-driven chip classes (no raw grays) */
  chip: string;
  dot: string;
};

const CATEGORY_META: Record<FeedbackCategory, CatMeta> = {
  bug: {
    label: "Bug",
    icon: Bug,
    chip: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    dot: "bg-rose-500",
  },
  problem: {
    label: "Problem",
    icon: MessageSquareWarning,
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dot: "bg-amber-500",
  },
  suggestion: {
    label: "Suggestion",
    icon: Lightbulb,
    chip: "bg-primary/15 text-primary border-primary/30",
    dot: "bg-primary",
  },
  praise: {
    label: "Praise",
    icon: ThumbsUp,
    chip: "bg-primary/15 text-primary border-primary/30",
    dot: "bg-primary",
  },
};

const SEVERITY_LABEL: Record<string, string> = {
  blocker: "Blocker",
  major: "Major",
  minor: "Minor",
};

const STATUS_META: Record<FeedbackStatus, { label: string; dot: string }> = {
  new: { label: "New", dot: "bg-primary" },
  triaged: { label: "Triaged", dot: "bg-amber-500" },
  resolved: { label: "Resolved", dot: "bg-emerald-500" },
  wontfix: { label: "Won't fix", dot: "bg-muted-foreground" },
};

const CATEGORY_PILLS: { id: FeedbackCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bug", label: "Bug" },
  { id: "problem", label: "Problem" },
  { id: "suggestion", label: "Suggestion" },
  { id: "praise", label: "Praise" },
];

const STATUS_OPTIONS: { id: FeedbackStatus | "all"; label: string }[] = [
  { id: "all", label: "All status" },
  { id: "new", label: "New" },
  { id: "triaged", label: "Triaged" },
  { id: "resolved", label: "Resolved" },
  { id: "wontfix", label: "Won't fix" },
];

/** Friendly labels for known answer keys; unknown keys fall back to a humanised form. */
const ANSWER_LABELS: Record<string, string> = {
  what_happened: "Kya hua",
  where: "Kahan",
  area: "Area",
  liked: "Kya accha laga",
};

function answerLabel(key: string): string {
  if (ANSWER_LABELS[key]) return ANSWER_LABELS[key];
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "2m 5s" · "45s" · "1m 0s" from a seconds count. */
function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return "—";
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

/** Last 6 chars of a visitor id, as a short tester tag. */
function visitorTag(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length <= 6 ? id : id.slice(-6);
}

/** Source-of-identity chip presentation (link param vs. first-load popup). */
const SOURCE_META: Record<string, { label: string; icon: typeof Link2 }> = {
  link: { label: "Link", icon: Link2 },
  popup: { label: "Popup", icon: MousePointerClick },
};

/* ------------------------------------------------------------------ */
/*  Panel                                                              */
/* ------------------------------------------------------------------ */

export default function FeedbackPanel() {
  const navigate = useNavigate();

  const [view, setView] = useState<PanelView>("feedback");

  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [testers, setTesters] = useState<TesterRecord[]>([]);
  const [testersLoading, setTestersLoading] = useState(true);

  const [category, setCategory] = useState<FeedbackCategory | "all">("all");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [search, setSearch] = useState("");

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // One fetch; all filtering is client-side (simpler, and the dataset is small).
  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchFeedback();
    setRecords(rows);
    setLoading(false);
  }, []);

  const loadTesters = useCallback(async () => {
    setTestersLoading(true);
    const rows = await fetchTesters();
    setTesters(rows);
    setTestersLoading(false);
  }, []);

  useEffect(() => {
    void load();
    void loadTesters();
  }, [load, loadTesters]);

  /* ---- derived: filtered list ---- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (status !== "all" && r.status !== status) return false;
      if (q) {
        const hay = [
          r.message,
          r.screen_path,
          r.geo?.city,
          r.geo?.country,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, category, status, search]);

  /* ---- keep a valid selection ---- */
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = useMemo(
    () => records.find((r) => r.id === selectedId) ?? null,
    [records, selectedId],
  );

  /* ---- stats (from the full set, not the filtered view) ---- */
  const stats = useMemo(() => {
    const base = {
      total: records.length,
      bug: 0,
      problem: 0,
      suggestion: 0,
      praise: 0,
      new: 0,
    };
    for (const r of records) {
      base[r.category] += 1;
      if (r.status === "new") base.new += 1;
    }
    return base;
  }, [records]);

  /* ---- feedback count per visitor (for the roster) ---- */
  const countByVisitor = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) {
      if (!r.visitor_id) continue;
      map.set(r.visitor_id, (map.get(r.visitor_id) ?? 0) + 1);
    }
    return map;
  }, [records]);

  /* ---- optimistic triage ---- */
  const onChangeStatus = useCallback(
    async (id: string, next: FeedbackStatus) => {
      const prev = records;
      setRecords((rs) =>
        rs.map((r) => (r.id === id ? { ...r, status: next } : r)),
      );
      const ok = await updateFeedbackStatus(id, next);
      if (!ok) setRecords(prev); // rollback on failure
    },
    [records],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* ---------------- Header strip ---------------- */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => navigate("/launchv2")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to Launch v2"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-semibold">Feedback — Launch 2.0</h1>
            <p className="truncate text-[11px] text-muted-foreground">
              Internal · tester reports
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* View switch — Feedback ↔ Testers roster */}
          <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
            <ViewToggleButton
              icon={MessageSquare}
              label="Feedback"
              active={view === "feedback"}
              onClick={() => setView("feedback")}
            />
            <ViewToggleButton
              icon={Users}
              label="Testers"
              active={view === "testers"}
              onClick={() => setView("testers")}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (view === "feedback" ? void load() : void loadTesters())}
            disabled={view === "feedback" ? loading : testersLoading}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                (view === "feedback" ? loading : testersLoading) && "animate-spin",
              )}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const blob = new Blob([exportAllAsJson()], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
              a.href = url;
              a.download = `lv2-feedback-${stamp}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="gap-1.5"
            title="Download all feedback + testers as JSON"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/json,.json";
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const text = await file.text();
                const { feedback, testers } = importJson(text);
                alert(`Imported: ${feedback} feedback rows · ${testers} testers`);
                void load();
                void loadTesters();
              };
              input.click();
            }}
            className="gap-1.5"
            title="Merge a previously exported JSON file"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!confirm("Clear ALL local feedback + testers? This cannot be undone.")) return;
              clearAll();
              void load();
              void loadTesters();
            }}
            className="gap-1.5 text-destructive hover:text-destructive"
            title="Wipe local storage (for testing)"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </header>

      {view === "testers" ? (
        <TestersView
          testers={testers}
          loading={testersLoading}
          countByVisitor={countByVisitor}
        />
      ) : (
        <>
      {/* ---------------- Stats row (asymmetric) ---------------- */}
      <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          {/* Total spans 2 cols — anchor tile */}
          <StatTile
            className="col-span-2 sm:col-span-2 bg-primary/5 border-primary/20"
            label="Total feedback"
            value={stats.total}
            accent
          />
          <StatTile label="New" value={stats.new} dot={STATUS_META.new.dot} />
          <StatTile label="Bugs" value={stats.bug} dot={CATEGORY_META.bug.dot} />
          <StatTile label="Problems" value={stats.problem} dot={CATEGORY_META.problem.dot} />
          <StatTile
            label="Ideas"
            value={stats.suggestion + stats.praise}
            dot={CATEGORY_META.suggestion.dot}
            hint={`${stats.suggestion} sug · ${stats.praise} praise`}
          />
        </div>
      </div>

      {/* ---------------- Filters bar ---------------- */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_PILLS.map((p) => {
            const active = category === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setCategory(p.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {p.id !== "all" && (
                  <CatIcon category={p.id} className="h-3 w-3" />
                )}
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as FeedbackStatus | "all")}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search message, screen, city…"
              className="h-8 w-[200px] pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* ---------------- Master-detail body ---------------- */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* List (left, ~38%) */}
        <div className="flex min-h-0 flex-col border-b border-border lg:w-[38%] lg:max-w-[460px] lg:border-b-0 lg:border-r">
          {loading ? (
            <ListSkeleton />
          ) : records.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <NoMatchState onClear={() => { setCategory("all"); setStatus("all"); setSearch(""); }} />
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <ul className="divide-y divide-border">
                {filtered.map((r) => (
                  <FeedbackRow
                    key={r.id}
                    record={r}
                    active={r.id === selectedId}
                    onSelect={() => setSelectedId(r.id)}
                  />
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        {/* Detail (right, ~62%) */}
        <div className="flex min-h-0 flex-1 flex-col">
          {loading ? (
            <DetailSkeleton />
          ) : selected ? (
            <DetailPane
              record={selected}
              onChangeStatus={onChangeStatus}
              onOpenScreenshot={() => selected.screenshot && setLightboxSrc(selected.screenshot)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              {records.length === 0
                ? "Reports will open here once a tester files one."
                : "Select a report to see details."}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* ---------------- Screenshot lightbox ---------------- */}
      <Dialog open={!!lightboxSrc} onOpenChange={(o) => !o && setLightboxSrc(null)}>
        <DialogContent className="max-w-4xl border-border bg-card p-2">
          <DialogTitle className="sr-only">Screenshot</DialogTitle>
          {lightboxSrc && (
            <img
              src={lightboxSrc}
              alt="Full feedback screenshot"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small presentational pieces                                        */
/* ------------------------------------------------------------------ */

function CatIcon({
  category,
  className,
}: {
  category: FeedbackCategory;
  className?: string;
}) {
  const Icon = CATEGORY_META[category].icon;
  return <Icon className={className} />;
}

function CategoryBadge({ category }: { category: FeedbackCategory }) {
  const m = CATEGORY_META[category];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none",
        m.chip,
      )}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function SeverityChip({ severity }: { severity: string }) {
  const label = SEVERITY_LABEL[severity] ?? severity;
  const tone =
    severity === "blocker"
      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
      : severity === "major"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none",
        tone,
      )}
    >
      {label}
    </span>
  );
}

function StatTile({
  label,
  value,
  hint,
  dot,
  accent,
  className,
}: {
  label: string;
  value: number;
  hint?: string;
  dot?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-2xl border border-border bg-card px-3 py-2.5",
        className,
      )}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums leading-none",
          accent && "text-primary",
        )}
      >
        {value}
      </span>
      {hint && (
        <span className="font-mono text-[10px] leading-tight text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  );
}

/** Segmented header toggle button (Feedback ↔ Testers). */
function ViewToggleButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/** Real tester identity block for the detail pane (name + captured email). */
function TesterIdentity({ record }: { record: FeedbackRecord }) {
  const name = record.tester_name?.trim();
  const email = record.tester_email?.trim();
  const anon = !name && !email;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          anon ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
        )}
      >
        <Users className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Tester
        </span>
        {anon ? (
          <p className="text-sm font-semibold text-muted-foreground">Anonymous tester</p>
        ) : (
          <>
            <p className="truncate text-sm font-semibold text-foreground">
              {name || "Anonymous"}
            </p>
            {email && (
              <p className="truncate font-mono text-[11px] text-muted-foreground">{email}</p>
            )}
          </>
        )}
      </div>
      <span className="shrink-0 self-center font-mono text-[10px] text-muted-foreground/70">
        #{visitorTag(record.visitor_id)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  List row                                                           */
/* ------------------------------------------------------------------ */

function FeedbackRow({
  record,
  active,
  onSelect,
}: {
  record: FeedbackRecord;
  active: boolean;
  onSelect: () => void;
}) {
  const st = STATUS_META[record.status];
  const metaLine = [
    record.device?.browser ?? "—",
    `${record.geo?.city ?? "—"}, ${record.geo?.country ?? ""}`.trim().replace(/,\s*$/, ""),
    formatRelative(record.created_at),
  ].join(" · ");

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full gap-3 px-3 py-3 text-left transition-colors",
          active ? "bg-primary/[0.07]" : "hover:bg-muted/50",
        )}
      >
        {/* Thumbnail */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          {record.screenshot ? (
            <img
              src={record.screenshot}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <Inbox className="h-4 w-4" />
            </span>
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            <CategoryBadge category={record.category} />
            {record.category === "bug" && record.severity && (
              <SeverityChip severity={record.severity} />
            )}
            <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
              {st.label}
            </span>
          </div>

          {/* Who filed it — real identity, not the shared login */}
          <p
            className={cn(
              "truncate text-xs font-semibold leading-tight",
              record.tester_name ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {record.tester_name?.trim() || "Anonymous"}
          </p>

          <p className="truncate text-[13px] leading-snug text-foreground">
            {record.message?.trim() || (
              <span className="text-muted-foreground">No message</span>
            )}
          </p>

          <p className="truncate font-mono text-[10px] leading-tight text-muted-foreground">
            {metaLine}
            <span className="ml-1 text-muted-foreground/70">#{visitorTag(record.visitor_id)}</span>
          </p>
        </div>
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail pane                                                        */
/* ------------------------------------------------------------------ */

function DetailPane({
  record,
  onChangeStatus,
  onOpenScreenshot,
}: {
  record: FeedbackRecord;
  onChangeStatus: (id: string, status: FeedbackStatus) => void;
  onOpenScreenshot: () => void;
}) {
  const answerEntries = Object.entries(record.answers ?? {}).filter(
    ([, v]) => (Array.isArray(v) ? v.length > 0 : !!v),
  );

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-5 p-4 sm:p-5">
        {/* Top: category + severity + status changer */}
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={record.category} />
          {record.category === "bug" && record.severity && (
            <SeverityChip severity={record.severity} />
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Status</span>
            <Select
              value={record.status}
              onValueChange={(v) => onChangeStatus(record.id, v as FeedbackStatus)}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_META) as FeedbackStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[s].dot)} />
                      {STATUS_META[s].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Who — real tester identity (not the shared Rahul login) */}
        <TesterIdentity record={record} />

        {/* Screenshot */}
        {record.screenshot ? (
          <button
            type="button"
            onClick={onOpenScreenshot}
            className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-muted"
          >
            <img
              src={record.screenshot}
              alt="Feedback screenshot"
              loading="lazy"
              className="max-h-[340px] w-full object-contain"
            />
            <span className="absolute right-2 top-2 rounded-md bg-background/80 px-2 py-1 text-[10px] font-medium text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              Click to enlarge
            </span>
          </button>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border bg-card text-xs text-muted-foreground">
            No screenshot captured
          </div>
        )}

        {/* Reproduction */}
        <Section title="Reproduction">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Opens the exact screen + state the tester saw.
              </p>
              <Button
                size="sm"
                onClick={() => window.open(record.deep_link, "_blank")}
                disabled={!record.deep_link}
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open exact screen
              </Button>
            </div>
            <dl className="grid grid-cols-3 gap-2">
              <Meta label="Screen" value={record.screen_path} />
              <Meta label="Step" value={record.step} />
              <Meta label="Variant" value={record.variant} />
            </dl>
          </div>
        </Section>

        {/* Structured answers */}
        {answerEntries.length > 0 && (
          <Section title="Answers">
            <dl className="space-y-2.5">
              {answerEntries.map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {answerLabel(key)}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {(Array.isArray(value) ? value : [value]).map((v, i) => (
                      <span
                        key={`${key}-${i}`}
                        className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground"
                      >
                        {v}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {/* Free-text message */}
        {record.message?.trim() && (
          <Section title="Message">
            <blockquote className="rounded-2xl border-l-2 border-primary bg-card px-4 py-3 text-sm italic text-foreground">
              {record.message}
            </blockquote>
          </Section>
        )}

        {/* Telemetry */}
        <Section title="Telemetry">
          <TelemetryBlock record={record} />
        </Section>
      </div>
    </ScrollArea>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A small label + Geist Mono value cell. */
function Meta({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate font-mono text-[11px] tabular-nums text-foreground">
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </dd>
    </div>
  );
}

function TelemetryBlock({ record }: { record: FeedbackRecord }) {
  const [uaOpen, setUaOpen] = useState(false);
  const d = record.device;
  const g = record.geo;
  const created = new Date(record.created_at);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        <Meta label="IP" value={record.ip ?? g?.ip} />
        <Meta label="City" value={g?.city} />
        <Meta label="Region" value={g?.region} />
        <Meta label="Country" value={g?.country} />
        <Meta label="ISP" value={g?.isp} />
        <Meta label="Visitor" value={visitorTag(record.visitor_id)} />

        <Meta
          label="Browser"
          value={d ? `${d.browser} ${d.browserVersion}`.trim() : undefined}
        />
        <Meta label="OS" value={d?.os} />
        <Meta label="Device" value={d?.deviceType} />
        <Meta label="Screen" value={d?.screen} />
        <Meta label="Viewport" value={d?.viewport} />
        <Meta label="DPR" value={d?.dpr} />
        <Meta label="Cores" value={d?.cores} />
        <Meta label="Memory" value={d?.memory != null ? `${d.memory} GB` : undefined} />
        <Meta label="Touch" value={d ? (d.touch ? "yes" : "no") : undefined} />

        <Meta label="Timezone" value={record.timezone} />
        <Meta label="Language" value={record.language} />
        <Meta label="Login email (shared)" value={record.email} />
        <Meta label="Session" value={formatDuration(record.session_seconds)} />
        <Meta label="On page" value={formatDuration(record.page_seconds)} />
      </dl>

      {/* created_at — absolute + relative */}
      <div className="border-t border-border pt-2.5">
        <Meta
          label="Created"
          value={`${created.toLocaleString()} · ${formatRelative(record.created_at)}`}
        />
      </div>

      {/* user agent — truncated + expandable */}
      {record.user_agent && (
        <div className="border-t border-border pt-2.5">
          <button
            type="button"
            onClick={() => setUaOpen((o) => !o)}
            className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            User agent {uaOpen ? "−" : "+"}
          </button>
          <p
            className={cn(
              "mt-1 break-all font-mono text-[11px] text-foreground",
              !uaOpen && "truncate",
            )}
          >
            {record.user_agent}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Testers roster view                                                */
/* ------------------------------------------------------------------ */

function TestersView({
  testers,
  loading,
  countByVisitor,
}: {
  testers: TesterRecord[];
  loading: boolean;
  countByVisitor: Map<string, number>;
}) {
  if (loading) return <TesterRosterSkeleton />;
  if (testers.length === 0) return <TestersEmptyState />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-2.5 sm:px-5">
        <p className="text-[11px] text-muted-foreground">
          Har woh tester jisne link kholi —{" "}
          <span className="font-mono tabular-nums text-foreground">{testers.length}</span> total.
          Feedback file karne se pehle bhi yahan dikhte hain.
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {/* Column header — hidden on small screens */}
        <div className="hidden border-b border-border px-4 py-2 sm:px-5 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:gap-4">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Tester
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Source
          </span>
          <span className="text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Feedback
          </span>
          <span className="text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Seen
          </span>
        </div>
        <ul className="divide-y divide-border">
          {testers.map((t) => (
            <TesterRow
              key={t.visitor_id}
              tester={t}
              feedbackCount={countByVisitor.get(t.visitor_id) ?? 0}
            />
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

function TesterRow({
  tester,
  feedbackCount,
}: {
  tester: TesterRecord;
  feedbackCount: number;
}) {
  const name = tester.name?.trim();
  const email = tester.email?.trim();
  const src = tester.source ? SOURCE_META[tester.source] : undefined;
  const SrcIcon = src?.icon;

  return (
    <li className="grid grid-cols-1 gap-2 px-4 py-3 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center md:gap-4">
      {/* Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            name ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Users className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-[13px] font-semibold leading-tight",
              name ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {name || "Anonymous"}
          </p>
          <p className="truncate font-mono text-[11px] leading-tight text-muted-foreground">
            {email || "—"}
            <span className="ml-1.5 text-muted-foreground/70">#{visitorTag(tester.visitor_id)}</span>
          </p>
        </div>
      </div>

      {/* Source chip */}
      <div className="flex items-center md:justify-start">
        {src ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {SrcIcon && <SrcIcon className="h-3 w-3" />}
            {src.label}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-muted-foreground/70">—</span>
        )}
      </div>

      {/* Feedback count */}
      <div className="flex items-center gap-1.5 md:justify-end">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground md:hidden">
          Feedback
        </span>
        <span
          className={cn(
            "font-mono text-xs tabular-nums",
            feedbackCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground/70",
          )}
        >
          {feedbackCount}
        </span>
      </div>

      {/* Seen — first + last as relative time */}
      <div className="flex items-center gap-1.5 md:flex-col md:items-end md:gap-0.5">
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {formatRelative(tester.last_seen)}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
          first {formatRelative(tester.first_seen)}
        </span>
      </div>
    </li>
  );
}

function TesterRosterSkeleton() {
  return (
    <div className="flex-1 divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2 py-0.5">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function TestersEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Users className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Abhi kisi ne link nahi kholi</h3>
        <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground">
          Jaise hi koi tester apna naam aur email daalega (link se ya popup se), woh yahan
          roster mein aa jayega — chahe usne abhi koi feedback file na kiya ho.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  States: empty / no-match / skeletons                               */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Abhi koi feedback nahi aaya</h3>
        <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground">
          Jab internal testers Launch 2.0 mein koi bug, problem ya suggestion file
          karenge, woh saare reports yahan dikhne lagenge.
        </p>
        <p className="mx-auto max-w-xs pt-1 text-[11px] leading-relaxed text-muted-foreground/70">
          Agar table abhi bana nahi hai to yahan kuch nahi dikhega.
        </p>
      </div>
    </div>
  );
}

function NoMatchState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Search className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Is filter pe kuch nahi mila</h3>
        <p className="text-xs text-muted-foreground">Filters ya search ko thoda dheela karo.</p>
      </div>
      <Button variant="outline" size="sm" onClick={onClear} className="gap-1.5">
        <X className="h-3.5 w-3.5" />
        Clear filters
      </Button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex-1 divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-3 py-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2 py-0.5">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex-1 space-y-5 p-5">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
        <div className="ml-auto h-8 w-36 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-56 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

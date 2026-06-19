/**
 * ReviewPanes — building blocks for Step 4's Meta master-detail review:
 *   IssuesList  — 3-tier error→fix list (center collapsible region)
 *
 * The Issues fixes call into the supplied `onApplyFix` / `onAutoFix`.
 */
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Wand2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type IssueFixKind,
  type ReviewIssue,
} from "./reviewModel";
import {
  ERR,
  ERR_TEXT,
  OK_TEXT,
  WARN,
  WARN_TEXT,
} from "./reviewParts";

/* ------------------------------------------------------------------ */
/*  ISSUES list — 3-tier error→fix (rendered inside overview region)   */
/* ------------------------------------------------------------------ */
export function IssuesList({
  issues,
  onApplyFix,
  onAutoFix,
}: {
  issues: ReviewIssue[];
  onApplyFix: (issue: ReviewIssue) => void;
  onAutoFix: () => void;
}) {
  const errors = issues.filter((i) => i.tier === "error");
  const warnings = issues.filter((i) => i.tier === "warning");
  const infos = issues.filter((i) => i.tier === "info");
  const fixable = issues.filter((i) => i.fix && i.fix.kind === "switch_distribution");

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed bg-card px-3 py-3 text-left">
        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: OK_TEXT }} />
        <div>
          <p className="text-[13px] font-medium">No issues — clear to launch</p>
          <p className="text-[11px] text-muted-foreground">
            Cap checks pass and no soft warnings fired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fixable.length > 0 && (
        <Button variant="outline" size="sm" className="w-full" onClick={onAutoFix}>
          <Wand2 className="h-4 w-4" />
          Auto-fix {fixable.length} cap {fixable.length === 1 ? "issue" : "issues"}
        </Button>
      )}
      {errors.length > 0 && <IssueGroup title="Must fix" issues={errors} onApplyFix={onApplyFix} />}
      {warnings.length > 0 && <IssueGroup title="Should fix" issues={warnings} onApplyFix={onApplyFix} />}
      {infos.length > 0 && <IssueGroup title="Could improve" issues={infos} onApplyFix={onApplyFix} />}
    </div>
  );
}

const TIER_META = {
  error: { Icon: XCircle, color: ERR, text: ERR_TEXT, bg: "rgba(255,77,79,0.06)", ring: "rgba(255,77,79,0.3)" },
  warning: { Icon: AlertTriangle, color: WARN, text: WARN_TEXT, bg: "rgba(250,173,20,0.07)", ring: "rgba(250,173,20,0.3)" },
  info: { Icon: Info, color: "rgba(15,15,12,0.55)", text: "rgba(15,15,12,0.7)", bg: "rgba(15,15,12,0.03)", ring: "rgba(15,15,12,0.12)" },
} as const;

function IssueGroup({
  title,
  issues,
  onApplyFix,
}: {
  title: string;
  issues: ReviewIssue[];
  onApplyFix: (issue: ReviewIssue) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      {issues.map((issue) => {
        const m = TIER_META[issue.tier];
        return (
          <div
            key={issue.id}
            className="rounded-xl border p-3"
            style={{ backgroundColor: m.bg, borderColor: m.ring }}
          >
            <div className="flex items-start gap-2.5">
              <m.Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: m.color }} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium" style={{ color: m.text }}>{issue.title}</div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{issue.detail}</p>
                {issue.fix && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7"
                    onClick={() => onApplyFix(issue)}
                    disabled={!isAutoApplicable(issue.fix.kind)}
                  >
                    {issue.fix.label}
                    {!isAutoApplicable(issue.fix.kind) && <span className="ml-1 text-[10px] text-muted-foreground">(in earlier step)</span>}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Only distribution switches can be applied in-place here; the others point back. */
function isAutoApplicable(kind: IssueFixKind): boolean {
  return kind === "switch_distribution";
}

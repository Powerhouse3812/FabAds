/**
 * Launch v2 — Feedback sheet.
 *
 * A guided, conversational micro-flow (NOT a form wall) for filing a
 * Bug / Problem / Suggestion / Praise. Opened by FloatingFeedbackButton with
 * a screenshot already captured (so widget chrome isn't in the shot).
 *
 * Three light steps with a slim progress indicator:
 *   1. Category pick (2×2 illustrated cards)
 *   2. Quick MCQs (branch by category) + screenshot preview
 *   3. Free-text + submit → loading → success / error
 *
 * Strict FabFunnel design system: lime `primary` token, rounded-2xl cards,
 * semantic tokens only, lucide icons (no emojis), dark-mode first.
 */
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bug,
  Check,
  Heart,
  ImagePlus,
  Lightbulb,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fileToDataUrl } from "./screenshot";
import { submitFeedback } from "./service";
import type {
  FeedbackCategory,
  FeedbackDraft,
  FeedbackSeverity,
} from "./types";

/* ───────────────────────── config ───────────────────────── */

type Step = 1 | 2 | 3;

interface CategoryCard {
  id: FeedbackCategory;
  icon: typeof Bug;
  /** tinted-circle classes */
  iconWrap: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

const CATEGORY_CARDS: CategoryCard[] = [
  {
    id: "bug",
    icon: Bug,
    iconWrap: "bg-destructive/10",
    iconColor: "text-destructive",
    title: "Something isn't working",
    subtitle: "Crash, error, or unexpected behavior",
  },
  {
    id: "problem",
    icon: AlertCircle,
    iconWrap: "bg-amber-500/10",
    iconColor: "text-amber-500",
    title: "Confusing or frustrating",
    subtitle: "Something was hard to use",
  },
  {
    id: "suggestion",
    icon: Lightbulb,
    iconWrap: "bg-primary/10",
    iconColor: "text-primary",
    title: "I have an idea",
    subtitle: "Something could be better",
  },
  {
    id: "praise",
    icon: Heart,
    iconWrap: "bg-primary/10",
    iconColor: "text-primary",
    title: "This is great",
    subtitle: "Loved something",
  },
];

/** Heading + the chosen card meta, for steps 2 & 3. */
const CATEGORY_META: Record<
  FeedbackCategory,
  { label: string; placeholder: string }
> = {
  bug: {
    label: "Bug",
    placeholder: "Describe the steps — what you did, what you expected, and what actually happened.",
  },
  problem: {
    label: "Problem",
    placeholder: "Where did you get stuck? What felt confusing or frustrating?",
  },
  suggestion: {
    label: "Idea",
    placeholder: "Describe your idea — what would you add or improve, and why?",
  },
  praise: {
    label: "Praise",
    placeholder: "What did you like? A bit more detail helps the team a lot.",
  },
};

interface McqGroup {
  id: string;
  prompt: string;
  type: "multi" | "single";
  options: string[];
}

/** Branch-by-category MCQ definitions. Severity (bug) handled separately. */
const MCQS: Record<FeedbackCategory, McqGroup[]> = {
  bug: [
    {
      id: "what_happened",
      prompt: "What happened?",
      type: "multi",
      options: [
        "Page blank / crash",
        "Button didn't work",
        "Wrong or stale data",
        "Slow / got stuck",
        "Layout broke",
        "Something else",
      ],
    },
  ],
  problem: [
    {
      id: "where",
      prompt: "Where did the issue occur?",
      type: "multi",
      options: [
        "Wasn't clear what to do",
        "Too many steps",
        "Hard to find",
        "Couldn't undo a mistake",
        "Something else",
      ],
    },
  ],
  suggestion: [
    {
      id: "area",
      prompt: "Which area?",
      type: "single",
      options: ["Setup", "Creative", "Distribution", "Review", "Overall"],
    },
  ],
  praise: [
    {
      id: "liked",
      prompt: "What did you like?",
      type: "multi",
      options: [
        "It's fast",
        "Easy & clear",
        "Looks good",
        "Saved time",
        "Something else",
      ],
    },
  ],
};

const SEVERITY_OPTIONS: { value: Exclude<FeedbackSeverity, null>; label: string; hint: string }[] = [
  { value: "blocker", label: "Blocker", hint: "Couldn't proceed" },
  { value: "major", label: "Major", hint: "Significant friction" },
  { value: "minor", label: "Minor", hint: "Small issue" },
];

const emptyDraft = (): FeedbackDraft => ({
  category: "bug",
  severity: null,
  answers: {},
  message: "",
  screenshot: null,
});

/* ───────────────────────── chip ───────────────────────── */

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── progress ───────────────────────── */

function StepProgress({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            n <= step ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

/* ───────────────────────── props ───────────────────────── */

export interface FeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Auto-captured screenshot data URL, or null if capture failed. */
  initialScreenshot: string | null;
  /** True when captureScreen() returned null (so we show the manual-fallback note). */
  captureFailed: boolean;
}

/* ───────────────────────── component ───────────────────────── */

export default function FeedbackSheet({
  open,
  onOpenChange,
  initialScreenshot,
  captureFailed,
}: FeedbackSheetProps) {
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<FeedbackDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  // Seed / reset draft whenever the sheet opens.
  useEffect(() => {
    if (open) {
      setStep(1);
      setDraft({ ...emptyDraft(), screenshot: initialScreenshot });
      setSubmitting(false);
      setSubmitError(false);
      setSubmitErrorMsg(null);
      setDone(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-close after success.
  useEffect(() => {
    if (done) {
      closeTimer.current = setTimeout(() => onOpenChange(false), 1800);
      return () => clearTimeout(closeTimer.current);
    }
  }, [done, onOpenChange]);

  /* ---- mutations ---- */

  const pickCategory = (category: FeedbackCategory) => {
    setDraft((d) => ({ ...d, category, answers: {}, severity: null }));
    setStep(2);
  };

  const toggleMulti = (qid: string, option: string) => {
    setDraft((d) => {
      const current = (d.answers[qid] as string[] | undefined) ?? [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...d, answers: { ...d.answers, [qid]: next } };
    });
  };

  const setSingle = (qid: string, option: string) => {
    setDraft((d) => {
      const current = d.answers[qid];
      const next = current === option ? undefined : option;
      const answers = { ...d.answers };
      if (next === undefined) delete answers[qid];
      else answers[qid] = next;
      return { ...d, answers };
    });
  };

  const setSeverity = (value: Exclude<FeedbackSeverity, null>) => {
    setDraft((d) => ({ ...d, severity: d.severity === value ? null : value }));
  };

  const removeScreenshot = () => setDraft((d) => ({ ...d, screenshot: null }));

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      setDraft((d) => ({ ...d, screenshot: url }));
    } catch {
      /* ignore — user can retry */
    } finally {
      // allow re-selecting the same file
      e.target.value = "";
    }
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setSubmitError(false);
    setSubmitErrorMsg(null);
    const res = await submitFeedback(draft);
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      setSubmitError(true);
      setSubmitErrorMsg(res.error ?? "Couldn't send. Check your connection and retry.");
    }
  };

  const meta = CATEGORY_META[draft.category];

  /* ───────────────────────── render ───────────────────────── */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        data-feedback-widget="true"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]"
      >
        {/* ── Header + progress ── */}
        <SheetHeader className="space-y-3 border-b border-border px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2">
            {step > 1 && !done && (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
                className="fab-focus -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <SheetTitle className="text-base font-semibold">
              {done
                ? "Submitted"
                : step === 1
                  ? "What would you like to share?"
                  : meta.label}
            </SheetTitle>
            {!done && (
              <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
                {step}/3
              </span>
            )}
          </div>
          {!done && <StepProgress step={step} />}
          <SheetDescription className="sr-only">
            Share your feedback or report a bug.
          </SheetDescription>
        </SheetHeader>

        {/* ── Body (scrolls) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {done ? (
            <SuccessState />
          ) : step === 1 ? (
            <CategoryStep onPick={pickCategory} />
          ) : step === 2 ? (
            <McqStep
              draft={draft}
              onToggleMulti={toggleMulti}
              onSetSingle={setSingle}
              onSetSeverity={setSeverity}
            />
          ) : (
            <DescriptionStep
              placeholder={meta.placeholder}
              value={draft.message}
              onChange={(message) => setDraft((d) => ({ ...d, message }))}
              screenshot={draft.screenshot}
              captureFailed={captureFailed}
              fileInputRef={fileInputRef}
              onFile={onFile}
              onRemoveScreenshot={removeScreenshot}
              error={submitError}
              errorMsg={submitErrorMsg}
            />
          )}
        </div>

        {/* ── Footer (action) ── */}
        {!done && step > 1 && (
          <div className="border-t border-border px-6 py-4">
            {step === 2 ? (
              <Button className="w-full" onClick={() => setStep(3)}>
                Next
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={onSubmit}
                disabled={submitting || draft.message.trim().length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ───────────────────────── step 1 ───────────────────────── */

function CategoryStep({ onPick }: { onPick: (c: FeedbackCategory) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick a category — we'll guide you from there.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onPick(card.id)}
              className="group flex flex-col items-start gap-2.5 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  card.iconWrap,
                )}
              >
                <Icon className={cn("h-5 w-5", card.iconColor)} />
              </span>
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">
                  {card.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {card.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── step 2 ───────────────────────── */

function McqStep({
  draft,
  onToggleMulti,
  onSetSingle,
  onSetSeverity,
}: {
  draft: FeedbackDraft;
  onToggleMulti: (qid: string, option: string) => void;
  onSetSingle: (qid: string, option: string) => void;
  onSetSeverity: (value: Exclude<FeedbackSeverity, null>) => void;
}) {
  const groups = MCQS[draft.category];

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const selected = draft.answers[g.id];
        return (
          <div key={g.id} className="space-y-2.5">
            <h3 className="text-sm font-medium text-foreground">{g.prompt}</h3>
            <div className="flex flex-wrap gap-2">
              {g.options.map((opt) => {
                const active =
                  g.type === "multi"
                    ? Array.isArray(selected) && selected.includes(opt)
                    : selected === opt;
                return (
                  <Chip
                    key={opt}
                    active={active}
                    onClick={() =>
                      g.type === "multi"
                        ? onToggleMulti(g.id, opt)
                        : onSetSingle(g.id, opt)
                    }
                  >
                    {opt}
                  </Chip>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Severity — bug only */}
      {draft.category === "bug" && (
        <div className="space-y-2.5">
          <h3 className="text-sm font-medium text-foreground">How severe?</h3>
          <div className="flex flex-wrap gap-2">
            {SEVERITY_OPTIONS.map((s) => (
              <Chip
                key={s.value}
                active={draft.severity === s.value}
                onClick={() => onSetSeverity(s.value)}
              >
                {s.label}
                <span className="ml-1.5 font-mono text-[10px] opacity-60">
                  {s.hint}
                </span>
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── step 3 ───────────────────────── */

function DescriptionStep({
  placeholder,
  value,
  onChange,
  screenshot,
  captureFailed,
  fileInputRef,
  onFile,
  onRemoveScreenshot,
  error,
  errorMsg,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  screenshot: string | null;
  captureFailed: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveScreenshot: () => void;
  error: boolean;
  errorMsg?: string | null;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add a description — more detail helps us act faster.
      </p>

      {/* Description field label */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Description</label>
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[140px] resize-none rounded-2xl bg-card"
        />
      </div>

      {/* Image attachment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Attach image</label>
          {captureFailed && (
            <span className="font-mono text-[10px] text-muted-foreground">
              Auto-capture failed — attach manually
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />

        {screenshot ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
              <img
                src={screenshot}
                alt="Attached screenshot"
                className="max-h-44 w-full object-cover object-top"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onRemoveScreenshot}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Replace
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ImagePlus className="h-4 w-4 text-primary" />
            </span>
            <span className="text-xs text-muted-foreground">
              Click to upload a screenshot or image
            </span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">optional</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-medium text-destructive">Failed to submit — please try again.</p>
            {errorMsg && (
              <p className="break-words font-mono text-[10px] text-destructive/70">
                {errorMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── success ───────────────────────── */

function SuccessState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <Check className="h-8 w-8 text-primary" strokeWidth={2.5} />
        </span>
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          Feedback received
        </h3>
        <p className="text-sm text-muted-foreground">
          The team will see this in the dashboard.
        </p>
      </div>
    </div>
  );
}

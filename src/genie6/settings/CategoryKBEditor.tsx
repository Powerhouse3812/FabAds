import { Link, Navigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  HardDrive,
  Cloud,
  Globe,
  X,
} from "lucide-react";
import { categories, getCategory } from "../mocks/categories";

/**
 * Category KB Editor — full build (Track 4.7).
 *
 * Sections (locked per spec):
 *   1. User instruction      ← textarea
 *   2. Reference URLs        ← list + add + AI research and add
 *   3. Similar categories    ← chips, linked
 *   4. Feedback log          ← winners + losers entries (NEW)
 *   5. Winner creatives      ← Local / Drive / Meta Library import (NEW)
 */
export function CategoryKBEditor() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const cat = categoryId ? getCategory(categoryId) : null;

  if (!cat) return <Navigate to="/iq/genie6/settings/categories" replace />;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        to="/iq/genie6/settings/categories"
        className="mb-4 inline-flex items-center gap-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary hover:text-g6-text"
      >
        <ChevronLeft className="h-3 w-3" /> Categories
      </Link>

      <header className="mb-6">
        <h1 className="font-g6-sans text-g6-h2 font-bold text-g6-text">{cat.name}</h1>
        <p className="mt-1 font-g6-mono text-g6-xs text-g6-text-tertiary">
          {cat.winnerCount} winners · {cat.feedbackCount} feedback entries
        </p>
      </header>

      <Section title="User instruction" hint="Rules AI follows when generating in this category. Compliance, voice, banned terms.">
        <textarea
          defaultValue={cat.instruction}
          rows={4}
          className="block w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3 font-g6-sans text-g6-base text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
          placeholder="What rules should AI follow when generating in this category?"
        />
      </Section>

      <Section
        title={`Reference URLs (${cat.referenceUrls.length})`}
        hint="Articles, guides, research AI consumes for category context."
      >
        <ul className="space-y-2">
          {cat.referenceUrls.map((url) => (
            <li
              key={url}
              className="group flex items-center gap-2 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base px-3 py-2"
            >
              <span className="flex-1 truncate font-g6-mono text-g6-sm text-g6-text">{url}</span>
              <button
                type="button"
                aria-label="Remove URL"
                className="opacity-0 transition-opacity group-hover:opacity-100 text-g6-text-tertiary hover:text-g6-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-g6-base border border-dashed border-g6-border bg-transparent px-3 font-g6-mono text-g6-xs text-g6-text-secondary hover:border-g6-primary-border hover:bg-g6-primary-bg"
          >
            <Plus className="h-3 w-3" /> Add reference URL
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-g6-base bg-g6-primary-bg px-3 font-g6-mono text-g6-xs font-semibold text-g6-primary-active hover:bg-g6-primary-bg-hover"
          >
            <Sparkles className="h-3 w-3" /> AI research and add
          </button>
        </div>
      </Section>

      <Section title="Similar categories" hint="Genie pulls patterns from similar categories when this one has thin data.">
        <div className="flex flex-wrap gap-1.5">
          {cat.similarCategoryIds.map((id) => {
            const known = getCategory(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-2.5 py-1 font-g6-sans text-g6-sm text-g6-text"
              >
                {known?.name ?? id}
              </span>
            );
          })}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-g6-pill border border-dashed border-g6-border bg-transparent px-2.5 py-1 font-g6-mono text-g6-xs text-g6-text-secondary hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </Section>

      <Section
        title={`Feedback log (${cat.feedbackCount})`}
        hint="Per-output thumbs from your team. AI learns category patterns from these."
      >
        <ul className="space-y-1.5">
          <FeedbackRow
            kind="up"
            outputName="Aspirational hair journey"
            note="Onion shampoo angle landed — premium tone matches brand."
            timeAgo="2h ago"
          />
          <FeedbackRow
            kind="down"
            outputName="Stop the hair fall."
            note="Too aggressive — feels like a medical claim."
            timeAgo="1d ago"
          />
          <FeedbackRow
            kind="up"
            outputName="Real ingredients, real results."
            note="Direct + honest tone. Use this template more often."
            timeAgo="3d ago"
          />
          <FeedbackRow
            kind="down"
            outputName="Hair gummy miracle"
            note="'Miracle' word banned per category rule."
            timeAgo="5d ago"
          />
        </ul>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1 font-g6-mono text-g6-xs text-g6-text-secondary underline-offset-2 hover:text-g6-text hover:underline"
        >
          View all {cat.feedbackCount} feedback entries →
        </button>
      </Section>

      <Section
        title={`Winner creatives (${cat.winnerCount})`}
        hint="Top-performing creatives Genie references. Import from your assets."
      >
        <div className="grid grid-cols-3 gap-2">
          <ImportCard
            Icon={HardDrive}
            label="Local upload"
            sub="JPG, PNG, MP4 · up to 50MB"
          />
          <ImportCard
            Icon={Cloud}
            label="Google Drive"
            sub="Connect a folder"
          />
          <ImportCard
            Icon={Globe}
            label="Meta Ad Library"
            sub="By page or ad ID"
          />
        </div>
        {cat.winnerCount > 0 && (
          <p className="mt-3 font-g6-mono text-g6-xs text-g6-text-tertiary">
            {cat.winnerCount} winners imported · last sync 2h ago
          </p>
        )}
      </Section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────── */

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
        {title}
      </h2>
      {hint && (
        <p className="mb-2 text-g6-xs text-g6-text-tertiary">{hint}</p>
      )}
      <div className="rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4">
        {children}
      </div>
    </section>
  );
}

function FeedbackRow({
  kind,
  outputName,
  note,
  timeAgo,
}: {
  kind: "up" | "down";
  outputName: string;
  note: string;
  timeAgo: string;
}) {
  const Icon = kind === "up" ? ThumbsUp : ThumbsDown;
  const tone =
    kind === "up"
      ? "text-g6-success border-g6-success/30 bg-g6-success/10"
      : "text-g6-error border-g6-error/30 bg-g6-error/10";
  return (
    <li className="flex items-start gap-2 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base px-3 py-2">
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${tone}`}
      >
        <Icon className="h-3 w-3" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-g6-sm font-medium text-g6-text">{outputName}</p>
        <p className="text-g6-xs text-g6-text-secondary">{note}</p>
      </div>
      <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{timeAgo}</span>
    </li>
  );
}

function ImportCard({
  Icon,
  label,
  sub,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      className="g6-lift flex flex-col items-start gap-1.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base p-3 text-left transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg"
    >
      <Icon className="h-4 w-4 text-g6-text-secondary" />
      <span className="text-g6-sm font-semibold text-g6-text">{label}</span>
      <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{sub}</span>
    </button>
  );
}

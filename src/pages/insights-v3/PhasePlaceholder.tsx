/**
 * Phase-1 placeholder for Industry Insights V2 pages. Each page file that
 * renders this is handed to its Phase-2 owner (see docs/industry-insights/
 * BUILD-LOG.md › Agents + file ownership), who replaces the body. Delete this
 * file once no page imports it.
 */
export function PhasePlaceholder({ title, owner }: { title: string; owner: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/30">
      <div className="border-b border-border bg-background px-5 py-4">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Industry Insights V2 · being built by agent {owner}</p>
      </div>
    </div>
  );
}

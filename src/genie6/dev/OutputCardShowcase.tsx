import { useState } from "react";
import { OutputCard } from "../components/OutputCard";
import { sampleOutputs } from "../mocks/sample-outputs";
import type { EllipsisAction } from "../types/output";

/**
 * Phase A2 acceptance gate.
 * 8 fixtures rendered for visual review:
 *   1. Image ad (populated)
 *   2. Video ad (populated)
 *   3. Text-only output
 *   4. Selected state
 *   5. Compact variant
 *   6. Kanban variant (winner column)
 *   7. Image ad with quality score on the warning tier
 *   8. Zero-data fallback (no thumbnail, no headline)
 *
 * Each fixture renders with both light and dark mode visible by toggling theme
 * via the GenieShell topbar.
 */

export function OutputCardShowcase() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([sampleOutputs[3].id]));
  const [lastAction, setLastAction] = useState<string>("none");

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onAction = (id: string) => (a: EllipsisAction) => setLastAction(`${id}:${a}`);
  const onSave = (id: string) => () => setLastAction(`${id}:save`);
  const onLaunch = (id: string) => () => setLastAction(`${id}:launch`);
  const onDownload = (id: string) => () => setLastAction(`${id}:download`);
  const onClick = (id: string) => () => setLastAction(`${id}:click(open preview)`);

  return (
    <div className="px-6 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          phase a2 · output card · 8 fixtures
        </p>
        <h1 className="font-g6-sans text-g6-h2 font-bold text-g6-text">OutputCard showcase</h1>
        <p className="text-g6-base text-g6-text-secondary">
          Toggle theme via the topbar to verify both light and dark. Last interaction:{" "}
          <span className="font-g6-mono text-g6-text">{lastAction}</span>
        </p>
      </header>

      <Section label="1 · Populated · image (Mamaearth, score 87)">
        {(() => {
          const o = sampleOutputs[0];
          return (
            <OutputCard
              {...o}
              selected={selectedIds.has(o.id)}
              onSave={onSave(o.id)}
              onLaunch={onLaunch(o.id)}
              onDownload={onDownload(o.id)}
              onEllipsisAction={onAction(o.id)}
              onSelect={() => toggle(o.id)}
              onClick={onClick(o.id)}
            />
          );
        })()}
      </Section>

      <Section label="2 · Populated · video (Noise, score 73 · warning tier)">
        {(() => {
          const o = sampleOutputs[1];
          return (
            <OutputCard
              {...o}
              selected={selectedIds.has(o.id)}
              onSave={onSave(o.id)}
              onLaunch={onLaunch(o.id)}
              onDownload={onDownload(o.id)}
              onEllipsisAction={onAction(o.id)}
              onSelect={() => toggle(o.id)}
              onClick={onClick(o.id)}
            />
          );
        })()}
      </Section>

      <Section label="3 · Text-only output (Boat, no thumbnail · TextOnlyMotif rendered)">
        {(() => {
          const o = sampleOutputs[2];
          return (
            <OutputCard
              {...o}
              selected={selectedIds.has(o.id)}
              onSave={onSave(o.id)}
              onLaunch={onLaunch(o.id)}
              onDownload={onDownload(o.id)}
              onEllipsisAction={onAction(o.id)}
              onSelect={() => toggle(o.id)}
              onClick={onClick(o.id)}
            />
          );
        })()}
      </Section>

      <Section label="4 · Selected state · lime ring (Sleepyhead, score 91)">
        {(() => {
          const o = sampleOutputs[3];
          return (
            <OutputCard
              {...o}
              selected
              onSave={onSave(o.id)}
              onLaunch={onLaunch(o.id)}
              onDownload={onDownload(o.id)}
              onEllipsisAction={onAction(o.id)}
              onSelect={() => toggle(o.id)}
              onClick={onClick(o.id)}
            />
          );
        })()}
      </Section>

      <Section label="5 · Compact variant · for PreviewPane embed and Recent strip">
        {(() => {
          const o = sampleOutputs[4];
          return (
            <OutputCard
              {...o}
              variant="compact"
              selectable={false}
              onClick={onClick(o.id)}
            />
          );
        })()}
      </Section>

      <Section label="6 · Kanban variant · winner column tagged (Mensa)">
        {(() => {
          const o = sampleOutputs[5];
          return (
            <OutputCard
              {...o}
              variant="kanban"
              kanbanColumn="winner"
              selected={selectedIds.has(o.id)}
              onSave={onSave(o.id)}
              onLaunch={onLaunch(o.id)}
              onDownload={onDownload(o.id)}
              onEllipsisAction={onAction(o.id)}
              onSelect={() => toggle(o.id)}
              onClick={onClick(o.id)}
            />
          );
        })()}
      </Section>

      <Section label="7 · Video · Image-to-Video output (Mamaearth, score 82)">
        {(() => {
          const o = sampleOutputs[6];
          return (
            <OutputCard
              {...o}
              selected={selectedIds.has(o.id)}
              onSave={onSave(o.id)}
              onLaunch={onLaunch(o.id)}
              onDownload={onDownload(o.id)}
              onEllipsisAction={onAction(o.id)}
              onSelect={() => toggle(o.id)}
              onClick={onClick(o.id)}
            />
          );
        })()}
      </Section>

      <Section label="8 · Zero-data fallback · no thumbnail, no headline">
        {(() => {
          const o = sampleOutputs[7];
          return (
            <OutputCard
              {...o}
              onSave={onSave(o.id)}
              onLaunch={onLaunch(o.id)}
              onDownload={onDownload(o.id)}
              onEllipsisAction={onAction(o.id)}
              onSelect={() => toggle(o.id)}
              onClick={onClick(o.id)}
            />
          );
        })()}
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 max-w-md">
      <p className="mb-2 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
        {label}
      </p>
      {children}
    </section>
  );
}

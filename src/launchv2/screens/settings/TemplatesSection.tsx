/**
 * TemplatesSection — Launch v2 Settings surface for saved templates.
 *
 * Lists Setup + Distribution templates (read from `templatesService`), supports
 * inline rename and two-step delete. Does NOT create templates — creation lives
 * in the Launch flow (Step 2 / Step 4 SaveTemplateDialog).
 *
 * Local state is the source of truth for the rendered list; after rename/delete
 * we re-read from the service so storage stays the source of record.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { templatesService } from "../../templates/service";
import type {
  DistributionTemplate,
  SetupTemplate,
  TemplateKind,
} from "../../templates/types";
import { summarizeDistribution, summarizeSetup } from "../../templates/summary";

type RenameTarget = { kind: TemplateKind; id: string; name: string } | null;

export default function TemplatesSection() {
  const [setups, setSetups] = useState<SetupTemplate[]>([]);
  const [dists, setDists] = useState<DistributionTemplate[]>([]);
  const [renameTarget, setRenameTarget] = useState<RenameTarget>(null);
  /** id of the row currently in "click again to confirm" delete state, scoped by kind. */
  const [confirmDelete, setConfirmDelete] = useState<{ kind: TemplateKind; id: string } | null>(
    null,
  );

  const refresh = useCallback(() => {
    setSetups(templatesService.listSetup());
    setDists(templatesService.listDistribution());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reset the "click to confirm" prompt after a short delay if not acted on.
  useEffect(() => {
    if (!confirmDelete) return;
    const t = window.setTimeout(() => setConfirmDelete(null), 3500);
    return () => window.clearTimeout(t);
  }, [confirmDelete]);

  const bothEmpty = setups.length === 0 && dists.length === 0;

  const handleRenameSubmit = (newName: string) => {
    if (!renameTarget) return;
    templatesService.rename(renameTarget.kind, renameTarget.id, newName);
    setRenameTarget(null);
    refresh();
  };

  const handleDeleteClick = (kind: TemplateKind, id: string) => {
    if (confirmDelete && confirmDelete.kind === kind && confirmDelete.id === id) {
      templatesService.remove(kind, id);
      setConfirmDelete(null);
      refresh();
    } else {
      setConfirmDelete({ kind, id });
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold leading-tight">Templates</h2>
        <p className="text-sm text-muted-foreground">
          Saved Setup and Distribution templates. Create new ones from the Launch flow.
        </p>
      </header>

      {bothEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          <TemplateList
            heading="Setup templates"
            kindLabel="Setup template"
            items={setups.map((t) => ({
              id: t.id,
              name: t.name,
              summary: summarizeSetup(t.payload),
              updatedAt: t.updatedAt,
            }))}
            onRename={(id, name) => setRenameTarget({ kind: "setup", id, name })}
            onDelete={(id) => handleDeleteClick("setup", id)}
            confirmingId={
              confirmDelete?.kind === "setup" ? confirmDelete.id : null
            }
            emptyHint="No Setup templates yet. Save one from Step 2 in the Launch flow."
          />

          <TemplateList
            heading="Distribution templates"
            kindLabel="Distribution template"
            items={dists.map((t) => ({
              id: t.id,
              name: t.name,
              summary: summarizeDistribution(t.payload),
              updatedAt: t.updatedAt,
            }))}
            onRename={(id, name) => setRenameTarget({ kind: "distribution", id, name })}
            onDelete={(id) => handleDeleteClick("distribution", id)}
            confirmingId={
              confirmDelete?.kind === "distribution" ? confirmDelete.id : null
            }
            emptyHint="No Distribution templates yet. Save one from Step 4 in the Launch flow."
          />
        </div>
      )}

      <RenameDialog
        target={renameTarget}
        onClose={() => setRenameTarget(null)}
        onSubmit={handleRenameSubmit}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* List                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

type Row = {
  id: string;
  name: string;
  summary: string;
  updatedAt: number;
};

function TemplateList({
  heading,
  kindLabel,
  items,
  onRename,
  onDelete,
  confirmingId,
  emptyHint,
}: {
  heading: string;
  kindLabel: string;
  items: Row[];
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  confirmingId: string | null;
  emptyHint: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">{heading}</h3>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyHint}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-card/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-base font-medium">{it.name}</p>
                  {it.summary && (
                    <p className="text-xs text-muted-foreground font-mono">{it.summary}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 whitespace-nowrap text-xs text-muted-foreground">
                  <span>{kindLabel}</span>
                  <span>Updated {relativeTime(it.updatedAt)}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRename(it.id, it.name)}
                >
                  Rename
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(it.id)}
                  className="text-destructive hover:text-destructive"
                >
                  {confirmingId === it.id ? "Click again to delete" : "Delete"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Empty state (both lists empty)                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
        <Zap className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium">No templates saved yet</h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Templates are created from the Launch flow — go to Step 2 Setup or Step 4 Distribution
          and "Save current as new."
        </p>
      </div>
      <Button variant="ghost" onClick={() => navigate("/launchv2")}>
        Open Launch flow
      </Button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Rename dialog                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function RenameDialog({
  target,
  onClose,
  onSubmit,
}: {
  target: RenameTarget;
  onClose: () => void;
  onSubmit: (newName: string) => void;
}) {
  const open = target !== null;
  const [name, setName] = useState("");

  useEffect(() => {
    if (target) setName(target.name);
  }, [target]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed !== target?.name;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename template</DialogTitle>
          <DialogDescription>Update the template's display name.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="rename-template-name" className="text-xs text-muted-foreground">
            Template name
          </Label>
          <Input
            id="rename-template-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (canSave) onSubmit(trimmed);
              }
            }}
            className="h-9"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => canSave && onSubmit(trimmed)} disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Utils                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function relativeTime(ts: number): string {
  // Re-use date-fns formatDistanceToNow; suppress "about" prefix for compactness.
  const raw = formatDistanceToNow(new Date(ts), { addSuffix: true });
  return raw.replace(/^about /, "");
}


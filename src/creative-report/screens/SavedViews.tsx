/**
 * SavedViews — named snapshots of the filter/sort/group query string
 * (handoff §5.5). A buyer saves "Fatiguing on Meta, last 14 days" once and
 * jumps straight back to it every morning. Backed by useSavedViews
 * (localStorage, cross-tab synced); an unsaved draft is autosaved elsewhere
 * in the module so a config is never silently lost.
 */
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bookmark, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSavedViews } from "@/creative-report/hooks/useSavedViews";
import { fmtDate } from "@/creative-report/lib/format";

const CREATIVES_PATH = "/reports/creative-v2/creatives";

export function SavedViews() {
  const { views, draft, save, rename, remove } = useSavedViews();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const currentQuery = searchParams.toString();

  const handleSave = () => {
    save(name, currentQuery);
    setName("");
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const confirmRename = () => {
    if (editingId) rename(editingId, editingName);
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Saved views</h1>
        <p className="text-sm text-muted-foreground">
          Reusable filter snapshots for your daily routines.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this view…"
            className="h-9 max-w-xs text-[13px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <Button size="sm" className="h-9 gap-1.5" onClick={handleSave}>
            <Bookmark className="h-4 w-4" />
            Save current view
          </Button>
          {draft && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Unsaved draft
              <Link
                to={`${CREATIVES_PATH}?${draft.query}`}
                className="font-semibold text-primary-text hover:underline"
              >
                Apply
              </Link>
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Current filters:{" "}
          <span className="font-mono text-[11px] text-foreground">
            {currentQuery || "No filters set"}
          </span>
        </p>
      </div>

      {views.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No saved views yet — set some filters and save them here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {views.map((v) => {
            const isEditing = editingId === v.id;
            return (
              <div key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 max-w-xs text-[13px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={confirmRename}
                        aria-label="Confirm rename"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Link
                      to={`${CREATIVES_PATH}?${v.query}`}
                      className="truncate text-[13px] font-medium text-foreground hover:underline"
                    >
                      {v.name}
                    </Link>
                  )}
                  {!isEditing && (
                    <p className="truncate text-xs text-muted-foreground">
                      {v.query || "No filters"}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {fmtDate(new Date(v.createdAt))}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => startRename(v.id, v.name)}
                    aria-label={`Rename ${v.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => remove(v.id)}
                    aria-label={`Delete ${v.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

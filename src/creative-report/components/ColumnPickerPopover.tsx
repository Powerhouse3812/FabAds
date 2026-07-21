/**
 * ColumnPickerPopover — Motion's "graph+table, saveable Custom columns"
 * pattern (iter-2 W4). Built-ins (E-com / Video / Post-engagement) are
 * read-only starting points; checking/unchecking columns forks a custom
 * preset. Custom presets can be renamed or deleted; built-ins can't.
 */
import { useState } from "react";
import { Check, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  COLUMN_DEFS,
  deleteCustomPreset,
  renameCustomPreset,
  saveCustomPreset,
  useColumnPresets,
  type MetricKey,
} from "@/creative-report/lib/columns";

const MAX_COLUMNS = 8;

export function ColumnPickerPopover() {
  const { presets, active, setActivePresetId, setActiveColumns } = useColumnPresets();
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [newName, setNewName] = useState("");

  const toggleColumn = (key: MetricKey) => {
    const has = active.columns.includes(key);
    if (has) {
      if (active.columns.length === 1) return; // never zero columns
      setActiveColumns(active.columns.filter((c) => c !== key));
    } else {
      if (active.columns.length >= MAX_COLUMNS) return;
      setActiveColumns([...active.columns, key]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[13px]">
          Columns: {active.name}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Preset
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePresetId(p.id);
                  setRenaming(false);
                  setSavingNew(false);
                }}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  p.id === active.id
                    ? "border-primary/40 bg-primary/15 text-primary-text"
                    : "border-border bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="my-3 h-px bg-border" />

        <div className="space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Columns ({active.columns.length}/{MAX_COLUMNS})
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {COLUMN_DEFS.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-[13px] text-foreground">
                <Checkbox
                  checked={active.columns.includes(c.key)}
                  onCheckedChange={() => toggleColumn(c.key)}
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div className="my-3 h-px bg-border" />

        {!active.builtIn && (
          <>
            {renaming ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Preset name"
                  className="h-7 text-[13px]"
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => {
                    renameCustomPreset(active.id, renameValue);
                    setRenaming(false);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[12px] text-muted-foreground"
                  onClick={() => {
                    setRenameValue(active.name);
                    setRenaming(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Rename
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[12px] text-destructive"
                  onClick={() => deleteCustomPreset(active.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            )}
            <div className="my-3 h-px bg-border" />
          </>
        )}

        {savingNew ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New preset name"
              className="h-7 text-[13px]"
              autoFocus
            />
            <Button
              size="sm"
              className="h-7 px-2"
              onClick={() => {
                saveCustomPreset(newName, active.columns);
                setSavingNew(false);
                setNewName("");
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[12px] text-muted-foreground"
            onClick={() => {
              setNewName(`${active.name} copy`);
              setSavingNew(true);
            }}
          >
            Save as new preset…
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

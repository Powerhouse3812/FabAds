/**
 * BoardsPanel — Foreplay-style Folders > Boards browser (iter-2 P4).
 *
 * Left rail: folders (collapsible), each listing its boards with a live
 * creative count and a Smart/Manual distinction. Right pane: the selected
 * board's contents as a CreativeCard grid.
 *
 * A board is either MANUAL (membership = manualCreativeIds only) or SMART
 * (ruleId set — membership = live evaluateRule(rule, rollups) UNION
 * manualCreativeIds, deduped). Smart-board rule matches can't be manually
 * removed here — only the manually-pinned underlay can, since that's the
 * only part actually owned by this board rather than by the rule.
 *
 * Self-contained: manages its own selection/edit-mode state, reads/writes
 * only via the exported store functions. Zero required props — a parent
 * screen (screens/Automations.tsx, wired separately) just drops this in.
 */
import { useMemo, useState } from "react";
import { Check, ChevronRight, Folder as FolderIcon, Pencil, Plus, Trash2, X, Zap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createBoard,
  createFolder,
  deleteBoard,
  deleteFolder,
  removeCreativeFromBoard,
  renameBoard,
  renameFolder,
  useBoardsStore,
  type Board,
  type Folder,
} from "@/creative-report/automations/boards";
import { CreativeCard } from "@/creative-report/components/CreativeCard";
import { evaluateRule } from "@/creative-report/automations/engine";
import { useAutomationRules } from "@/creative-report/automations/rulesStore";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { pluralize } from "@/creative-report/lib/format";
import type { AutomationRule } from "@/creative-report/automations/model";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

/** Live membership for a board: rule-matched ids (smart only) + manually
 *  pinned ids, deduped. Shared by the tree's count badge and the grid. */
function boardMemberIds(board: Board, rules: AutomationRule[], rollups: CreativeRollup[]): {
  ids: string[];
  rule: AutomationRule | undefined;
  ruleBroken: boolean;
  ruleDisabled: boolean;
} {
  if (!board.ruleId) {
    return { ids: board.manualCreativeIds, rule: undefined, ruleBroken: false, ruleDisabled: false };
  }
  const rule = rules.find((r) => r.id === board.ruleId);
  if (!rule) {
    return { ids: board.manualCreativeIds, rule: undefined, ruleBroken: true, ruleDisabled: false };
  }
  // A turned-off rule must stop driving membership — the enabled switch on
  // the Rules tab means "this rule doesn't act", and a smart board silently
  // ignoring it would make that switch a lie. Pinned underlay stays.
  if (!rule.enabled) {
    return { ids: board.manualCreativeIds, rule, ruleBroken: false, ruleDisabled: true };
  }
  const matched = evaluateRule(rule, rollups).map((r) => r.creative.id);
  const union = new Set([...matched, ...board.manualCreativeIds]);
  return { ids: [...union], rule, ruleBroken: false, ruleDisabled: false };
}

export function BoardsPanel() {
  const { folders, boards } = useBoardsStore();
  const rules = useAutomationRules();
  const data = useCreativeData();
  const rollups = data.status === "ready" ? data.rollups : [];
  const categoriseRules = useMemo(() => rules.filter((r) => r.type === "categorise"), [rules]);

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null;

  const rollupById = useMemo(() => {
    const map = new Map<string, CreativeRollup>();
    for (const r of rollups) map.set(r.creative.id, r);
    return map;
  }, [rollups]);

  const toggleFolder = (id: string) =>
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 gap-6">
      <aside className="w-72 shrink-0 rounded-xl border border-border bg-card p-2">
        <div className="flex items-center justify-between px-2 pb-2 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Folders
          </span>
          <NewFolderButton />
        </div>

        <div className="space-y-1">
          {folders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              boards={boards.filter((b) => b.folderId === folder.id)}
              rules={rules}
              categoriseRules={categoriseRules}
              rollups={rollups}
              collapsed={collapsedFolders.has(folder.id)}
              onToggle={() => toggleFolder(folder.id)}
              canDelete={folders.length > 1}
              selectedBoardId={selectedBoardId}
              onSelectBoard={setSelectedBoardId}
              onBoardDeleted={(id) => {
                if (selectedBoardId === id) setSelectedBoardId(null);
              }}
              onFolderDeleted={() => {
                const stillHasSelected = boards.some(
                  (b) => b.id === selectedBoardId && b.folderId !== folder.id,
                );
                if (!stillHasSelected) setSelectedBoardId(null);
              }}
            />
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {selectedBoard ? (
          <BoardContent
            board={selectedBoard}
            membership={boardMemberIds(selectedBoard, rules, rollups)}
            rollupById={rollupById}
          />
        ) : (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-center">
            <span className="text-sm font-medium text-foreground">No board selected</span>
            <span className="text-xs text-muted-foreground">
              Pick a board on the left to see what&apos;s inside it.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function NewFolderButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setName("");
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[12px] text-muted-foreground">
          <Plus className="h-3.5 w-3.5" /> New folder
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Folder name
        </span>
        <div className="flex items-center gap-1.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. UGC Testing"
            className="h-7 text-[13px]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                createFolder(name);
                setOpen(false);
                setName("");
              }
            }}
          />
          <Button
            size="sm"
            className="h-7 px-2"
            disabled={!name.trim()}
            onClick={() => {
              createFolder(name);
              setOpen(false);
              setName("");
            }}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FolderRow({
  folder,
  boards,
  rules,
  categoriseRules,
  rollups,
  collapsed,
  onToggle,
  canDelete,
  selectedBoardId,
  onSelectBoard,
  onBoardDeleted,
  onFolderDeleted,
}: {
  folder: Folder;
  boards: Board[];
  rules: AutomationRule[];
  categoriseRules: AutomationRule[];
  rollups: CreativeRollup[];
  collapsed: boolean;
  onToggle: () => void;
  canDelete: boolean;
  selectedBoardId: string | null;
  onSelectBoard: (id: string) => void;
  onBoardDeleted: (id: string) => void;
  onFolderDeleted: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Collapsible open={!collapsed} onOpenChange={onToggle}>
      <div className="group flex items-center gap-1 rounded-md px-1 py-1 hover:bg-accent">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex flex-1 items-center gap-1.5 text-left" aria-label={collapsed ? "Expand folder" : "Collapse folder"}>
            <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", !collapsed && "rotate-90")} />
            <FolderIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {renaming ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renameFolder(folder.id, renameValue);
                    setRenaming(false);
                  }
                }}
                className="h-6 flex-1 text-[13px]"
                autoFocus
              />
            ) : (
              <span className="truncate text-[13px] font-medium text-foreground">{folder.name}</span>
            )}
            <span className="ml-auto shrink-0 pl-1 text-[11px] text-muted-foreground">
              {pluralize(boards.length, "board")}
            </span>
          </button>
        </CollapsibleTrigger>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
          {renaming ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                renameFolder(folder.id, renameValue);
                setRenaming(false);
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <>
              <NewBoardButton folderId={folder.id} categoriseRules={categoriseRules} />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                aria-label="Rename folder"
                onClick={() => {
                  setRenameValue(folder.name);
                  setRenaming(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive disabled:text-muted-foreground"
                aria-label="Delete folder"
                disabled={!canDelete}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <CollapsibleContent className="ml-4 space-y-0.5 border-l border-border pl-2">
        {boards.length === 0 ? (
          <div className="px-2 py-1.5 text-[12px] text-muted-foreground">No boards yet.</div>
        ) : (
          boards.map((board) => (
            <BoardRow
              key={board.id}
              board={board}
              rules={rules}
              rollups={rollups}
              selected={board.id === selectedBoardId}
              onSelect={() => onSelectBoard(board.id)}
              onDeleted={() => onBoardDeleted(board.id)}
            />
          ))
        )}
      </CollapsibleContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{folder.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the folder and {pluralize(boards.length, "board")} inside it. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteFolder(folder.id);
                onFolderDeleted();
              }}
            >
              Delete folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  );
}

function NewBoardButton({
  folderId,
  categoriseRules,
}: {
  folderId: string;
  categoriseRules: AutomationRule[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"manual" | "smart">("manual");
  const [ruleId, setRuleId] = useState<string | undefined>(undefined);

  const reset = () => {
    setName("");
    setKind("manual");
    setRuleId(undefined);
  };

  const canCreate = name.trim().length > 0 && (kind === "manual" || (kind === "smart" && !!ruleId));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="New board" onClick={(e) => e.stopPropagation()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3" onClick={(e) => e.stopPropagation()}>
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Board name
        </span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Winning UGC hooks"
          className="mb-3 h-7 text-[13px]"
          autoFocus
        />

        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Type
        </span>
        <RadioGroup value={kind} onValueChange={(v) => setKind(v as "manual" | "smart")} className="mb-3 gap-2">
          <label className="flex items-center gap-2 text-[13px] text-foreground">
            <RadioGroupItem value="manual" />
            Manual board — add/remove creatives yourself
          </label>
          <label className="flex items-center gap-2 text-[13px] text-foreground">
            <RadioGroupItem value="smart" disabled={categoriseRules.length === 0} />
            Smart board — auto-files by a rule
          </label>
        </RadioGroup>

        {kind === "smart" &&
          (categoriseRules.length === 0 ? (
            <p className="mb-3 text-[12px] text-muted-foreground">Create a categorise rule first.</p>
          ) : (
            <Select value={ruleId} onValueChange={setRuleId}>
              <SelectTrigger className="mb-3 h-8 text-[13px]">
                <SelectValue placeholder="Pick a rule" />
              </SelectTrigger>
              <SelectContent>
                {categoriseRules.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

        <Button
          size="sm"
          className="h-7 w-full px-2"
          disabled={!canCreate}
          onClick={() => {
            createBoard(folderId, name, kind === "smart" ? ruleId : undefined);
            setOpen(false);
            reset();
          }}
        >
          Create board
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function BoardRow({
  board,
  rules,
  rollups,
  selected,
  onSelect,
  onDeleted,
}: {
  board: Board;
  rules: AutomationRule[];
  rollups: CreativeRollup[];
  selected: boolean;
  onSelect: () => void;
  onDeleted: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(board.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { ids } = boardMemberIds(board, rules, rollups);

  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 rounded-md px-1.5 py-1",
        selected ? "bg-primary/15" : "hover:bg-accent",
      )}
    >
      <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-1.5 overflow-hidden text-left">
        {renaming ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                renameBoard(board.id, renameValue);
                setRenaming(false);
              }
            }}
            className="h-6 flex-1 text-[13px]"
            autoFocus
          />
        ) : (
          <span className={cn("truncate text-[13px]", selected ? "font-medium text-primary-text" : "text-foreground")}>
            {board.name}
          </span>
        )}
        {board.ruleId && (
          <Badge variant="outline" className="h-4 shrink-0 gap-0.5 px-1 py-0 text-[10px] font-medium">
            <Zap className="h-2.5 w-2.5" /> Smart
          </Badge>
        )}
        <span className="ml-auto shrink-0 pl-1 text-[11px] text-muted-foreground">{ids.length}</span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
        {renaming ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => {
              renameBoard(board.id, renameValue);
              setRenaming(false);
            }}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              aria-label="Rename board"
              onClick={(e) => {
                e.stopPropagation();
                setRenameValue(board.name);
                setRenaming(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive"
              aria-label="Delete board"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{board.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the board{board.ruleId ? " (the linked rule itself is untouched)" : ""}. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteBoard(board.id);
                onDeleted();
              }}
            >
              Delete board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BoardContent({
  board,
  membership,
  rollupById,
}: {
  board: Board;
  membership: { ids: string[]; rule: AutomationRule | undefined; ruleBroken: boolean; ruleDisabled: boolean };
  rollupById: Map<string, CreativeRollup>;
}) {
  const { ids, rule, ruleBroken, ruleDisabled } = membership;
  const cardRollups = ids
    .map((id) => rollupById.get(id))
    .filter((r): r is CreativeRollup => !!r);

  const isEmpty = cardRollups.length === 0;
  const emptyCopy = board.ruleId
    ? ruleBroken || ruleDisabled
      ? "No manually pinned creatives here"
      : "No creatives match this rule's conditions yet"
    : "No creatives here yet";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{board.name}</h2>
          {board.ruleId && (
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {ruleBroken
                ? "Linked rule no longer exists — showing manually pinned creatives only"
                : ruleDisabled
                  ? `Linked rule "${rule?.name}" is turned off — showing manually pinned creatives only`
                  : `Auto-filed by rule: ${rule?.name}`}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[12px] text-muted-foreground">
          {pluralize(cardRollups.length, "creative")}
        </span>
      </div>

      {isEmpty ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border text-[13px] text-muted-foreground">
          {emptyCopy}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {cardRollups.map((rollup) => (
            <BoardCreativeCard
              key={rollup.creative.id}
              rollup={rollup}
              // Only manually-pinned ids are removable — a pure rule-match
              // is controlled by the rule, not by this board.
              removable={board.manualCreativeIds.includes(rollup.creative.id)}
              onRemove={() => removeCreativeFromBoard(board.id, rollup.creative.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BoardCreativeCard({
  rollup,
  removable,
  onRemove,
}: {
  rollup: CreativeRollup;
  removable: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="group/board-card relative">
      <CreativeCard rollup={rollup} selected={false} onToggleSelect={() => {}} />
      {removable && (
        // Floating corner badge, deliberately OUTSIDE the hero image bounds
        // (-top-2/-right-2) so it never collides with the hero's own
        // top-right overlay (the bucket chip sits inset at right-2 top-2).
        <Button
          size="icon"
          variant="ghost"
          className="absolute -right-2 -top-2 z-10 h-6 w-6 rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover/board-card:opacity-100"
          aria-label="Remove from board"
          onClick={onRemove}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

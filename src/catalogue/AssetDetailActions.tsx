import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Bookmark, Pencil, Copy, Download, Archive, Trash2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import type { AssetTypeDef } from "./assetTypes";
import { buildDuplicate } from "./assetTypes";
import {
  useAssetOverride,
  toggleBookmark,
  archiveAsset,
  deleteAsset,
  duplicateAsset,
  renameAsset,
} from "./catalogue-write-store";
import { AssetFormModal } from "./AssetFormModal";

/**
 * §9 "Actions on every asset": Edit / delete / duplicate — plus Archive
 * (§21.2) — plus Use directly in Genie, all in one row. Built once, used
 * from every entity detail surface: `CatalogueFinder`'s per-type Section
 * views, `CatalogueDetailPage`'s `Shell`, and (for Brand/Product/Category)
 * inserted alongside their existing tab strip without touching its
 * architecture.
 *
 * House confirmation policy: destructive actions (Archive, Delete)
 * confirm via `AlertDialog`; Edit's own Save button is its confirm — no
 * second dialog on top of it.
 */
interface AssetDetailActionsProps<T extends { id: string }> {
  def: AssetTypeDef<T>;
  item: T;
  useInGenieHref: string;
  onDeleted?: () => void;
  onDuplicated?: (newId: string) => void;
  className?: string;
}

export function AssetDetailActions<T extends { id: string }>({
  def,
  item,
  useInGenieHref,
  onDeleted,
  onDuplicated,
  className,
}: AssetDetailActionsProps<T>) {
  const id = def.getId(item);
  const name = def.getName(item);
  const card = def.toCard(item);
  const override = useAssetOverride(def.id, id);
  const bookmarked = !!override?.bookmarked;
  const archived = !!override?.archived;

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const handleDuplicate = () => {
    const clone = buildDuplicate(def, item);
    duplicateAsset(def.id, id, clone);
    toast.success(`${def.getName(clone)} created`, {
      description: "Duplicate appears in the list — local to this session.",
    });
    onDuplicated?.(def.getId(clone));
  };

  const handleDownload = () => {
    toast.success(`${name} — download prepared`, {
      description: "Prototype surface: no real file is attached.",
    });
  };

  const handleArchiveConfirm = () => {
    archiveAsset(def.id, id, !archived);
    toast.success(archived ? `${name} unarchived` : `${name} archived`);
    setConfirmArchive(false);
  };

  const handleDeleteConfirm = () => {
    deleteAsset(def.id, id);
    toast.success(`${name} deleted`, { description: "Local to this session — reload restores it." });
    setConfirmDelete(false);
    onDeleted?.();
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Link
        to={useInGenieHref}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.99]"
      >
        <Wand2 className="h-3.5 w-3.5" />
        Use in Genie
      </Link>

      <ActionBtn
        icon={Bookmark}
        label={bookmarked ? "Bookmarked" : "Bookmark"}
        active={bookmarked}
        onClick={() => toggleBookmark(def.id, id)}
      />
      <ActionBtn icon={Pencil} label="Edit" onClick={() => setEditOpen(true)} />
      <ActionBtn icon={Copy} label="Duplicate" onClick={handleDuplicate} />
      <ActionBtn icon={Download} label="Download" onClick={handleDownload} />
      <ActionBtn
        icon={Archive}
        label={archived ? "Unarchive" : "Archive"}
        onClick={() => setConfirmArchive(true)}
      />
      <ActionBtn icon={Trash2} label="Delete" destructive onClick={() => setConfirmDelete(true)} />

      <AssetFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        singular={def.singular}
        addForm={def.addForm}
        initialName={name}
        initialTags={card.tags}
        onSubmit={(input) => renameAsset(def.id, id, input.name, input.tags)}
      />

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{archived ? `Unarchive "${name}"?` : `Archive "${name}"?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {archived
                ? "It will reappear in the default list."
                : "It's hidden from the default list. Turn on \"Show archived\" in the filter row to find it again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveConfirm}>
              {archived ? "Unarchive" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone within this session — the row is gone until reload resets the
              demo data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  active,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary-text"
          : destructive
            ? "border-destructive/30 bg-background text-destructive hover:bg-destructive/10"
            : "border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

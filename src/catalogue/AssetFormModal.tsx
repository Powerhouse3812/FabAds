import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { SessionScopeNote } from "./CatalogueShared";
import type { AddAssetInput, CatalogueType } from "./assetTypes";
import { hasEditableBody } from "./assetActions";
import { editAssetBody } from "./catalogue-write-store";

/**
 * §9 "Manually add or upload — the user is never dependent on fetched
 * data alone." One modal, reused for every Creative type's Add flow AND
 * for the generic Edit action (§9 "Edit / delete / duplicate — plus
 * Archive"), rather than 11 bespoke add forms. House confirmation policy:
 * edits treat Save as the confirm — there's no separate "are you sure".
 *
 * Field labels come from the registry's `AssetTypeDef.addForm` so the
 * single form still reads correctly per type ("Script title" vs "CTA
 * text" vs "Audience label").
 *
 * EDIT MODE USED TO BE NAME + TAGS ONLY, for every one of the 14 types —
 * the content of a script, a hook, a concept was permanently read-only.
 * Owner, 2026-09-14: "Edit" is listed on Script and nowhere else in his
 * spec, and he asked for "a simple input field". So edit mode now also
 * offers the BODY, but only for the types `assetActions.EDITABLE_BODY_TYPES`
 * names (Script today), and only when the caller hands over the asset's
 * identity via `assetType` + `assetId`.
 *
 * The body write goes straight to the store from here rather than through
 * `onSubmit`, because `AddAssetInput.body` already means "the body of a
 * NEW asset" for the add path and overloading it would make two different
 * things share one field. Callers that pass no `assetType` keep the exact
 * old behaviour.
 */
interface AssetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  singular: string;
  addForm?: { nameLabel: string; bodyLabel?: string; bodyPlaceholder?: string };
  initialName?: string;
  initialTags?: string[];
  onSubmit: (input: AddAssetInput) => void;
  /** Identity of the asset being edited. Both required before edit mode will
   *  offer the body field — without them there is nothing to write back to. */
  assetType?: CatalogueType;
  assetId?: string;
  /** The asset's current body text, so the field opens with what is there
   *  rather than blank. */
  initialBody?: string;
  /** Field label for the body in EDIT mode. Falls back to the add-form's own
   *  label, then to a plain default. */
  editBodyLabel?: string;
}

export function AssetFormModal({
  open,
  onOpenChange,
  mode,
  singular,
  addForm,
  initialName = "",
  initialTags = [],
  onSubmit,
  assetType,
  assetId,
  initialBody = "",
  editBodyLabel,
}: AssetFormModalProps) {
  const [name, setName] = useState(initialName);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [body, setBody] = useState("");

  // DEFECT FIX (audited): both add-mode callers omit `initialTags`, so the
  // `initialTags = []` default parameter above constructs a BRAND NEW array
  // on every render of the caller. With `initialTags` in this effect's deps,
  // that fresh `[]` !== the previous fresh `[]` by reference, so the effect
  // re-fired on every keystroke and reset `name` back to "" — the "Add"
  // button for 10 of 11 Creative types (everything except Avatars, which has
  // no addForm) stayed permanently disabled. Depending on `open` ALONE is
  // correct: the effect only needs to reset the form at the moment the
  // dialog transitions to open, not on every parent re-render while it's
  // already open. Edit mode was unaffected only because its parent (a
  // stable list row) doesn't re-render on every keystroke — a difference in
  // caller behaviour, not in this effect, which is why it slipped through.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      setName(initialName);
      setTags(initialTags.join(", "));
      // Add mode starts empty; edit mode starts with what the asset says now,
      // so Save without touching the field is a no-op rather than a wipe.
      setBody(mode === "edit" ? initialBody : "");
    }
  }, [open]);

  const nameLabel = addForm?.nameLabel ?? `${singular} name`;
  /** Edit mode offers the body only for a type that HAS an editable body and
   *  only when the caller identified the row. */
  const showEditBody = mode === "edit" && hasEditableBody(assetType) && !!assetType && !!assetId;
  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({ name: trimmedName, tags: parsedTags, body: body.trim() || undefined });
    // Content write is its own store call — see this file's header for why it
    // does not ride along on `onSubmit`.
    if (showEditBody && assetType && assetId && body !== initialBody) {
      editAssetBody(assetType, assetId, body);
    }
    toast.success(mode === "add" ? `${singular} added` : `${singular} updated`, {
      description:
        mode === "add"
          ? `${trimmedName} appears in the list below — local to this session.`
          : `${trimmedName} saved.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          {/* DEFECT FIX (audited): `singular.toLowerCase()` produced "Add
              cta" for the one acronym type in the registry. Every
              `AssetTypeDef.singular` is already authored in the correct
              case ("CTA", "Audience", "Angle", …) — use it verbatim instead
              of forcing a case transform that only some labels tolerate. */}
          <DialogTitle>{mode === "add" ? `Add ${singular}` : `Edit ${singular}`}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? `Appends a new ${singular} to the catalogue immediately below.`
              : showEditBody
                ? `Rewrite this ${singular}, or rename it and update its tags.`
                : `Rename this ${singular} or update its tags.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">{nameLabel}</Label>
            <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>

          {showEditBody && (
            <div className="space-y-1.5">
              <Label htmlFor="asset-edit-body">
                {editBodyLabel ?? addForm?.bodyLabel ?? `${singular} content`}
              </Label>
              <Textarea
                id="asset-edit-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="resize-y leading-relaxed"
              />
              {/* Clearing the box RESTORES the seeded text rather than saving
                  an empty asset — an empty script is not something anyone
                  means to create from a text field, and "" would otherwise be
                  indistinguishable from "reset". Said out loud so the
                  behaviour isn't a surprise. */}
              <p className="text-[11px] leading-4 text-muted-foreground">
                Leave empty to restore the original text.
              </p>
            </div>
          )}

          {mode === "add" && addForm?.bodyLabel && (
            <div className="space-y-1.5">
              <Label htmlFor="asset-body">{addForm.bodyLabel}</Label>
              <Textarea
                id="asset-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={addForm.bodyPlaceholder}
                rows={5}
                className="resize-none leading-relaxed"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="asset-tags">Tags (comma-separated, optional)</Label>
            <Input
              id="asset-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. urgency, festive"
            />
          </div>

          {mode === "add" && <SessionScopeNote />}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {mode === "add" ? `Add ${singular}` : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

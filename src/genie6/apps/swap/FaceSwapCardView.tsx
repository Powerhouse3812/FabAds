import { useState } from "react";
import { Pencil, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { avatars, voices } from "@/mocks/shared";
import { toneLabel } from "@/genie6/brain/avatarTaxonomy";
import { AvatarVoicePicker } from "@/genie6/brain/AvatarVoicePicker";
import { languageFlag, languageLabel } from "../../lib/languages";
import { LanguageSelectField } from "../fields/LanguageSelectField";
import { SwapCardShell } from "./SwapCardShell";
import type { FaceSwapCardState } from "./swapTypes";

const THUMB_BOX = "h-9 w-9";

/**
 * Face Swap's stage-3 card — same "resting-state chip, opens a picker"
 * grammar `ProductSheet` established for Product Swap, built from the two
 * components the owner named directly rather than a new bespoke picker:
 * `AvatarVoicePicker` (avatar + voice + tone, decided together per §13) and
 * `LanguageSelectField` (the single-language rule, owner ruling 2026-09-09).
 * Both are the FULL components Genie Brain / other apps already mount, not
 * forks — opened in a Dialog because, unlike `ProductSheet`, no equivalent
 * compact chip existed for this trio before this file.
 *
 * `ratePerLanguageMinute` is intentionally omitted from `LanguageSelectField`
 * here: `AppRunner` only passes that prop when `app.cost.unit ===
 * "language-minute"` (Translate Videos), and Face Swap's unit is "minute" —
 * passing it here would show a per-language rate that isn't how this app
 * actually bills.
 */
export function FaceSwapCardView({
  card,
  index,
  onChange,
}: {
  card: FaceSwapCardState;
  index: number;
  onChange: (patch: Partial<FaceSwapCardState>) => void;
}) {
  const [open, setOpen] = useState(false);
  const avatar = card.avatarId ? avatars.find((a) => a.id === card.avatarId) : undefined;
  const voice = card.voiceId ? voices.find((v) => v.id === card.voiceId) : undefined;

  const remove = () => onChange({ avatarId: null, voiceId: null, tone: null, language: null });

  return (
    <SwapCardShell index={index} eyebrow={`Swap ${index + 1}`}>
      {!avatar ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fab-focus flex w-full items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/10 px-3 py-2 text-left transition-colors hover:bg-primary/15"
        >
          <User className="h-4 w-4 shrink-0 text-primary-text" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-semibold leading-4 text-primary-text">
              Attach an avatar, voice &amp; language
            </span>
            <span className="block truncate text-[11px] leading-4 text-muted-foreground">
              This swap stays tied to whoever and whatever language you pick here.
            </span>
          </span>
        </button>
      ) : (
        <div className="flex w-full items-center gap-2.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-2">
          <div
            className={cn(
              "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30",
              THUMB_BOX,
            )}
          >
            {avatar.thumbnail ? (
              <img src={avatar.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              title={avatar.name}
              className="truncate text-[13px] font-semibold leading-tight text-foreground"
            >
              {avatar.name}
            </p>
            <p className="truncate text-[11px] leading-4 text-muted-foreground">
              {voice?.name ?? "No voice"}
              {card.tone ? ` · ${toneLabel(card.tone)}` : ""}
              {" · "}
              {card.language
                ? `${languageFlag(card.language)} ${languageLabel(card.language)}`
                : "No language yet"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="fab-focus inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold leading-4 text-primary-text hover:underline"
          >
            <Pencil className="h-3 w-3" aria-hidden />
            Change
          </button>
          <button
            type="button"
            onClick={remove}
            aria-label={`Remove ${avatar.name}`}
            className="fab-focus inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[85vh] max-w-2xl overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="text-[15px] font-semibold text-foreground">
            Avatar, voice &amp; language
          </DialogTitle>
          <AvatarVoicePicker
            avatarId={card.avatarId}
            voiceId={card.voiceId}
            tone={card.tone}
            withVoice
            withTone
            onChange={(v) =>
              onChange({
                avatarId: v.avatarId !== undefined ? v.avatarId : card.avatarId,
                voiceId: v.voiceId !== undefined ? v.voiceId : card.voiceId,
                tone: v.tone !== undefined ? v.tone : card.tone,
              })
            }
          />
          <div className="flex flex-col gap-1.5 border-t border-border pt-4">
            <label className="text-[13px] font-medium text-foreground">
              Language <span className="ml-0.5 text-primary-text">*</span>
            </label>
            <LanguageSelectField
              value={card.language ?? undefined}
              onChange={(code) => onChange({ language: code })}
            />
          </div>
          <Button type="button" onClick={() => setOpen(false)} className="mt-1 w-full">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </SwapCardShell>
  );
}

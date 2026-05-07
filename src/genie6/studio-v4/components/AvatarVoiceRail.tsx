import { useState } from "react";
import { Check, Mic, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatars, voices } from "../../mocks/library";

interface AvatarVoiceRailProps {
  selectedAvatarId: string | null;
  selectedVoiceId: string | null;
  onAvatarChange: (id: string | null) => void;
  onVoiceChange: (id: string | null) => void;
  onClose: () => void;
}

type Tab = "avatar" | "voice";

/**
 * AvatarVoiceRail — combined picker for the merged "Avatar · Voice"
 * chip in PromptReferenceBar (UGC Video mode only). Tabbed —
 * Avatar (single-select) + Voice (single-select).
 *
 * Real avatar images don't exist in the mock data — we render
 * deterministic colored circles with name initials. Voice list
 * shows name + language + 1-line description.
 */
export function AvatarVoiceRail({
  selectedAvatarId,
  selectedVoiceId,
  onAvatarChange,
  onVoiceChange,
  onClose,
}: AvatarVoiceRailProps) {
  const [tab, setTab] = useState<Tab>("avatar");

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            UGC Video
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Avatar · Voice
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="shrink-0 flex border-b border-border bg-muted/20 px-2 py-1">
        <TabBtn
          active={tab === "avatar"}
          onClick={() => setTab("avatar")}
          icon={User}
        >
          Avatar
        </TabBtn>
        <TabBtn
          active={tab === "voice"}
          onClick={() => setTab("voice")}
          icon={Mic}
        >
          Voice
        </TabBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === "avatar" && (
          <ul className="space-y-1">
            <PickRow
              active={selectedAvatarId === null}
              label="Auto"
              sub="Genie picks the best avatar for your script."
              onClick={() => onAvatarChange(null)}
              avatarText="A"
              avatarBg="hsl(0, 0%, 60%)"
            />
            {avatars.slice(0, 12).map((a) => (
              <PickRow
                key={a.id}
                active={selectedAvatarId === a.id}
                label={a.name}
                sub={a.demographic}
                onClick={() => onAvatarChange(a.id)}
                avatarText={a.name.charAt(0).toUpperCase()}
                avatarBg={stringToHsl(a.name)}
              />
            ))}
          </ul>
        )}

        {tab === "voice" && (
          <ul className="space-y-1">
            <PickRow
              active={selectedVoiceId === null}
              label="Auto"
              sub="Genie matches voice to your brand and avatar."
              onClick={() => onVoiceChange(null)}
              avatarText="V"
              avatarBg="hsl(0, 0%, 60%)"
            />
            {voices.slice(0, 12).map((v) => (
              <PickRow
                key={v.id}
                active={selectedVoiceId === v.id}
                label={v.name}
                sub={`${v.language} · ${v.description}`}
                onClick={() => onVoiceChange(v.id)}
                avatarText={v.name.charAt(0).toUpperCase()}
                avatarBg={stringToHsl(v.name)}
                icon={Mic}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="shrink-0 flex items-center justify-end border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
        >
          Done
        </button>
      </footer>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}

function PickRow({
  active,
  label,
  sub,
  onClick,
  avatarText,
  avatarBg,
  icon: Icon,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
  avatarText: string;
  avatarBg: string;
  icon?: React.ElementType;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-md border bg-background p-2 text-left transition-colors",
          active
            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
            : "border-border hover:border-primary/40",
        )}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: avatarBg }}
        >
          {Icon ? <Icon className="h-3.5 w-3.5" /> : avatarText}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-foreground">
            {label}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{sub}</p>
        </div>
        {active && (
          <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={3} />
        )}
      </button>
    </li>
  );
}

function stringToHsl(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

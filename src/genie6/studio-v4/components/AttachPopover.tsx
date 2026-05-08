import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AttachSource } from "../state/useWizard";

/**
 * AttachPopover — Step 4 attach-source picker (Track C).
 *
 * Anchored to the `+` icon on the prompt-reference bar. Six items: Upload,
 * Library, Pinterest, Brand-Winner-Ads, Product-Winner-Ads, URL.
 *
 * Heavy sources (library / pinterest / *-winner-ads) trigger a right-rail
 * column drawer in the parent. Lighter sources (upload / url) fire inline.
 */

interface AttachPopoverProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (source: AttachSource) => void;
  children: ReactNode;
}

const ITEMS: {
  source: AttachSource;
  emoji: string;
  label: string;
  subtext: string;
}[] = [
  {
    source: "upload",
    emoji: "🖼",
    label: "Upload",
    subtext: "from your computer",
  },
  {
    source: "library",
    emoji: "🗂",
    label: "From Library",
    subtext: "saved generations & assets",
  },
  {
    source: "pinterest",
    emoji: "📌",
    label: "Pinterest",
    subtext: "auto-fetched mood-board pins",
  },
  {
    source: "brand-winner-ads",
    emoji: "🏆",
    label: "Brand knowledge: Winner Ads",
    subtext: "top-performing brand creatives",
  },
  {
    source: "product-winner-ads",
    emoji: "📦",
    label: "Product knowledge: Winner Ads",
    subtext: "top-performing product creatives",
  },
  {
    source: "instruction",
    emoji: "📝",
    label: "Instruction",
    subtext: "attach a KB instruction to guide this generation",
  },
  {
    source: "url",
    emoji: "🔗",
    label: "URL",
    subtext: "paste a reference link",
  },
];

export function AttachPopover({
  open,
  onOpenChange,
  onPick,
  children,
}: AttachPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-80 p-1">
        <div className="flex flex-col">
          {ITEMS.map((item) => (
            <button
              key={item.source}
              type="button"
              onClick={() => onPick(item.source)}
              className="flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="text-lg leading-none mt-0.5">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {item.label}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {item.subtext}
                </div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

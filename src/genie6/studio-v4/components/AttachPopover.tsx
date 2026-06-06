import type { ReactNode, ElementType } from "react";
import {
  Upload,
  Library,
  Pin,
  Trophy,
  Package,
  FileText,
  Link as LinkIcon,
  Database,
  Image as ImageIcon,
  LayoutTemplate,
} from "lucide-react";
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
  Icon: ElementType;
  label: string;
  subtext: string;
}[] = [
  { source: "upload", Icon: Upload, label: "Upload", subtext: "from your computer" },
  { source: "library", Icon: Library, label: "From Library", subtext: "saved generations & assets" },
  { source: "seed-image", Icon: ImageIcon, label: "Product images", subtext: "official seed shots for this product" },
  { source: "pinterest", Icon: Pin, label: "Pinterest", subtext: "auto-fetched mood-board pins" },
  { source: "brand-winner-ads", Icon: Trophy, label: "Brand knowledge: Winner Ads", subtext: "top-performing brand creatives" },
  { source: "product-winner-ads", Icon: Package, label: "Product knowledge: Winner Ads", subtext: "top-performing product creatives" },
  { source: "industry-insights", Icon: Database, label: "Industry Insights", subtext: "pinned competitor & category insights" },
  { source: "template", Icon: LayoutTemplate, label: "Templates", subtext: "start from a proven ad layout" },
  { source: "instruction", Icon: FileText, label: "Instruction", subtext: "attach a KB instruction to guide this generation" },
  { source: "url", Icon: LinkIcon, label: "URL", subtext: "paste a reference link" },
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
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
                <item.Icon className="h-4 w-4" />
              </span>
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

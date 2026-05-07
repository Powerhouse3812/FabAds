import { ImageIcon, VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroHeader } from "../components/HeroHeader";
import type { Format, UseWizardReturn } from "../state/useWizard";

interface Step1Props {
  wizard: UseWizardReturn;
  onAdvance: () => void;
}

interface FormatOption {
  id: Format;
  icon: React.ElementType;
  title: string;
  desc: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "image",
    icon: ImageIcon,
    title: "Image",
    desc: "Static ad creatives — hero shots, carousels, story frames.",
  },
  {
    id: "video",
    icon: VideoIcon,
    title: "Video",
    desc: "Motion creatives — UGC, reels, product demos.",
  },
];

export function AlphaStep1Format({ wizard, onAdvance }: Step1Props) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 pt-8 pb-10">
      <HeroHeader title="Pick your format" />

      <div className="grid grid-cols-2 gap-4">
        {FORMAT_OPTIONS.map((f) => {
          const Icon = f.icon;
          const selected = wizard.state.format === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                wizard.set("format", f.id);
                onAdvance();
              }}
              className={cn(
                "flex flex-col items-center gap-4 p-8 rounded-2xl border bg-card transition-all cursor-pointer",
                selected
                  ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                  : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
              )}
            >
              <Icon
                className={cn(
                  "h-12 w-12",
                  selected ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="text-lg font-bold text-foreground">{f.title}</span>
              <span className="text-[13px] text-muted-foreground text-center">
                {f.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

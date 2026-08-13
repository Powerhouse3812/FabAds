import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // On a phone the bottom of the screen belongs to the tab bar, open bottom
      // sheets and their sticky action footers — a bottom-right toast is either
      // covered or has an unreachable Undo button. Undo is the safety net for
      // pause / budget / duplicate, so it has to be tappable. Desktop keeps
      // sonner's default position.
      position={isMobile ? "top-center" : props.position}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          // min-h-11 on mobile for WCAG 2.5.5 — the Undo action must be a real
          // 44px target, not a text link.
          actionButton: cn(
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            isMobile && "group-[.toast]:min-h-11 group-[.toast]:px-4",
          ),
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

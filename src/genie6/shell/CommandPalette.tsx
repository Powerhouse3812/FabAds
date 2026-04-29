import { useEffect, useState, useCallback, createContext, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Sparkles, Home, FolderTree, PenLine, Library as LibraryIcon, Settings,
  Sun, Moon, Columns3, Brush, LayoutDashboard, Boxes,
} from "lucide-react";
import { useGenie6Theme, type GenieVariant, setVariant } from "../hooks/useGenie6Theme";
import { useNewGenerationOverlay } from "./NewGenerationOverlay";
import { modeConfigs } from "../generate/modeConfigs";
import { resolvePrefillFromRoute } from "../lib/prefillContext";

/**
 * Genie 6 — global command palette.
 *
 * Linear/Raycast-style ⌘K palette. Every Genie 6 affordance reachable from
 * the keyboard:
 *   ⌘K            open palette
 *   ⌘1 / ⌘2 / ⌘3 / ⌘4 — switch variant directly (no palette)
 *   ⌘⇧D           toggle dark mode
 *   ⌘N            open new-generation overlay (the focused new-gen flow)
 *
 * Inside the palette: switch variant, switch theme, navigate to any Genie 6
 * section, launch a specific generation mode, or fire the focused
 * new-generation flow.
 *
 * Mounted once at the Genie6Bridge level so it's only active on /iq/genie6/*.
 */

interface CommandPaletteCtx {
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<CommandPaletteCtx | null>(null);

export function useCommandPalette() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen, toggle: () => setOpen((v) => !v) }), [open]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <CommandPalette />
    </Ctx.Provider>
  );
}

function CommandPalette() {
  const { open, setOpen } = useContext(Ctx)!;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { variant } = useGenie6Theme();
  const { setTheme, resolvedTheme } = useTheme();
  const { open: openNewGenOverlay } = useNewGenerationOverlay();

  const run = useCallback(
    (action: () => void) => {
      setOpen(false);
      // Defer to after the dialog closes so focus restores cleanly.
      setTimeout(action, 0);
    },
    [setOpen]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search… (variant, mode, theme, jump)" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => run(() => openNewGenOverlay(resolvePrefillFromRoute(pathname)))}>
            <Sparkles className="h-4 w-4" />
            New generation
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Toggle {resolvedTheme === "dark" ? "light" : "dark"} mode
            <CommandShortcut>⌘⇧D</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Switch variant">
          <VariantItem id="studio" Icon={Columns3} label="Studio" desc="3-column workspace" shortcut="⌘1" active={variant === "studio"} onSelect={(id) => run(() => setVariant(id))} />
          <VariantItem id="canvas" Icon={Brush} label="Canvas" desc="editor + viewport" shortcut="⌘2" active={variant === "canvas"} onSelect={(id) => run(() => setVariant(id))} />
          <VariantItem id="command" Icon={LayoutDashboard} label="Command" desc="ops dashboard" shortcut="⌘3" active={variant === "command"} onSelect={(id) => run(() => setVariant(id))} />
          <VariantItem id="modular" Icon={Boxes} label="Modular" desc="composable cards" shortcut="⌘4" active={variant === "modular"} onSelect={(id) => run(() => setVariant(id))} />
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Jump to">
          {/* Updated for iter-3 IA: Home → Dashboard, Assets → Library, current
              Library → Generations. Generate folded into Dashboard (no separate
              entry). Settings still here for global preferences. */}
          <CommandItem onSelect={() => run(() => navigate("/iq/genie6"))}>
            <Home className="h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/iq/genie6/workspace/brands"))}>
            <FolderTree className="h-4 w-4" />
            Library
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/iq/genie6/library"))}>
            <LibraryIcon className="h-4 w-4" />
            Generations
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/iq/genie6/settings"))}>
            <Settings className="h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Launch a mode">
          {modeConfigs.map((cfg) => (
            <CommandItem
              key={cfg.id}
              onSelect={() => run(() => navigate(`/iq/genie6/generate/${cfg.id}/form`))}
            >
              <Sparkles className="h-4 w-4" />
              {cfg.label}
              <span className="ml-auto text-xs text-muted-foreground">{cfg.description.slice(0, 40)}…</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function VariantItem({
  id,
  Icon,
  label,
  desc,
  shortcut,
  active,
  onSelect,
}: {
  id: GenieVariant;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  shortcut: string;
  active: boolean;
  onSelect: (id: GenieVariant) => void;
}) {
  return (
    <CommandItem onSelect={() => onSelect(id)}>
      <Icon className="h-4 w-4" />
      {label}
      <span className="ml-2 text-xs text-muted-foreground">{desc}</span>
      {active && <span className="ml-auto text-xs text-g6-primary font-medium">active</span>}
      <CommandShortcut>{shortcut}</CommandShortcut>
    </CommandItem>
  );
}

/** Hook to bind the global keyboard shortcuts. Mounted once at Genie6Bridge level. */
export function useCommandPaletteShortcuts() {
  const { toggle } = useCommandPalette();
  const { variant } = useGenie6Theme();
  const { setTheme, resolvedTheme } = useTheme();
  const { open: openNewGenOverlay } = useNewGenerationOverlay();
  const { pathname } = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea" || target?.isContentEditable;
      const meta = e.metaKey || e.ctrlKey;

      if (!meta) return;

      // Cmd+K — open palette (allowed even from inputs since it's the universal escape hatch)
      if (e.key.toLowerCase() === "k" && !e.shiftKey) {
        e.preventDefault();
        toggle();
        return;
      }

      // Don't fire other shortcuts when typing in a field
      if (inField) return;

      // Cmd+Shift+D — toggle dark mode
      if (e.key.toLowerCase() === "d" && e.shiftKey) {
        e.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        return;
      }

      // Cmd+N — quick new generation (open focused overlay)
      if (e.key.toLowerCase() === "n" && !e.shiftKey) {
        e.preventDefault();
        openNewGenOverlay(resolvePrefillFromRoute(pathname));
        return;
      }

      // Cmd+1/2/3/4 — switch variant directly
      if (["1", "2", "3", "4"].includes(e.key)) {
        const variants: GenieVariant[] = ["studio", "canvas", "command", "modular"];
        const next = variants[parseInt(e.key, 10) - 1];
        if (next && next !== variant) {
          e.preventDefault();
          setVariant(next);
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggle, variant, setTheme, resolvedTheme, openNewGenOverlay, pathname]);
}

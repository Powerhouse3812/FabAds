import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  MODULES,
  groupedModules,
  type ModuleDef,
  type SubItem,
} from "@/components/sidebar/modules";

/**
 * Cmd+K command palette — global keyboard-driven nav surface.
 *
 * v1 scope (iter-6 A-5): module + sub-item navigation only. Lists every
 * top-level module + every sub-item path with the parent module's label
 * as the group header. Picking an entry navigates and closes.
 *
 * Future scope: brand search, generation search, recent paths, AI actions.
 *
 * Invocation:
 *   - Cmd+K (Linear/Raycast convention) — global keydown listener
 *   - Click on the search field in the sidebar (which calls openPalette())
 *
 * Architecture: external open-state store + useSyncExternalStore so any
 * surface (search field, keyboard shortcut, future deep-link) can open
 * the palette without prop drilling.
 */

let isOpen = false;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return isOpen;
}

export function openPalette() {
  if (isOpen) return;
  isOpen = true;
  emit();
}

export function closePalette() {
  if (!isOpen) return;
  isOpen = false;
  emit();
}

export function togglePalette() {
  isOpen = !isOpen;
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
      // Don't fire when user is typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      e.preventDefault();
      togglePalette();
    }
  });
}

function useCommandPaletteOpen() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function CommandPalette() {
  const open = useCommandPaletteOpen();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const groups = groupedModules();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (path: string) => {
    navigate(path);
    closePalette();
  };

  const renderModuleItems = (mod: ModuleDef) => {
    const items: { key: string; node: React.ReactNode }[] = [];
    if (mod.path) {
      items.push({
        key: mod.key,
        node: (
          <CommandItem
            key={mod.key}
            value={`${mod.label} ${mod.key}`}
            onSelect={() => go(mod.path!)}
          >
            <mod.icon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{mod.label}</span>
          </CommandItem>
        ),
      });
    }
    if (mod.subItems) {
      mod.subItems.forEach((sub: SubItem) => {
        items.push({
          key: sub.path,
          node: (
            <CommandItem
              key={sub.path}
              value={`${mod.label} ${sub.label} ${sub.path}`}
              onSelect={() => go(sub.path)}
            >
              <mod.icon className="mr-2 h-4 w-4 text-muted-foreground/60" />
              <span className="text-muted-foreground">{mod.label}</span>
              <span className="mx-1.5 text-muted-foreground/40">›</span>
              <span>{sub.label}</span>
            </CommandItem>
          ),
        });
      });
    }
    return items;
  };

  return (
    <CommandDialog open={open} onOpenChange={(o) => (o ? openPalette() : closePalette())}>
      <CommandInput
        placeholder="Search FabAds — modules, pages, actions…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {groups.map(({ group, modules }, gi) =>
          modules.length === 0 ? null : (
            <div key={group}>
              {gi > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {modules.flatMap(renderModuleItems).map((it) => it.node)}
              </CommandGroup>
            </div>
          )
        )}
        {/* Top-level modules with direct paths (no sub-items) — already
            included above via mod.path. Only render Settings/etc separately
            if they aren't already in MODULES. */}
        {MODULES.length === 0 && <CommandEmpty>No modules configured.</CommandEmpty>}
      </CommandList>
    </CommandDialog>
  );
}

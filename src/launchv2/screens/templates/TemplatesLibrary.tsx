/**
 * TemplatesLibrary — Full-page templates management surface.
 *
 * Layout: Tab bar (Setup | Distribution) + two-panel (card list | preview rail).
 * Design: FabFunnel v1.2 — lime #8FB821, bg #FAFAF7 light / #18181B dark,
 * rounded-2xl cards, Geist Mono for metadata/numbers.
 *
 * Data: localStorage-backed via `templatesService`. Read-only from this surface —
 * creation lives in the Launch flow (Step 2 / Step 4). Rename + Delete supported.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { templatesService } from "../../templates/service";
import { summarizeDistribution, summarizeSetup } from "../../templates/summary";
import type {
  DistributionTemplate,
  SetupTemplate,
  TemplateKind,
} from "../../templates/types";

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

type ActiveTab = "setup" | "distribution";

interface NormalizedTemplate {
  id: string;
  kind: TemplateKind;
  name: string;
  summary: string;
  createdAt: number;
  updatedAt: number;
}

type RenameTarget = { kind: TemplateKind; id: string; name: string } | null;
type DeleteTarget = { kind: TemplateKind; id: string } | null;

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function relativeTime(ts: number): string {
  const raw = formatDistanceToNow(new Date(ts), { addSuffix: true });
  return raw.replace(/^about /, "");
}

function formatAbsolute(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalize(
  setups: SetupTemplate[],
  dists: DistributionTemplate[],
): { setup: NormalizedTemplate[]; distribution: NormalizedTemplate[] } {
  return {
    setup: setups.map((t) => ({
      id: t.id,
      kind: "setup" as TemplateKind,
      name: t.name,
      summary: summarizeSetup(t.payload),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    distribution: dists.map((t) => ({
      id: t.id,
      kind: "distribution" as TemplateKind,
      name: t.name,
      summary: summarizeDistribution(t.payload),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Main export                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export function TemplatesLibrary() {
  const [setups, setSetups] = useState<SetupTemplate[]>([]);
  const [dists, setDists] = useState<DistributionTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("setup");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [renameTarget, setRenameTarget] = useState<RenameTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const refresh = useCallback(() => {
    setSetups(templatesService.listSetup());
    setDists(templatesService.listDistribution());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // When switching tabs, reset selection and search
  const handleTabSwitch = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSelectedId(null);
    setSearch("");
  };

  const normalized = normalize(setups, dists);
  const activeList = normalized[activeTab];

  const filteredList = search.trim()
    ? activeList.filter((t) =>
        t.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : activeList;

  const selectedItem =
    selectedId != null
      ? activeList.find((t) => t.id === selectedId) ?? null
      : null;

  const bothEmpty = setups.length === 0 && dists.length === 0;

  const handleRename = (kind: TemplateKind, id: string, name: string) => {
    setRenameTarget({ kind, id, name });
  };

  const handleRenameSubmit = (newName: string) => {
    if (!renameTarget) return;
    templatesService.rename(renameTarget.kind, renameTarget.id, newName);
    // If the renamed item is selected, the list refresh handles name update
    setRenameTarget(null);
    refresh();
  };

  const handleDeleteRequest = (kind: TemplateKind, id: string) => {
    setDeleteTarget({ kind, id });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    templatesService.remove(deleteTarget.kind, deleteTarget.id);
    if (selectedId === deleteTarget.id) setSelectedId(null);
    setDeleteTarget(null);
    refresh();
  };

  /* ── Full-page empty state (both tabs empty) ── */
  if (bothEmpty) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#FAFAF7] dark:bg-[#18181B]">
        <PageHeader />
        <FullEmptyState />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FAFAF7] dark:bg-[#18181B]">
      <PageHeader />

      {/* Tab bar */}
      <div className="sticky top-0 z-10 border-b border-[#e7e5dc] bg-[#FAFAF7] px-8 dark:border-[#2a2a2a] dark:bg-[#18181B]">
        <div className="flex gap-0">
          {(["setup", "distribution"] as ActiveTab[]).map((tab) => {
            const count =
              tab === "setup" ? setups.length : dists.length;
            const label = tab === "setup" ? "Setup" : "Distribution";
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-3 text-[13px] transition-colors",
                  "focus-visible:outline-none",
                  isActive
                    ? "font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
                    : "font-normal text-[rgba(15,15,12,0.55)] hover:text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.55)] dark:hover:text-[rgba(255,255,255,0.72)]",
                )}
              >
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "font-mono text-[10px] font-600 tabular-nums",
                      isActive
                        ? "text-[#5B7611] dark:text-[#C3E165]"
                        : "text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]",
                    )}
                  >
                    {count}
                  </span>
                )}
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full bg-[#8FB821]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: card list */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Search */}
          <div className="px-6 py-4">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
              <input
                type="text"
                placeholder={`Search ${activeTab === "setup" ? "setup" : "distribution"} templates…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "h-9 w-full rounded-[28px] border border-[#e7e5dc] bg-white pl-9 pr-4",
                  "font-mono text-[13px] text-[rgba(15,15,12,0.92)] placeholder:text-[rgba(15,15,12,0.45)]",
                  "transition-all focus:border-[#8FB821] focus:outline-none focus:ring-0",
                  "focus:shadow-[0_0_0_4px_rgba(143,184,33,0.18)]",
                  "dark:border-[#2a2a2a] dark:bg-[#1E1E23] dark:text-[rgba(255,255,255,0.92)]",
                  "dark:placeholder:text-[rgba(255,255,255,0.45)] dark:focus:border-[#90BA24]",
                )}
              />
            </div>
          </div>

          {/* Cards scroll region */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {filteredList.length === 0 ? (
              <TabEmptyState
                tab={activeTab}
                isFiltered={search.trim().length > 0}
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {filteredList.map((item, i) => (
                  <TemplateCard
                    key={item.id}
                    item={item}
                    isSelected={selectedId === item.id}
                    animationDelay={i * 30}
                    onClick={() =>
                      setSelectedId((prev) =>
                        prev === item.id ? null : item.id,
                      )
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: preview rail (300px) */}
        <div className="w-[300px] flex-shrink-0 overflow-y-auto border-l border-[#e7e5dc] dark:border-[#2a2a2a]">
          {selectedItem ? (
            <PreviewRail
              item={selectedItem}
              onRename={() =>
                handleRename(selectedItem.kind, selectedItem.id, selectedItem.name)
              }
              onDelete={() =>
                handleDeleteRequest(selectedItem.kind, selectedItem.id)
              }
            />
          ) : (
            <RailZeroState />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <RenameDialog
        target={renameTarget}
        onClose={() => setRenameTarget(null)}
        onSubmit={handleRenameSubmit}
      />
      <DeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Page header                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <header className="px-8 pb-4 pt-6">
      <h1
        className="text-[19px] font-bold leading-[27px] tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
      >
        Templates
      </h1>
      <p className="mt-0.5 font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        Saved Setup &amp; Distribution configurations — apply from the launch flow.
      </p>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Template card                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function TemplateCard({
  item,
  isSelected,
  animationDelay,
  onClick,
}: {
  item: NormalizedTemplate;
  isSelected: boolean;
  animationDelay: number;
  onClick: () => void;
}) {
  return (
    <li
      onClick={onClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        "animate-in fade-in slide-in-from-bottom-1 cursor-pointer rounded-2xl border p-4 transition-all duration-220",
        "hover:-translate-y-0.5 hover:shadow-sm",
        isSelected
          ? "border-[#8FB821] bg-[#F5FBE2] dark:border-[#90BA24] dark:bg-[#1D2A09]"
          : "border-[#e7e5dc] bg-white hover:border-[#c8c5ba] hover:shadow-md dark:border-[#2a2a2a] dark:bg-[#1E1E23] dark:hover:border-[#3a3a3a]",
      )}
    >
      {/* Name + kind badge row */}
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] font-medium leading-[21px]",
            isSelected
              ? "text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
              : "text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]",
          )}
        >
          {item.name}
        </p>
        <KindBadge kind={item.kind} />
      </div>

      {/* Summary */}
      {item.summary && (
        <p className="mt-1.5 font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
          {item.summary}
        </p>
      )}

      {/* Footer */}
      <p className="mt-2.5 font-mono text-[10px] leading-[15px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
        Updated {relativeTime(item.updatedAt)}
      </p>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Kind badge                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function KindBadge({ kind }: { kind: TemplateKind }) {
  const label = kind === "setup" ? "SETUP" : "DISTRIBUTION";
  return (
    <span
      className={cn(
        "flex-shrink-0 rounded-full px-2 py-0.5",
        "font-mono text-[10px] font-semibold uppercase leading-[15px] tracking-[0.06em]",
        kind === "setup"
          ? "bg-[rgba(143,184,33,0.1)] text-[#5B7611] dark:bg-[rgba(144,186,36,0.12)] dark:text-[#C3E165]"
          : "bg-[rgba(15,15,12,0.06)] text-[rgba(15,15,12,0.62)] dark:bg-[rgba(255,255,255,0.06)] dark:text-[rgba(255,255,255,0.62)]",
      )}
    >
      {label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Preview rail                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function PreviewRail({
  item,
  onRename,
  onDelete,
}: {
  item: NormalizedTemplate;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-5">
      {/* Kind eyebrow */}
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
        {item.kind === "setup" ? "Setup template" : "Distribution template"}
      </span>

      {/* Name */}
      <h2 className="mt-2 text-[15px] font-bold leading-[23px] tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
        {item.name}
      </h2>

      {/* Summary */}
      {item.summary && (
        <p className="mt-2 font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
          {item.summary}
        </p>
      )}

      {/* Divider */}
      <div className="my-4 h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

      {/* Metadata rows */}
      <dl className="space-y-2.5">
        <MetaRow label="Created" value={formatAbsolute(item.createdAt)} />
        <MetaRow label="Updated" value={relativeTime(item.updatedAt)} />
        <MetaRow label="ID" value={item.id} truncate />
      </dl>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2">
        <button
          onClick={onRename}
          className={cn(
            "h-9 w-full rounded-full px-4 text-[13px] font-medium transition-all",
            "border border-[#e7e5dc] bg-transparent text-[rgba(15,15,12,0.92)]",
            "hover:border-[#c8c5ba] hover:bg-[#F0F0EC]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821]",
            "dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.92)] dark:hover:border-[#3a3a3a] dark:hover:bg-[#1B1B1F]",
          )}
        >
          Rename
        </button>

        <button
          onClick={onDelete}
          className={cn(
            "h-9 w-full rounded-full px-4 text-[13px] font-medium transition-all",
            "border border-transparent bg-transparent text-[#cf1322]",
            "hover:border-[#ffccc7] hover:bg-[rgba(207,19,34,0.06)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf1322]",
            "dark:text-[#f37370] dark:hover:border-[rgba(243,115,112,0.25)] dark:hover:bg-[rgba(243,115,112,0.06)]",
          )}
        >
          Delete template
        </button>
      </div>

      {/* P2 note */}
      <p className="mt-4 font-mono text-[10px] leading-[15px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
        Apply this template from within the launch flow — open Step 2 or Step 3 and select a saved template.
      </p>
    </div>
  );
}

function MetaRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex-shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
        {label}
      </dt>
      <dd
        className={cn(
          "font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]",
          truncate && "min-w-0 truncate text-right",
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Zero states                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function RailZeroState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      {/* Abstract geometric motif */}
      <div className="relative mb-5 flex h-12 w-12 items-center justify-center">
        <div className="absolute inset-0 rounded-xl border-[1.5px] border-[#e7e5dc] dark:border-[#2a2a2a]" />
        <div className="absolute inset-[6px] rounded-lg border-[1.5px] border-[#c8c5ba] dark:border-[#3a3a3a]" />
        <LayersIcon className="relative z-10 h-4 w-4 text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]" />
      </div>
      <p className="text-[13px] font-medium text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        Select a template to preview
      </p>
      <p className="mt-1 font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
        Click any card on the left
      </p>
    </div>
  );
}

function TabEmptyState({
  tab,
  isFiltered,
}: {
  tab: ActiveTab;
  isFiltered: boolean;
}) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e7e5dc] bg-[#F0F0EC]/50 px-6 py-12 text-center dark:border-[#2a2a2a] dark:bg-[#1B1B1F]/50">
        <p className="text-[13px] font-medium text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
          No match
        </p>
        <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
          Try a different name
        </p>
      </div>
    );
  }

  const hint =
    tab === "setup"
      ? "No setup templates yet — save one from Step 2 in the launch flow"
      : "No distribution templates yet — save one from Step 3 in the launch flow";

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e7e5dc] bg-[#F0F0EC]/50 px-6 py-12 text-center dark:border-[#2a2a2a] dark:bg-[#1B1B1F]/50">
      <p className="font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        {hint}
      </p>
    </div>
  );
}

function FullEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-24 text-center">
      {/* Geometric motif — two stacked squares suggesting layers/files */}
      <div className="relative mb-6 h-16 w-16">
        <div className="absolute inset-0 rounded-2xl border-[1.5px] border-[#e7e5dc] bg-white dark:border-[#2a2a2a] dark:bg-[#1E1E23]" />
        <div className="absolute inset-[7px] rounded-xl border-[1.5px] border-[#c8c5ba] bg-[#F0F0EC] dark:border-[#3a3a3a] dark:bg-[#1B1B1F]" />
        <div className="absolute inset-[14px] flex items-center justify-center">
          <FileStackIcon className="h-5 w-5 text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]" />
        </div>
      </div>

      <h2 className="text-[15px] font-bold leading-[23px] tracking-[-0.01em] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
        No templates saved yet
      </h2>
      <p className="mt-2 max-w-[340px] font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        Templates are created from within the launch flow. Open Step 2 to save a Setup template, or Step 3 to save a Distribution template.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Rename dialog                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function RenameDialog({
  target,
  onClose,
  onSubmit,
}: {
  target: RenameTarget;
  onClose: () => void;
  onSubmit: (newName: string) => void;
}) {
  const open = target !== null;
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (target) {
      setName(target.name);
      // Focus deferred so the dialog animation doesn't interfere
      setTimeout(() => inputRef.current?.select(), 60);
    }
  }, [target]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed !== target?.name;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canSave) onSubmit(trimmed);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold tracking-[-0.01em]">
            Rename template
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px]">
            Update the template's display name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label
            htmlFor="rename-tpl-name"
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]"
          >
            Template name
          </Label>
          <input
            ref={inputRef}
            id="rename-tpl-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-9 w-full rounded-[28px] border border-[#e7e5dc] bg-white px-4",
              "font-mono text-[13px] text-[rgba(15,15,12,0.92)] placeholder:text-[rgba(15,15,12,0.38)]",
              "transition-all focus:border-[#8FB821] focus:outline-none",
              "focus:shadow-[0_0_0_4px_rgba(143,184,33,0.18)]",
              "dark:border-[#2a2a2a] dark:bg-[#1E1E23] dark:text-[rgba(255,255,255,0.92)]",
            )}
          />
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-medium transition-all",
              "border border-[#e7e5dc] text-[rgba(15,15,12,0.72)] hover:bg-[#F0F0EC]",
              "dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.72)] dark:hover:bg-[#1B1B1F]",
            )}
          >
            Cancel
          </button>
          <button
            onClick={() => canSave && onSubmit(trimmed)}
            disabled={!canSave}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-medium transition-all",
              "bg-[#8FB821] text-[#121212]",
              "hover:bg-[#AACF32] disabled:cursor-not-allowed disabled:opacity-40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821] focus-visible:ring-offset-2",
            )}
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Delete confirmation dialog                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function DeleteDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: DeleteTarget;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const open = target !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold tracking-[-0.01em]">
            Delete template?
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] leading-[19px]">
            This action cannot be undone. The template will be permanently removed from your saved templates.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <button
            onClick={onClose}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-medium transition-all",
              "border border-[#e7e5dc] text-[rgba(15,15,12,0.72)] hover:bg-[#F0F0EC]",
              "dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.72)] dark:hover:bg-[#1B1B1F]",
            )}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-medium transition-all",
              "bg-[#cf1322] text-white hover:bg-[#a8101b]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf1322] focus-visible:ring-offset-2",
            )}
          >
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Inline SVG icons (no emoji, no external deps)                              */
/* ────────────────────────────────────────────────────────────────────────── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 2L14 5.5L8 9L2 5.5L8 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2 9L8 12.5L14 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileStackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="6" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 6V5C7 3.895 7.895 3 9 3H11L14 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 10H13M7 13H11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

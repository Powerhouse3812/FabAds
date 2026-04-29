import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "../../mocks/brands";
import { productsForBrand } from "../../mocks/products";
import { categories } from "../../mocks/categories";
import { audiences, angles, concepts } from "../../mocks/library";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { useNewGenerationOverlay } from "../../shell/NewGenerationOverlay";

/**
 * Tree sidebar view (Track 4.3 — Notion / Figma style).
 *
 * Left pane: collapsible nested tree. Each brand is a top-level node;
 * children are Products / Audiences / Angles / Concepts / Variants sections,
 * each expandable to show items.
 *
 * Right pane: detail for the selected node.
 */

type SelectedNode =
  | { kind: "brand"; brandId: string }
  | { kind: "section"; brandId: string; section: string }
  | { kind: "leaf"; brandId: string; section: string; id: string }
  | null;

export function WorkspaceTree({
  tab,
  initialId,
}: {
  tab: "brands" | "categories";
  initialId?: string;
}) {
  const items = tab === "brands" ? brands : categories;
  const [selected, setSelected] = useState<SelectedNode>(
    initialId ? { kind: "brand", brandId: initialId } : null
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    initialId ? { [initialId]: true } : {}
  );
  const { open: openOverlay } = useNewGenerationOverlay();

  const toggleExpand = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex h-full">
      <aside className="w-[280px] flex-shrink-0 border-r border-g6-border-secondary overflow-y-auto">
        <ul className="py-2">
          {items.map((item) => {
            const isOpen = !!expanded[item.id];
            const sectionsExpanded = (sec: string) => !!expanded[`${item.id}:${sec}`];

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    toggleExpand(item.id);
                    setSelected({ kind: "brand", brandId: item.id });
                  }}
                  className={cn(
                    "flex w-full items-center gap-1 px-3 py-1.5 text-left text-g6-sm font-semibold transition-colors",
                    selected?.kind === "brand" && selected.brandId === item.id
                      ? "bg-g6-primary-bg text-g6-text"
                      : "text-g6-text hover:bg-g6-bg-spotlight"
                  )}
                >
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-g6-text-tertiary" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-g6-text-tertiary" />
                  )}
                  <span className="truncate">{item.name}</span>
                </button>

                {isOpen && tab === "brands" && (
                  <ul className="ml-4 border-l border-g6-border-secondary">
                    <SectionGroup
                      label="Products"
                      sectionKey={`${item.id}:products`}
                      expanded={sectionsExpanded("products")}
                      onToggle={() => toggleExpand(`${item.id}:products`)}
                      onClick={() => setSelected({ kind: "section", brandId: item.id, section: "products" })}
                      isSelected={
                        selected?.kind === "section" &&
                        selected.brandId === item.id &&
                        selected.section === "products"
                      }
                      items={productsForBrand(item.id).map((p) => ({ id: p.id, label: p.name }))}
                      onPickItem={(id) =>
                        setSelected({ kind: "leaf", brandId: item.id, section: "products", id })
                      }
                      selectedItemId={
                        selected?.kind === "leaf" && selected.section === "products"
                          ? selected.id
                          : null
                      }
                    />
                    <SectionGroup
                      label="Audiences"
                      sectionKey={`${item.id}:audiences`}
                      expanded={sectionsExpanded("audiences")}
                      onToggle={() => toggleExpand(`${item.id}:audiences`)}
                      onClick={() => setSelected({ kind: "section", brandId: item.id, section: "audiences" })}
                      isSelected={
                        selected?.kind === "section" &&
                        selected.brandId === item.id &&
                        selected.section === "audiences"
                      }
                      items={audiences
                        .filter((a) => !a.brandId || a.brandId === item.id)
                        .map((a) => ({ id: a.id, label: a.label }))}
                      onPickItem={(id) =>
                        setSelected({ kind: "leaf", brandId: item.id, section: "audiences", id })
                      }
                      selectedItemId={
                        selected?.kind === "leaf" && selected.section === "audiences"
                          ? selected.id
                          : null
                      }
                    />
                    <SectionGroup
                      label="Concepts"
                      sectionKey={`${item.id}:concepts`}
                      expanded={sectionsExpanded("concepts")}
                      onToggle={() => toggleExpand(`${item.id}:concepts`)}
                      onClick={() => setSelected({ kind: "section", brandId: item.id, section: "concepts" })}
                      isSelected={
                        selected?.kind === "section" &&
                        selected.brandId === item.id &&
                        selected.section === "concepts"
                      }
                      items={concepts
                        .filter((c) => c.brandId === item.id)
                        .map((c) => ({ id: c.id, label: c.name }))}
                      onPickItem={(id) =>
                        setSelected({ kind: "leaf", brandId: item.id, section: "concepts", id })
                      }
                      selectedItemId={
                        selected?.kind === "leaf" && selected.section === "concepts"
                          ? selected.id
                          : null
                      }
                    />
                    <SectionGroup
                      label="Variants"
                      sectionKey={`${item.id}:variants`}
                      expanded={sectionsExpanded("variants")}
                      onToggle={() => toggleExpand(`${item.id}:variants`)}
                      onClick={() => setSelected({ kind: "section", brandId: item.id, section: "variants" })}
                      isSelected={
                        selected?.kind === "section" &&
                        selected.brandId === item.id &&
                        selected.section === "variants"
                      }
                      items={sampleOutputs
                        .filter((o) => o.brand?.name === item.name)
                        .map((o) => ({ id: o.id, label: o.headline ?? "Untitled" }))}
                      onPickItem={(id) =>
                        setSelected({ kind: "leaf", brandId: item.id, section: "variants", id })
                      }
                      selectedItemId={
                        selected?.kind === "leaf" && selected.section === "variants"
                          ? selected.id
                          : null
                      }
                    />
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="flex-1 overflow-y-auto p-6">
        {!selected && (
          <p className="text-g6-base text-g6-text-tertiary">Pick a node from the tree to see details.</p>
        )}
        {selected?.kind === "brand" && (
          <BrandDetail
            brandId={selected.brandId}
            onGenerate={() => openOverlay({ brandId: selected.brandId, source: "workspace" })}
          />
        )}
        {selected?.kind === "section" && (
          <p className="text-g6-base text-g6-text-secondary">
            {selected.section} for {brands.find((b) => b.id === selected.brandId)?.name}
          </p>
        )}
        {selected?.kind === "leaf" && (
          <p className="text-g6-base text-g6-text-secondary">
            Selected {selected.section} · {selected.id}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionGroup({
  label,
  sectionKey: _sectionKey,
  expanded,
  onToggle,
  onClick,
  isSelected,
  items,
  onPickItem,
  selectedItemId,
}: {
  label: string;
  sectionKey: string;
  expanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  isSelected: boolean;
  items: Array<{ id: string; label: string }>;
  onPickItem: (id: string) => void;
  selectedItemId: string | null;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          onToggle();
          onClick();
        }}
        className={cn(
          "flex w-full items-center gap-1 px-3 py-1 text-left text-g6-xs font-medium uppercase tracking-wider transition-colors",
          isSelected ? "text-g6-primary" : "text-g6-text-tertiary hover:text-g6-text"
        )}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {label} <span className="font-g6-mono">({items.length})</span>
      </button>
      {expanded && (
        <ul className="ml-4 border-l border-g6-border-secondary">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onPickItem(it.id)}
                className={cn(
                  "block w-full truncate px-3 py-1 text-left text-g6-sm transition-colors",
                  selectedItemId === it.id
                    ? "bg-g6-primary-bg text-g6-text"
                    : "text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text"
                )}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function BrandDetail({ brandId, onGenerate }: { brandId: string; onGenerate: () => void }) {
  const brand = brands.find((b) => b.id === brandId);
  if (!brand) return null;
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-g6-h3 font-bold text-g6-text">{brand.name}</h2>
        <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{brand.domain}</p>
        <p className="text-g6-base text-g6-text-secondary">{brand.tone}</p>
      </header>
      <button
        type="button"
        onClick={onGenerate}
        className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-3 py-1 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn"
      >
        Generate
      </button>
    </div>
  );
}

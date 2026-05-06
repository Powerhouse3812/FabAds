import { Lightbulb } from "lucide-react";
import { PickerColumn } from "@/genie6/generate-v3/components/PickerColumn";
import { ConceptsStrip, type ConceptSource } from "./ConceptsStrip";

/**
 * ConceptsDrawer — A-11.24.
 *
 * Wraps <ConceptsStrip> (Saved/New toggle + Regenerate + concept cards)
 * in <PickerDrawer>. Empty selection at submit means "let AI decide".
 */

export interface ConceptsDrawerProps {
  open: boolean;
  onClose: () => void;
  source: ConceptSource;
  onSourceChange: (next: ConceptSource) => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function ConceptsDrawer({
  open,
  onClose,
  source,
  onSourceChange,
  selectedIds,
  onToggle,
}: ConceptsDrawerProps) {
  return (
    <PickerColumn
      open={open}
      onClose={onClose}
      icon={Lightbulb}
      title="Browse concepts"
      sub={
        selectedIds.length === 0
          ? "Empty = AI decides at generation"
          : `${selectedIds.length} selected`
      }
    >
      <ConceptsStrip
        source={source}
        onSourceChange={onSourceChange}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </PickerColumn>
  );
}

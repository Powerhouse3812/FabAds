import { Wand2 } from "lucide-react";
import { PickerColumn } from "@/genie6/generate-v3/components/PickerColumn";
import { AnglePicker } from "./AnglePicker";

/**
 * AngleDrawer — A-11.24.
 *
 * Wraps <AnglePicker> (8-variant SVG mockup grid) in <PickerDrawer>.
 */

export interface AngleDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function AngleDrawer({
  open,
  onClose,
  selectedIds,
  onToggle,
}: AngleDrawerProps) {
  return (
    <PickerColumn
      open={open}
      onClose={onClose}
      icon={Wand2}
      title="Choose angles"
      sub={`${selectedIds.length} selected · multi-select for parallel render`}
    >
      <AnglePicker selectedIds={selectedIds} onToggle={onToggle} />
    </PickerColumn>
  );
}

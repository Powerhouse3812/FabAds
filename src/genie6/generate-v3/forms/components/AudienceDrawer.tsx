import { Users } from "lucide-react";
import { PickerColumn } from "@/genie6/generate-v3/components/PickerColumn";
import { AudiencePicker } from "./AudiencePicker";
import type { Audience } from "@/genie6/generate-v3/mocks/audiences";

/**
 * AudienceDrawer — A-11.24.
 *
 * Wraps <AudiencePicker> in <PickerDrawer>. Drawer body is the existing
 * picker — multi-select persona cards + create-custom CTA.
 */

export interface AudienceDrawerProps {
  open: boolean;
  onClose: () => void;
  audiences: Audience[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: () => void;
}

export function AudienceDrawer({
  open,
  onClose,
  audiences,
  selectedIds,
  onToggle,
  onCreate,
}: AudienceDrawerProps) {
  return (
    <PickerColumn
      open={open}
      onClose={onClose}
      icon={Users}
      title="Browse audiences"
      sub={`${selectedIds.length} selected · scan-and-pick`}
    >
      <AudiencePicker
        audiences={audiences}
        selectedIds={selectedIds}
        onToggle={onToggle}
        onCreate={onCreate}
      />
    </PickerColumn>
  );
}

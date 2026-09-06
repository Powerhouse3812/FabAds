import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppField } from "../appTypes";

type SelectFieldSpec = Extract<AppField, { kind: "select" }>;

interface SelectFieldProps {
  field: SelectFieldSpec;
  value: string | undefined;
  onChange: (value: string) => void;
}

/** Plain closed-list select (e.g. target resolution, frame rate). Radix
 *  Select is exempt from the no-outside-click-dismiss rule (§ app-wide). */
export function SelectField({ field, value, onChange }: SelectFieldProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="rounded-[28px]" aria-label={field.label}>
        <SelectValue placeholder={`Choose ${field.label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {field.options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className="flex flex-col">
              <span>{opt.label}</span>
              {opt.desc && (
                <span className="text-[11px] font-normal text-muted-foreground">{opt.desc}</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

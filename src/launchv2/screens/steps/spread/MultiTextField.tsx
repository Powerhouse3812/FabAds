/**
 * MultiTextField — a primary field value + a list of extra "variation" values,
 * capped at `max` total (Meta Advantage+ allows up to 5 text options each for
 * primary text / headline / description). When `multiline` is set the inputs are
 * textareas (primary text), otherwise single-line Inputs (headline/description).
 *
 * The first row edits the base value (e.g. adCopy.primaryText); subsequent rows
 * edit the variations array (e.g. adCopy.textVariations).
 */
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function MultiTextField({
  label,
  value,
  variations,
  onValueChange,
  onVariationsChange,
  placeholder,
  multiline = false,
  rows = 3,
  max = 5,
}: {
  label: string;
  value: string;
  variations: string[];
  onValueChange: (v: string) => void;
  onVariationsChange: (v: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  max?: number;
}) {
  // total = base value (1) + variations.length
  const total = 1 + variations.length;
  const canAdd = total < max;

  const renderInput = (
    val: string,
    onChange: (v: string) => void,
    ph: string,
  ) =>
    multiline ? (
      <Textarea
        rows={rows}
        value={val}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        className="resize-none text-sm"
      />
    ) : (
      <Input
        value={val}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        className="text-sm"
      />
    );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {label}{" "}
          <span className="font-mono tabular-nums text-muted-foreground/60">
            {total}/{max}
          </span>
        </span>
        {canAdd && (
          <button
            type="button"
            onClick={() => onVariationsChange([...variations, ""])}
            className="flex items-center gap-1 text-[11px] font-medium text-foreground hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add option
          </button>
        )}
      </div>

      {/* Base value (option 1) */}
      <div className="flex items-start gap-1.5">
        {renderInput(value, onValueChange, placeholder ?? "Option 1")}
      </div>

      {/* Variations (option 2..max) */}
      {variations.map((v, i) => (
        <div key={i} className="flex items-start gap-1.5">
          {renderInput(
            v,
            (nv) => onVariationsChange(variations.map((x, j) => (j === i ? nv : x))),
            `Option ${i + 2}`,
          )}
          <button
            type="button"
            onClick={() => onVariationsChange(variations.filter((_, j) => j !== i))}
            aria-label="Remove option"
            className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

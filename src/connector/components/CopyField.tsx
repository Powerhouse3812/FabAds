/**
 * CopyField — a read-only value with a copy button.
 *
 * Used wherever the Connector surface shows a value the user is expected to
 * copy verbatim (a one-time access token, an MCP server URL) rather than
 * read or edit. Pairs a readOnly `Input` with an outline icon `Button` that
 * flips `Copy` → `Check` for a moment after a successful copy, following the
 * pattern already used in `InviteMemberDialog` (readOnly Input + icon Button
 * + copied state + toast) and `HowThisWasMade`'s `CopyButton` (stopPropagation
 * + a documented try/catch around the Clipboard API).
 *
 * The clipboard + "copied" flip logic is extracted into `useCopy()` below so
 * `ConfigSnippetBlock` can reuse it instead of duplicating the try/catch.
 */
import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

/** How long the icon stays flipped to `Check` after a successful copy. */
const COPY_FEEDBACK_MS = 1800;

/**
 * Shared clipboard-copy behavior: writes `text` to the clipboard, flips
 * `copied` to true for `COPY_FEEDBACK_MS`, and toasts success or failure.
 *
 * `navigator.clipboard.writeText` genuinely throws in insecure contexts
 * (non-HTTPS, some embedded webviews) — that failure is surfaced as a
 * destructive toast telling the user to copy manually, never swallowed.
 *
 * The pending revert timer is cleared on unmount so a component that copies
 * and is then torn down before the timeout fires never calls `setState` on
 * a dead component.
 */
export function useCopy() {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = React.useCallback(async (text: string, toastLabel?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied", description: `${toastLabel ?? "Value"} copied to clipboard.` });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      // The Clipboard API genuinely throws in insecure contexts — never fail
      // silently, tell the user how to recover.
      toast({
        variant: "destructive",
        title: "Couldn't copy",
        description: "Select the text and copy it manually.",
      });
    }
  }, []);

  return { copied, copy };
}

/**
 * Renders a masked preview of `value` for display only — first few and last
 * four characters visible, the rest replaced with bullets. The copy button
 * always copies the real `value` passed in; masking is a visual affordance
 * only, never a second source of truth.
 */
function maskValue(value: string): string {
  if (value.length <= 6) return "•".repeat(value.length);
  const prefixLen = Math.min(7, Math.floor(value.length / 3));
  return `${value.slice(0, prefixLen)}••••${value.slice(-4)}`;
}

export interface CopyFieldProps {
  value: string;
  label?: string;
  ariaLabel: string;
  monospace?: boolean;
  masked?: boolean;
  toastLabel?: string;
  className?: string;
}

export function CopyField({
  value,
  label,
  ariaLabel,
  monospace,
  masked,
  toastLabel,
  className,
}: CopyFieldProps) {
  const { copied, copy } = useCopy();
  const displayValue = masked ? maskValue(value) : value;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <Input
          readOnly
          dir="ltr"
          value={displayValue}
          aria-label={ariaLabel}
          className={cn(
            "min-w-0 overflow-x-auto whitespace-nowrap",
            monospace && "font-mono text-sm",
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => copy(value, toastLabel)}
          aria-label={ariaLabel}
          className="shrink-0"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      {/* Announces the copy for screen-reader users; the icon flip alone is silent. */}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}

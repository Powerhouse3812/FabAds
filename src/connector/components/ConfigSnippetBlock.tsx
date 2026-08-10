/**
 * ConfigSnippetBlock — a dark code block showing the MCP config a user
 * pastes into their agent (Claude Desktop, Cursor, VS Code, ...), with a
 * filename header and a copy button.
 *
 * No syntax highlighter is installed in this repo (no prism / shiki /
 * react-syntax-highlighter) and none is added here — this renders plain
 * monospace text via `<pre>`, never `dangerouslySetInnerHTML` (the snippet
 * contains user-controlled values: token, connection name, etc.).
 *
 * Reuses `useCopy()` from `CopyField.tsx` rather than re-implementing the
 * clipboard try/catch + "copied" flip + toast here.
 */
import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/connector/components/CopyField";

export interface ConfigSnippetPair {
  key: string;
  value: string;
}

export interface ConfigSnippetBlockProps {
  /** "~/.cursor/mcp.json" — null = no file needed. */
  filename: string | null;
  /** Plain text, already assembled by the caller. Used when `pairs` is null/omitted. */
  code: string;
  /** Key/value alternative to `code`. Exactly one of `code` / `pairs` is meaningful. */
  pairs?: ConfigSnippetPair[] | null;
  className?: string;
}

/** Flattens `pairs` into the same plain-text shape a user would paste, for the clipboard. */
function flattenPairs(pairs: ConfigSnippetPair[]): string {
  return pairs.map((p) => `${p.key}: ${p.value}`).join("\n");
}

export function ConfigSnippetBlock({ filename, code, pairs, className }: ConfigSnippetBlockProps) {
  const { copied, copy } = useCopy();
  const hasPairs = Array.isArray(pairs);
  const textToCopy = hasPairs ? flattenPairs(pairs as ConfigSnippetPair[]) : code;
  const toastLabel = filename ?? "Config";

  return (
    <div className={cn("overflow-hidden rounded-md border border-border", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/60 px-3 py-2">
        <span className="truncate font-mono text-xs text-muted-foreground">
          {/* Counted, not hardcoded: an OAuth connection is handed the server
              URL alone, and a header that says "two values" over a list of one
              is the kind of small lie that makes a user distrust the rest. */}
          {filename ??
            (hasPairs && (pairs as ConfigSnippetPair[]).length === 1
              ? "No file needed — paste this value"
              : "No file needed — paste these values")}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => copy(textToCopy, toastLabel)}
          aria-label={`Copy ${toastLabel}`}
          className="h-7 w-7 shrink-0"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div className="bg-muted">
        {hasPairs ? (
          // Two-column key/value list. Kept inside the same scroll/height
          // envelope (`max-h-72 overflow-y-auto`, dir="ltr") the <pre> path
          // uses below, since a dl of key/value rows isn't literal
          // preformatted text but must behave the same way when the list
          // is long or a value is wide.
          <dl
            dir="ltr"
            className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 overflow-x-auto p-3 max-h-72 overflow-y-auto font-mono text-[11px] leading-relaxed"
          >
            {(pairs as ConfigSnippetPair[]).map((pair) => (
              <React.Fragment key={pair.key}>
                <dt className="whitespace-nowrap text-muted-foreground">{pair.key}</dt>
                <dd className="break-words text-foreground/90">{pair.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        ) : (
          <pre
            dir="ltr"
            className="whitespace-pre-wrap break-words overflow-x-auto max-h-72 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-foreground/90"
          >
            {code}
          </pre>
        )}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}

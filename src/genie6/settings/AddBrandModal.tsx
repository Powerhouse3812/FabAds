import { useState } from "react";
import { Link, FileSpreadsheet, Pencil, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AddMethod = "url" | "csv" | "manual" | "demo";

const METHODS: { id: AddMethod; label: string; description: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "url", label: "Fetch by URL", description: "Paste your brand homepage. AI extracts logo, colors, fonts, voice, products.", Icon: Link },
  { id: "csv", label: "Upload CSV", description: "Bulk import multiple brands from a spreadsheet.", Icon: FileSpreadsheet },
  { id: "manual", label: "Manual entry", description: "Enter brand details by hand. Use when AI extraction won't work.", Icon: Pencil },
  { id: "demo", label: "Try a demo", description: "Mamaearth pre-loaded. 0 credits — risk-free first generation.", Icon: Sparkles },
];

export function AddBrandModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<AddMethod | null>(null);
  const [url, setUrl] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setMethod(null); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="g6-root max-w-xl border-g6-border bg-g6-bg-elevated text-g6-text">
        <DialogHeader>
          <DialogTitle className="font-g6-sans text-g6-h4 font-semibold text-g6-text">
            {method ? METHODS.find((m) => m.id === method)?.label : "Add a brand"}
          </DialogTitle>
        </DialogHeader>

        {method === null && (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {METHODS.map(({ id, label, description, Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setMethod(id)}
                  className={cn(
                    "flex h-full w-full flex-col items-start gap-2 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 text-left transition-colors",
                    "hover:border-g6-primary-border hover:bg-g6-primary-bg"
                  )}
                >
                  <Icon className="h-5 w-5 text-g6-primary-active" />
                  <span className="font-g6-sans text-g6-base font-semibold text-g6-text">
                    {label}
                  </span>
                  <span className="text-g6-sm text-g6-text-secondary">{description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {method === "url" && (
          <div className="space-y-3">
            <label className="block font-g6-sans text-g6-sm text-g6-text-secondary">
              Brand homepage
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourbrand.com"
                className="mt-1 block w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 py-2 font-g6-mono text-g6-base text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
              />
            </label>
            <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">
              AI will fetch logo, colors, fonts, voice, products. ~30s.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMethod(null)}
                className="h-9 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-4 font-g6-sans text-g6-sm text-g6-text-secondary hover:bg-g6-bg-spotlight"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={!url}
                className="h-9 rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover disabled:opacity-50"
              >
                Fetch brand
              </button>
            </div>
          </div>
        )}

        {(method === "csv" || method === "manual" || method === "demo") && (
          <div className="space-y-3">
            <p className="text-g6-base text-g6-text-secondary">
              Phase B wires this method's full flow. For now, the picker confirms structure.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMethod(null)}
                className="h-9 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-4 font-g6-sans text-g6-sm text-g6-text-secondary hover:bg-g6-bg-spotlight"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

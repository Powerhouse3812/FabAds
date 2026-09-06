import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCredits } from "../../lib/credits";
import type { RunItem } from "../../lib/genieRunTypes";

/**
 * "View details" (§8 results anatomy). Most Other-Apps items carry no
 * `outputId` — an app output has no ad copy for the Library's AdDetailDrawer
 * to show — so this is a lightweight local dialog covering what a RunItem
 * itself knows, with an "Open in Library" link when an outputId IS present.
 */
export function RunItemDetailsDialog({ item, children }: { item: RunItem; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          {item.summary && <DialogDescription>{item.summary}</DialogDescription>}
        </DialogHeader>

        {item.thumbnail && (
          <div className="overflow-hidden rounded-xl bg-muted">
            <img src={item.thumbnail} alt="" className="aspect-video w-full object-cover" />
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="text-right font-mono capitalize text-foreground">{item.status}</dd>
          <dt className="text-muted-foreground">Credits</dt>
          <dd className="text-right font-mono text-foreground">{formatCredits(item.credits)}</dd>
          <dt className="text-muted-foreground">Output</dt>
          <dd className="text-right font-mono text-foreground">
            {item.index} of batch
          </dd>
        </dl>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {item.outputId && (
          <Link
            to={`/iq/genie6/library?ad=${encodeURIComponent(item.outputId)}`}
            className="inline-flex items-center gap-1 self-start text-[12.5px] font-medium text-primary hover:underline"
          >
            Open in Library
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </DialogContent>
    </Dialog>
  );
}

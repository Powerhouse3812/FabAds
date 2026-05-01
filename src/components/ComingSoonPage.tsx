import { Clock } from "lucide-react";

/**
 * Generic "coming soon" placeholder for FabAds-wide modules that are
 * wired in the nav but not yet implemented.
 */
export function ComingSoonPage({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-20">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{label}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? "This module is being built and will be available soon."}
        </p>
      </div>
    </div>
  );
}

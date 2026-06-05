import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/launch2/components";
import { useLaunch2Variant, VARIANT_META } from "@/launch2/shell/useLaunch2Variant";
import { MissionControlHome } from "./variants/MissionControlHome";

/**
 * Launch 2.0 — Home variant router (dev-only toggle, Maalik).
 *
 * Mission Control is the active build. Ops Console & Launchpad are wired in
 * the variant store but render a tasteful placeholder until built — with a
 * one-click jump back to the live variant.
 */
export function Launch2Home() {
  const { variant, setVariant } = useLaunch2Variant();

  if (variant === "mission") return <MissionControlHome />;

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-16 font-g6-sans">
      <EmptyState
        className="w-full max-w-lg"
        icon={<Construction className="h-5 w-5" />}
        title="This variant isn't built yet"
        description={`${VARIANT_META[variant].label} — ${VARIANT_META[variant].hint}. Mission Control is the active build — Ops Console & Launchpad come next.`}
        action={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setVariant("mission")}
          >
            Go to Mission Control
          </Button>
        }
      />
    </div>
  );
}

/**
 * LaunchV2Settings — Launch v2 Settings shell at /launchv2/settings.
 *
 * For v1 the shell hosts a single section (Templates). It is structured so a
 * tab/sidebar nav can be added later (Workspace, Account-Health, etc.) without
 * refactoring TemplatesSection.
 */
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TemplatesSection from "./settings/TemplatesSection";

export default function LaunchV2Settings() {
  const navigate = useNavigate();

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/launchv2")}
              aria-label="Back to Launch flow"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-lg font-semibold">Launch settings</h1>
        </div>

        <TemplatesSection />
      </div>
    </div>
  );
}

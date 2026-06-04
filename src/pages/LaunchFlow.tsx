import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { LaunchStepper } from "@/components/launch/LaunchStepper";
import { StepAccountSetup } from "@/components/launch/StepAccountSetup";
import { StepTargeting } from "@/components/launch/StepTargeting";
import { StepCreatives } from "@/components/launch/StepCreatives";
import { useLaunchFull } from "@/hooks/use-launch-data";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const CatalogueAdsFlow = lazy(() => import("@/pages/CatalogueAdsFlow"));

export default function LaunchFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get("folderId");
  const campaignUrlId = searchParams.get("campaignUrlId");
  const templateId = searchParams.get("templateId");
  const isCatalogueMode = searchParams.get("mode") === "catalogue";
  const [currentStep, setCurrentStep] = useState(1);
  const [launchId, setLaunchId] = useState<string | undefined>(id);
  const { data: launchData, isLoading } = useLaunchFull(launchId);

  const isCatalogue = isCatalogueMode || (launchData?.launch_config as any)?.mode === "catalogue";
  const completedStep = launchData?.completed_step ?? 0;

  // On load with existing launch, resume at the next incomplete step
  useEffect(() => {
    if (launchData && id && !isCatalogue) {
      const resumeStep = Math.min((launchData.completed_step || 0) + 1, 3);
      setCurrentStep(resumeStep);
    }
  }, [launchData?.id]); // only on initial load

  const handleStepChange = useCallback((targetStep: number) => {
    if (targetStep < currentStep) { setCurrentStep(targetStep); return; }
    if (targetStep > completedStep + 1) { toast({ title: "Complete the current step first", variant: "destructive" }); return; }
    if (targetStep > currentStep && currentStep > completedStep) { toast({ title: "Save current step before jumping ahead", variant: "destructive" }); return; }
    setCurrentStep(targetStep);
  }, [currentStep, completedStep]);

  const handleLaunchCreated = useCallback((newId: string) => { setLaunchId(newId); navigate(`/launch/${newId}`, { replace: true }); setCurrentStep(2); }, [navigate]);
  const handleNext = useCallback(() => setCurrentStep((s) => Math.min(s + 1, 3)), []);
  const handleBack = useCallback(() => setCurrentStep((s) => Math.max(s - 1, 1)), []);

  // New catalogue launch (no data yet) — setup mode
  if (isCatalogueMode && !launchData && !isLoading) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>}>
        <CatalogueAdsFlow launchData={null} />
      </Suspense>
    );
  }

  // Existing catalogue launch — 3-column flow
  if (isCatalogue && launchData) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>}>
        <CatalogueAdsFlow launchData={launchData} />
      </Suspense>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/launch" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{launchData?.name || (id ? "Edit Launch" : "New Launch")}</h1>
          <p className="text-muted-foreground text-sm">Configure your Facebook ad launch.</p>
        </div>
      </div>
      <LaunchStepper currentStep={currentStep} completedStep={completedStep} onStepChange={handleStepChange} />
      {currentStep === 1 && <StepAccountSetup launchId={launchId} launchData={launchData} onCreated={handleLaunchCreated} onNext={handleNext} folderId={folderId} campaignUrlId={campaignUrlId} />}
      {currentStep === 2 && launchId && launchData && <StepTargeting launchData={launchData} onNext={handleNext} onBack={handleBack} campaignUrlId={campaignUrlId} templateId={templateId} />}
      {currentStep === 3 && launchId && launchData && <StepCreatives launchData={launchData} onBack={handleBack} />}
      {isLoading && launchId && currentStep > 1 && <div className="flex items-center justify-center py-12 text-muted-foreground">Loading launch data...</div>}
    </div>
  );
}

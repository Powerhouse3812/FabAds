import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Zap, ArrowRight, ArrowLeft, Globe, Sparkles,
  Check, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Genie5SelectionSummary } from "./Genie5SelectionSummary";

const pageVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const NICHES = [
  "Auto Insurance", "Weight Loss", "Solar", "Medicare",
  "Debt Relief", "Home Insurance", "CBD", "Finance",
];

function LoadingStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 shrink-0",
        done ? "bg-primary shadow-sm shadow-primary/20" : "border border-border animate-pulse"
      )}>
        {done && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
      </div>
      <span className={cn(
        "text-[13px] transition-colors duration-300",
        done ? "text-foreground font-medium" : "text-muted-foreground"
      )}>{label}</span>
    </div>
  );
}

export default function Genie5QuickStart() {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<null | "ecommerce" | "affiliate">(null);

  // Ecom state
  const [ecomUrl, setEcomUrl] = useState("");
  const [ecomName, setEcomName] = useState("");
  const [ecomStep, setEcomStep] = useState(0);
  const [ecomLoading, setEcomLoading] = useState<boolean[]>([false, false, false, false]);

  // Affiliate state
  const [affName, setAffName] = useState("");
  const [affNiche, setAffNiche] = useState("");
  const [affStep, setAffStep] = useState(0);
  const [affLoading, setAffLoading] = useState<boolean[]>([false, false, false]);

  const ecomLabels = ["Scanning website...", "Extracting products...", "Detecting brand identity...", "Building creative workspace..."];
  const affLabels = ["Analyzing niche...", "Building creative memory...", "Preparing workspace..."];

  const startEcomAnalysis = () => {
    setEcomStep(1);
    ecomLabels.forEach((_, i) => {
      setTimeout(() => setEcomLoading(prev => { const n = [...prev]; n[i] = true; return n; }), 1000 + i * 1500);
    });
    setTimeout(() => setEcomStep(2), 1000 + ecomLabels.length * 1500 + 800);
  };

  const startAffPrep = () => {
    setAffStep(1);
    affLabels.forEach((_, i) => {
      setTimeout(() => setAffLoading(prev => { const n = [...prev]; n[i] = true; return n; }), 800 + i * 1200);
    });
    setTimeout(() => setAffStep(2), 800 + affLabels.length * 1200 + 600);
  };

  const summaryItems = flow === "ecommerce"
    ? [ecomName && { label: "Brand", value: ecomName }, ecomUrl && { label: "URL", value: ecomUrl }].filter(Boolean) as { label: string; value: string }[]
    : [affName && { label: "Workspace", value: affName }, affNiche && { label: "Niche", value: affNiche }].filter(Boolean) as { label: string; value: string }[];

  const stepLabels = flow === "ecommerce"
    ? ["Choose Mode", "Input", "Processing", "Done"]
    : ["Choose Mode", "Input", "Processing", "Done"];
  const currentStepIndex = flow === null ? 0 : (flow === "ecommerce" ? ecomStep + 1 : affStep + 1);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[500px] mb-8 relative z-10">
        <div className="flex gap-1">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={cn("h-1 rounded-full transition-all duration-500", i < currentStepIndex ? "bg-primary" : "bg-muted")} />
              <p className={cn("text-[9px] mt-1.5 font-medium tracking-wide", i < currentStepIndex ? "text-primary" : "text-muted-foreground/50")}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          {/* Step 1: Choose mode */}
          {flow === null && (
            <motion.div key="choose" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[500px]">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Quick Start</h2>
              <p className="text-sm text-muted-foreground mb-8">Get up and running in under a minute.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setFlow("ecommerce")} className="group text-left rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground">E-commerce</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Paste your store URL, we'll do the rest</p>
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold mt-4 group-hover:gap-2 transition-all">
                    Start <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
                <button onClick={() => setFlow("affiliate")} className="group text-left rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <Zap className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Affiliate / Ad Lab</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Pick a niche and start generating</p>
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold mt-4 group-hover:gap-2 transition-all">
                    Start <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Ecom: Input */}
          {flow === "ecommerce" && ecomStep === 0 && (
            <motion.div key="ecom-input" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[480px]">
              <button onClick={() => setFlow(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Set Up Your Brand</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Paste your website URL and we'll extract everything automatically.</p>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Brand Name</label>
                  <Input value={ecomName} onChange={e => setEcomName(e.target.value)} placeholder="e.g. GlowSkin Co" className="h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input value={ecomUrl} onChange={e => setEcomUrl(e.target.value)} placeholder="https://yourstore.com" className="h-11 pl-10" />
                  </div>
                </div>
              </div>
              <Button onClick={startEcomAnalysis} className="w-full mt-8 h-11" disabled={!ecomUrl}>
                <Sparkles className="h-4 w-4 mr-2" /> Analyze Brand
              </Button>
            </motion.div>
          )}

          {/* Ecom: Processing */}
          {flow === "ecommerce" && ecomStep === 1 && (
            <motion.div key="ecom-load" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[420px]">
              {summaryItems.length > 0 && <div className="mb-8"><Genie5SelectionSummary items={summaryItems} /></div>}
              <div className="text-center mb-10">
                <div className="relative mx-auto mb-6" style={{ width: 72, height: 72 }}>
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                  <div className="absolute inset-1 rounded-full border-2 border-t-primary border-r-primary/30 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Globe className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-foreground">Analyzing Your Website</h2>
                <p className="text-xs text-muted-foreground mt-1">{ecomUrl || "yourstore.com"}</p>
              </div>
              <div className="space-y-4">
                {ecomLabels.map((label, i) => (
                  <LoadingStep key={i} label={label} done={ecomLoading[i]} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Ecom: Done */}
          {flow === "ecommerce" && ecomStep === 2 && (
            <motion.div key="ecom-done" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[500px]">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                  <Check className="h-7 w-7 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Brand Ready!</h2>
                <p className="text-xs text-muted-foreground mt-1">Your brand has been analyzed and is ready for generation.</p>
              </div>
              <Card className="mb-6">
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-[13px]">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Brand</span>
                      <p className="text-foreground font-semibold mt-1">{ecomName || "GlowSkin Co"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Products Found</span>
                      <p className="text-foreground font-semibold mt-1">24 products</p>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Detected Style</span>
                    <div className="flex items-center gap-2 mt-2">
                      {["hsl(var(--primary))", "hsl(220,70%,55%)", "hsl(0,0%,96%)", "hsl(220,40%,13%)"].map((c, i) => (
                        <div key={i} className="w-7 h-7 rounded-md border border-border" style={{ backgroundColor: c }} />
                      ))}
                      <span className="text-[11px] text-muted-foreground ml-2">Modern · Clean</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Button onClick={() => navigate("/iq/genie5")} className="w-full h-11">
                <Sparkles className="h-4 w-4 mr-2" /> Start Creating
              </Button>
            </motion.div>
          )}

          {/* Affiliate: Input */}
          {flow === "affiliate" && affStep === 0 && (
            <motion.div key="aff-input" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[480px]">
              <button onClick={() => setFlow(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-accent-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Set Up Your Ad Lab</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Choose a niche and let AI build your creative engine.</p>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace Name</label>
                  <Input value={affName} onChange={e => setAffName(e.target.value)} placeholder="e.g. Auto Insurance Q2" className="h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category / Niche</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map(n => (
                      <button key={n} onClick={() => setAffNiche(n)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                          affNiche === n ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
                        )}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={startAffPrep} className="w-full mt-8 h-11" disabled={!affNiche}>
                <Sparkles className="h-4 w-4 mr-2" /> Create Workspace
              </Button>
            </motion.div>
          )}

          {/* Affiliate: Processing */}
          {flow === "affiliate" && affStep === 1 && (
            <motion.div key="aff-load" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[420px]">
              {summaryItems.length > 0 && <div className="mb-8"><Genie5SelectionSummary items={summaryItems} /></div>}
              <div className="text-center mb-10">
                <div className="relative mx-auto mb-6" style={{ width: 72, height: 72 }}>
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                  <div className="absolute inset-1 rounded-full border-2 border-t-primary border-r-primary/30 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-foreground">Preparing Your Ad Lab</h2>
                <p className="text-xs text-muted-foreground mt-1">{affNiche}</p>
              </div>
              <div className="space-y-4">
                {affLabels.map((label, i) => (
                  <LoadingStep key={i} label={label} done={affLoading[i]} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Affiliate: Done */}
          {flow === "affiliate" && affStep === 2 && (
            <motion.div key="aff-done" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[500px]">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                  <Check className="h-7 w-7 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Workspace Ready!</h2>
                <p className="text-xs text-muted-foreground mt-1">Your Ad Lab is configured and ready for action.</p>
              </div>
              <Card className="mb-6">
                <CardContent className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-[13px]">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Workspace</span>
                      <p className="text-foreground font-semibold mt-1">{affName || "Ad Lab"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Niche</span>
                      <p className="text-foreground font-semibold mt-1">{affNiche}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Button onClick={() => navigate("/iq/genie5")} className="w-full h-11">
                <Sparkles className="h-4 w-4 mr-2" /> Start Creating
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Zap, ArrowRight, ArrowLeft, Globe, Sparkles,
  Check, Palette, Package, TrendingUp, Wand2, Edit3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Genie5SelectionSummary } from "./Genie5SelectionSummary";
import { toast } from "sonner";

const pageVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const NICHES = ["Auto Insurance", "Weight Loss", "Solar", "Medicare", "Debt Relief", "Home Insurance", "CBD", "Finance"];

const MOCK_PRODUCTS = [
  { name: "Vitamin C Serum", price: "$29.99", img: "🧴" },
  { name: "Hyaluronic Cream", price: "$34.99", img: "✨" },
  { name: "Retinol Night Oil", price: "$42.99", img: "🌙" },
  { name: "SPF 50 Sunscreen", price: "$19.99", img: "☀️" },
];

const MOCK_TRENDS = ["UGC Style", "Before/After", "Ingredient Focus", "Social Proof", "Urgency/FOMO"];

const MOCK_STRATEGIES = [
  { id: "s1", title: "Before/After Transformation", hook: "See the difference in just 7 days" },
  { id: "s2", title: "Social Proof Authority", hook: "Join 50K+ satisfied customers" },
  { id: "s3", title: "Problem-Solution", hook: "Tired of X? Here's the fix." },
];

const DEMO_RESULTS = [
  { id: "r1", url: "https://picsum.photos/seed/g5ai1/600/450" },
  { id: "r2", url: "https://picsum.photos/seed/g5ai2/600/450" },
  { id: "r3", url: "https://picsum.photos/seed/g5ai3/600/450" },
  { id: "r4", url: "https://picsum.photos/seed/g5ai4/600/450" },
];

interface AnalysisStep {
  label: string;
  icon: React.ElementType;
  done: boolean;
  detail?: string;
}

export default function Genie5AISetup() {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<null | "ecommerce" | "affiliate">(null);
  const [step, setStep] = useState(0); // 0=choose, 1=input, 2=analysis, 3=review, 4=generating, 5=results

  // Input state
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");

  // Analysis
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<typeof MOCK_PRODUCTS>([]);
  const [visibleTrends, setVisibleTrends] = useState<string[]>([]);

  // Review
  const [editingBrand, setEditingBrand] = useState(false);
  const [brandTone, setBrandTone] = useState("Modern · Clean · Approachable");
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set(["s1", "s2"]));

  // Results
  const [generatingProgress, setGeneratingProgress] = useState(0);

  const isEcom = flow === "ecommerce";
  const allStepLabels = ["Mode", "Input", "AI Analysis", "Review", "Generate", "Results"];
  const currentIdx = flow === null ? 0 : step + 1;

  const toggleStrategy = (id: string) => {
    const next = new Set(selectedStrategies);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStrategies(next);
  };

  const startAnalysis = useCallback(() => {
    setStep(2);

    const ecomSteps: AnalysisStep[] = [
      { label: "Analyzing brand identity...", icon: Palette, done: false, detail: "Colors, typography, tone" },
      { label: "Discovering products...", icon: Package, done: false, detail: "Scanning product catalog" },
      { label: "Researching market trends...", icon: TrendingUp, done: false, detail: "Competitor & trend analysis" },
      { label: "Generating creative strategies...", icon: Sparkles, done: false, detail: "Building hook & angle library" },
    ];

    const affSteps: AnalysisStep[] = [
      { label: "Understanding your niche...", icon: Globe, done: false, detail: "Market research" },
      { label: "Analyzing top performers...", icon: TrendingUp, done: false, detail: "Winner patterns" },
      { label: "Building creative strategies...", icon: Sparkles, done: false, detail: "Hook & angle library" },
    ];

    const steps = isEcom ? ecomSteps : affSteps;
    setAnalysisSteps(steps);

    steps.forEach((_, i) => {
      const delay = 2000 + i * 2500;
      setTimeout(() => {
        setAnalysisSteps(prev => prev.map((s, j) => j === i ? { ...s, done: true } : s));
        // Progressive data reveal
        if (isEcom) {
          if (i === 1) {
            MOCK_PRODUCTS.forEach((p, pi) => {
              setTimeout(() => setVisibleProducts(prev => [...prev, p]), pi * 300);
            });
          }
          if (i === 2) {
            MOCK_TRENDS.forEach((t, ti) => {
              setTimeout(() => setVisibleTrends(prev => [...prev, t]), ti * 200);
            });
          }
        } else {
          if (i === 1) {
            MOCK_TRENDS.forEach((t, ti) => {
              setTimeout(() => setVisibleTrends(prev => [...prev, t]), ti * 200);
            });
          }
        }
      }, delay);
    });

    const totalTime = 2000 + steps.length * 2500 + 1000;
    setTimeout(() => setStep(3), totalTime);
  }, [isEcom]);

  const startGenerating = () => {
    setStep(4);
    setGeneratingProgress(0);
    const interval = setInterval(() => {
      setGeneratingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
    setTimeout(() => {
      clearInterval(interval);
      setGeneratingProgress(100);
      setStep(5);
      toast.success("4 ad concepts generated!");
    }, 6000 + Math.random() * 3000);
  };

  const summaryItems = [
    name && { label: isEcom ? "Brand" : "Workspace", value: name },
    isEcom && url && { label: "URL", value: url },
    !isEcom && niche && { label: "Niche", value: niche },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/[0.02] blur-[100px]" />
      </div>

      {/* Progress */}
      <div className="w-full max-w-[600px] mb-8 relative z-10">
        <div className="flex gap-1">
          {allStepLabels.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={cn("h-1 rounded-full transition-all duration-500", i < currentIdx ? "bg-primary" : "bg-muted")} />
              <p className={cn("text-[9px] mt-1.5 font-medium tracking-wide", i < currentIdx ? "text-primary" : "text-muted-foreground/50")}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {summaryItems.length > 0 && step > 1 && (
        <div className="w-full max-w-[600px] mb-4 relative z-10">
          <Genie5SelectionSummary items={summaryItems} />
        </div>
      )}

      <div className="relative z-10 w-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          {/* Step 0: Choose mode */}
          {flow === null && (
            <motion.div key="choose" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[500px]">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2 flex items-center gap-2">
                <Wand2 className="h-6 w-6 text-primary" />
                AI-Guided Setup
              </h2>
              <p className="text-sm text-muted-foreground mb-8">Let AI analyze, suggest, and generate your first ads automatically.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setFlow("ecommerce"); setStep(1); }} className="group text-left rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                  <ShoppingBag className="h-6 w-6 text-primary mb-3" />
                  <p className="text-sm font-bold text-foreground">E-commerce</p>
                  <p className="text-[11px] text-muted-foreground mt-1">AI analyzes your brand, products & market</p>
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold mt-3 group-hover:gap-2 transition-all">Start <ArrowRight className="h-3 w-3" /></div>
                </button>
                <button onClick={() => { setFlow("affiliate"); setStep(1); }} className="group text-left rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                  <Zap className="h-6 w-6 text-accent-foreground mb-3" />
                  <p className="text-sm font-bold text-foreground">Affiliate / Ad Lab</p>
                  <p className="text-[11px] text-muted-foreground mt-1">AI builds niche intelligence & generates</p>
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold mt-3 group-hover:gap-2 transition-all">Start <ArrowRight className="h-3 w-3" /></div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Input */}
          {step === 1 && (
            <motion.div key="input" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[480px]">
              <button onClick={() => { setFlow(null); setStep(0); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <h2 className="text-xl font-bold text-foreground mb-6">{isEcom ? "Tell us about your brand" : "Set up your niche"}</h2>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{isEcom ? "Brand Name" : "Workspace Name"}</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder={isEcom ? "e.g. GlowSkin Co" : "e.g. Auto Insurance Q2"} className="h-11" />
                </div>
                {isEcom ? (
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourstore.com" className="h-11 pl-10" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category / Niche</label>
                    <div className="flex flex-wrap gap-2">
                      {NICHES.map(n => (
                        <button key={n} onClick={() => setNiche(n)} className={cn(
                          "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                          niche === n ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border"
                        )}>{n}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={startAnalysis} className="w-full mt-8 h-11" disabled={isEcom ? !url : !niche}>
                <Sparkles className="h-4 w-4 mr-2" /> Let AI Analyze
              </Button>
            </motion.div>
          )}

          {/* Step 2: AI Analysis */}
          {step === 2 && (
            <motion.div key="analysis" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[550px]">
              <div className="text-center mb-8">
                <div className="relative mx-auto mb-5" style={{ width: 72, height: 72 }}>
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                  <div className="absolute inset-1 rounded-full border-2 border-t-primary border-r-primary/30 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wand2 className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-foreground">AI is analyzing everything...</h2>
                <p className="text-xs text-muted-foreground mt-1">This takes a moment for the best results</p>
              </div>

              <div className="space-y-4 mb-6">
                {analysisSteps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3.5">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 shrink-0",
                      s.done ? "bg-primary shadow-sm shadow-primary/20" : "border border-border animate-pulse"
                    )}>
                      {s.done ? <Check className="h-3.5 w-3.5 text-primary-foreground" /> : <s.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <div>
                      <span className={cn("text-sm", s.done ? "text-foreground font-medium" : "text-muted-foreground")}>{s.label}</span>
                      {s.detail && <p className="text-[10px] text-muted-foreground">{s.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progressive data reveal */}
              {visibleProducts.length > 0 && (
                <div className="rounded-lg border border-border p-3 mb-3 animate-in fade-in-0 duration-500">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Products Detected</p>
                  <div className="grid grid-cols-4 gap-2">
                    {visibleProducts.map((p, i) => (
                      <motion.div key={p.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                        className="text-center p-2 rounded-md bg-muted/30">
                        <span className="text-lg">{p.img}</span>
                        <p className="text-[10px] text-foreground mt-1 truncate">{p.name}</p>
                        <p className="text-[9px] text-muted-foreground">{p.price}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {visibleTrends.length > 0 && (
                <div className="flex flex-wrap gap-1.5 animate-in fade-in-0 duration-500">
                  {visibleTrends.map((t, i) => (
                    <motion.div key={t} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <Badge variant="secondary" className="text-[10px]">{t}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <motion.div key="review" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[550px]">
              <h2 className="text-lg font-bold text-foreground mb-5">Review AI Suggestions</h2>

              <Card className="mb-4">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">Brand Identity</p>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setEditingBrand(!editingBrand)}>
                      <Edit3 className="h-3 w-3 mr-1" /> {editingBrand ? "Done" : "Edit"}
                    </Button>
                  </div>
                  {editingBrand ? (
                    <Textarea value={brandTone} onChange={e => setBrandTone(e.target.value)} className="text-xs min-h-[60px]" />
                  ) : (
                    <p className="text-xs text-muted-foreground">{brandTone}</p>
                  )}
                  <div className="flex gap-1.5">
                    {["hsl(var(--primary))", "hsl(220,70%,55%)", "hsl(0,0%,96%)"].map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded border border-border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="mb-4">
                <p className="text-xs font-semibold text-foreground mb-2">Suggested Strategies</p>
                <div className="space-y-2">
                  {MOCK_STRATEGIES.map(s => (
                    <button key={s.id} onClick={() => toggleStrategy(s.id)}
                      className={cn(
                        "w-full text-left rounded-lg border p-3 transition-all",
                        selectedStrategies.has(s.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">{s.title}</p>
                        {selectedStrategies.has(s.id) && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 italic">{s.hook}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={startGenerating} className="flex-1">
                  <Sparkles className="h-4 w-4 mr-2" /> Generate First Batch
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Generating */}
          {step === 4 && (
            <motion.div key="gen" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[440px] text-center">
              <div className="relative mx-auto mb-6" style={{ width: 80, height: 80 }}>
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                <div className="absolute inset-1 rounded-full border-2 border-t-primary border-r-primary/30 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: "1.2s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Creating your first ad concepts...</h2>
              <p className="text-xs text-muted-foreground mb-6">Applying strategies, analyzing context, rendering visuals...</p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(generatingProgress, 100)}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{Math.min(Math.round(generatingProgress), 100)}%</p>
            </motion.div>
          )}

          {/* Step 5: Results */}
          {step === 5 && (
            <motion.div key="results" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-[600px]">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Your First Ads Are Ready!</h2>
                <p className="text-xs text-muted-foreground mt-1">4 concepts generated based on AI analysis</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {DEMO_RESULTS.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="rounded-lg overflow-hidden border border-border aspect-[4/3]">
                    <img src={r.url} alt={`Generated ${i + 1}`} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
              <Button onClick={() => navigate("/iq/genie5")} className="w-full h-11">
                <Sparkles className="h-4 w-4 mr-2" /> Go to Genie 5.0 Workspace
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, ShieldAlert } from "lucide-react";

const ADS_PER_PAGE = 250;

export function RRMToolsTab() {
  // Calculator state
  const [rejectedAds, setRejectedAds] = useState(9);
  const [totalAds, setTotalAds] = useState(820);
  const [targetThreshold, setTargetThreshold] = useState(1.0);

  // Recovery state
  const [recoveryEnabled, setRecoveryEnabled] = useState(false);
  const [recoveryThreshold, setRecoveryThreshold] = useState(0.5);
  const [pauseRate, setPauseRate] = useState(10);

  // Calculator computations
  const currentRatio = totalAds > 0 ? (rejectedAds / totalAds) * 100 : 0;
  const requiredTotal = targetThreshold > 0 ? Math.ceil((rejectedAds / targetThreshold) * 100) : 0;
  const dilutionNeeded = Math.max(0, requiredTotal - totalAds);
  const projectedRatio = (totalAds + dilutionNeeded) > 0
    ? (rejectedAds / (totalAds + dilutionNeeded)) * 100
    : 0;
  const pagesNeeded = Math.ceil(dilutionNeeded / ADS_PER_PAGE);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Dilution Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Dilution Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Rejected Ads</Label>
              <Input
                type="number"
                min={0}
                value={rejectedAds}
                onChange={(e) => setRejectedAds(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Current Total Ads</Label>
              <Input
                type="number"
                min={0}
                value={totalAds}
                onChange={(e) => setTotalAds(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Threshold (%)</Label>
              <Input
                type="number"
                step={0.01}
                min={0}
                value={targetThreshold}
                onChange={(e) => setTargetThreshold(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Current Ratio" value={`${currentRatio.toFixed(2)}%`} warn={currentRatio >= targetThreshold} />
            <ResultCard label="Required Total Ads" value={requiredTotal.toLocaleString()} />
            <ResultCard label="Dilution Ads Needed" value={dilutionNeeded.toLocaleString()} highlight />
            <ResultCard label="Projected Ratio After" value={`${projectedRatio.toFixed(2)}%`} />
          </div>

          <div className="text-center p-3 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground">Pages needed (@ {ADS_PER_PAGE} ads/page)</p>
            <p className="text-2xl font-bold">{pagesNeeded}</p>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Recovery Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Recovery</Label>
              <p className="text-xs text-muted-foreground">Automatically pause ads when ratio drops below recovery threshold</p>
            </div>
            <Switch checked={recoveryEnabled} onCheckedChange={setRecoveryEnabled} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Recovery Threshold (%)</Label>
                <span className="text-xs text-muted-foreground">{recoveryThreshold}%</span>
              </div>
              <Slider
                value={[recoveryThreshold]}
                onValueChange={([v]) => setRecoveryThreshold(v)}
                min={0}
                max={2}
                step={0.1}
                disabled={!recoveryEnabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pause Rate (% per hour)</Label>
                <span className="text-xs text-muted-foreground">{pauseRate}%</span>
              </div>
              <Slider
                value={[pauseRate]}
                onValueChange={([v]) => setPauseRate(v)}
                min={1}
                max={100}
                step={1}
                disabled={!recoveryEnabled}
              />
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md border text-center">
              <p className="text-xs text-muted-foreground">Active Accounts</p>
              <p className="text-xl font-bold">4</p>
            </div>
            <div className="p-3 rounded-md border text-center">
              <p className="text-xs text-muted-foreground">In Recovery</p>
              <p className="text-xl font-bold text-destructive">0</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground p-3 rounded-md bg-muted/50">
            When recovery mode is active, the system will gradually pause low-performing ads to bring the rejection ratio back above the recovery threshold. The pause rate controls how aggressively ads are paused per hour.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultCard({ label, value, warn, highlight }: { label: string; value: string; warn?: boolean; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-md border ${highlight ? "border-primary/50 bg-primary/5" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${warn ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

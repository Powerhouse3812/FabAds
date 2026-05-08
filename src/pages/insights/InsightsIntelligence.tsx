import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InsightsFeed from "./InsightsFeed";
import { SavedAdsTab } from "@/components/insights/SavedAdsTab";
import { CompetitorAdsTab } from "@/components/insights/CompetitorAdsTab";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

export default function InsightsIntelligence() {
  const [tab, setTab] = useState("feed");
  const { preferences } = useInsightPreferences();
  const [prefsOpen, setPrefsOpen] = useState(false);

  return (
    <div className="v3-page-mesh space-y-2 h-full flex flex-col p-3">
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold tracking-tight shrink-0">Intelligence</h1>
          <TabsList className="w-fit">
            <TabsTrigger value="feed">My Feed</TabsTrigger>
            <TabsTrigger value="saved">Saved Ads</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
          </TabsList>
          {preferences?.onboarded && (
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => setPrefsOpen(true)}>
              <Settings2 className="h-4 w-4 mr-1" /> Preferences
            </Button>
          )}
        </div>

        <TabsContent value="feed" className="flex-1 min-h-0 mt-2">
          <InsightsFeed prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)} />
        </TabsContent>

        <TabsContent value="saved" className="flex-1 min-h-0 mt-2">
          <SavedAdsTab />
        </TabsContent>

        <TabsContent value="competitors" className="flex-1 min-h-0 mt-2">
          <CompetitorAdsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

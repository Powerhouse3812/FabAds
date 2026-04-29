import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { countryAggregation, type CountryData } from "@/lib/dashboard-selectors";

type MapMetric = "spend" | "revenue" | "activeCampaigns";

// Simplified SVG paths for major countries (approximate shapes)
const COUNTRY_PATHS: Record<string, { d: string; cx: number; cy: number }> = {
  US: { d: "M60,120 L130,120 L140,140 L130,160 L60,160 L50,140 Z", cx: 95, cy: 140 },
  CA: { d: "M60,80 L140,80 L145,110 L60,110 Z", cx: 100, cy: 95 },
  BR: { d: "M155,200 L190,180 L200,220 L180,260 L155,240 Z", cx: 175, cy: 220 },
  UK: { d: "M270,100 L280,95 L282,115 L272,118 Z", cx: 276, cy: 107 },
  DE: { d: "M290,105 L305,100 L308,120 L292,122 Z", cx: 299, cy: 111 },
  FR: { d: "M275,120 L295,118 L295,140 L275,142 Z", cx: 285, cy: 130 },
  JP: { d: "M500,135 L510,125 L515,145 L505,155 Z", cx: 507, cy: 140 },
  AU: { d: "M470,260 L530,255 L535,295 L475,300 Z", cx: 502, cy: 278 },
  IN: { d: "M410,155 L430,145 L435,190 L415,200 Z", cx: 422, cy: 172 },
  CN: { d: "M430,110 L490,100 L500,140 L440,145 Z", cx: 465, cy: 122 },
  RU: { d: "M320,60 L500,50 L510,90 L330,95 Z", cx: 415, cy: 72 },
  MX: { d: "M70,160 L110,155 L105,185 L65,180 Z", cx: 87, cy: 170 },
  ZA: { d: "M320,270 L345,265 L348,290 L322,293 Z", cx: 334, cy: 279 },
  KR: { d: "M490,120 L500,118 L502,132 L492,134 Z", cx: 496, cy: 126 },
  NG: { d: "M295,195 L315,192 L317,212 L297,214 Z", cx: 306, cy: 203 },
};

const COUNTRY_LABELS: Record<string, string> = {
  US: "United States", CA: "Canada", BR: "Brazil", UK: "United Kingdom",
  DE: "Germany", FR: "France", JP: "Japan", AU: "Australia",
  IN: "India", CN: "China", RU: "Russia", MX: "Mexico",
  ZA: "South Africa", KR: "South Korea", NG: "Nigeria",
};

interface CountryInsightsMapProps {
  dateSeed: number;
}

export function CountryInsightsMap({ dateSeed }: CountryInsightsMapProps) {
  const [metric, setMetric] = useState<MapMetric>("spend");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const data = useMemo(() => countryAggregation(dateSeed), [dateSeed]);
  const dataMap = useMemo(() => {
    const m = new Map<string, CountryData>();
    data.forEach((d) => m.set(d.country, d));
    return m;
  }, [data]);

  const maxVal = useMemo(() => {
    const vals = data.map((d) => d[metric]);
    return Math.max(...vals, 1);
  }, [data, metric]);

  const formatVal = (v: number) => {
    if (metric === "activeCampaigns") return v.toString();
    return `$${v.toLocaleString()}`;
  };

  const getOpacity = (country: string) => {
    const d = dataMap.get(country);
    if (!d) return 0.1;
    return 0.2 + (d[metric] / maxVal) * 0.8;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold">Country Insights</CardTitle>
          <Select value={metric} onValueChange={(v) => setMetric(v as MapMetric)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spend">Spend</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="activeCampaigns">Active Campaigns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg viewBox="0 0 580 320" className="w-full h-auto" style={{ maxHeight: 220 }}>
            {/* Background */}
            <rect width="580" height="320" fill="none" />

            {/* Country shapes */}
            {Object.entries(COUNTRY_PATHS).map(([code, { d }]) => {
              const countryData = dataMap.get(code);
              const opacity = getOpacity(code);
              return (
                <Tooltip key={code} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <path
                      d={d}
                      fill={`hsl(var(--chart-1))`}
                      fillOpacity={opacity}
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                      className="cursor-pointer transition-all hover:stroke-foreground hover:stroke-2"
                      onMouseEnter={() => setHoveredCountry(code)}
                      onMouseLeave={() => setHoveredCountry(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{COUNTRY_LABELS[code] || code}</p>
                    {countryData ? (
                      <p className="text-xs text-muted-foreground">
                        {metric === "spend" ? "Spend" : metric === "revenue" ? "Revenue" : "Active Campaigns"}:{" "}
                        {formatVal(countryData[metric])}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No data</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Country labels */}
            {Object.entries(COUNTRY_PATHS).map(([code, { cx, cy }]) => (
              <text
                key={`label-${code}`}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-foreground text-[8px] font-medium pointer-events-none"
              >
                {code}
              </text>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[10px] text-muted-foreground">Low</span>
          <div className="flex-1 mx-2 h-2 rounded-full bg-gradient-to-r from-muted to-chart-1" />
          <span className="text-[10px] text-muted-foreground">High</span>
        </div>
      </CardContent>
    </Card>
  );
}

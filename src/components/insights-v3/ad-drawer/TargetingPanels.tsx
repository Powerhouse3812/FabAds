/**
 * Kept from the old drawer: Ad keywords (AI generated) + Platforms, Targeted
 * demographics, Location, Domains + Language. Each one that has no data is a
 * DisabledSection with a reason, never a blank gap.
 */
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdvertiser, getLandingPage } from "@/lib/insights-v3/data";
import type { Ad } from "@/lib/insights-v3/types";
import { DisabledSection, ElementChip, OverlaySection, fmtInt } from "@/components/insights-v3/shared";
import { ageRangeLabel, genderLabel } from "./drawerUtils";

const PILL = "inline-flex max-w-full items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground";

export function KeywordsPlatforms({ ad }: { ad: Ad }) {
  const keywords = ad.analysis.keywords;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
      {keywords.length > 0 ? (
        <OverlaySection title="Ad keywords (AI generated)" basedOn={1}>
          <ul className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <li key={k} className="inline-flex max-w-full items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary-text">
                <span className="truncate">#{k.replace(/^#/, "")}</span>
              </li>
            ))}
          </ul>
        </OverlaySection>
      ) : (
        <DisabledSection title="Ad keywords (AI generated)" reason="No keywords were extracted for this ad." minHeight={96} />
      )}

      {ad.platforms.length > 0 ? (
        <OverlaySection title="Platforms">
          <ul className="flex flex-wrap gap-1.5">
            {ad.platforms.map((p) => (
              <li key={p} className={PILL}>
                {p}
              </li>
            ))}
          </ul>
        </OverlaySection>
      ) : (
        <DisabledSection title="Platforms" reason="No platform was reported for this ad." minHeight={96} />
      )}
    </div>
  );
}

export function DemographicsSection({ ad }: { ad: Ad }) {
  const [detail, setDetail] = useState(false);
  const rows = ad.demographics;
  if (rows.length === 0) {
    return <DisabledSection title="Targeted demographics" reason="Targeting demographics weren't reported for this ad." minHeight={96} />;
  }
  return (
    <OverlaySection
      title="Targeted demographics"
      action={
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          View details
          <Switch checked={detail} onCheckedChange={setDetail} aria-label="Show demographics table" />
        </label>
      }
    >
      {!detail ? (
        <ul className="list-disc space-y-0.5 pl-4 text-[13px] text-foreground/90">
          <li>Age group: {ageRangeLabel(rows)}</li>
          <li>Gender: {genderLabel(rows)}</li>
        </ul>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 text-[11px]">Age group</TableHead>
                <TableHead className="h-8 text-[11px]">Gender</TableHead>
                <TableHead className="h-8 text-right text-[11px]">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="py-1.5 text-xs">{d.ageGroup}</TableCell>
                  <TableCell className="py-1.5 text-xs capitalize">{d.gender}</TableCell>
                  <TableCell className="py-1.5 text-right font-mono text-xs tabular-nums">{fmtInt(d.percentage)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </OverlaySection>
  );
}

export function LocationSection({ ad }: { ad: Ad }) {
  const [open, setOpen] = useState(false);
  const rows = ad.locations;
  if (rows.length === 0) {
    return <DisabledSection title="Location" reason="Targeted locations weren't reported for this ad." minHeight={96} />;
  }
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-border bg-card">
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-xl px-4 py-3 text-left text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        Location
        <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[11px] font-normal leading-5 tabular-nums text-primary-text">
          {fmtInt(rows.length)}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 text-[11px]">Location</TableHead>
                <TableHead className="h-8 text-[11px]">Type</TableHead>
                <TableHead className="h-8 text-[11px]">Include / Exclude</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="py-1.5 text-xs">{l.name}</TableCell>
                  <TableCell className="py-1.5 text-xs">{l.type}</TableCell>
                  <TableCell className="py-1.5 text-xs capitalize">{l.includeExclude}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DomainsLanguage({ ad }: { ad: Ad }) {
  const domainAdv = ad.domainAdvertiserId ? getAdvertiser(ad.domainAdvertiserId) : undefined;
  const lp = ad.landingPageId ? getLandingPage(ad.landingPageId) : undefined;

  // Unique domains this ad touches: the advertiser's domain, then the lander's if different.
  const domains: { name: string; id: string | null }[] = [];
  if (domainAdv) domains.push({ name: domainAdv.name, id: domainAdv.id });
  if (lp && !domains.some((d) => d.name === lp.domain)) domains.push({ name: lp.domain, id: null });

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {domains.length > 0 ? (
        <OverlaySection title="Domains">
          <ul className="space-y-1.5">
            {domains.map((d) => (
              <li key={d.name} className="min-w-0">
                {d.id ? (
                  <ElementChip type="domain" id={d.id} label={d.name} />
                ) : (
                  <span className="break-all font-mono text-xs text-foreground/90">{d.name}</span>
                )}
              </li>
            ))}
          </ul>
        </OverlaySection>
      ) : (
        <DisabledSection title="Domains" reason="This ad has no landing domain we could trace." minHeight={96} />
      )}

      {ad.languages.length > 0 ? (
        <OverlaySection title="Language">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] text-foreground/90">
            {ad.languages.map((l) => (
              <li key={l} className="list-inside list-disc">
                {l}
              </li>
            ))}
          </ul>
        </OverlaySection>
      ) : (
        <DisabledSection title="Language" reason="No language was detected for this ad." minHeight={96} />
      )}
    </div>
  );
}

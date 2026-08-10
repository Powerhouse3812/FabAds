import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlansPaymentTab } from "@/components/workspace-settings/PlansPaymentTab";
import { ConnectorPanel } from "@/connector/ConnectorPanel";
import { cn } from "@/lib/utils";

/**
 * WorkspaceSettings — top-level Settings page at `/settings`.
 *
 * Two tabs have real content: **Plans & Payment** and **Connector (AI
 * access)**. The other ten are "Coming soon" placeholders mirroring the tab
 * set the live product ships, so this prototype's IA lines up 1:1 with prod
 * when the Connector work is ported across.
 *
 * Active tab is URL-backed (`?tab=…`, with the default omitted from the query
 * string) so refresh and deep-link both work — the URL-state pattern used
 * across this app. The Connector panel layers two more params of its own
 * (`connection`, `view`); it owns those, this file just leaves them alone when
 * switching tabs.
 *
 * DEFAULT IS `connector`, NOT `plans-payment`.
 * Connector sits twelfth in a scrolling tab bar, which is a poor place to put
 * the one surface this build exists to show — anyone opening `/settings` would
 * have to scroll a row of ten placeholders to find it. Plans & Payment loses
 * nothing but its bare URL; it stays one click away and reachable at
 * `?tab=plans-payment`. Flip this constant back the moment the other ten tabs
 * become real, because at that point "the newest thing" stops being the right
 * landing page.
 *
 * THE TAB BAR IS A SCROLLER, NOT A ROW.
 * Twelve labels at ~120px plus `gap-8` is well over 1,400px and clipped on
 * any laptop. So: a horizontal scroll container, edge fade masks that appear
 * only when there is actually more to see, and `scrollIntoView` on the active
 * trigger at mount — without that last part a deep-linked `?tab=connector`
 * lands with its own tab off-screen, which reads as the link being broken.
 */
const TABS = [
  { value: "profile-security", label: "Profile & security" },
  { value: "members", label: "Members" },
  { value: "workspace", label: "Workspace" },
  { value: "notifications", label: "Notifications" },
  { value: "alert-notifications", label: "Alert notifications" },
  { value: "system-config", label: "System Configurations" },
  { value: "nomenclature", label: "Nomenclature settings" },
  { value: "plans-payment", label: "Plans & Payment" },
  { value: "activity", label: "Activity" },
  { value: "logs", label: "Logs" },
  { value: "whats-new", label: "What's new" },
  { value: "connector", label: "Connector (AI access)" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const DEFAULT_TAB: TabValue = "connector";

/** Tabs with real content. Everything else renders the placeholder. */
const BUILT: TabValue[] = ["plans-payment", "connector"];

export default function WorkspaceSettings() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: TabValue = useMemo(() => {
    const raw = searchParams.get("tab");
    const match = TABS.find((t) => t.value === raw);
    return match?.value ?? DEFAULT_TAB;
  }, [searchParams]);

  const setActiveTab = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === DEFAULT_TAB) sp.delete("tab");
          else sp.set("tab", next);
          // The Connector panel's own sub-route params are meaningless under
          // any other tab, and leaving them behind would send the user back
          // into a detail view the next time they return.
          if (next !== "connector") {
            sp.delete("connection");
            sp.delete("view");
          }
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  /* ── Tab bar scroll affordances ─────────────────────────────── */
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setEdges({
      left: el.scrollLeft > 4,
      // 4px slack — sub-pixel layout rounding otherwise leaves the right mask
      // permanently on at the end of the scroll.
      right: el.scrollLeft < maxScroll - 4,
    });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  /**
   * Bring the active trigger into view whenever it changes.
   *
   * Deferred by two frames on purpose. Called synchronously in the effect,
   * `scrollIntoView` runs before the scroller has its final width — the
   * element's box is still zero-ish, the call is a no-op, and the tab bar
   * stays at `scrollLeft: 0`. That leaves the ACTIVE tab off-screen while its
   * panel is rendered below, which reads as the page having opened on the
   * wrong tab. It matters most on first paint, which is now the common case:
   * `connector` is the default and it sits twelfth.
   *
   * Two frames rather than one because Radix mounts the trigger in the first
   * commit and the scroller only settles its width after that.
   */
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const trigger = el.querySelector<HTMLElement>(`[data-tab-value="${activeTab}"]`);
        trigger?.scrollIntoView({ block: "nearest", inline: "nearest" });
        measure();
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [activeTab, measure]);

  /* ── Panel scroll reset ─────────────────────────────────────── */
  // The panel is its own `overflow-y-auto` container, so `window.scrollTo`
  // does nothing here. Reset via the ref instead, or switching tabs lands
  // mid-page.
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full flex-col"
      >
        {/* Tab bar — underline indicator, horizontally scrollable, masked edges */}
        <div className="relative border-b border-border/60">
          {/* The horizontal padding lives on the INNER list, not on this
              scroller. A scroll container's trailing `padding-right` is not
              part of its scrollWidth, so with `px-5` here the last tab —
              "Connector (AI access)", the longest label and the one that
              matters — ends flush against the scrollport and clips even after
              scrollIntoView. Padding on the child is inside the scrollable
              area and scrolls with it. */}
          <div
            ref={scrollerRef}
            className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <TabsList className="h-auto w-max justify-start gap-8 bg-transparent px-5 py-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  data-tab-value={tab.value}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-0 py-2 text-sm font-normal shadow-none",
                    "data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none",
                    // Placeholders stay reachable but read as inert, so the
                    // ten unbuilt tabs don't compete with the two real ones.
                    BUILT.includes(tab.value)
                      ? "text-muted-foreground"
                      : "text-muted-foreground/55",
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {/* Fade masks — pointer-events-none so they never eat a tab click */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity",
              edges.left ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity",
              edges.right ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        {/* Tab panels */}
        <div ref={panelRef} className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="plans-payment" className="mt-0">
            <PlansPaymentTab />
          </TabsContent>
          <TabsContent value="connector" className="mt-0">
            <ConnectorPanel />
          </TabsContent>
          {TABS.filter((t) => !BUILT.includes(t.value)).map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-0 px-5 py-12">
              <div className="rounded-lg border border-dashed border-border/60 bg-card/40 p-12 text-center">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Coming soon
                </p>
                <p className="mt-2 text-sm text-foreground">
                  The {t.label} tab is part of the next iteration.
                </p>
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}

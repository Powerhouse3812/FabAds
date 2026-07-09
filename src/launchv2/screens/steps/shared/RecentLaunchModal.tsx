/**
 * RecentLaunchModal — Import settings or creatives from a past launch.
 *
 * mode="setup"    → used in Step 2. Patches objective, intent, budgetAmount,
 *                   budgetMode, targets.
 * mode="creative" → used in Step 3. Patches format, creatives, adCopy.
 *
 * Filters: name search (AND) + objective chip (AND) + niche chip.
 * Calendar: stub button with "Coming soon" tooltip.
 */

import { useState } from "react";
import { Search, Calendar, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PlanV2, AdCopy, CreativeRef, AdFormat, Objective, Intent, BudgetMode, TargetPair } from "../../../types";

/* ─── Props ─────────────────────────────────────────────────────────────────── */

export interface RecentLaunchModalProps {
  open: boolean;
  onClose: () => void;
  mode: "setup" | "creative";
  onImport: (patch: Partial<PlanV2>) => void;
}

/* ─── Mock data types ────────────────────────────────────────────────────────── */

type NicheLabel = "D2C" | "E-commerce" | "BFSI" | "EdTech" | "SaaS";

interface MockLaunch {
  id: string;
  name: string;
  date: string;          // ISO date string
  objective: Objective;
  intent: Intent;
  budgetAmount: number;
  budgetMode: BudgetMode;
  niche: NicheLabel;
  format: AdFormat;
  creatives: CreativeRef[];
  adCopy: AdCopy;
  targets: TargetPair[];
  /** Thumbnail hue for the colored placeholder block (hsl lightness ~85%) */
  thumbHue: number;
}

/* ─── Mock launches (12 entries) ────────────────────────────────────────────── */
// Dates relative to 2026-07-01

const MOCK_LAUNCHES: MockLaunch[] = [
  {
    id: "ml-001",
    name: "Mamaearth — Vitamin C Face Wash Q2",
    date: "2026-06-18",
    objective: "OUTCOME_SALES",
    intent: "scale",
    budgetAmount: 85000,
    budgetMode: "CBO",
    niche: "D2C",
    format: "single_image",
    thumbHue: 38,
    creatives: [
      { id: "cr-001a", name: "VitC_FaceWash_Hero.jpg", format: "single_image", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "Dull skin? Switch to Mamaearth Vitamin C Face Wash — formulated with natural actives for a brighter, even-toned complexion in just 4 weeks.",
      headline: "Glow Brighter, Naturally",
      description: "Cruelty-free · Dermatologist tested · No sulfates",
      cta: "SHOP_NOW",
      destinationUrl: "https://mamaearth.in/vitamin-c-face-wash",
      displayLink: "mamaearth.in",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=vitc-facewash-q2",
    },
    targets: [
      { accountId: "act_2847103956", accountName: "Mamaearth Brand", currency: "INR", pageId: "pg_38471029", fbPageId: "38471029", pageName: "Mamaearth" },
    ],
  },
  {
    id: "ml-002",
    name: "boAt Rockerz 450 — Festive Push",
    date: "2026-06-03",
    objective: "OUTCOME_TRAFFIC",
    intent: "test",
    budgetAmount: 42000,
    budgetMode: "ABO",
    niche: "E-commerce",
    format: "carousel",
    thumbHue: 210,
    creatives: [
      { id: "cr-002a", name: "Rockerz_450_Black.jpg", format: "carousel", source: "library", itemType: "media" },
      { id: "cr-002b", name: "Rockerz_450_Red.jpg", format: "carousel", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "60 hours playback. Dual connectivity. Premium sound at a price that makes sense. The Rockerz 450 is here to level up your daily playlist.",
      headline: "boAt Rockerz 450 — Own the Sound",
      description: "60hr battery · Bluetooth 5.0 · Foldable design",
      cta: "LEARN_MORE",
      destinationUrl: "https://www.boat-lifestyle.com/rockerz-450",
      displayLink: "boat-lifestyle.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=rockerz450-festive",
    },
    targets: [
      { accountId: "act_5192847301", accountName: "boAt India", currency: "INR", pageId: "pg_51928473", fbPageId: "51928473", pageName: "boAt" },
    ],
  },
  {
    id: "ml-003",
    name: "Noise ColorFit Pro 5 — Mid-Year Sale",
    date: "2026-05-29",
    objective: "OUTCOME_SALES",
    intent: "scale",
    budgetAmount: 1,
    budgetMode: "CBO",
    niche: "E-commerce",
    format: "single_video",
    thumbHue: 185,
    creatives: [
      { id: "cr-003a", name: "ColorFit_Pro5_TVC.mp4", format: "single_video", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "Track your fitness the smart way. The Noise ColorFit Pro 5 features a 1.85\" AMOLED display, 110+ sports modes, and 7-day battery life. Limited-period offer — ₹1,999 only.",
      headline: "Smart Watch. Smarter Price.",
      description: "AMOLED · 7-day battery · IP68 water resistant",
      cta: "SHOP_NOW",
      destinationUrl: "https://www.gonoise.com/colorfit-pro-5",
      displayLink: "gonoise.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=colorfit-pro5-midyear",
    },
    targets: [
      { accountId: "act_6283940175", accountName: "Noise India", currency: "INR", pageId: "pg_62839401", fbPageId: "62839401", pageName: "Noise" },
    ],
  },
  {
    id: "ml-004",
    name: "Sleepyhead Ortho-X Mattress — Retargeting",
    date: "2026-06-22",
    objective: "OUTCOME_SALES",
    intent: "custom",
    budgetAmount: 250000,
    budgetMode: "CBO",
    niche: "D2C",
    format: "single_image",
    thumbHue: 270,
    creatives: [
      { id: "cr-004a", name: "OrthoX_Lifestyle_01.jpg", format: "single_image", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "You deserve better sleep. The Sleepyhead Ortho-X features 7 comfort zones and dual-sided design — pick the firmness that's right for you. 100-night free trial included.",
      headline: "Sleep Better From Night One",
      description: "100-night trial · Free delivery · 10-year warranty",
      cta: "SHOP_NOW",
      destinationUrl: "https://sleepyhead.in/ortho-x-mattress",
      displayLink: "sleepyhead.in",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=orthox-retarget-jun26",
    },
    targets: [
      { accountId: "act_9014728356", accountName: "Sleepyhead", currency: "INR", pageId: "pg_90147283", fbPageId: "90147283", pageName: "Sleepyhead" },
    ],
  },
  {
    id: "ml-005",
    name: "Mensa Brands — House of Beauty Leads",
    date: "2026-06-10",
    objective: "OUTCOME_LEADS",
    intent: "test",
    budgetAmount: 35000,
    budgetMode: "ABO",
    niche: "D2C",
    format: "single_image",
    thumbHue: 320,
    creatives: [
      { id: "cr-005a", name: "HouseOfBeauty_LeadForm.jpg", format: "single_image", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "Get personalized skincare recommendations from Mensa Brands' house of beauty. Fill in a 30-second form and receive your free skin analysis.",
      headline: "Your Skin, Personalised",
      description: "Free skin analysis · 30 seconds · Trusted by 2.4L+ customers",
      cta: "SIGN_UP",
      destinationUrl: "https://mensabrands.com/beauty-form",
      displayLink: "mensabrands.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=hob-leads-jun26",
    },
    targets: [
      { accountId: "act_7461829305", accountName: "Mensa Brands", currency: "INR", pageId: "pg_74618293", fbPageId: "74618293", pageName: "Mensa Brands" },
    ],
  },
  {
    id: "ml-006",
    name: "WOW Skin Science — Apple Cider Vinegar",
    date: "2026-04-15",
    objective: "OUTCOME_AWARENESS",
    intent: "test",
    budgetAmount: 18000,
    budgetMode: "ABO",
    niche: "D2C",
    format: "single_video",
    thumbHue: 95,
    creatives: [
      { id: "cr-006a", name: "ACV_Shampoo_UGC_30s.mp4", format: "single_video", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "No sulfates. No parabens. Just the power of Apple Cider Vinegar. WOW ACV Shampoo balances your scalp pH and leaves hair looking visibly shinier.",
      headline: "Hair Care That Actually Works",
      description: "Sulfate-free · Paraben-free · Clinically tested",
      cta: "LEARN_MORE",
      destinationUrl: "https://www.wowskinsicence.com/acv-shampoo",
      displayLink: "wowskinsicence.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=acv-awareness-apr26",
    },
    targets: [
      { accountId: "act_3829104756", accountName: "WOW Skin Science", currency: "INR", pageId: "pg_38291047", fbPageId: "38291047", pageName: "WOW Skin Science" },
    ],
  },
  {
    id: "ml-007",
    name: "Lenskart — Progressive Lenses Launch",
    date: "2026-05-11",
    objective: "OUTCOME_TRAFFIC",
    intent: "scale",
    budgetAmount: 120000,
    budgetMode: "CBO",
    niche: "E-commerce",
    format: "carousel",
    thumbHue: 15,
    creatives: [
      { id: "cr-007a", name: "Progressive_Slide1.jpg", format: "carousel", source: "library", itemType: "media" },
      { id: "cr-007b", name: "Progressive_Slide2.jpg", format: "carousel", source: "library", itemType: "media" },
      { id: "cr-007c", name: "Progressive_Slide3.jpg", format: "carousel", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "See every distance clearly — without changing glasses. Lenskart Progressive Lenses adapt to near, mid and far vision in one seamless lens. Book a free eye check today.",
      headline: "One Lens, Every Distance",
      description: "Free home trial · Anti-glare · Blue light cut",
      cta: "BOOK_NOW",
      destinationUrl: "https://www.lenskart.com/progressive-lenses",
      displayLink: "lenskart.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=progressive-traffic-may26",
    },
    targets: [
      { accountId: "act_1837465029", accountName: "Lenskart Ads", currency: "INR", pageId: "pg_18374650", fbPageId: "18374650", pageName: "Lenskart" },
    ],
  },
  {
    id: "ml-008",
    name: "Razorpay — SMB Payments Awareness",
    date: "2026-06-27",
    objective: "OUTCOME_AWARENESS",
    intent: "scale",
    budgetAmount: 200000,
    budgetMode: "CBO",
    niche: "SaaS",
    format: "single_video",
    thumbHue: 228,
    creatives: [
      { id: "cr-008a", name: "Razorpay_SMB_30s.mp4", format: "single_video", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "Over 8 million businesses trust Razorpay for seamless payments. Accept UPI, cards, EMI and netbanking — set up in under 15 minutes.",
      headline: "India's No.1 Payment Gateway",
      description: "8M+ businesses · 100+ payment modes · 99.9% uptime",
      cta: "LEARN_MORE",
      destinationUrl: "https://razorpay.com/payment-gateway",
      displayLink: "razorpay.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=smb-awareness-jun26",
    },
    targets: [
      { accountId: "act_4729018356", accountName: "Razorpay", currency: "INR", pageId: "pg_47290183", fbPageId: "47290183", pageName: "Razorpay" },
    ],
  },
  {
    id: "ml-009",
    name: "Zepto — 10-min Grocery Traffic",
    date: "2026-05-02",
    objective: "OUTCOME_TRAFFIC",
    intent: "test",
    budgetAmount: 65000,
    budgetMode: "ABO",
    niche: "E-commerce",
    format: "single_image",
    thumbHue: 55,
    creatives: [
      { id: "cr-009a", name: "Zepto_10min_Banner.jpg", format: "single_image", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "Groceries at your door in 10 minutes. Vegetables, dairy, snacks, beverages — order on Zepto and we'll handle the rest. First order free with code FIRST.",
      headline: "Groceries in 10 Minutes, Flat",
      description: "No surge · 5,000+ products · Order tracking",
      cta: "DOWNLOAD",
      destinationUrl: "https://zepto.com/app",
      displayLink: "zepto.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=10min-traffic-may26",
    },
    targets: [
      { accountId: "act_6038291745", accountName: "Zepto Ads", currency: "INR", pageId: "pg_60382917", fbPageId: "60382917", pageName: "Zepto" },
    ],
  },
  {
    id: "ml-010",
    name: "upGrad — Data Science PG Lead Gen",
    date: "2026-06-01",
    objective: "OUTCOME_LEADS",
    intent: "scale",
    budgetAmount: 95000,
    budgetMode: "CBO",
    niche: "EdTech",
    format: "single_image",
    thumbHue: 170,
    creatives: [
      { id: "cr-010a", name: "DataSci_PG_Lead_Banner.jpg", format: "single_image", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "Get a PG Certification in Data Science from upGrad & IIIT Bangalore. Learn from 50+ industry mentors, work on 20+ projects, and placement support from day one.",
      headline: "PG Data Science in 12 Months",
      description: "IIIT-B certified · 50+ mentors · Placement support",
      cta: "SIGN_UP",
      destinationUrl: "https://upgrad.com/data-science-pg",
      displayLink: "upgrad.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=ds-pg-leads-jun26",
    },
    targets: [
      { accountId: "act_2019384756", accountName: "upGrad", currency: "INR", pageId: "pg_20193847", fbPageId: "20193847", pageName: "upGrad" },
    ],
  },
  {
    id: "ml-011",
    name: "Cred — Premium Card Awareness",
    date: "2026-04-07",
    objective: "OUTCOME_AWARENESS",
    intent: "custom",
    budgetAmount: 175000,
    budgetMode: "CBO",
    niche: "BFSI",
    format: "single_video",
    thumbHue: 0,
    creatives: [
      { id: "cr-011a", name: "Cred_Premium_TVC_15s.mp4", format: "single_video", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "CRED is for people who pay their credit card bills on time. Pay bills, earn CRED coins, unlock exclusive rewards. Download the app trusted by 12M+ premium members.",
      headline: "Rewards for Good Credit",
      description: "12M+ members · Exclusive deals · Instant cashback",
      cta: "DOWNLOAD",
      destinationUrl: "https://cred.club/download",
      displayLink: "cred.club",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=premium-awareness-apr26",
    },
    targets: [
      { accountId: "act_8374016295", accountName: "Cred", currency: "INR", pageId: "pg_83740162", fbPageId: "83740162", pageName: "CRED" },
    ],
  },
  {
    id: "ml-012",
    name: "PhysicsWallah — JEE Batch Sales",
    date: "2026-06-14",
    objective: "OUTCOME_SALES",
    intent: "test",
    budgetAmount: 28000,
    budgetMode: "ABO",
    niche: "EdTech",
    format: "single_image",
    thumbHue: 135,
    creatives: [
      { id: "cr-012a", name: "JEE_Batch_Creative.jpg", format: "single_image", source: "library", itemType: "media" },
    ],
    adCopy: {
      primaryText: "JEE 2027 aspirants — enroll in PW's Arjuna batch at just ₹9,999. Learn from Alakh Sir and India's top IIT faculty, with daily live classes and test series.",
      headline: "JEE 2027 — Start Strong",
      description: "Live classes · Daily tests · Doubt clearing · ₹9,999",
      cta: "SHOP_NOW",
      destinationUrl: "https://pw.live/jee-arjuna-2027",
      displayLink: "pw.live",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=jee-arjuna-sales-jun26",
    },
    targets: [
      { accountId: "act_5193847026", accountName: "PhysicsWallah", currency: "INR", pageId: "pg_51938470", fbPageId: "51938470", pageName: "PhysicsWallah" },
    ],
  },
];

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

const OBJ_LABELS: Record<Objective, string> = {
  OUTCOME_SALES: "Sales",
  OUTCOME_TRAFFIC: "Traffic",
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_LEADS: "Leads",
  OUTCOME_ENGAGEMENT: "Engagement",
  OUTCOME_APP_PROMOTION: "App",
};

const FORMAT_LABELS: Record<AdFormat, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  flexible: "Flexible",
  dpa: "Catalogue",
};

function fmtINR(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 0)}K`;
  return `₹${n}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

/** Hsl-based thumb color per launch */
function thumbStyle(hue: number): string {
  return `hsl(${hue}, 58%, 78%)`;
}

/* ─── Filter constants ──────────────────────────────────────────────────────── */

type ObjFilter = "All" | Objective;
type NicheFilter = "All" | NicheLabel;

const OBJ_CHIPS: ObjFilter[] = [
  "All",
  "OUTCOME_SALES",
  "OUTCOME_TRAFFIC",
  "OUTCOME_LEADS",
  "OUTCOME_AWARENESS",
];

const NICHE_CHIPS: NicheFilter[] = ["All", "D2C", "E-commerce", "BFSI", "EdTech", "SaaS"];

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-full px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors",
        active
          ? "bg-[#8FB821] text-[#121212]"
          : "bg-[#F0F0EC] text-[rgba(15,15,12,0.62)] hover:bg-[#E8E8E4] dark:bg-[#1B1B1F] dark:text-[rgba(255,255,255,0.62)] dark:hover:bg-[#222226]",
      )}
    >
      {label === "OUTCOME_SALES"
        ? "Sales"
        : label === "OUTCOME_TRAFFIC"
          ? "Traffic"
          : label === "OUTCOME_LEADS"
            ? "Leads"
            : label === "OUTCOME_AWARENESS"
              ? "Awareness"
              : label}
    </button>
  );
}

function LaunchCard({
  launch,
  mode,
  onUse,
}: {
  launch: MockLaunch;
  mode: "setup" | "creative";
  onUse: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-3 rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-4 py-3 transition-all duration-[220ms] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] cursor-pointer"
      onClick={onUse}
    >
      {/* Thumbnail */}
      <div
        className="h-11 w-11 shrink-0 rounded-xl"
        style={{ backgroundColor: thumbStyle(launch.thumbHue) }}
      />

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
            {launch.name}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {fmtDate(launch.date)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* Objective pill */}
          <span className="rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
            {OBJ_LABELS[launch.objective]}
          </span>

          {/* mode === "setup": budget pill */}
          {mode === "setup" && (
            <span className="rounded-full bg-[#F5FBE2] dark:bg-[#1D2A09] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#5B7611] dark:text-[#C3E165]">
              {fmtINR(launch.budgetAmount)} · {launch.budgetMode}
            </span>
          )}

          {/* mode === "creative": format + adCopy preview */}
          {mode === "creative" && (
            <>
              <span className="rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                {FORMAT_LABELS[launch.format]}
              </span>
              <span className="max-w-[200px] truncate font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                {launch.adCopy.primaryText}
              </span>
            </>
          )}

          {/* Niche tag */}
          <span className="rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] px-2 py-0.5 font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {launch.niche}
          </span>
        </div>
      </div>

      {/* CTA — always visible */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onUse(); }}
        className="shrink-0 rounded-full bg-[#8FB821] px-4 py-1.5 font-mono text-[11px] font-semibold text-[#121212] transition-colors hover:bg-[#AACF32] active:scale-[0.97]"
      >
        Use this
      </button>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */

export default function RecentLaunchModal({
  open,
  onClose,
  mode,
  onImport,
}: RecentLaunchModalProps) {
  const [q, setQ] = useState("");
  const [objFilter, setObjFilter] = useState<ObjFilter>("All");
  const [nicheFilter, setNicheFilter] = useState<NicheFilter>("All");
  const [calTooltip, setCalTooltip] = useState(false);

  const filtered = MOCK_LAUNCHES.filter((l) => {
    const matchesQ = l.name.toLowerCase().includes(q.toLowerCase());
    const matchesObj = objFilter === "All" || l.objective === objFilter;
    const matchesNiche = nicheFilter === "All" || l.niche === nicheFilter;
    return matchesQ && matchesObj && matchesNiche;
  });

  function handleUse(launch: MockLaunch) {
    if (mode === "setup") {
      onImport({
        objective: launch.objective,
        intent: launch.intent,
        budgetAmount: launch.budgetAmount,
        budgetMode: launch.budgetMode,
        targets: launch.targets,
      });
    } else {
      onImport({
        format: launch.format,
        creatives: launch.creatives,
        adCopy: launch.adCopy,
      });
    }
    onClose();
  }

  function resetFilters() {
    setQ("");
    setObjFilter("All");
    setNicheFilter("All");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      {/* Bug 1 fix: bg-white / dark:bg-[#1E1E23] on the content box — backdrop stays behind */}
      <DialogContent
        className="flex max-h-[88vh] max-w-[600px] flex-col gap-0 overflow-hidden rounded-2xl p-0 bg-white dark:bg-[#1E1E23]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-row items-center justify-between border-b border-[#e7e5dc] dark:border-[#2a2a2a] px-6 py-4">
          <div className="flex flex-col">
            <span className="text-[17px] font-bold tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
              Recent Launches
            </span>
            <span className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mt-0.5">
              Select a past launch to prefill this step
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] flex items-center justify-center text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] transition-colors hover:bg-[#F0F0EC] dark:hover:bg-[#1B1B1F]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────────────── */}
        <div className="bg-[#FAFAF7] dark:bg-[#18181B] border-b border-[#e7e5dc] dark:border-[#2a2a2a] px-5 py-4 space-y-3">
          {/* Search */}
          <div className="relative flex h-9 items-center">
            <Search className="absolute left-3.5 h-3.5 w-3.5 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search launches..."
              className="rounded-[28px] h-9 border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] pl-9 pr-4 text-[13px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821]/50 focus:shadow-[0_0_0_3px_rgba(143,184,33,0.15)] w-full placeholder:font-mono placeholder:text-[rgba(15,15,12,0.4)] dark:placeholder:text-[rgba(255,255,255,0.4)] transition-all"
            />
          </div>

          {/* Bug 3 fix: Objective row with eyebrow label */}
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
              Objective
            </p>
            <div className="flex flex-wrap gap-1.5">
              {OBJ_CHIPS.map((o) => (
                <FilterChip
                  key={o}
                  label={o}
                  active={objFilter === o}
                  onClick={() => setObjFilter(o)}
                />
              ))}
            </div>
          </div>

          {/* Bug 3 fix: Niche row with eyebrow label + calendar */}
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
              Niche
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {NICHE_CHIPS.map((n) => (
                <FilterChip
                  key={n}
                  label={n}
                  active={nicheFilter === n}
                  onClick={() => setNicheFilter(n)}
                />
              ))}
              <div className="h-4 w-px bg-[#e7e5dc] dark:bg-[#2a2a2a] mx-0.5" />
              {/* Calendar stub */}
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setCalTooltip(true)}
                  onMouseLeave={() => setCalTooltip(false)}
                  className="flex h-7 items-center gap-1.5 rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:bg-[#E8E8E4] dark:hover:bg-[#222226] transition-colors"
                >
                  <Calendar className="h-3 w-3" />
                  Date range
                </button>
                {calTooltip && (
                  <div className="absolute left-1/2 top-8 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[rgba(15,15,12,0.92)] px-2.5 py-1.5 font-mono text-[11px] text-white shadow-md">
                    Coming soon
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Results count bar ───────────────────────────────────────────────── */}
        <div className="px-5 py-2 border-b border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23]">
          <span className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {filtered.length} launch{filtered.length !== 1 ? "es" : ""}
          </span>
        </div>

        {/* ── Launch list ─────────────────────────────────────────────────────── */}
        <div className="bg-[#FAFAF7] dark:bg-[#18181B] flex-1 overflow-y-auto px-5 py-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="h-10 w-10 rounded-xl bg-[#F0F0EC] dark:bg-[#1B1B1F] flex items-center justify-center">
                <Search className="h-4 w-4 text-[rgba(15,15,12,0.35)] dark:text-[rgba(255,255,255,0.35)]" />
              </div>
              <p className="text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                No launches match
              </p>
              <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Try different filters or clear the search
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] px-4 py-1.5 text-[12px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/40 transition-colors"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((l) => (
                <LaunchCard
                  key={l.id}
                  launch={l}
                  mode={mode}
                  onUse={() => handleUse(l)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

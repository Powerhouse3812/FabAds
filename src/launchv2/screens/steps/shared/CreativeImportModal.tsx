/**
 * CreativeImportModal — Step 3 creative-selection modal.
 *
 * Lets the user pick ad creative assets from a past launch.
 * Imports: format, creatives, adCopy — NO budget, niche, or objective.
 *
 * Filter: name/brand search + FORMAT chip (All | Image | Video | Carousel | DPA).
 * Lock: cannot close by clicking outside or pressing Escape — only the X button.
 */

import { useState } from "react";
import { Search, ImageIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PlanV2, AdCopy, CreativeRef, AdFormat } from "../../../types";

/* ─── Props ─────────────────────────────────────────────────────────────────── */

export interface CreativeImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (patch: Partial<PlanV2>) => void;
}

/* ─── Mock data ──────────────────────────────────────────────────────────────── */

interface MockLaunch {
  id: string;
  name: string;
  brand: string;
  date: string;
  format: AdFormat;
  creativeCount: number;
  thumbnail: string;
  adCopy: AdCopy;
  creatives: Array<{ id: string; name: string; format: string; source: string; thumbnail: string; itemType: string; }>;
}

const MOCK_LAUNCHES: MockLaunch[] = [
  {
    id: "ci-001",
    name: "Vitamin C Face Wash — Q2 Push",
    brand: "Mamaearth",
    date: "2026-06-18",
    format: "single_image",
    creativeCount: 3,
    thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&q=80",
    adCopy: {
      primaryText: "Dull skin? Switch to Mamaearth Vitamin C Face Wash — formulated with natural actives for a brighter, even-toned complexion in just 4 weeks.",
      headline: "Glow Brighter, Naturally",
      description: "Cruelty-free · Dermatologist tested · No sulfates",
      cta: "SHOP_NOW",
      destinationUrl: "https://mamaearth.in/vitamin-c-face-wash",
      displayLink: "mamaearth.in",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=vitc-facewash-q2",
    },
    creatives: [
      { id: "cr-001a", name: "VitC_Hero_01.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=80&q=70", itemType: "media" },
      { id: "cr-001b", name: "VitC_Lifestyle_02.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=80&q=70", itemType: "media" },
      { id: "cr-001c", name: "VitC_Closeup_03.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=80&q=70", itemType: "media" },
    ],
  },
  {
    id: "ci-002",
    name: "Rockerz 450 — Festive Product Demo",
    brand: "boAt",
    date: "2026-06-03",
    format: "single_video",
    creativeCount: 2,
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80",
    adCopy: {
      primaryText: "60 hours playback. Dual connectivity. Premium sound at a price that makes sense. The Rockerz 450 is here to level up your daily playlist.",
      headline: "Own the Sound",
      description: "60hr battery · Bluetooth 5.0 · Foldable design",
      cta: "LEARN_MORE",
      destinationUrl: "https://www.boat-lifestyle.com/rockerz-450",
      displayLink: "boat-lifestyle.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=rockerz450-festive",
    },
    creatives: [
      { id: "cr-002a", name: "Rockerz_450_Demo_30s.mp4", format: "single_video", source: "library", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=70", itemType: "media" },
      { id: "cr-002b", name: "Rockerz_450_Unbox_15s.mp4", format: "single_video", source: "library", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=70", itemType: "media" },
    ],
  },
  {
    id: "ci-003",
    name: "ColorFit Pro 5 — Mid-Year Carousel",
    brand: "Noise",
    date: "2026-05-29",
    format: "carousel",
    creativeCount: 5,
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80",
    adCopy: {
      primaryText: "Track fitness the smart way. The Noise ColorFit Pro 5 features a 1.85\" AMOLED display, 110+ sports modes, and 7-day battery life.",
      headline: "Smart Watch. Smarter Price.",
      description: "AMOLED · 7-day battery · IP68 water resistant",
      cta: "SHOP_NOW",
      destinationUrl: "https://www.gonoise.com/colorfit-pro-5",
      displayLink: "gonoise.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=colorfit-pro5-carousel",
    },
    creatives: [
      { id: "cr-003a", name: "ColorFit_Slide1_Black.jpg", format: "carousel", source: "library", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=70", itemType: "media" },
      { id: "cr-003b", name: "ColorFit_Slide2_Rose.jpg", format: "carousel", source: "library", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=70", itemType: "media" },
      { id: "cr-003c", name: "ColorFit_Slide3_Teal.jpg", format: "carousel", source: "library", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=70", itemType: "media" },
      { id: "cr-003d", name: "ColorFit_Slide4_Specs.jpg", format: "carousel", source: "library", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=70", itemType: "media" },
      { id: "cr-003e", name: "ColorFit_Slide5_Offer.jpg", format: "carousel", source: "library", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=70", itemType: "media" },
    ],
  },
  {
    id: "ci-004",
    name: "Ortho-X Mattress — DPA Retarget",
    brand: "Sleepyhead",
    date: "2026-06-22",
    format: "dpa",
    creativeCount: 4,
    thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&q=80",
    adCopy: {
      primaryText: "You deserve better sleep. The Sleepyhead Ortho-X features 7 comfort zones and a dual-sided design — pick the firmness that's right for you.",
      headline: "Sleep Better From Night One",
      description: "100-night trial · Free delivery · 10-year warranty",
      cta: "SHOP_NOW",
      destinationUrl: "https://sleepyhead.in/ortho-x-mattress",
      displayLink: "sleepyhead.in",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=orthox-dpa-retarget",
    },
    creatives: [
      { id: "cr-004a", name: "OrthoX_DPA_Queen.jpg", format: "dpa", source: "library", thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=80&q=70", itemType: "media" },
      { id: "cr-004b", name: "OrthoX_DPA_King.jpg", format: "dpa", source: "library", thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=80&q=70", itemType: "media" },
      { id: "cr-004c", name: "OrthoX_DPA_Single.jpg", format: "dpa", source: "library", thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=80&q=70", itemType: "media" },
      { id: "cr-004d", name: "OrthoX_DPA_Double.jpg", format: "dpa", source: "library", thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=80&q=70", itemType: "media" },
    ],
  },
  {
    id: "ci-005",
    name: "Apple Cider Vinegar Shampoo — UGC",
    brand: "WOW Skin Science",
    date: "2026-06-10",
    format: "single_image",
    creativeCount: 3,
    thumbnail: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&q=80",
    adCopy: {
      primaryText: "No sulfates. No parabens. Just the power of Apple Cider Vinegar. WOW ACV Shampoo balances your scalp pH and leaves hair visibly shinier.",
      headline: "Hair Care That Actually Works",
      description: "Sulfate-free · Paraben-free · Clinically tested",
      cta: "LEARN_MORE",
      destinationUrl: "https://www.wowskinsicence.com/acv-shampoo",
      displayLink: "wowskinsicence.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=acv-ugc-image",
    },
    creatives: [
      { id: "cr-005a", name: "ACV_UGC_Before_After.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=80&q=70", itemType: "media" },
      { id: "cr-005b", name: "ACV_Bottle_Flat_Lay.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=80&q=70", itemType: "media" },
      { id: "cr-005c", name: "ACV_Lifestyle_Shower.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=80&q=70", itemType: "media" },
    ],
  },
  {
    id: "ci-006",
    name: "Progressive Lenses — Product Tour",
    brand: "Lenskart",
    date: "2026-05-11",
    format: "single_video",
    creativeCount: 2,
    thumbnail: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200&q=80",
    adCopy: {
      primaryText: "See every distance clearly — without changing glasses. Lenskart Progressive Lenses adapt to near, mid and far vision in one seamless lens.",
      headline: "One Lens, Every Distance",
      description: "Free home trial · Anti-glare · Blue light cut",
      cta: "BOOK_NOW",
      destinationUrl: "https://www.lenskart.com/progressive-lenses",
      displayLink: "lenskart.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=progressive-video",
    },
    creatives: [
      { id: "cr-006a", name: "Progressive_Tour_30s.mp4", format: "single_video", source: "library", thumbnail: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=80&q=70", itemType: "media" },
      { id: "cr-006b", name: "Progressive_Testimonial_15s.mp4", format: "single_video", source: "library", thumbnail: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=80&q=70", itemType: "media" },
    ],
  },
  {
    id: "ci-007",
    name: "SMB Payments — Brand Static",
    brand: "Razorpay",
    date: "2026-06-27",
    format: "single_image",
    creativeCount: 4,
    thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&q=80",
    adCopy: {
      primaryText: "Over 8 million businesses trust Razorpay for seamless payments. Accept UPI, cards, EMI and netbanking — set up in under 15 minutes.",
      headline: "India's No.1 Payment Gateway",
      description: "8M+ businesses · 100+ payment modes · 99.9% uptime",
      cta: "LEARN_MORE",
      destinationUrl: "https://razorpay.com/payment-gateway",
      displayLink: "razorpay.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=smb-static-image",
    },
    creatives: [
      { id: "cr-007a", name: "Razorpay_SMB_Stat_01.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=80&q=70", itemType: "media" },
      { id: "cr-007b", name: "Razorpay_SMB_Stat_02.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=80&q=70", itemType: "media" },
      { id: "cr-007c", name: "Razorpay_Dashboard_03.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=80&q=70", itemType: "media" },
      { id: "cr-007d", name: "Razorpay_Infographic_04.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=80&q=70", itemType: "media" },
    ],
  },
  {
    id: "ci-008",
    name: "10-min Grocery — App Install Video",
    brand: "Zepto",
    date: "2026-05-02",
    format: "single_video",
    creativeCount: 3,
    thumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80",
    adCopy: {
      primaryText: "Groceries at your door in 10 minutes. Vegetables, dairy, snacks, beverages — order on Zepto and we'll handle the rest. First order free with code FIRST.",
      headline: "Groceries in 10 Minutes, Flat",
      description: "No surge · 5,000+ products · Order tracking",
      cta: "DOWNLOAD",
      destinationUrl: "https://zepto.com/app",
      displayLink: "zepto.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=10min-video-app",
    },
    creatives: [
      { id: "cr-008a", name: "Zepto_10min_Demo_30s.mp4", format: "single_video", source: "library", thumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&q=70", itemType: "media" },
      { id: "cr-008b", name: "Zepto_10min_Hook_15s.mp4", format: "single_video", source: "library", thumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&q=70", itemType: "media" },
      { id: "cr-008c", name: "Zepto_10min_UGC_12s.mp4", format: "single_video", source: "library", thumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&q=70", itemType: "media" },
    ],
  },
  {
    id: "ci-009",
    name: "Data Science PG — Course Carousel",
    brand: "upGrad",
    date: "2026-06-01",
    format: "carousel",
    creativeCount: 4,
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80",
    adCopy: {
      primaryText: "Get a PG Certification in Data Science from upGrad & IIIT Bangalore. Learn from 50+ industry mentors, work on 20+ projects, and placement support from day one.",
      headline: "PG Data Science in 12 Months",
      description: "IIIT-B certified · 50+ mentors · Placement support",
      cta: "SIGN_UP",
      destinationUrl: "https://upgrad.com/data-science-pg",
      displayLink: "upgrad.com",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=ds-pg-carousel",
    },
    creatives: [
      { id: "cr-009a", name: "DS_PG_Slide1_Curriculum.jpg", format: "carousel", source: "library", thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&q=70", itemType: "media" },
      { id: "cr-009b", name: "DS_PG_Slide2_Mentors.jpg", format: "carousel", source: "library", thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&q=70", itemType: "media" },
      { id: "cr-009c", name: "DS_PG_Slide3_Outcomes.jpg", format: "carousel", source: "library", thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&q=70", itemType: "media" },
      { id: "cr-009d", name: "DS_PG_Slide4_Alumni.jpg", format: "carousel", source: "library", thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&q=70", itemType: "media" },
    ],
  },
  {
    id: "ci-010",
    name: "Premium Card — Brand Awareness",
    brand: "CRED",
    date: "2026-04-07",
    format: "single_image",
    creativeCount: 2,
    thumbnail: "https://images.unsplash.com/photo-1580508174046-170816f65662?w=200&q=80",
    adCopy: {
      primaryText: "CRED is for people who pay their credit card bills on time. Pay bills, earn CRED coins, unlock exclusive rewards. Download the app trusted by 12M+ premium members.",
      headline: "Rewards for Good Credit",
      description: "12M+ members · Exclusive deals · Instant cashback",
      cta: "DOWNLOAD",
      destinationUrl: "https://cred.club/download",
      displayLink: "cred.club",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign=premium-static-image",
    },
    creatives: [
      { id: "cr-010a", name: "CRED_Premium_Black_01.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1580508174046-170816f65662?w=80&q=70", itemType: "media" },
      { id: "cr-010b", name: "CRED_Premium_Gold_02.jpg", format: "single_image", source: "library", thumbnail: "https://images.unsplash.com/photo-1580508174046-170816f65662?w=80&q=70", itemType: "media" },
    ],
  },
];

/* ─── Format display map ─────────────────────────────────────────────────────── */

const FORMAT_DISPLAY: Record<string, string> = {
  single_image: "IMAGE",
  single_video: "VIDEO",
  carousel: "CAROUSEL",
  dpa: "DPA",
};

/* ─── Filter types ───────────────────────────────────────────────────────────── */

type FormatFilter = "ALL" | "IMAGE" | "VIDEO" | "CAROUSEL" | "DPA";

const FORMAT_CHIPS: FormatFilter[] = ["ALL", "IMAGE", "VIDEO", "CAROUSEL", "DPA"];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

function formatMatchesFilter(format: string, filter: FormatFilter): boolean {
  if (filter === "ALL") return true;
  return FORMAT_DISPLAY[format] === filter;
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function FormatChip({
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
        "rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-colors",
        active
          ? "bg-[#8FB821] text-[#121212]"
          : "bg-[#F0F0EC] text-[rgba(15,15,12,0.62)] hover:bg-[#E8E8E4] dark:bg-[#1B1B1F] dark:text-[rgba(255,255,255,0.62)] dark:hover:bg-[#222226]",
      )}
    >
      {label}
    </button>
  );
}

function CreativeCard({
  launch,
  onUse,
}: {
  launch: MockLaunch;
  onUse: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] p-3 transition-all duration-[220ms] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      {/* Thumbnail */}
      <img
        src={launch.thumbnail}
        alt={launch.name}
        className="h-14 w-14 shrink-0 rounded-xl object-cover bg-[#F0F0EC] dark:bg-[#1B1B1F]"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />

      {/* Body */}
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        {/* Row 1: name + date */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 truncate text-[13px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
            {launch.brand} — {launch.name}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {fmtDate(launch.date)}
          </span>
        </div>

        {/* Row 2: format badge + creative count */}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            {FORMAT_DISPLAY[launch.format] ?? launch.format}
          </span>
          <span className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {launch.creativeCount} creative{launch.creativeCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Row 3: headline preview */}
        <p className="truncate font-mono text-[11px] italic text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
          &ldquo;{launch.adCopy.headline}&rdquo;
        </p>

        {/* Row 4: CTA right-aligned */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onUse}
            className="rounded-full bg-[#8FB821] px-3 py-1 font-mono text-[11px] font-semibold text-[#121212] transition-colors hover:bg-[#AACF32] active:scale-[0.97]"
          >
            Use creatives
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

export default function CreativeImportModal({
  open,
  onClose,
  onImport,
}: CreativeImportModalProps) {
  const [q, setQ] = useState("");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("ALL");

  const filtered = MOCK_LAUNCHES.filter((l) => {
    const matchesQ =
      `${l.name} ${l.brand}`.toLowerCase().includes(q.toLowerCase());
    const matchesFmt = formatMatchesFilter(l.format, formatFilter);
    return matchesQ && matchesFmt;
  });

  function handleUse(launch: MockLaunch) {
    onImport({
      format: launch.format as AdFormat,
      creatives: launch.creatives as CreativeRef[],
      adCopy: launch.adCopy as AdCopy,
    });
    onClose();
  }

  function resetFilters() {
    setQ("");
    setFormatFilter("ALL");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="flex max-h-[88vh] max-w-[640px] flex-col gap-0 overflow-hidden rounded-2xl p-0 bg-white dark:bg-[#1E1E23]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Radix accessibility requirement */}
        <DialogTitle className="sr-only">Import creatives</DialogTitle>

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[#e7e5dc] dark:border-[#2a2a2a] px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
              Import creatives
            </span>
            <span className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
              Select a past launch to import its format, creatives, and copy
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] transition-colors hover:bg-[#F0F0EC] dark:hover:bg-[#1B1B1F]"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
        <div className="space-y-3 border-b border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B] px-5 py-4">
          {/* Search */}
          <div className="relative flex h-9 items-center">
            <Search className="absolute left-3.5 h-3.5 w-3.5 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search launches..."
              className="h-9 w-full rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] pl-9 pr-4 text-[13px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none transition-all placeholder:font-mono placeholder:text-[rgba(15,15,12,0.4)] dark:placeholder:text-[rgba(255,255,255,0.4)] focus:border-[#8FB821]/50 focus:shadow-[0_0_0_3px_rgba(143,184,33,0.15)]"
            />
          </div>

          {/* Format filter row */}
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
              Format
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FORMAT_CHIPS.map((chip) => (
                <FormatChip
                  key={chip}
                  label={chip}
                  active={formatFilter === chip}
                  onClick={() => setFormatFilter(chip)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Results count bar ────────────────────────────────────────────────── */}
        <div className="border-b border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-5 py-2">
          <span className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {filtered.length} launch{filtered.length !== 1 ? "es" : ""}
          </span>
        </div>

        {/* ── List ─────────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAF7] dark:bg-[#18181B] px-5 py-4">
          {filtered.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F0EC] dark:bg-[#1B1B1F]">
                <ImageIcon className="h-4 w-4 text-[rgba(15,15,12,0.35)] dark:text-[rgba(255,255,255,0.35)]" />
              </div>
              <p className="text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                No launches match
              </p>
              <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Try a different format filter
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] px-4 py-1.5 text-[12px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] transition-colors hover:border-[#8FB821]/40"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((l) => (
                <CreativeCard
                  key={l.id}
                  launch={l}
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

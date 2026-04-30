import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Globe, Tag, MessageSquare, Palette, Package, Save, X, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brand, Product } from "../types/entities";
import { addBrand } from "../stores/userBrandsStore";
import { BrandLogo } from "./BrandLogo";

/**
 * BrandFetchModal — port of Genie 5's killer URL→brand-auto-detect flow.
 *
 * 3-state machine:
 *   1. INPUT   — paste URL + go
 *   2. FETCHING — skeleton with stage labels (Reading page / Extracting voice / Listing products)
 *   3. REVIEW  — auto-filled fields (name/category/tone/colors) + product list,
 *                inline editable, Save → adds to user brands store + selects in
 *                draft.
 *
 * No backend wired — fetch is mocked with a 2.4s delay + a deterministic stub
 * derived from the domain. Replace `mockFetch` with the real endpoint when
 * the brand-extraction service is live.
 */

type Stage = "input" | "fetching" | "review";

interface FetchedBrand {
  name: string;
  domain: string;
  logo?: string;
  category: string;
  tone: string;
  colors: string[];
  products: { name: string; price?: string; image?: string }[];
}

const STAGES = [
  "Reading page",
  "Extracting voice",
  "Detecting colors",
  "Listing products",
];

interface BrandFetchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional initial URL to skip the input stage. */
  initialUrl?: string;
  /** Called with the new brand id after save (so caller can select it). */
  onSaved?: (brandId: string) => void;
}

export function BrandFetchModal({ open, onOpenChange, initialUrl, onSaved }: BrandFetchModalProps) {
  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [stageIdx, setStageIdx] = useState(0);
  const [fetched, setFetched] = useState<FetchedBrand | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("");
  const [colors, setColors] = useState<string[]>([]);

  // Auto-trigger fetch when modal opens with initialUrl
  useEffect(() => {
    if (open && initialUrl && stage === "input") {
      setUrl(initialUrl);
      runFetch(initialUrl);
    }
    if (!open) {
      // reset on close
      setStage("input");
      setStageIdx(0);
      setFetched(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUrl]);

  // Animate stage progression while fetching
  useEffect(() => {
    if (stage !== "fetching") return;
    const interval = setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
    }, 600);
    return () => clearInterval(interval);
  }, [stage]);

  // Sync fetched data into editable state
  useEffect(() => {
    if (fetched) {
      setName(fetched.name);
      setCategory(fetched.category);
      setTone(fetched.tone);
      setColors([...fetched.colors]);
    }
  }, [fetched]);

  function runFetch(u: string) {
    setStage("fetching");
    setStageIdx(0);
    // Mock 2.4s fetch
    setTimeout(() => {
      setFetched(mockFetch(u));
      setStage("review");
    }, 2400);
  }

  const handleSave = () => {
    if (!fetched) return;
    const id = `user-${slugify(name)}-${Date.now().toString(36)}`;
    const products: Product[] = fetched.products.map((p, i) => ({
      id: `${id}-product-${i}`,
      brandId: id,
      name: p.name,
      price: p.price ?? "",
      thumbnail: p.image,
      benefits: [],
      generatedCount: 0,
    }));
    const brand: Brand = {
      id,
      name,
      domain: fetched.domain,
      logo: fetched.logo,
      category,
      tone,
      voice: tone,
      fonts: { display: "Inter", body: "Inter" },
      colors,
      usps: [],
      competitors: [],
      productIds: products.map((p) => p.id),
    };
    addBrand(brand, products);
    onSaved?.(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="g6-root max-w-lg border-g6-border bg-g6-bg-elevated text-g6-text">
        <DialogHeader>
          <DialogTitle className="font-g6-sans text-g6-h4 font-semibold text-g6-text">
            {stage === "input" && "Fetch a brand"}
            {stage === "fetching" && "Reading your brand…"}
            {stage === "review" && "Confirm brand details"}
          </DialogTitle>
        </DialogHeader>

        {stage === "input" && (
          <InputStage
            url={url}
            setUrl={setUrl}
            onFetch={() => runFetch(url)}
            onCancel={() => onOpenChange(false)}
          />
        )}
        {stage === "fetching" && <FetchingStage url={url} stageIdx={stageIdx} />}
        {stage === "review" && fetched && (
          <ReviewStage
            url={url}
            fetched={fetched}
            name={name}
            setName={setName}
            category={category}
            setCategory={setCategory}
            tone={tone}
            setTone={setTone}
            colors={colors}
            setColors={setColors}
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────── */

function InputStage({
  url,
  setUrl,
  onFetch,
  onCancel,
}: {
  url: string;
  setUrl: (s: string) => void;
  onFetch: () => void;
  onCancel: () => void;
}) {
  const valid = /^https?:\/\/[^\s]+$/.test(url.trim());
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="font-g6-sans text-g6-sm text-g6-text-secondary">Brand homepage or product URL</span>
        <input
          type="url"
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourbrand.com"
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid) onFetch();
          }}
          className="mt-1 block w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 py-2 font-g6-mono text-g6-base text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
        />
      </label>
      <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">
        AI will read the page and pull logo, colors, voice, and a few products. ~3s.
      </p>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-4 font-g6-sans text-g6-sm text-g6-text-secondary hover:bg-g6-bg-spotlight"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onFetch}
          disabled={!valid}
          className="h-9 rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover disabled:opacity-50"
        >
          Fetch brand ▸
        </button>
      </div>
    </div>
  );
}

function FetchingStage({ url, stageIdx }: { url: string; stageIdx: number }) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 font-g6-mono text-g6-xs text-g6-text-tertiary">
        <Globe className="h-3.5 w-3.5" />
        <span className="truncate">{url}</span>
      </div>
      <div className="space-y-2">
        {STAGES.map((s, i) => {
          const done = i < stageIdx;
          const active = i === stageIdx;
          return (
            <div key={s} className="flex items-center gap-2 text-g6-sm">
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  done && "bg-g6-primary text-g6-text-on-accent",
                  active && "bg-g6-primary-bg",
                  !done && !active && "bg-g6-bg-spotlight"
                )}
              >
                {done && <span className="text-[10px]">✓</span>}
                {active && <Loader2 className="h-2.5 w-2.5 animate-spin text-g6-primary" />}
              </span>
              <span
                className={cn(
                  done ? "text-g6-text-secondary line-through" : "",
                  active ? "text-g6-text font-medium" : "",
                  !done && !active ? "text-g6-text-tertiary" : ""
                )}
              >
                {s}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStage({
  url,
  fetched,
  name,
  setName,
  category,
  setCategory,
  tone,
  setTone,
  colors,
  setColors,
  onSave,
  onCancel,
}: {
  url: string;
  fetched: FetchedBrand;
  name: string;
  setName: (s: string) => void;
  category: string;
  setCategory: (s: string) => void;
  tone: string;
  setTone: (s: string) => void;
  colors: string[];
  setColors: (cs: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header with logo + name */}
      <div className="flex items-center gap-3">
        <BrandLogo
          name={name}
          src={fetched.logo}
          tint={colors[0]}
          size="h-10 w-10"
          rounded="rounded-g6-base"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 flex-1 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-2.5 text-g6-base font-semibold text-g6-text focus:border-g6-primary-border focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 font-g6-mono text-g6-xs text-g6-text-tertiary">
        <Globe className="h-3 w-3" />
        <span className="truncate">{url}</span>
      </div>

      {/* Category + Tone */}
      <div className="grid grid-cols-2 gap-3">
        <FieldEditor Icon={Tag} label="Category" value={category} onChange={setCategory} />
        <FieldEditor Icon={MessageSquare} label="Tone" value={tone} onChange={setTone} />
      </div>

      {/* Colors */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 font-g6-mono text-[11px] uppercase tracking-wider text-g6-text-tertiary">
          <Palette className="h-3 w-3" />
          Brand colors
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {colors.map((c, i) => (
            <div key={i} className="group flex items-center gap-1">
              <input
                type="color"
                value={c}
                onChange={(e) => setColors(colors.map((x, j) => (j === i ? e.target.value : x)))}
                className="h-7 w-7 cursor-pointer rounded-g6-base border border-g6-border-secondary p-0"
              />
              <input
                value={c}
                onChange={(e) => setColors(colors.map((x, j) => (j === i ? e.target.value : x)))}
                className="h-7 w-20 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-1.5 font-g6-mono text-[11px] text-g6-text"
              />
              {colors.length > 1 && (
                <button
                  onClick={() => setColors(colors.filter((_, j) => j !== i))}
                  className="text-g6-text-tertiary opacity-0 transition-opacity hover:text-g6-error group-hover:opacity-100"
                  aria-label="Remove color"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setColors([...colors, "#888888"])}
            className="flex h-7 w-7 items-center justify-center rounded-g6-base border border-dashed border-g6-border-secondary text-g6-text-tertiary hover:border-g6-border hover:text-g6-text"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Products */}
      {fetched.products.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-g6-mono text-[11px] uppercase tracking-wider text-g6-text-tertiary">
            <Package className="h-3 w-3" />
            {fetched.products.length} product{fetched.products.length === 1 ? "" : "s"} found
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-1">
            {fetched.products.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-2"
              >
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-9 w-9 shrink-0 rounded bg-g6-bg-spotlight object-cover" />
                ) : (
                  <div className="h-9 w-9 shrink-0 rounded bg-g6-bg-spotlight" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-g6-xs font-medium text-g6-text">{p.name}</p>
                  {p.price && (
                    <p className="font-g6-mono text-[10px] text-g6-text-tertiary">{p.price}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center gap-1.5 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-4 font-g6-sans text-g6-sm text-g6-text-secondary hover:bg-g6-bg-spotlight"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!name.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" /> Save & select
        </button>
      </div>
    </div>
  );
}

function FieldEditor({
  Icon,
  label,
  value,
  onChange,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="flex items-center gap-1.5 font-g6-mono text-[11px] uppercase tracking-wider text-g6-text-tertiary">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block h-8 w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-2 text-g6-sm text-g6-text focus:border-g6-primary-border focus:outline-none"
      />
    </label>
  );
}

/* ─────────────────────────────────────────────────── */

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

/**
 * Mock brand-fetch. Derives a plausible brand profile from the URL alone.
 * Real implementation will hit the brand-extraction service.
 */
function mockFetch(rawUrl: string): FetchedBrand {
  let domain = rawUrl;
  try {
    domain = new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    // ignore
  }
  const root = domain.split(".")[0] || "brand";
  const name = root
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

  // Simple keyword-based category guess
  const u = rawUrl.toLowerCase();
  let category = "D2C consumer";
  let tone = "Direct, energetic, modern";
  let colors = ["#1f2937", "#10b981", "#f8fafc"];
  if (/skin|beauty|hair|cosmet/.test(u)) {
    category = "Beauty & personal care";
    tone = "Warm, ingredient-led, optimistic";
    colors = ["#7c2d6a", "#fbcfe8", "#fffaf3"];
  } else if (/audio|earbud|headphone|speaker|wear/.test(u)) {
    category = "Audio & wearables";
    tone = "Bold, energetic, performance-led";
    colors = ["#0a0a0a", "#ef4444", "#ffffff"];
  } else if (/sleep|mattress|bed/.test(u)) {
    category = "Sleep & home";
    tone = "Premium, calm, design-led";
    colors = ["#1A2845", "#E4D3B0", "#FFFFFF"];
  } else if (/food|nutrition|supplement|protein/.test(u)) {
    category = "Food & nutrition";
    tone = "Clean, scientific, accessible";
    colors = ["#16a34a", "#fef3c7", "#0f172a"];
  }

  return {
    name,
    domain,
    logo: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
    category,
    tone,
    colors,
    products: [
      {
        name: `${name} Hero product`,
        price: "₹999",
        image: "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=200&q=70",
      },
      {
        name: `${name} Bestseller`,
        price: "₹1,299",
        image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=200&q=70",
      },
      {
        name: `${name} Starter pack`,
        price: "₹1,799",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=70",
      },
    ],
  };
}

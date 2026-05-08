import { useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  GalleryHorizontal,
  History,
  Image as ImageIcon,
  Lightbulb,
  Link2,
  Package,
  Palette,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  Type as TypeIcon,
  Users,
  Building2,
  Crosshair,
  MessageSquareQuote,
  UserRound,
  Mic,
  Volume2,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  brands,
  categories,
  products,
  audiences,
  angles,
  hooks,
  concepts,
  avatars,
  voices,
  getInstructionsForEntity,
  getWinnerAdsForEntity,
  getConceptsForEntity,
  getReferenceUrlsForEntity,
  shortUrl,
  type EntityType as KbEntityType,
  type EntityId as KbEntityId,
  type KbInstruction,
  type WinnerAd,
  type KbConcept,
  type ReferenceUrl,
} from "@/mocks/shared";
import type { Avatar, Brand, Product } from "@/genie6/types/entities";
import { sampleOutputs } from "@/genie6/mocks/sample-outputs";
import {
  ACTIVITY_LOG,
  getActivityLogForBrand,
  type ActivityLogEntry,
  type ActivityKind,
} from "@/mocks/shared";
import { SectionHeader } from "@/genie6/studio-v4/components/SectionHeader";
import { KbCreateModal, type KbCreateKind } from "./KbCreateModal";
import {
  addInstruction as savedAddInstruction,
  addWinnerAd as savedAddWinnerAd,
  addConcept as savedAddConcept,
  useSavedProductsForBrand,
  useSavedInstructionsForEntity,
  useSavedWinnersForEntity,
  useSavedConceptsForEntity,
} from "@/genie6/concepts/saved-store";

type CatalogueType =
  | "categories"
  | "brands"
  | "products"
  | "audiences"
  | "angles"
  | "hooks"
  | "concepts"
  | "avatars"
  | "voices";

// Note: KB block (KnowledgeBaseSection) only renders inside the brand /
// product / category branches below. The new types (angles / hooks /
// concepts / avatars / voices) never reach it — they return their own
// Shell before the products fallthrough.

/**
 * Catalogue entity detail — stub for iter-6 A-9.
 *
 * Displays the entity's full metadata + linked relations. Real entity-level
 * sub-nav (Products / KB / Generations / Targeting Templates / Linked Folder /
 * Campaign URLs / etc. tabs) ships in the next sprint per A-1's planning.
 *
 * Iter-6 KB block: for Brand / Product / Category (NOT Audience), a
 * Knowledge Base section is appended after the entity-specific sections.
 * Sub-sections: Main instruction · Custom instructions · Winner ads · Concepts.
 */
export function CatalogueDetailPage({ type }: { type: CatalogueType }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <div className="p-6 text-muted-foreground">Missing entity id.</div>;

  if (type === "brands") {
    const brand = brands.find((b) => b.id === id);
    if (!brand) return <NotFound type={type} navigate={navigate} />;
    return <BrandDetail brand={brand} navigate={navigate} />;
  }

  if (type === "categories") {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return <NotFound type={type} navigate={navigate} />;
    const linkedProducts = products.filter((p) => p.categoryId === cat.id);
    const linkedBrands = brands.filter((b) => b.categoryIds?.includes(cat.id));
    return (
      <Shell type={type} title={cat.name} subtitle={`${linkedBrands.length} brands · ${linkedProducts.length} products`} icon={<Tag className="h-5 w-5" />}>
        <Section title="KB instruction"><p className="text-sm text-foreground">{cat.instruction}</p></Section>
        <Section title={`Brands · ${linkedBrands.length}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {linkedBrands.map((b) => (
              <Link key={b.id} to={`/catalogue/brands/${b.id}`}
                className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:border-primary/40">
                {b.logo && <img src={b.logo} alt="" className="h-5 w-5 rounded" />}
                <span className="truncate">{b.name}</span>
              </Link>
            ))}
          </div>
        </Section>
        <Section title={`Products · ${linkedProducts.length}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {linkedProducts.map((p) => (
              <Link key={p.id} to={`/catalogue/products/${p.id}`}
                className="rounded-lg border border-border p-3 text-sm hover:border-primary/40">
                <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.price}</p>
              </Link>
            ))}
          </div>
        </Section>
        <KnowledgeBaseSection entityType="category" entityId={cat.id} entityLabel="category" />
      </Shell>
    );
  }

  if (type === "audiences") {
    const audience = audiences.find((a) => a.id === id);
    if (!audience) return <NotFound type={type} navigate={navigate} />;
    const brand = audience.brandId ? brands.find((b) => b.id === audience.brandId) : undefined;
    return (
      <Shell type={type} title={audience.label} subtitle={audience.segment} icon={<Users className="h-5 w-5" />}>
        <Section title="Segment definition">
          <p className="text-sm text-foreground">{audience.segment}</p>
        </Section>
        <Section title="Parent brand">
          {brand ? (
            <Link
              to={`/catalogue/brands/${brand.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:border-primary/40"
            >
              {brand.logo && <img src={brand.logo} alt="" className="h-5 w-5 rounded" />}
              <span className="font-medium text-foreground">{brand.name}</span>
              <span className="text-xs text-muted-foreground">· {brand.domain}</span>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Brand-agnostic audience — applies across multiple brands.
            </p>
          )}
        </Section>
        <Section title="Linked campaigns">
          <p className="text-sm text-muted-foreground italic">No campaigns linked yet.</p>
        </Section>
      </Shell>
    );
  }

  if (type === "angles") {
    const angle = angles.find((a) => a.id === id);
    if (!angle) return <NotFound type={type} navigate={navigate} />;
    // Find hooks + concepts that reference this angle (denormalised relation).
    const linkedHooks = hooks.filter((h) => h.angleId === angle.id);
    const linkedConcepts = concepts.filter(
      (c) => c.angle.toLowerCase() === angle.label.toLowerCase()
    );
    return (
      <Shell type={type} title={angle.label} subtitle={angle.description} icon={<Crosshair className="h-5 w-5" />}>
        {angle.description && (
          <Section title="What it is"><p className="text-sm text-foreground">{angle.description}</p></Section>
        )}
        <Section title={`Linked hooks · ${linkedHooks.length}`}>
          {linkedHooks.length > 0 ? (
            <ul className="space-y-1.5">
              {linkedHooks.slice(0, 8).map((h) => (
                <li key={h.id}>
                  <Link
                    to={`/catalogue/hooks/${h.id}`}
                    className="block rounded-lg border border-border p-2.5 text-sm hover:border-primary/40"
                  >
                    <p className="text-foreground line-clamp-2">"{h.text}"</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No hooks linked yet.</p>
          )}
        </Section>
        <Section title={`Linked concepts · ${linkedConcepts.length}`}>
          {linkedConcepts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {linkedConcepts.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  to={`/catalogue/concepts/${c.id}`}
                  className="rounded-lg border border-border p-2.5 text-sm hover:border-primary/40"
                >
                  <p className="font-medium text-foreground line-clamp-1">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{c.tone}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No concepts linked yet.</p>
          )}
        </Section>
        <Section title="Generation history">
          <p className="text-sm text-muted-foreground italic">No generations yet.</p>
        </Section>
      </Shell>
    );
  }

  if (type === "hooks") {
    const hook = hooks.find((h) => h.id === id);
    if (!hook) return <NotFound type={type} navigate={navigate} />;
    const brand = hook.brandId ? brands.find((b) => b.id === hook.brandId) : undefined;
    const angle = hook.angleId ? angles.find((a) => a.id === hook.angleId) : undefined;
    return (
      <Shell type={type} title={`"${hook.text}"`} subtitle={undefined} icon={<MessageSquareQuote className="h-5 w-5" />}>
        <Section title="Linked brand">
          {brand ? (
            <Link
              to={`/catalogue/brands/${brand.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:border-primary/40"
            >
              {brand.logo && <img src={brand.logo} alt="" className="h-5 w-5 rounded" />}
              <span className="font-medium text-foreground">{brand.name}</span>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground italic">No brand linked.</p>
          )}
        </Section>
        <Section title="Linked angle">
          {angle ? (
            <Link
              to={`/catalogue/angles/${angle.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:border-primary/40"
            >
              <Crosshair className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">{angle.label}</span>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground italic">No angle linked.</p>
          )}
        </Section>
        {hook.performance && (
          <Section title="Performance">
            <div className="flex items-center gap-4 font-mono tabular-nums">
              <div>
                <p className="text-xs text-muted-foreground">CTR</p>
                <p className="text-xl font-bold text-foreground">{hook.performance.ctr.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impressions</p>
                <p className="text-xl font-bold text-foreground">{formatCompact(hook.performance.impressions)}</p>
              </div>
            </div>
          </Section>
        )}
        <Section title="Generation history">
          <p className="text-sm text-muted-foreground italic">No generations yet.</p>
        </Section>
      </Shell>
    );
  }

  if (type === "concepts") {
    const concept = concepts.find((c) => c.id === id);
    if (!concept) return <NotFound type={type} navigate={navigate} />;
    const brand = brands.find((b) => b.id === concept.brandId);
    // Look up the linked angle by label match (concept stores angle by string label,
    // not id — see Concept shape in entities.ts).
    const angle = angles.find((a) => a.label.toLowerCase() === concept.angle.toLowerCase());
    // Find hooks that match this concept's hook text exactly (since Concept.hook
    // is also a string, not a ref).
    const linkedHook = hooks.find((h) => h.text === concept.hook);
    return (
      <Shell type={type} title={concept.name} subtitle={`${concept.angle} · ${concept.tone}`} icon={<Lightbulb className="h-5 w-5" />}>
        <Section title="Format"><p className="text-sm text-foreground font-mono">{concept.format}</p></Section>
        <Section title="Visual direction"><p className="text-sm text-foreground">{concept.visualDirection}</p></Section>
        <Section title="Hook copy"><p className="text-sm text-foreground italic">"{concept.hook}"</p></Section>
        <Section title="Linked brand">
          {brand ? (
            <Link
              to={`/catalogue/brands/${brand.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:border-primary/40"
            >
              {brand.logo && <img src={brand.logo} alt="" className="h-5 w-5 rounded" />}
              <span className="font-medium text-foreground">{brand.name}</span>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground italic">No brand linked.</p>
          )}
        </Section>
        {angle && (
          <Section title="Linked angle">
            <Link
              to={`/catalogue/angles/${angle.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:border-primary/40"
            >
              <Crosshair className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">{angle.label}</span>
            </Link>
          </Section>
        )}
        {linkedHook && (
          <Section title="Linked hook">
            <Link
              to={`/catalogue/hooks/${linkedHook.id}`}
              className="block rounded-lg border border-border p-2.5 text-sm hover:border-primary/40"
            >
              <p className="text-foreground line-clamp-2">"{linkedHook.text}"</p>
            </Link>
          </Section>
        )}
        <Section title="Generation history">
          <div className="flex items-baseline gap-2">
            <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm text-foreground font-mono tabular-nums">{concept.generationCount} runs</p>
          </div>
        </Section>
      </Shell>
    );
  }

  if (type === "avatars") {
    const avatar = avatars.find((a) => a.id === id);
    if (!avatar) return <NotFound type={type} navigate={navigate} />;
    const visual = avatarVisual(avatar);
    return (
      <Shell
        type={type}
        title={avatar.name}
        subtitle={avatar.demographic}
        icon={
          <div
            className="flex h-full w-full items-center justify-center rounded-xl text-[14px] font-semibold"
            style={{ background: visual.bg, color: visual.fg }}
          >
            {visual.initials}
          </div>
        }
      >
        <Section title="Demographic"><p className="text-sm text-foreground">{avatar.demographic}</p></Section>
        <Section title={`Languages · ${avatar.language.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {avatar.language.map((l) => (
              <span key={l} className="text-xs font-mono rounded bg-muted px-2 py-1 text-muted-foreground">
                {l}
              </span>
            ))}
          </div>
        </Section>
        <Section title="Generation history">
          <p className="text-sm text-muted-foreground italic">No generations yet.</p>
        </Section>
      </Shell>
    );
  }

  if (type === "voices") {
    const voice = voices.find((v) => v.id === id);
    if (!voice) return <NotFound type={type} navigate={navigate} />;
    return (
      <Shell type={type} title={voice.name} subtitle={voice.language} icon={<Mic className="h-5 w-5" />}>
        <Section title="Description"><p className="text-sm text-foreground">{voice.description}</p></Section>
        <Section title="Language">
          <span className="text-xs font-mono rounded bg-muted px-2 py-1 text-muted-foreground">
            {voice.language}
          </span>
        </Section>
        {voice.sample && (
          <Section title="Sample">
            <a
              href={voice.sample}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40"
            >
              <Volume2 className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">Play sample</span>
            </a>
          </Section>
        )}
        <Section title="Generation history">
          <p className="text-sm text-muted-foreground italic">No generations yet.</p>
        </Section>
      </Shell>
    );
  }

  // products
  const prod = products.find((p) => p.id === id);
  if (!prod) return <NotFound type={type} navigate={navigate} />;
  const brand = brands.find((b) => b.id === prod.brandId);
  const category = categories.find((c) => c.id === prod.categoryId);
  return (
    <Shell type={type} title={prod.name} subtitle={`${brand?.name}${category ? ` · ${category.name}` : ""}`} icon={<Package className="h-5 w-5" />}>
      <Section title="Price"><p className="text-2xl font-bold text-foreground font-mono">{prod.price}</p></Section>
      {prod.promo && <Section title="Promo"><span className="inline-block rounded bg-primary/15 text-primary px-2 py-1 text-sm">{prod.promo}</span></Section>}
      <Section title="Benefits">
        <ul className="space-y-1 text-sm text-foreground">
          {prod.benefits.map((b) => <li key={b}>· {b}</li>)}
        </ul>
      </Section>
      {prod.landingPages && prod.landingPages.length > 0 && (
        <Section title={`Landing pages · ${prod.landingPages.length}`}>
          <ul className="space-y-1">
            {prod.landingPages.map((lp) => (
              <li key={lp}>
                <a href={lp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  {lp} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {prod.campaignUrls && prod.campaignUrls.length > 0 && (
        <Section title={`Campaign URLs · ${prod.campaignUrls.length}`}>
          <ul className="space-y-1">
            {prod.campaignUrls.map((cu) => (
              <li key={cu}>
                <a href={cu} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground">
                  {cu} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <KnowledgeBaseSection entityType="product" entityId={prod.id} entityLabel="product" />
    </Shell>
  );
}

/* ─── Shared layout pieces ─── */

function Shell({
  type,
  title,
  subtitle,
  icon,
  children,
}: {
  type: CatalogueType;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="v3-page-mesh flex h-full flex-col p-6">
      <div className="mb-5">
        <Link to={`/catalogue/${type}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3 w-3" /> Back to {type}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">{icon}</div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-5">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionHeader title={title} />
      <div className="mt-2">{children}</div>
    </section>
  );
}

function NotFound({ type, navigate }: { type: CatalogueType; navigate: (to: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <p className="text-foreground font-medium">Entity not found</p>
      <p className="text-sm text-muted-foreground mt-1">No {type.slice(0, -1)} matches that id.</p>
      <button type="button" onClick={() => navigate(`/catalogue/${type}`)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {type}
      </button>
    </div>
  );
}

/* ─── Knowledge Base block ─── */

type KbTabKey = "main" | "custom" | "winners" | "concepts" | "refs";

function KnowledgeBaseSection({
  entityType,
  entityId,
  entityLabel,
}: {
  entityType: KbEntityType;
  entityId: KbEntityId;
  entityLabel: string;
}) {
  const [tab, setTab] = useState<KbTabKey>("main");
  const [createKind, setCreateKind] = useState<KbCreateKind | null>(null);

  // Saved items live in the global saved-store — surfaces here AND in
  // ConceptsLibrary AND ContextRail without prop-drilling.
  const savedInstr = useSavedInstructionsForEntity(entityType, entityId);
  const savedWinners = useSavedWinnersForEntity(entityType, entityId);
  const savedConcepts = useSavedConceptsForEntity(entityType, entityId);

  const seedInstr = getInstructionsForEntity(entityType, entityId);
  const main = seedInstr.main;
  const custom = [...seedInstr.custom, ...savedInstr];
  const winners = [...getWinnerAdsForEntity(entityType, entityId), ...savedWinners];
  const conceptsList = [...getConceptsForEntity(entityType, entityId), ...savedConcepts];
  const refs = getReferenceUrlsForEntity(entityType, entityId);

  const handleSaved = (
    saved:
      | { kind: "instruction"; item: KbInstruction }
      | { kind: "winner-ad"; item: WinnerAd }
      | { kind: "concept"; item: KbConcept },
  ) => {
    if (saved.kind === "instruction") savedAddInstruction(saved.item);
    else if (saved.kind === "winner-ad") savedAddWinnerAd(saved.item);
    else savedAddConcept(saved.item);
    setCreateKind(null);
  };

  const tabs: { key: KbTabKey; label: string; count: number }[] = [
    { key: "main", label: "Main", count: main ? 1 : 0 },
    { key: "custom", label: "Custom", count: custom.length },
    { key: "winners", label: "Winners", count: winners.length },
    { key: "concepts", label: "Concepts", count: conceptsList.length },
    { key: "refs", label: "References", count: refs.length },
  ];

  return (
    <section className="space-y-4 border-t border-border/40 pt-6">
      <SectionHeader
        title="Knowledge Base"
        icon={BookOpen}
        hint="For Genie generations"
      />

      {/* Tab strip — pill segmented */}
      <div className="inline-flex flex-wrap gap-1 rounded-full border border-border/60 bg-background/40 p-0.5">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold",
                    active
                      ? "bg-primary/20 text-primary"
                      : "bg-foreground/[0.08] text-foreground",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      <div>
        {tab === "main" && (
          <KbTabPanel
            hint={`The default writing rules Genie follows for this ${entityLabel}.`}
            emptyMessage={`No main instruction yet — Genie will use a generic fallback for this ${entityLabel}.`}
            createLabel={main ? "Replace" : "Create instruction"}
            onCreate={() => setCreateKind("instruction")}
            isEmpty={!main}
          >
            {main && (
              <ul className="space-y-2">
                <InstructionRow item={main} />
              </ul>
            )}
          </KbTabPanel>
        )}

        {tab === "custom" && (
          <KbTabPanel
            hint="Optional rule sets — used for campaigns, festivals, or specific product lines."
            emptyMessage="No custom instructions yet."
            createLabel="Add instruction"
            onCreate={() => setCreateKind("instruction")}
            isEmpty={custom.length === 0}
          >
            <ul className="space-y-2">
              {custom.map((it) => (
                <InstructionRow key={it.id} item={it} />
              ))}
            </ul>
          </KbTabPanel>
        )}

        {tab === "winners" && (
          <KbTabPanel
            hint="Top-performing ads — uploaded, saved from Genie, or saved from Industry Insights."
            emptyMessage="No winner ads saved yet."
            createLabel="Add winner ad"
            onCreate={() => setCreateKind("winner-ad")}
            isEmpty={winners.length === 0}
            countMax={50}
            countCurrent={winners.length}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {winners.map((w) => (
                <WinnerAdCard key={w.id} ad={w} />
              ))}
            </div>
          </KbTabPanel>
        )}

        {tab === "concepts" && (
          <KbTabPanel
            hint="Visual + tonal concepts — derived from winner ads, or saved from Genie / Industry Insights."
            emptyMessage="No concepts saved yet."
            createLabel="Add concept"
            onCreate={() => setCreateKind("concept")}
            isEmpty={conceptsList.length === 0}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {conceptsList.map((c) => (
                <ConceptCard key={c.id} concept={c} />
              ))}
            </div>
          </KbTabPanel>
        )}

        {tab === "refs" && (
          <KbTabPanel
            hint="Reference URLs — landing pages, brand assets, inspiration links."
            emptyMessage="No reference URLs saved."
            createLabel="Add URL"
            onCreate={() => alert("Add reference URL — coming soon")}
            isEmpty={refs.length === 0}
          >
            <ul className="space-y-1.5">
              {refs.map((r) => (
                <RefRow key={r.id} ref={r} />
              ))}
            </ul>
          </KbTabPanel>
        )}
      </div>

      {/* Creation modal — shared chassis for instruction / winner-ad / concept */}
      {createKind && (
        <KbCreateModal
          kind={createKind}
          entityType={entityType}
          entityId={entityId}
          entityName={entityLabel}
          onSave={handleSaved}
          onClose={() => setCreateKind(null)}
        />
      )}
    </section>
  );
}

function KbTabPanel({
  hint,
  emptyMessage,
  createLabel,
  onCreate,
  isEmpty,
  countCurrent,
  countMax,
  children,
}: {
  hint: string;
  emptyMessage: string;
  createLabel: string;
  onCreate: () => void;
  isEmpty: boolean;
  countCurrent?: number;
  countMax?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3.5">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">{hint}</p>
          {countMax && countCurrent !== undefined && (
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
              {countCurrent} of {countMax} max
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          {createLabel}
        </button>
      </header>
      {isEmpty ? (
        <p className="rounded-lg border border-dashed border-border/40 px-3 py-6 text-center text-[11px] italic text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

function RefRow({ ref: r }: { ref: ReferenceUrl }) {
  return (
    <li>
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-md border border-border/40 bg-background/60 px-3 py-2 text-[11px] transition-colors hover:border-foreground/20 hover:bg-background"
      >
        <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">{r.label}</span>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {shortUrl(r.url)}
        </span>
        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
      </a>
    </li>
  );
}

function InstructionRow({ item }: { item: KbInstruction }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border/40 bg-background px-3 py-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <BookOpen className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
          <SourceChip source={item.source} />
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{item.description}</p>
      </div>
      <div className="flex items-center gap-1">
        <IconBtn label="Edit" icon={Pencil} onClick={() => alert(`Edit "${item.name}" — coming soon`)} />
        <IconBtn label="Delete" icon={Trash2} onClick={() => alert(`Delete "${item.name}" — coming soon`)} />
      </div>
    </li>
  );
}

function WinnerAdCard({ ad }: { ad: WinnerAd }) {
  const sourceLabel: Record<WinnerAd["source"], string> = {
    uploaded: "Uploaded",
    "saved-from-genie": "From Genie",
    "saved-from-insights": "From Insights",
    "saved-from-library": "From Library",
  };
  const ctrPct = typeof ad.ctr === "number" ? `${(ad.ctr * 100).toFixed(1)}% CTR` : null;
  const imp = typeof ad.impressions === "number" ? formatCompact(ad.impressions) : null;

  return (
    <article className="overflow-hidden rounded-lg border border-border/60 bg-background transition-shadow hover:shadow-sm">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {ad.thumbnail ? (
          <img
            src={ad.thumbnail}
            alt={ad.headline}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 inline-flex items-center rounded-full border border-border/60 bg-background/95 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
          {sourceLabel[ad.source]}
        </span>
      </div>
      <div className="space-y-1 p-2">
        <p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground">{ad.headline}</p>
        {(ctrPct || imp) && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {[ctrPct, imp ? `${imp} imp` : null].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </article>
  );
}

function ConceptCard({ concept }: { concept: KbConcept }) {
  const sourceLabel: Record<KbConcept["source"], string> = {
    "from-winner-ad": "From Winner Ad",
    "saved-from-genie": "From Genie",
    "saved-from-insights": "From Insights",
  };
  return (
    <article className="flex gap-3 rounded-lg border border-border/60 bg-background p-2.5 transition-shadow hover:shadow-sm">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {concept.thumbnail ? (
          <img src={concept.thumbnail} alt={concept.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <Lightbulb className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold text-foreground">{concept.name}</p>
          <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary">
            {concept.tone}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{concept.description}</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
          <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />
          {sourceLabel[concept.source]}
        </p>
      </div>
    </article>
  );
}

function SourceChip({ source }: { source: KbInstruction["source"] }) {
  const label: Record<KbInstruction["source"], string> = {
    default: "Default",
    manual: "Manual",
    uploaded: "Uploaded",
    "ai-generated": "AI",
  };
  return (
    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
      {label[source]}
    </span>
  );
}

function IconBtn({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

/* Deterministic palette for avatar circles (same logic as CatalogueListPage). */
function avatarVisual(avatar: Avatar): { bg: string; fg: string; initials: string } {
  const palette = [
    { bg: "hsl(220, 40%, 88%)", fg: "hsl(220, 50%, 30%)" },
    { bg: "hsl(160, 35%, 86%)", fg: "hsl(160, 50%, 25%)" },
    { bg: "hsl(30, 50%, 88%)", fg: "hsl(30, 60%, 30%)" },
    { bg: "hsl(340, 35%, 88%)", fg: "hsl(340, 50%, 32%)" },
    { bg: "hsl(265, 35%, 88%)", fg: "hsl(265, 50%, 32%)" },
    { bg: "hsl(195, 35%, 86%)", fg: "hsl(195, 60%, 28%)" },
  ];
  let hash = 0;
  for (let i = 0; i < avatar.id.length; i++) hash = (hash * 31 + avatar.id.charCodeAt(i)) | 0;
  const slot = Math.abs(hash) % palette.length;
  const initials = avatar.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { ...palette[slot], initials };
}

/* ─────────────────────────────────────────────────────────────────────────
 * BrandDetail — A-12.42 6-tab redesign for brand catalogue detail.
 *
 * Hero header (logo + name + key stats + colors + tone)
 * Tab strip: Guidelines · KB · Winners · Library · Activity · Products
 * Active tab via ?tab=... URL state.
 *
 * Each tab is its own panel component below.
 * ───────────────────────────────────────────────────────────────────────── */

type BrandTabKey =
  | "guidelines"
  | "kb"
  | "winners"
  | "library"
  | "activity"
  | "products";

function BrandDetail({
  brand,
  navigate,
}: {
  brand: Brand;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as BrandTabKey | null;
  const tab: BrandTabKey =
    tabParam &&
    ["guidelines", "kb", "winners", "library", "activity", "products"].includes(tabParam)
      ? tabParam
      : "guidelines";
  const setTab = (next: BrandTabKey) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === "guidelines") sp.delete("tab");
        else sp.set("tab", next);
        return sp;
      },
      { replace: true },
    );
  };

  // Counts for tab badges.
  const seedProducts = products.filter((p) => p.brandId === brand.id);
  const savedProducts = useSavedProductsForBrand(brand.id);
  const linkedProducts = [...seedProducts, ...savedProducts];

  const winnersCount =
    getWinnerAdsForEntity("brand", brand.id).length;
  const libraryCount = sampleOutputs.filter(
    (o) => o.brand?.name === brand.name,
  ).length;
  const activityCount = ACTIVITY_LOG.filter(
    (e) => e.entityType === "brand" && e.entityId === brand.id,
  ).length;
  const kbInstrCount = (() => {
    const { main, custom } = getInstructionsForEntity("brand", brand.id);
    return (main ? 1 : 0) + custom.length;
  })();

  const tabs: { key: BrandTabKey; label: string; count?: number }[] = [
    { key: "guidelines", label: "Guidelines" },
    { key: "kb", label: "Knowledge Base", count: kbInstrCount },
    { key: "winners", label: "Winner Ads", count: winnersCount },
    { key: "library", label: "Library", count: libraryCount },
    { key: "activity", label: "Activity", count: activityCount },
    { key: "products", label: "Products", count: linkedProducts.length },
  ];

  return (
    <div className="v3-page-mesh mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-6 pb-10">
      {/* ── Top action: ← Back ── */}
      <button
        type="button"
        onClick={() => navigate("/catalogue/brands")}
        className="inline-flex w-max items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Brands
      </button>

      {/* ── Hero header ── */}
      <BrandHero brand={brand} productCount={linkedProducts.length} />

      {/* ── Tab strip ── */}
      <div className="flex flex-wrap gap-1 rounded-full border border-border/60 bg-background/40 p-0.5 self-start">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold",
                    active
                      ? "bg-primary/20 text-primary"
                      : "bg-foreground/[0.08] text-foreground",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active tab content ── */}
      <div>
        {tab === "guidelines" && <GuidelinesPanel brand={brand} />}
        {tab === "kb" && (
          <KnowledgeBaseSection
            entityType="brand"
            entityId={brand.id}
            entityLabel="brand"
          />
        )}
        {tab === "winners" && <WinnersPanel brandId={brand.id} />}
        {tab === "library" && <LibraryPanel brandName={brand.name} />}
        {tab === "activity" && <ActivityPanel brandId={brand.id} />}
        {tab === "products" && <ProductsPanel brand={brand} products={linkedProducts} />}
      </div>
    </div>
  );
}

function BrandHero({ brand, productCount }: { brand: Brand; productCount: number }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
      <img
        src={brand.logo}
        alt={brand.name}
        className="h-16 w-16 rounded-xl border border-border/40 bg-background object-contain p-1.5"
      />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">{brand.name}</h1>
          <span className="rounded-full bg-muted/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
            {brand.category}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground">
          {productCount} products · {brand.competitors.length} competitors tracked
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {brand.colors.slice(0, 4).map((c) => (
            <span
              key={c}
              className="h-5 w-5 rounded-full border border-border/40"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          {brand.tone && (
            <span className="ml-1 line-clamp-1 text-[10px] italic text-muted-foreground">
              · {brand.tone}
            </span>
          )}
        </div>
      </div>
      <a
        href={`https://${brand.domain}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {brand.domain}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

/* ─── Tab panels ─────────────────────────────────────────────────────── */

function GuidelinesPanel({ brand }: { brand: Brand }) {
  const linkedAudiences = audiences.filter((a) => a.brandId === brand.id);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <GuidelinesCard title="Brand voice" icon={Sparkles}>
        <p className="text-[13px] leading-relaxed text-foreground">{brand.voice}</p>
        {brand.tone && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Tone · <span className="lowercase tracking-normal text-foreground/70">{brand.tone}</span>
          </p>
        )}
      </GuidelinesCard>

      <GuidelinesCard title="Colors" icon={Palette}>
        <div className="flex flex-wrap items-center gap-2">
          {brand.colors.map((c) => (
            <div key={c} className="flex items-center gap-1.5">
              <span
                className="inline-block h-7 w-7 rounded-lg border border-border/60"
                style={{ backgroundColor: c }}
                title={c}
              />
              <code className="font-mono text-[10px] text-muted-foreground">{c}</code>
            </div>
          ))}
        </div>
      </GuidelinesCard>

      <GuidelinesCard title="Typography" icon={TypeIcon}>
        <div className="space-y-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Display</p>
            <p
              className="text-base font-semibold text-foreground"
              style={{ fontFamily: brand.fonts.display }}
            >
              {brand.fonts.display}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Body</p>
            <p
              className="text-sm text-foreground"
              style={{ fontFamily: brand.fonts.body }}
            >
              {brand.fonts.body}
            </p>
          </div>
        </div>
      </GuidelinesCard>

      <GuidelinesCard title={`USPs · ${brand.usps.length}`} icon={Sparkles}>
        <ul className="space-y-1">
          {brand.usps.map((u) => (
            <li key={u} className="flex items-start gap-1.5 text-[13px] text-foreground">
              <span className="text-muted-foreground/50">·</span>
              <span>{u}</span>
            </li>
          ))}
        </ul>
      </GuidelinesCard>

      <GuidelinesCard title={`Audiences · ${linkedAudiences.length}`} icon={Users}>
        {linkedAudiences.length === 0 ? (
          <p className="text-[12px] italic text-muted-foreground">No audiences linked yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {linkedAudiences.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2 py-1 text-[11px]"
                title={a.segment}
              >
                <span className="font-medium text-foreground">{a.label}</span>
                <span className="font-mono text-[9px] text-muted-foreground">·</span>
                <span className="line-clamp-1 max-w-[180px] text-muted-foreground">{a.segment}</span>
              </span>
            ))}
          </div>
        )}
      </GuidelinesCard>

      <GuidelinesCard title={`Competitors · ${brand.competitors.length}`} icon={Crosshair}>
        {brand.competitors.length === 0 ? (
          <p className="text-[12px] italic text-muted-foreground">No competitors tracked.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {brand.competitors.map((c) => (
              <span key={c} className="rounded-full bg-muted/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
                {c}
              </span>
            ))}
          </div>
        )}
      </GuidelinesCard>

      <GuidelinesCard title="Domain" icon={Link2}>
        <a
          href={`https://${brand.domain}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[13px] text-foreground hover:text-primary"
        >
          {brand.domain}
          <ExternalLink className="h-3 w-3" />
        </a>
      </GuidelinesCard>

      <GuidelinesCard title="Industry" icon={Building2}>
        <p className="text-[13px] text-foreground">{brand.category}</p>
        {brand.categoryIds && brand.categoryIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {brand.categoryIds.slice(0, 6).map((cid) => {
              const c = categories.find((x) => x.id === cid);
              return (
                <Link
                  key={cid}
                  to={`/catalogue/categories/${cid}`}
                  className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary hover:bg-primary/15"
                >
                  {c?.name ?? cid}
                </Link>
              );
            })}
          </div>
        )}
      </GuidelinesCard>
    </div>
  );
}

function GuidelinesCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function WinnersPanel({ brandId }: { brandId: string }) {
  const seedWinners = getWinnerAdsForEntity("brand", brandId);
  const savedWinners = useSavedWinnersForEntity("brand", brandId);
  const winners = [...seedWinners, ...savedWinners];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader title={`Winner ads · ${winners.length}`} icon={Trophy} />
        <button
          type="button"
          onClick={() => alert("Add winner ad — wire to KbCreateModal next")}
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          Add winner ad
        </button>
      </div>
      {winners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-[12px] italic text-muted-foreground">
            Upload winner ads to teach Genie what works for this brand.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {winners.map((w) => (
            <WinnerAdCard key={w.id} ad={w} />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryPanel({ brandName }: { brandName: string }) {
  const generations = sampleOutputs.filter((o) => o.brand?.name === brandName);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={`Library · ${generations.length}`}
          icon={GalleryHorizontal}
          hint="all generations for this brand"
        />
        <Link
          to="/iq/genie6/library"
          className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all →
        </Link>
      </div>
      {generations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-[12px] italic text-muted-foreground">No generations yet for this brand.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {generations.slice(0, 24).map((o) => (
            <li key={o.id}>
              <div className="overflow-hidden rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {o.thumbnail ? (
                    <img src={o.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Sparkles className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <p className="line-clamp-2 px-2 py-1.5 text-[11px] font-medium leading-tight text-foreground">
                  {o.headline ?? "Untitled"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ACTIVITY_ICON: Record<ActivityKind, React.ElementType> = {
  "instruction-added": BookOpen,
  "instruction-edited": Pencil,
  "product-added": Plus,
  "winner-ad-saved": Trophy,
  "concept-saved": Lightbulb,
  "generation-run": Sparkles,
  "reference-added": Link2,
  "brand-edited": Building2,
};

function formatActivityAge(d: Date): string {
  const ms = Date.now() - d.getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ActivityPanel({ brandId }: { brandId: string }) {
  const log = getActivityLogForBrand(brandId);
  return (
    <div className="space-y-3">
      <SectionHeader
        title={`Activity · ${log.length}`}
        icon={History}
        hint="audit log of edits, saves, and runs"
      />
      {log.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-[12px] italic text-muted-foreground">No activity yet for this brand.</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {log.map((entry) => {
            const Icon = ACTIVITY_ICON[entry.kind] ?? Sparkles;
            return (
              <li
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/60 p-3 backdrop-blur-sm"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06]">
                  <Icon className="h-3.5 w-3.5 text-foreground/65" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">{entry.summary}</p>
                  {entry.detail && (
                    <p className="mt-0.5 text-[11px] italic text-muted-foreground">{entry.detail}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                    {entry.actor}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground/60">
                    {formatActivityAge(entry.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function ProductsPanel({
  brand,
  products: list,
}: {
  brand: Brand;
  products: Product[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader title={`Products · ${list.length}`} icon={ShoppingBag} />
        <button
          type="button"
          onClick={() =>
            alert(
              `Add product to ${brand.name} — wire this to a creation modal next.`,
            )
          }
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          Add product
        </button>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-[12px] italic text-muted-foreground">
            No products yet. Add the first one to start generating ads.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                to={`/catalogue/products/${p.id}`}
                className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/40 bg-card/60 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-2xl text-white/80"
                      style={{ background: brand.colors[0] ?? "#888" }}
                    >
                      {p.name.charAt(0)}
                    </div>
                  )}
                  {p.variants && p.variants.length > 0 && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-foreground backdrop-blur">
                      {p.variants.length} variants
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 px-2 py-2">
                  <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
                    {p.name}
                  </p>
                  {p.price && (
                    <p className="font-mono text-[10px] text-muted-foreground">{p.price}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

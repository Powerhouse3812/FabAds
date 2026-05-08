import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Image as ImageIcon,
  Lightbulb,
  Package,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Users,
  Building2,
  Crosshair,
  MessageSquareQuote,
  UserRound,
  Mic,
  Volume2,
  Wand2,
} from "lucide-react";
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
  type EntityType as KbEntityType,
  type EntityId as KbEntityId,
  type KbInstruction,
  type WinnerAd,
  type KbConcept,
} from "@/mocks/shared";
import type { Avatar } from "@/genie6/types/entities";

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
    const linkedProducts = products.filter((p) => p.brandId === brand.id);
    const linkedCategories = categories.filter((c) => brand.categoryIds?.includes(c.id));
    return (
      <Shell type={type} title={brand.name} subtitle={brand.domain} icon={<Building2 className="h-5 w-5" />}>
        <Section title="Brand voice"><p className="text-sm text-foreground">{brand.voice}</p></Section>
        <Section title="USPs">
          <div className="flex flex-wrap gap-1.5">
            {brand.usps.map((u) => (
              <span key={u} className="text-xs rounded bg-muted px-2 py-1 text-muted-foreground">{u}</span>
            ))}
          </div>
        </Section>
        <Section title={`Categories · ${linkedCategories.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {linkedCategories.map((c) => (
              <Link key={c.id} to={`/catalogue/categories/${c.id}`}
                className="text-xs rounded bg-primary/10 text-primary px-2 py-1 hover:bg-primary/15">
                {c.name}
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
        <KnowledgeBaseSection entityType="brand" entityId={brand.id} entityLabel="brand" />
      </Shell>
    );
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
    <div className="flex h-full flex-col p-6">
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
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      {children}
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

function KnowledgeBaseSection({
  entityType,
  entityId,
  entityLabel,
}: {
  entityType: KbEntityType;
  entityId: KbEntityId;
  entityLabel: string;
}) {
  const { main, custom } = getInstructionsForEntity(entityType, entityId);
  const winners = getWinnerAdsForEntity(entityType, entityId);
  const concepts = getConceptsForEntity(entityType, entityId);

  const mainList = main ? [main] : [];

  return (
    <section className="space-y-4 border-t border-border/40 pt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-bold text-foreground">Knowledge Base</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          For Genie generations
        </span>
      </header>

      <KbSubsection
        title="Main instruction"
        hint={`The default writing rules Genie follows for this ${entityLabel}.`}
        emptyMessage={`No main instruction yet — Genie will use a generic fallback for this ${entityLabel}.`}
        createLabel={main ? "Replace" : "Create instruction"}
        onCreate={() => alert("Create instruction — coming soon")}
      >
        {mainList.length > 0 && (
          <ul className="space-y-2">
            {mainList.map((it) => (
              <InstructionRow key={it.id} item={it} />
            ))}
          </ul>
        )}
      </KbSubsection>

      <KbSubsection
        title={`Custom instructions${custom.length ? ` · ${custom.length}` : ""}`}
        hint="Optional rule sets — used for campaigns, festivals, or specific product lines."
        emptyMessage="No custom instructions yet."
        createLabel="Add instruction"
        onCreate={() => alert("Add instruction — coming soon")}
      >
        {custom.length > 0 && (
          <ul className="space-y-2">
            {custom.map((it) => (
              <InstructionRow key={it.id} item={it} />
            ))}
          </ul>
        )}
      </KbSubsection>

      <KbSubsection
        title={`Winner ads${winners.length ? ` · ${winners.length}` : ""}`}
        hint="Top-performing ads — uploaded, saved from Genie, or saved from Industry Insights."
        emptyMessage="No winner ads saved yet."
        createLabel="Add winner ad"
        onCreate={() => alert("Add winner ad — opens upload modal")}
      >
        {winners.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {winners.map((w) => (
              <WinnerAdCard key={w.id} ad={w} />
            ))}
          </div>
        )}
      </KbSubsection>

      <KbSubsection
        title={`Concepts${concepts.length ? ` · ${concepts.length}` : ""}`}
        hint="Visual + tonal concepts — derived from winner ads, or saved from Genie / Industry Insights."
        emptyMessage="No concepts saved yet."
        createLabel="Add concept"
        onCreate={() => alert("Save concept from Genie or Industry Insights")}
      >
        {concepts.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {concepts.map((c) => (
              <ConceptCard key={c.id} concept={c} />
            ))}
          </div>
        )}
      </KbSubsection>
    </section>
  );
}

function KbSubsection({
  title,
  hint,
  emptyMessage,
  createLabel,
  onCreate,
  children,
}: {
  title: string;
  hint: string;
  emptyMessage: string;
  createLabel: string;
  onCreate: () => void;
  children?: React.ReactNode;
}) {
  const isEmpty = !children;
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3.5">
      <header className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
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
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/20 px-3 py-6">
          <p className="text-[11px] italic text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
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

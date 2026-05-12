import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
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
  getReferenceUrlsForEntity,
  shortUrl,
  type EntityType as KbEntityType,
  type EntityId as KbEntityId,
  type KbInstruction,
  type WinnerAd,
  type KbConcept,
  type ReferenceUrl,
} from "@/mocks/shared";
import type { Audience, Avatar, Brand, Category, Product } from "@/genie6/types/entities";
import { sampleOutputs } from "@/genie6/mocks/sample-outputs";
import {
  ACTIVITY_LOG,
  getActivityLogForBrand,
  getActivityLogForEntity,
  type ActivityLogEntry,
  type ActivityKind,
} from "@/mocks/shared";
import { SectionHeader } from "@/genie6/studio-v4/components/SectionHeader";
import { KbCreateModal, type KbCreateKind } from "./KbCreateModal";
import { AnglePlaybookPanel, CATEGORIES as ANGLE_CATEGORIES } from "./AnglePlaybookPanel";
import {
  addInstruction as savedAddInstruction,
  addWinnerAd as savedAddWinnerAd,
  addConcept as savedAddConcept,
  useSavedProductsForBrand,
  useSavedInstructionsForEntity,
  useSavedWinnersForEntity,
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
    return <CategoryDetail category={cat} navigate={navigate} />;
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
    <ProductDetail
      product={prod}
      brand={brand}
      category={category}
      navigate={navigate}
    />
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

function KnowledgeBaseSection({
  entityType,
  entityId,
  entityLabel,
}: {
  entityType: KbEntityType;
  entityId: KbEntityId;
  entityLabel: string;
}) {
  // URL-backed modal state so HTML.to.design captures + hard refresh preserve
  // the open modal. ?create=instruction|winner-ad|concept. replace:false so
  // browser Back closes the modal (matches Step2Product pattern, c9101b2).
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_KINDS: KbCreateKind[] = ["instruction", "winner-ad", "concept"];
  const urlCreate = searchParams.get("create");
  const createKind: KbCreateKind | null =
    urlCreate && VALID_KINDS.includes(urlCreate as KbCreateKind)
      ? (urlCreate as KbCreateKind)
      : null;
  const setCreateKind = (next: KbCreateKind | null) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === null) sp.delete("create");
        else sp.set("create", next);
        return sp;
      },
      { replace: false },
    );
  };

  // Saved items live in the global saved-store — surfaces here AND in
  // ConceptsLibrary AND ContextRail without prop-drilling.
  // A-12.54 (Maalik): winners are NO LONGER rendered inside KB — they live
  // on the dedicated "Winner Ads" top-level tab. So winners + savedWinners
  // are not derived here anymore. Per-tab WinnersPanel/ProductWinnersPanel/
  // CategoryWinnersPanel re-read them independently via the same hooks.
  // A-12.61 (Maalik): concepts derivation dropped — KB no longer renders
  // a Concepts sub-section. Concepts are an output of KB, not an input.
  const savedInstr = useSavedInstructionsForEntity(entityType, entityId);

  const seedInstr = getInstructionsForEntity(entityType, entityId);
  const main = seedInstr.main;
  const custom = [...seedInstr.custom, ...savedInstr];
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

  return (
    <section className="space-y-5 border-t border-border/40 pt-6">
      <SectionHeader
        title="Knowledge Base"
        icon={BookOpen}
        hint="For Genie generations"
      />

      {/* A-12.42 (Maalik): tabs removed — vertical sections, scroll OK. */}
      <div className="space-y-5">
        <KbTabPanel
          title="Main instruction"
          count={main ? 1 : 0}
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

        <KbTabPanel
          title="Custom instructions"
          count={custom.length}
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

        {/* A-12.54 (Maalik): Winner ads sub-section removed — winners now
            live on the dedicated "Winner Ads" top-level tab. Single source. */}

        {/* A-12.61 (Maalik): Concepts sub-section removed from KB. KB
            holds main + custom + references — these are the inputs Genie
            uses to generate concepts + ads. Concepts themselves live on
            /iq/genie6/concepts. */}

        <KbTabPanel
          title="References"
          count={refs.length}
          hint="Reference URLs — landing pages, brand assets, inspiration links."
          emptyMessage="No reference URLs saved."
          createLabel="Add URL"
          onCreate={() => alert("Add reference URL — coming soon")}
          isEmpty={refs.length === 0}
        >
          <ul className="space-y-1.5">
            {refs.map((r) => (
              <RefRow key={r.id} item={r} />
            ))}
          </ul>
        </KbTabPanel>

        {/* A-12.62 (Maalik): two summary cards at the bottom of the KB
            tab — Angle Playbook + Winner Ads. Each is a 50/50 clickable
            card that navigates to the matching top-level tab. Reads as:
            "these things plug into your KB but live in their own tab". */}
        <UsedElsewhereCards
          entityType={entityType}
          entityId={entityId}
        />
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
  title,
  count,
  hint,
  emptyMessage,
  createLabel,
  onCreate,
  isEmpty,
  countCurrent,
  countMax,
  children,
}: {
  title: string;
  count: number;
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
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold tracking-tight text-foreground">
              {title}
            </h4>
            {count > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-foreground/[0.08] px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground">
                {count}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
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

/**
 * A-12.62 (Maalik): "Used elsewhere" 50/50 cards at the bottom of the KB
 * tab. Two clickable summary cards (Angle Playbook + Winner Ads) that
 * navigate to the matching top-level tab via ?tab= URL. Different stats
 * per card.
 */
function UsedElsewhereCards({
  entityType,
  entityId,
}: {
  entityType: KbEntityType;
  entityId: KbEntityId;
}) {
  const [, setSearchParams] = useSearchParams();
  const goToTab = (next: "angles" | "winners") => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("tab", next);
        // clear sub-state owned by the previous tab
        sp.delete("playbook");
        sp.delete("playbook-cat");
        sp.delete("playbook-angle");
        return sp;
      },
      { replace: false },
    );
  };

  // Angle Playbook stats (Maalik's spec):
  //   - kitne angle hain                 → 30 tracked (from CATEGORIES)
  //   - no of filled angle knowledge     → filled count
  //   - top used angle in tags           → resolve angleId → angle.label
  // Plus: categories covered (M of 10) + recency.
  const savedAngleInstr = useSavedInstructionsForEntity(entityType, entityId)
    .filter((i) => i.kind === "angle");
  const { angles: seedAngleInstr } = getInstructionsForEntity(entityType, entityId);
  const allAngleInstr = [...seedAngleInstr, ...savedAngleInstr];

  const filledAngleIds = new Set<string>();
  for (const i of allAngleInstr) {
    for (const id of i.anglesCovered) filledAngleIds.add(id);
  }
  const filledAngleCount = filledAngleIds.size;

  const ANGLE_PLAYBOOK_TOTAL = ANGLE_CATEGORIES.reduce(
    (n, c) => n + c.angleIds.length,
    0,
  );

  // Top 3 by most recently updated (proxy for "most used"). Resolve to a
  // human label: canonical angles list first, then a title-case fallback
  // for legacy short-form ids ("hero" → "Hero").
  const titleCase = (s: string) =>
    s
      .replace(/^ang-/, "")
      .split("-")
      .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
      .join(" ");
  const topAngles = allAngleInstr
    .slice()
    .sort((a, b) => +b.createdAt - +a.createdAt)
    .slice(0, 3)
    .map((i) => {
      const angleId = i.anglesCovered[0];
      if (!angleId) return null;
      const angle = angles.find((a) => a.id === angleId);
      return angle?.label ?? titleCase(angleId);
    })
    .filter(Boolean) as string[];

  // Categories covered out of 10
  const coveredCategorySet = new Set<string>();
  for (const cat of ANGLE_CATEGORIES) {
    if (cat.angleIds.some((id) => filledAngleIds.has(id))) {
      coveredCategorySet.add(cat.name);
    }
  }
  const coveredCategoryCount = coveredCategorySet.size;

  // Most recent angle-instruction timestamp
  const lastAngleUpdate = allAngleInstr
    .map((i) => i.createdAt)
    .sort((a, b) => +b - +a)[0];

  // Source mix — manual vs ai-drafted
  const angleSourceMix = (() => {
    let manual = 0;
    let ai = 0;
    for (const i of allAngleInstr) {
      if (i.source === "ai-generated") ai++;
      else manual++;
    }
    return { manual, ai };
  })();

  // Winner Ads stats: count + source mix + most recent timestamp
  const seedWinners = getWinnerAdsForEntity(entityType, entityId);
  const winnerCount = seedWinners.length;
  const sourceMix = (() => {
    const counts: Record<string, number> = {};
    for (const w of seedWinners) counts[w.source] = (counts[w.source] ?? 0) + 1;
    return counts;
  })();
  const mostRecent = seedWinners
    .map((w) => w.capturedAt)
    .filter(Boolean)
    .sort((a, b) => +new Date(b!) - +new Date(a!))[0];

  return (
    <section className="space-y-2 pt-2">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Used in generation · lives in its own tab
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Angle Playbook card */}
        <button
          type="button"
          onClick={() => goToTab("angles")}
          className="group flex flex-col gap-2.5 rounded-xl border border-border/40 bg-card/60 p-3.5 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <h5 className="text-[12px] font-semibold tracking-tight text-foreground">
              Angle Playbook
            </h5>
            <span className="ml-auto inline-flex items-center rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground">
              {filledAngleCount} / {ANGLE_PLAYBOOK_TOTAL} filled
            </span>
          </div>

          {/* Stat strip: total angles · categories covered · source mix */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-muted-foreground">
            <span>{ANGLE_PLAYBOOK_TOTAL} angles tracked</span>
            <span className="text-muted-foreground/30">·</span>
            <span>
              {coveredCategoryCount} / {ANGLE_CATEGORIES.length} categories
            </span>
            {(angleSourceMix.ai > 0 || angleSourceMix.manual > 0) && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span>
                  {angleSourceMix.manual > 0 && `${angleSourceMix.manual} manual`}
                  {angleSourceMix.manual > 0 && angleSourceMix.ai > 0 && " · "}
                  {angleSourceMix.ai > 0 && `${angleSourceMix.ai} AI`}
                </span>
              </>
            )}
          </div>

          {/* Top used angles — proper labels, tag-style chips */}
          {topAngles.length > 0 ? (
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                Top used
              </p>
              <div className="flex flex-wrap gap-1">
                {topAngles.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full border border-primary/30 bg-primary/[0.08] px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[11px] italic text-muted-foreground">
              No angle rules yet — click to add.
            </p>
          )}

          {lastAngleUpdate && (
            <p className="font-mono text-[9px] text-muted-foreground/70">
              last update · {formatActivityAge(new Date(lastAngleUpdate))}
            </p>
          )}

          <p className="mt-auto inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
            Open Angles tab <ChevronRight className="h-2.5 w-2.5" />
          </p>
        </button>

        {/* Winner Ads card */}
        <button
          type="button"
          onClick={() => goToTab("winners")}
          className="group flex flex-col gap-2 rounded-xl border border-border/40 bg-card/60 p-3.5 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <h5 className="text-[12px] font-semibold tracking-tight text-foreground">
              Winner Ads
            </h5>
            <span className="ml-auto inline-flex items-center rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground">
              {winnerCount} saved
            </span>
          </div>
          {winnerCount > 0 ? (
            <>
              <div className="flex flex-wrap gap-1">
                {Object.entries(sourceMix).map(([src, n]) => (
                  <span
                    key={src}
                    className="inline-flex items-center rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground/70"
                  >
                    {src.replace("saved-from-", "").replace("-", " ")} · {n}
                  </span>
                ))}
              </div>
              {mostRecent && (
                <p className="font-mono text-[9px] text-muted-foreground/80">
                  last update · {formatActivityAge(new Date(mostRecent))}
                </p>
              )}
            </>
          ) : (
            <p className="text-[11px] italic text-muted-foreground">
              No winner ads saved — click to add.
            </p>
          )}
          <p className="mt-auto inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
            Open Winner Ads tab <ChevronRight className="h-2.5 w-2.5" />
          </p>
        </button>
      </div>
    </section>
  );
}

function RefRow({ item: r }: { item: ReferenceUrl }) {
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
  | "angles"
  | "winners"
  | "library"
  | "activity"
  | "products";

export function BrandDetail({
  brand,
  navigate,
  embedded = false,
}: {
  brand: Brand;
  navigate: ReturnType<typeof useNavigate>;
  /** When true, the component is being rendered inside the Catalogue Finder's
   *  pane 3 — drop outer padding/max-width and hide the Back button (the
   *  Finder's own pane-1 list serves as the back affordance). */
  embedded?: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as BrandTabKey | null;
  const tab: BrandTabKey =
    tabParam &&
    ["guidelines", "kb", "angles", "winners", "library", "activity", "products"].includes(tabParam)
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
  const angleInstrCount = (() => {
    const { angles } = getInstructionsForEntity("brand", brand.id);
    return angles.length;
  })();

  const tabs: { key: BrandTabKey; label: string; count?: number }[] = [
    { key: "guidelines", label: "Guidelines" },
    { key: "kb", label: "Knowledge Base", count: kbInstrCount },
    { key: "angles", label: "Angles", count: angleInstrCount },
    { key: "winners", label: "Winner Ads", count: winnersCount },
    { key: "library", label: "Library", count: libraryCount },
    { key: "activity", label: "Activity", count: activityCount },
    { key: "products", label: "Products", count: linkedProducts.length },
  ];

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6",
        embedded
          ? "p-5"
          : "v3-page-mesh mx-auto max-w-6xl px-6 pt-6 pb-10",
      )}
    >
      {/* ── Top action: ← Back (hidden when embedded inside Finder) ── */}
      {!embedded && (
        <button
          type="button"
          onClick={() => navigate("/catalogue/brands")}
          className="inline-flex w-max items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Brands
        </button>
      )}

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
        {tab === "angles" && (
          <AnglePlaybookPanel
            entityType="brand"
            entityId={brand.id}
            entityLabel="brand"
            forceOpen
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
        <SectionHeader
          title={`Winner ads · ${winners.length}`}
          icon={Trophy}
          hint="feeds the Knowledge Base"
        />
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

/* ─────────────────────────────────────────────────────────────────────────
 * Product Detail — A-12.42
 *
 * Mirrors BrandDetail but with a Product-shaped Guidelines tab:
 *   ── Compact Brand Guidelines (read-only, inherited from parent brand:
 *       voice / colors / typography) ──
 *   ── Then product-specific cards: Audience, USPs (= benefits),
 *      Category, Price, Promo, Landing pages, Campaign URLs ──
 *
 * Tabs: Guidelines · KB · Winners · Library · Activity · Variants.
 * ───────────────────────────────────────────────────────────────────────── */

type ProductTabKey =
  | "guidelines"
  | "kb"
  | "angles"
  | "winners"
  | "library"
  | "activity"
  | "variants";

export function ProductDetail({
  product,
  brand,
  category,
  navigate,
  embedded = false,
}: {
  product: Product;
  brand?: Brand;
  category?: Category;
  navigate: ReturnType<typeof useNavigate>;
  /** When true, rendered inside the Catalogue Finder's pane 3 — drop outer
   *  padding/max-width and hide the Back button (pane 1 list = back). */
  embedded?: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as ProductTabKey | null;
  const tab: ProductTabKey =
    tabParam &&
    ["guidelines", "kb", "angles", "winners", "library", "activity", "variants"].includes(
      tabParam,
    )
      ? tabParam
      : "guidelines";
  const setTab = (next: ProductTabKey) => {
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

  const winnersCount = getWinnerAdsForEntity("product", product.id).length;
  const libraryCount = sampleOutputs.filter(
    (o) => o.product?.name === product.name,
  ).length;
  const activityCount = ACTIVITY_LOG.filter(
    (e) => e.entityType === "product" && e.entityId === product.id,
  ).length;
  const kbInstrCount = (() => {
    const { main, custom } = getInstructionsForEntity("product", product.id);
    return (main ? 1 : 0) + custom.length;
  })();
  const angleInstrCount = (() => {
    const { angles } = getInstructionsForEntity("product", product.id);
    return angles.length;
  })();
  const variantsCount = product.variants?.length ?? 0;

  const tabs: { key: ProductTabKey; label: string; count?: number }[] = [
    { key: "guidelines", label: "Guidelines" },
    { key: "kb", label: "Knowledge Base", count: kbInstrCount },
    { key: "angles", label: "Angles", count: angleInstrCount },
    { key: "winners", label: "Winner Ads", count: winnersCount },
    { key: "library", label: "Library", count: libraryCount },
    { key: "activity", label: "Activity", count: activityCount },
    { key: "variants", label: "Variants", count: variantsCount },
  ];

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6",
        embedded
          ? "p-5"
          : "v3-page-mesh mx-auto max-w-6xl px-6 pt-6 pb-10",
      )}
    >
      {/* ── Top action: ← Back (hidden when embedded) ── */}
      {!embedded && (
        <button
          type="button"
          onClick={() => navigate("/catalogue/products")}
          className="inline-flex w-max items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Products
        </button>
      )}

      {/* ── Hero header ── */}
      <ProductHero product={product} brand={brand} category={category} />

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
        {tab === "guidelines" && (
          <ProductGuidelinesPanel
            product={product}
            brand={brand}
            category={category}
          />
        )}
        {tab === "kb" && (
          <KnowledgeBaseSection
            entityType="product"
            entityId={product.id}
            entityLabel="product"
          />
        )}
        {tab === "angles" && (
          <AnglePlaybookPanel
            entityType="product"
            entityId={product.id}
            entityLabel="product"
            forceOpen
          />
        )}
        {tab === "winners" && <ProductWinnersPanel productId={product.id} />}
        {tab === "library" && <ProductLibraryPanel productName={product.name} />}
        {tab === "activity" && <ProductActivityPanel productId={product.id} />}
        {tab === "variants" && (
          <ProductVariantsPanel product={product} brand={brand} />
        )}
      </div>
    </div>
  );
}

function ProductHero({
  product,
  brand,
  category,
}: {
  product: Product;
  brand?: Brand;
  category?: Category;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xl text-white/80"
            style={{ background: brand?.colors[0] ?? "#888" }}
          >
            {product.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
            {product.price}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {brand && (
            <Link
              to={`/catalogue/brands/${brand.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
            >
              {brand.name}
            </Link>
          )}
          {category && (
            <Link
              to={`/catalogue/categories/${category.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
            >
              {category.name}
            </Link>
          )}
          {product.variants && product.variants.length > 0 && (
            <span className="font-mono">
              · {product.variants.length} variants
            </span>
          )}
          {product.generatedCount > 0 && (
            <span className="font-mono">
              · {product.generatedCount} generations
            </span>
          )}
        </div>
        {product.promo && (
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
            {product.promo}
          </span>
        )}
      </div>
    </div>
  );
}

function ProductGuidelinesPanel({
  product,
  brand,
  category,
}: {
  product: Product;
  brand?: Brand;
  category?: Category;
}) {
  const linkedAudiences = brand
    ? audiences.filter((a) => a.brandId === brand.id)
    : [];

  return (
    <div className="space-y-5">
      {/* ── Brand guidelines (compact) ─────────────────────── */}
      {brand && (
        <div className="rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
                Brand guidelines · {brand.name}
              </h3>
            </div>
            <Link
              to={`/catalogue/brands/${brand.id}`}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View brand
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Voice */}
            <div className="space-y-1">
              <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-2.5 w-2.5" />
                Voice
              </p>
              <p className="line-clamp-3 text-[12px] leading-relaxed text-foreground">
                {brand.voice}
              </p>
              {brand.tone && (
                <p className="font-mono text-[10px] italic text-muted-foreground/80">
                  {brand.tone}
                </p>
              )}
            </div>

            {/* Colors */}
            <div className="space-y-1">
              <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <Palette className="h-2.5 w-2.5" />
                Colors
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {brand.colors.map((c) => (
                  <span
                    key={c}
                    className="inline-block h-6 w-6 rounded-md border border-border/60"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-1">
              <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <TypeIcon className="h-2.5 w-2.5" />
                Typography
              </p>
              <p
                className="text-[13px] font-semibold text-foreground"
                style={{ fontFamily: brand.fonts.display }}
              >
                {brand.fonts.display}
              </p>
              <p
                className="text-[11px] text-muted-foreground"
                style={{ fontFamily: brand.fonts.body }}
              >
                {brand.fonts.body}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Product-specific cards ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GuidelinesCard
          title={`USPs · ${product.benefits.length}`}
          icon={Sparkles}
        >
          {product.benefits.length === 0 ? (
            <p className="text-[12px] italic text-muted-foreground">
              No benefits listed yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {product.benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-1.5 text-[13px] text-foreground"
                >
                  <span className="text-muted-foreground/50">·</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </GuidelinesCard>

        <GuidelinesCard
          title={`Audiences · ${linkedAudiences.length}`}
          icon={Users}
        >
          {linkedAudiences.length === 0 ? (
            <p className="text-[12px] italic text-muted-foreground">
              No audiences linked to this brand.
            </p>
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
                  <span className="line-clamp-1 max-w-[180px] text-muted-foreground">
                    {a.segment}
                  </span>
                </span>
              ))}
            </div>
          )}
        </GuidelinesCard>

        <GuidelinesCard title="Category" icon={Tag}>
          {category ? (
            <Link
              to={`/catalogue/categories/${category.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-primary transition-colors hover:bg-primary/15"
            >
              {category.name}
            </Link>
          ) : (
            <p className="text-[12px] italic text-muted-foreground">
              No category linked.
            </p>
          )}
        </GuidelinesCard>

        <GuidelinesCard title="Price & promo" icon={Tag}>
          <p className="font-mono text-base font-bold text-foreground">
            {product.price}
          </p>
          {product.promo && (
            <span className="mt-1.5 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
              {product.promo}
            </span>
          )}
        </GuidelinesCard>

        {product.landingPages && product.landingPages.length > 0 && (
          <GuidelinesCard
            title={`Landing pages · ${product.landingPages.length}`}
            icon={Link2}
          >
            <ul className="space-y-1">
              {product.landingPages.map((lp) => (
                <li key={lp}>
                  <a
                    href={lp}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 truncate text-[12px] text-primary hover:underline"
                  >
                    {shortUrl(lp)}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </li>
              ))}
            </ul>
          </GuidelinesCard>
        )}

        {product.campaignUrls && product.campaignUrls.length > 0 && (
          <GuidelinesCard
            title={`Campaign URLs · ${product.campaignUrls.length}`}
            icon={Link2}
          >
            <ul className="space-y-1">
              {product.campaignUrls.map((cu) => (
                <li key={cu}>
                  <a
                    href={cu}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 truncate font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {shortUrl(cu)}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </li>
              ))}
            </ul>
          </GuidelinesCard>
        )}
      </div>
    </div>
  );
}

function ProductWinnersPanel({ productId }: { productId: string }) {
  const seedWinners = getWinnerAdsForEntity("product", productId);
  const savedWinners = useSavedWinnersForEntity("product", productId);
  const winners = [...seedWinners, ...savedWinners];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={`Winner ads · ${winners.length}`}
          icon={Trophy}
          hint="feeds the Knowledge Base"
        />
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
            Upload winner ads to teach Genie what works for this product.
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

function ProductLibraryPanel({ productName }: { productName: string }) {
  const generations = sampleOutputs.filter(
    (o) => o.product?.name === productName,
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={`Library · ${generations.length}`}
          icon={GalleryHorizontal}
          hint="all generations for this product"
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
          <p className="text-[12px] italic text-muted-foreground">
            No generations yet for this product.
          </p>
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

function ProductActivityPanel({ productId }: { productId: string }) {
  const log = getActivityLogForEntity("product", productId);
  return (
    <div className="space-y-3">
      <SectionHeader
        title={`Activity · ${log.length}`}
        icon={History}
        hint="audit log of edits, saves, and runs"
      />
      {log.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-[12px] italic text-muted-foreground">
            No activity yet for this product.
          </p>
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
                  <p className="text-[13px] font-medium text-foreground">
                    {entry.summary}
                  </p>
                  {entry.detail && (
                    <p className="mt-0.5 text-[11px] italic text-muted-foreground">
                      {entry.detail}
                    </p>
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

function ProductVariantsPanel({
  product,
  brand,
}: {
  product: Product;
  brand?: Brand;
}) {
  const variants = product.variants ?? [];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={`Variants · ${variants.length}`}
          icon={Package}
          hint="SKU-level options — sizes, colors, fragrances"
        />
        <button
          type="button"
          onClick={() =>
            alert(`Add variant to ${product.name} — coming soon.`)
          }
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          Add variant
        </button>
      </div>
      {variants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-[12px] italic text-muted-foreground">
            This product has no variants — single SKU.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {variants.map((v) => (
            <li
              key={v.id}
              className="overflow-hidden rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt={v.name} className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-2xl text-white/80"
                    style={{
                      background: v.color ?? brand?.colors[0] ?? "#888",
                    }}
                  >
                    {v.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="space-y-0.5 px-2 py-2">
                <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
                  {v.name}
                </p>
                <div className="flex flex-wrap items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  {v.sku && <span>{v.sku}</span>}
                  {v.price && (
                    <>
                      {v.sku && <span>·</span>}
                      <span className="text-foreground">{v.price}</span>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Category Detail — A-12.45
 *
 * Mirrors Brand/Product but shaped for an aggregator entity. Tabs:
 *   Overview · KB · Winners · Library · Activity · Brands · Products
 *
 * Hero: brand logo montage (top 4-5 overlapped) + name + counts +
 *       similar-categories chips row (compact, always visible).
 * Overview tab (Maalik Q2.b): Description + Reference URLs +
 *       Aggregated patterns (top voice tones, top USPs, top audience
 *       tags) computed across linked brands.
 * Brands tab (Maalik Q3.iii): same row pattern as Finder pane-1.
 * ───────────────────────────────────────────────────────────────────────── */

type CategoryTabKey =
  | "overview"
  | "kb"
  | "angles"
  | "winners"
  | "library"
  | "activity"
  | "brands"
  | "products";

export function CategoryDetail({
  category,
  navigate,
  embedded = false,
}: {
  category: Category;
  navigate: ReturnType<typeof useNavigate>;
  embedded?: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as CategoryTabKey | null;
  const tab: CategoryTabKey =
    tabParam &&
    ["overview", "kb", "angles", "winners", "library", "activity", "brands", "products"].includes(
      tabParam,
    )
      ? tabParam
      : "overview";
  const setTab = (next: CategoryTabKey) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === "overview") sp.delete("tab");
        else sp.set("tab", next);
        return sp;
      },
      { replace: true },
    );
  };

  const linkedBrands = brands.filter((b) =>
    b.categoryIds?.includes(category.id),
  );
  const linkedProducts = products.filter((p) => p.categoryId === category.id);
  const linkedProductNames = new Set(linkedProducts.map((p) => p.name));
  const linkedAudiences = audiences.filter(
    (a) => a.brandId && linkedBrands.some((b) => b.id === a.brandId),
  );
  const similarCategories = category.similarCategoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is Category => Boolean(c));

  const winnersCount = getWinnerAdsForEntity("category", category.id).length;
  const libraryCount = sampleOutputs.filter(
    (o) => o.product?.name && linkedProductNames.has(o.product.name),
  ).length;
  const activityCount = ACTIVITY_LOG.filter(
    (e) => e.entityType === "category" && e.entityId === category.id,
  ).length;
  const kbInstrCount = (() => {
    const { main, custom } = getInstructionsForEntity("category", category.id);
    return (main ? 1 : 0) + custom.length;
  })();
  const angleInstrCount = (() => {
    const { angles } = getInstructionsForEntity("category", category.id);
    return angles.length;
  })();

  const tabs: { key: CategoryTabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "kb", label: "Knowledge Base", count: kbInstrCount },
    { key: "angles", label: "Angles", count: angleInstrCount },
    { key: "winners", label: "Winner Ads", count: winnersCount },
    { key: "library", label: "Library", count: libraryCount },
    { key: "activity", label: "Activity", count: activityCount },
    { key: "brands", label: "Brands", count: linkedBrands.length },
    { key: "products", label: "Products", count: linkedProducts.length },
  ];

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6",
        embedded
          ? "p-5"
          : "v3-page-mesh mx-auto max-w-6xl px-6 pt-6 pb-10",
      )}
    >
      {!embedded && (
        <button
          type="button"
          onClick={() => navigate("/catalogue/categories")}
          className="inline-flex w-max items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Categories
        </button>
      )}

      <CategoryHero
        category={category}
        linkedBrands={linkedBrands}
        linkedProducts={linkedProducts}
        similarCategories={similarCategories}
      />

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

      <div>
        {tab === "overview" && (
          <CategoryOverviewPanel
            category={category}
            linkedBrands={linkedBrands}
            linkedAudiences={linkedAudiences}
          />
        )}
        {tab === "kb" && (
          <KnowledgeBaseSection
            entityType="category"
            entityId={category.id}
            entityLabel="category"
          />
        )}
        {tab === "angles" && (
          <AnglePlaybookPanel
            entityType="category"
            entityId={category.id}
            entityLabel="category"
            forceOpen
          />
        )}
        {tab === "winners" && <CategoryWinnersPanel categoryId={category.id} />}
        {tab === "library" && (
          <CategoryLibraryPanel productNames={linkedProductNames} />
        )}
        {tab === "activity" && (
          <CategoryActivityPanel categoryId={category.id} />
        )}
        {tab === "brands" && <CategoryBrandsPanel brands={linkedBrands} />}
        {tab === "products" && (
          <CategoryProductsPanel
            products={linkedProducts}
            brands={linkedBrands}
          />
        )}
      </div>
    </div>
  );
}

function CategoryHero({
  category,
  linkedBrands,
  linkedProducts,
  similarCategories,
}: {
  category: Category;
  linkedBrands: Brand[];
  linkedProducts: Product[];
  similarCategories: Category[];
}) {
  const montage = linkedBrands.slice(0, 5);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        {montage.length > 0 ? (
          <div className="flex shrink-0 items-center">
            {montage.map((b, i) => (
              <img
                key={b.id}
                src={b.logo}
                alt={b.name}
                title={b.name}
                className="h-12 w-12 rounded-xl border-2 border-card bg-background object-contain p-1"
                style={{
                  marginLeft: i === 0 ? 0 : -14,
                  zIndex: montage.length - i,
                }}
              />
            ))}
            {linkedBrands.length > montage.length && (
              <span
                className="ml-2 inline-flex h-12 items-center rounded-full bg-muted/60 px-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground"
                style={{ zIndex: 0 }}
              >
                +{linkedBrands.length - montage.length}
              </span>
            )}
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Tag className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-xl font-bold text-foreground">{category.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span>{linkedBrands.length} brands</span>
            <span>·</span>
            <span>{linkedProducts.length} products</span>
            {category.winnerCount > 0 && (
              <>
                <span>·</span>
                <span>{category.winnerCount} winners</span>
              </>
            )}
            {category.feedbackCount > 0 && (
              <>
                <span>·</span>
                <span>{category.feedbackCount} feedback</span>
              </>
            )}
          </div>
        </div>
      </div>

      {similarCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Similar
          </span>
          {similarCategories.map((c) => (
            <Link
              key={c.id}
              to={`/catalogue/categories/${c.id}`}
              className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground transition-colors hover:bg-primary/15 hover:text-primary"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryOverviewPanel({
  category,
  linkedBrands,
  linkedAudiences,
}: {
  category: Category;
  linkedBrands: Brand[];
  linkedAudiences: Audience[];
}) {
  const toneCounts = new Map<string, number>();
  linkedBrands.forEach((b) => {
    if (b.tone) toneCounts.set(b.tone, (toneCounts.get(b.tone) ?? 0) + 1);
  });
  const topTones = [...toneCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([t]) => t);

  const uspCounts = new Map<string, number>();
  linkedBrands.forEach((b) =>
    b.usps.forEach((u) => uspCounts.set(u, (uspCounts.get(u) ?? 0) + 1)),
  );
  const topUsps = [...uspCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([u]) => u);

  const audienceLabels = [...new Set(linkedAudiences.map((a) => a.label))].slice(
    0,
    4,
  );

  return (
    <div className="space-y-5">
      <GuidelinesCard title="Description" icon={BookOpen}>
        <p className="text-[13px] leading-relaxed text-foreground">
          {category.instruction}
        </p>
      </GuidelinesCard>

      <div className="rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-muted-foreground" />
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
            Aggregated patterns · across {linkedBrands.length} brands
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Top voice tones
            </p>
            {topTones.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">
                No tone data yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {topTones.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Top USPs
            </p>
            {topUsps.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">
                No USPs yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {topUsps.map((u) => (
                  <span
                    key={u}
                    className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {u}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Top audiences
            </p>
            {audienceLabels.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">
                No audiences linked.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {audienceLabels.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {category.referenceUrls.length > 0 && (
        <GuidelinesCard
          title={`Reference URLs · ${category.referenceUrls.length}`}
          icon={Link2}
        >
          <ul className="space-y-1">
            {category.referenceUrls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 truncate text-[12px] text-primary hover:underline"
                >
                  {shortUrl(url)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </li>
            ))}
          </ul>
        </GuidelinesCard>
      )}
    </div>
  );
}

function CategoryWinnersPanel({ categoryId }: { categoryId: string }) {
  const seedWinners = getWinnerAdsForEntity("category", categoryId);
  const savedWinners = useSavedWinnersForEntity("category", categoryId);
  const winners = [...seedWinners, ...savedWinners];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={`Winner ads · ${winners.length}`}
          icon={Trophy}
          hint="feeds the Knowledge Base"
        />
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
            Upload winner ads to teach Genie what works in this category.
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

function CategoryLibraryPanel({
  productNames,
}: {
  productNames: Set<string>;
}) {
  const generations = sampleOutputs.filter(
    (o) => o.product?.name && productNames.has(o.product.name),
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={`Library · ${generations.length}`}
          icon={GalleryHorizontal}
          hint="all generations across this category's products"
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
          <p className="text-[12px] italic text-muted-foreground">
            No generations yet for this category.
          </p>
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

function CategoryActivityPanel({ categoryId }: { categoryId: string }) {
  const log = getActivityLogForEntity("category", categoryId);
  return (
    <div className="space-y-3">
      <SectionHeader
        title={`Activity · ${log.length}`}
        icon={History}
        hint="audit log of edits, saves, and runs"
      />
      {log.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-[12px] italic text-muted-foreground">
            No activity yet for this category.
          </p>
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
                  <p className="text-[13px] font-medium text-foreground">
                    {entry.summary}
                  </p>
                  {entry.detail && (
                    <p className="mt-0.5 text-[11px] italic text-muted-foreground">
                      {entry.detail}
                    </p>
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

/** Q3.iii: Brand row mirroring Finder's pane-1 visual pattern. */
function CategoryBrandsPanel({ brands: list }: { brands: Brand[] }) {
  return (
    <div className="space-y-3">
      <SectionHeader title={`Brands · ${list.length}`} icon={Building2} />
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-[12px] italic text-muted-foreground">
            No brands linked to this category yet.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm">
          {list.map((b, i) => {
            const productCount = products.filter(
              (p) => p.brandId === b.id,
            ).length;
            return (
              <li
                key={b.id}
                className={cn(i > 0 && "border-t border-border/40")}
              >
                <Link
                  to={`/catalogue/brands/${b.id}`}
                  className="flex w-full items-center gap-2.5 px-3 py-2 transition-colors hover:bg-primary/10"
                >
                  <img
                    src={b.logo}
                    alt={b.name}
                    className="h-6 w-6 shrink-0 rounded-md bg-muted object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {b.name}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {b.domain} · {productCount} products
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CategoryProductsPanel({
  products: list,
  brands: brandList,
}: {
  products: Product[];
  brands: Brand[];
}) {
  const brandById = new Map(brandList.map((b) => [b.id, b]));
  return (
    <div className="space-y-3">
      <SectionHeader title={`Products · ${list.length}`} icon={Package} />
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-[12px] italic text-muted-foreground">
            No products yet in this category.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => {
            const brand = brandById.get(p.brandId);
            return (
              <li key={p.id}>
                <Link
                  to={`/catalogue/products/${p.id}`}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/40 bg-card/60 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    {p.thumbnail ? (
                      <img
                        src={p.thumbnail}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-2xl text-white/80"
                        style={{ background: brand?.colors[0] ?? "#888" }}
                      >
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 px-2 py-2">
                    <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
                      {p.name}
                    </p>
                    <div className="flex items-center justify-between gap-1.5 font-mono text-[10px] text-muted-foreground">
                      {brand && <span className="truncate">{brand.name}</span>}
                      {p.price && (
                        <span className="text-foreground">{p.price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { Sparkles, Package, Image as ImageIcon, Video, Ratio, Users, Target, Lightbulb, Layers, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUB_MODE_PROFILES, type StudioV4Form } from "../types";

/**
 * OverviewPane — live recipe summary for the persistent right column.
 *
 * Vertical stack of section blocks. Each block has an icon + label and
 * the resolved values rendered as chips/pills. When everything is
 * empty we show the italic empty-state hint Maalik signed off on.
 *
 * Lookup helpers are optional — if not provided we fall back to the
 * raw IDs so the pane never blocks rendering.
 */

export interface ProductLookup {
  id: string;
  name: string;
  thumbUrl?: string;
  brandName?: string;
}

export interface BrandLookup {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface NamedLookup {
  id: string;
  name: string;
}

export interface ReferenceLookup {
  id: string;
  thumbUrl?: string;
}

export interface OverviewPaneProps {
  form: StudioV4Form;
  product?: ProductLookup | null;
  brand?: BrandLookup | null;
  audienceLookup?: (id: string) => NamedLookup | null;
  angleLookup?: (id: string) => NamedLookup | null;
  conceptLookup?: (id: string) => NamedLookup | null;
  references?: ReferenceLookup[];
  /** Per-render credit cost. Defaults to 5. */
  creditPerRender?: number;
}

function SectionRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active = true,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2 text-[11px] font-medium",
        active
          ? "bg-primary/15 text-foreground"
          : "bg-muted/60 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function OverviewPane({
  form,
  product,
  brand,
  audienceLookup,
  angleLookup,
  conceptLookup,
  references = [],
  creditPerRender = 5,
}: OverviewPaneProps) {
  const profile = SUB_MODE_PROFILES[form.subMode];

  const audiences = form.audienceIds.map(
    (id) => audienceLookup?.(id) ?? { id, name: id },
  );
  const angles = form.angleIds.map(
    (id) => angleLookup?.(id) ?? { id, name: id },
  );
  const concepts = form.conceptIds.map(
    (id) => conceptLookup?.(id) ?? { id, name: id },
  );

  const isEmpty =
    !product &&
    !brand &&
    audiences.length === 0 &&
    angles.length === 0 &&
    concepts.length === 0 &&
    references.length === 0;

  const credits = form.count * creditPerRender;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Sub-mode chip */}
      <div className="flex items-center gap-2">
        <Chip>
          <Sparkles className="mr-1 h-3 w-3" />
          {profile.label}
        </Chip>
      </div>

      {/* Empty-state hint */}
      {isEmpty && (
        <p className="italic text-[11px] text-muted-foreground">
          Picks show here as you build
        </p>
      )}

      {/* Product */}
      {product && (
        <SectionRow icon={Package} label="Product">
          <div className="flex w-full items-center gap-2">
            {product.thumbUrl ? (
              <img
                src={product.thumbUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-foreground">
                {product.name}
              </p>
              {(product.brandName ?? brand?.name) && (
                <p className="truncate text-[10px] text-muted-foreground">
                  {product.brandName ?? brand?.name}
                </p>
              )}
            </div>
          </div>
        </SectionRow>
      )}

      {/* Format */}
      <SectionRow
        icon={form.output === "video" ? Video : ImageIcon}
        label="Format"
      >
        <Chip>{form.output === "video" ? "Video" : "Image"}</Chip>
      </SectionRow>

      {/* Aspect ratios */}
      {form.aspectRatios.length > 0 && (
        <SectionRow icon={Ratio} label="Aspect">
          {form.aspectRatios.map((ar) => (
            <Chip key={ar}>{ar}</Chip>
          ))}
        </SectionRow>
      )}

      {/* Audiences */}
      {audiences.length > 0 && (
        <SectionRow icon={Users} label="Audiences">
          {audiences.map((a) => (
            <Chip key={a.id}>{a.name}</Chip>
          ))}
        </SectionRow>
      )}

      {/* Angles */}
      {angles.length > 0 && (
        <SectionRow icon={Target} label="Angles">
          {angles.map((a) => (
            <Chip key={a.id}>{a.name}</Chip>
          ))}
        </SectionRow>
      )}

      {/* Concepts */}
      {concepts.length > 0 && (
        <SectionRow icon={Lightbulb} label="Concepts">
          {concepts.map((c) => (
            <Chip key={c.id}>{c.name}</Chip>
          ))}
        </SectionRow>
      )}

      {/* References */}
      {references.length > 0 && (
        <SectionRow icon={Layers} label="References">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {references.slice(0, 4).map((r) =>
                r.thumbUrl ? (
                  <img
                    key={r.id}
                    src={r.thumbUrl}
                    alt=""
                    className="h-6 w-6 rounded-full border-2 border-background object-cover"
                  />
                ) : (
                  <div
                    key={r.id}
                    className="h-6 w-6 rounded-full border-2 border-background bg-muted"
                  />
                ),
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {references.length} reference{references.length === 1 ? "" : "s"}
            </span>
          </div>
        </SectionRow>
      )}

      {/* Cost */}
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Coins className="h-3 w-3" />
          {form.count} × {creditPerRender}
        </div>
        <div className="text-[12px] font-semibold text-foreground">
          {credits} credits
        </div>
      </div>
    </div>
  );
}

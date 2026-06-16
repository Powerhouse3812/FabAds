/**
 * CarouselCardEditor — manages plan.carouselCards (2–10 cards). Each card has
 * its own media (creativeId), headline, description, link (URL) and CTA. The
 * shared primary text lives above this in AdContent. Add / remove / reorder.
 */
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CarouselCard, CreativeRef } from "../../../types";
import { CTA_OPTIONS } from "./meta";
import MediaPicker from "./MediaPicker";

const MIN_CARDS = 2;
const MAX_CARDS = 10;

function newCard(): CarouselCard {
  return {
    id: `card_${Math.random().toString(36).slice(2, 9)}`,
    creativeId: undefined,
    headline: "",
    description: "",
    link: "",
    cta: "SHOP_NOW",
  };
}

export default function CarouselCardEditor({
  cards,
  creatives,
  onChange,
}: {
  cards: CarouselCard[];
  creatives: CreativeRef[];
  onChange: (cards: CarouselCard[]) => void;
}) {
  // Ensure at least MIN_CARDS exist for editing.
  const list = cards.length >= MIN_CARDS ? cards : [...cards, ...Array.from({ length: MIN_CARDS - cards.length }, newCard)];

  const update = (id: string, p: Partial<CarouselCard>) =>
    onChange(list.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const remove = (id: string) => {
    if (list.length <= MIN_CARDS) return;
    onChange(list.filter((c) => c.id !== id));
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const canAdd = list.length < MAX_CARDS;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          Cards{" "}
          <span className="font-mono tabular-nums text-muted-foreground/60">
            {list.length}/{MAX_CARDS}
          </span>
        </span>
        {canAdd && (
          <button
            type="button"
            onClick={() => onChange([...list, newCard()])}
            className="flex items-center gap-1 text-[11px] font-medium text-foreground hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add card
          </button>
        )}
      </div>

      {list.map((card, i) => (
        <div key={card.id} className="rounded-2xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              Card {i + 1}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === list.length - 1}
                aria-label="Move down"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => remove(card.id)}
                disabled={list.length <= MIN_CARDS}
                aria-label="Remove card"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          <MediaPicker
            creatives={creatives}
            value={card.creativeId}
            onChange={(id) => update(card.id, { creativeId: id })}
            size="sm"
          />

          <Input
            value={card.headline}
            onChange={(e) => update(card.id, { headline: e.target.value })}
            placeholder="Card headline"
            className="h-8 text-xs"
          />
          <Input
            value={card.description}
            onChange={(e) => update(card.id, { description: e.target.value })}
            placeholder="Card description"
            className="h-8 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={card.link}
              onChange={(e) => update(card.id, { link: e.target.value })}
              placeholder="https://…"
              className="h-8 font-mono text-[11px]"
            />
            <Select value={card.cta} onValueChange={(v) => update(card.id, { cta: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CTA_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}

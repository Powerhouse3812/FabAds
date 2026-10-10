import {
  Anchor,
  Crosshair,
  Globe,
  Image as ImageIcon,
  LayoutTemplate,
  PanelTop,
  Shapes,
  Store,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { SavableType } from "@/lib/insights-v3/types";

/** One icon per savable type, shared by TypeChip + ElementChip. */
export const TYPE_ICON: Record<SavableType, LucideIcon> = {
  ad: ImageIcon,
  framework: LayoutTemplate,
  hook: Anchor,
  angle: Crosshair,
  concept: Shapes,
  domain: Globe,
  page: Store,
  "landing-page": PanelTop,
  offer: Tag,
};

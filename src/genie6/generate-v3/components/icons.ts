import {
  Sparkles,
  ShoppingBag,
  Camera,
  Target,
  Video,
  RefreshCw,
  Image,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon registry for Studio v3 — keeps SubModeDescriptor.icon as a plain
 * string in types.ts without forcing a lucide-react import there. Each
 * descriptor's `icon` field is looked up in this map at render time.
 *
 * Add new icons here as new sub-modes get added.
 */
export const STUDIO_V3_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  ShoppingBag,
  Camera,
  Target,
  Video,
  RefreshCw,
  Image,
};

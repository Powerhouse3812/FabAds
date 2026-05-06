/**
 * Genre → default angle heuristic.
 *
 * Phase-1 stub. Reasonable defaults that match the v3 angle library
 * IDs; will be replaced by a brand-trained recommendation later.
 */

const GENRE_TO_ANGLE: Record<string, string> = {
  beauty: "lifestyle",
  fashion: "lifestyle",
  food: "fomo",
  finance: "bold-claim",
  fitness: "before-after",
};

export function angleForGenre(genre?: string): string {
  if (!genre) return "hero-shot";
  const key = genre.toLowerCase();
  return GENRE_TO_ANGLE[key] ?? "hero-shot";
}

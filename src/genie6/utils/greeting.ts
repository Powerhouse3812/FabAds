/**
 * Time-of-day greeting. Used in StudioHome / CanvasHome / CommandHome
 * (was duplicated 3 times before extraction).
 */
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "good morning";
  if (h < 18) return "good afternoon";
  return "good evening";
}

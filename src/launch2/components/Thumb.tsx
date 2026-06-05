import { cn } from "@/lib/utils";

/** Deterministic gradient from a string seed (used as image fallback). */
export function seedGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 45% 55%), hsl(${(h + 40) % 360} 55% 42%))`;
}

/** Image with a graceful gradient fallback behind it (mock thumbs may 404). */
export function Thumb({
  src,
  seed,
  alt = "",
  className,
}: {
  src?: string;
  seed: string;
  alt?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ background: seedGradient(seed) }}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}

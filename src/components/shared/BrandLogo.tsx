import { useState } from "react";
import { cn } from "@/lib/utils";

const SIZES = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-11 w-11" } as const;
const TEXT_SIZES = { sm: "text-[10px]", md: "text-[11px]", lg: "text-sm" } as const;
const IMG_SIZES = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" } as const;

interface Props {
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  color?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

function getDomain(url: string): string | null {
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    return new URL(u).hostname;
  } catch {
    return null;
  }
}

export function BrandLogo({ name, logoUrl, website, color, size = "md", className }: Props) {
  const [imgError, setImgError] = useState(false);

  const faviconUrl = website ? (() => {
    const domain = getDomain(website);
    return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
  })() : null;

  const src = logoUrl && !imgError ? logoUrl : (!imgError || !logoUrl) && faviconUrl ? faviconUrl : null;
  const [faviconError, setFaviconError] = useState(false);

  const showImg = (logoUrl && !imgError) || (faviconUrl && !faviconError && !logoUrl);
  const actualSrc = logoUrl && !imgError ? logoUrl : faviconUrl;

  if (showImg && actualSrc) {
    return (
      <div className={cn(SIZES[size], "flex shrink-0 items-center justify-center rounded-md bg-white border border-border", className)}>
        <img
          src={actualSrc}
          alt={name}
          className={cn(IMG_SIZES[size], "rounded object-contain")}
          loading="lazy"
          onError={() => {
            if (actualSrc === logoUrl) setImgError(true);
            else setFaviconError(true);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(SIZES[size], "flex shrink-0 items-center justify-center rounded-md font-bold text-white", TEXT_SIZES[size], className)}
      style={{ backgroundColor: color || "#6366F1" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

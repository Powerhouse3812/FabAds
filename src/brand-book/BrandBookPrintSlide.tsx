import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { SLIDES, SLIDE_BY_SLUG } from "./slides";

/**
 * BrandBookPrintSlide — public, no-auth, no-shell, no-scale variant of
 * the slideshow built specifically for design-importer tools (html.to.design,
 * Anima, Locofy, screenshot services).
 *
 * Why this exists:
 *   - The interactive BrandBookShell sits inside ProtectedRoute + AppLayout.
 *     Headless scrapers hit the URL → see a spinner during auth bootstrap →
 *     capture blank.
 *   - The shell also uses position:fixed + CSS transform:scale() which
 *     confuses tools that capture by element bounding rect.
 *
 * This route:
 *   - mounts OUTSIDE ProtectedRoute (App.tsx)
 *   - renders ONE slide at its native dimensions in document flow
 *   - no overlay, no chrome, no animation, no auth
 *   - resets body / html so the page IS the slide
 *
 * URL pattern: /brand-book-print/:slug (e.g. /brand-book-print/cover)
 */

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap";

function usePrintEnvironment(slideW: number, slideH: number) {
  // Inject Geist fonts (synchronous, cached) and reset body so the page
  // IS the slide — no white margins, no scroll, no app-shell residue.
  useEffect(() => {
    const fontId = "brand-book-print-fonts";
    if (!document.getElementById(fontId)) {
      const pre1 = document.createElement("link");
      pre1.rel = "preconnect";
      pre1.href = "https://fonts.googleapis.com";
      pre1.id = fontId + "-pre1";
      const pre2 = document.createElement("link");
      pre2.rel = "preconnect";
      pre2.href = "https://fonts.gstatic.com";
      pre2.crossOrigin = "anonymous";
      pre2.id = fontId + "-pre2";
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.append(pre1, pre2, link);
    }

    // Reset doc + body so the page renders cleanly for scrapers.
    const prevHtmlMargin = document.documentElement.style.margin;
    const prevBodyMargin = document.body.style.margin;
    const prevBodyPadding = document.body.style.padding;
    const prevBodyBg = document.body.style.background;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.margin = "0";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = "#f6f4ef";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.margin = prevHtmlMargin;
      document.body.style.margin = prevBodyMargin;
      document.body.style.padding = prevBodyPadding;
      document.body.style.background = prevBodyBg;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [slideW, slideH]);
}

export function BrandBookPrintSlide() {
  const { slug } = useParams<{ slug: string }>();
  const idx = slug && slug in SLIDE_BY_SLUG ? SLIDE_BY_SLUG[slug] : 0;
  const slide = SLIDES[idx];
  const Cmp = slide.Component;

  usePrintEnvironment(slide.w, slide.h);

  useEffect(() => {
    document.title = `FabFunnel — ${slide.label}`;
  }, [slide.label]);

  // Native-dimension artboard in document flow. No fixed position, no scale,
  // no animation. Just the slide content sized exactly as designed —
  // scrape-friendly.
  return (
    <div
      data-brand-book-print="1"
      data-slug={slide.slug}
      style={{
        width: slide.w,
        height: slide.h,
        background: "#f6f4ef",
        overflow: "hidden",
        fontFamily: "'Geist', sans-serif",
        color: "#1a1a17",
      }}
    >
      <Cmp />
    </div>
  );
}

import { Navigate, Route } from "react-router-dom";
import { BrandBookShell } from "./BrandBookShell";
import { BrandBookPrintSlide } from "./BrandBookPrintSlide";

// Interactive slideshow — sits inside ProtectedRoute + AppLayout. Each slide
// is its own URL so back/forward + bookmarks work.
export const brandBookRoutes = (
  <Route path="brand-book">
    <Route index element={<Navigate to="cover" replace />} />
    <Route path=":slug" element={<BrandBookShell />} />
  </Route>
);

// Public, no-auth, no-shell variant for design-importer tools
// (html.to.design, Anima, Locofy, screenshot services). Mounted at App root
// OUTSIDE ProtectedRoute so headless scrapers never see the auth spinner.
// Each slide renders at native dimensions in document flow — no overlay, no
// scale, no animation. URL: /brand-book-print/:slug
export const brandBookPrintRoutes = (
  <Route path="brand-book-print">
    <Route index element={<Navigate to="cover" replace />} />
    <Route path=":slug" element={<BrandBookPrintSlide />} />
  </Route>
);

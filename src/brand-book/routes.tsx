import { Navigate, Route } from "react-router-dom";
import { BrandBookShell } from "./BrandBookShell";

// Temporary top-level Brand Book slideshow. Each slide is its own route
// (`/brand-book/:slug`) so the browser URL changes on every step — mirrors
// the Genie 6 path-based pattern.
export const brandBookRoutes = (
  <Route path="brand-book">
    <Route index element={<Navigate to="cover" replace />} />
    <Route path=":slug" element={<BrandBookShell />} />
  </Route>
);

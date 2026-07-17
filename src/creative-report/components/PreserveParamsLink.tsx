/**
 * NavLink wrapper that carries the module's persistent filter params to the
 * target route while dropping view-scoped params (drawer id, tab, compare
 * ids…). Query params already present on `to` win over preserved ones.
 */
import { forwardRef } from "react";
import { NavLink, NavLinkProps, useSearchParams } from "react-router-dom";
import { FILTER_PARAM_KEYS } from "@/creative-report/lib/paramSchema";

export interface PreserveParamsLinkProps extends Omit<NavLinkProps, "to"> {
  to: string;
}

export function buildPreservedSearch(
  current: URLSearchParams,
  targetSearch: string,
): string {
  const merged = new URLSearchParams();
  for (const key of FILTER_PARAM_KEYS) {
    const value = current.get(key);
    if (value) merged.set(key, value);
  }
  const explicit = new URLSearchParams(targetSearch);
  explicit.forEach((value, key) => merged.set(key, value));
  const qs = merged.toString();
  return qs ? `?${qs}` : "";
}

export const PreserveParamsLink = forwardRef<HTMLAnchorElement, PreserveParamsLinkProps>(
  function PreserveParamsLink({ to, ...props }, ref) {
    const [searchParams] = useSearchParams();
    const [pathname, targetSearch = ""] = to.split("?");
    const search = buildPreservedSearch(searchParams, targetSearch);
    return <NavLink ref={ref} to={`${pathname}${search}`} {...props} />;
  },
);

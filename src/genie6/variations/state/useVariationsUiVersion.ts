import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { VariationsUiVersion } from "../types";

/**
 * Which of the two UI versions of the Generate Variations flow is showing.
 *
 * URL-borne (`?ui=a|b`) rather than localStorage, on Maalik's call: a link he
 * sends carries the version he was looking at, which a per-browser preference
 * cannot. Same precedent as `?queue=v1|v2|v3` on the results screen.
 */
export const UI_VERSION_PARAM = "ui";
export const DEFAULT_UI_VERSION: VariationsUiVersion = "a";

export const UI_VERSION_META: Record<VariationsUiVersion, { label: string; hint: string }> = {
  a: { label: "A · Inline", hint: "Everything on one screen" },
  b: { label: "B · Stepped", hint: "Split across 3 steps" },
};

function isValid(value: string | null): value is VariationsUiVersion {
  return value === "a" || value === "b";
}

export function useVariationsUiVersion() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(UI_VERSION_PARAM);
  const version: VariationsUiVersion = isValid(raw) ? raw : DEFAULT_UI_VERSION;

  const setVersion = useCallback(
    (next: VariationsUiVersion) => {
      setSearchParams(
        () => {
          // Read live rather than from the closed-over params: react-router
          // hands the updater the params of the render that created it.
          const sp = new URLSearchParams(window.location.search);
          sp.set(UI_VERSION_PARAM, next);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { version, setVersion };
}

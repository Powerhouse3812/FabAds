import { useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { FEED_FILTER_QP, countFeedFilters, readFeedFilters, type FeedFilters } from "@/lib/insights-v3/selectors";

/** URL-backed filters. A change replaces history (like every other filter) and keeps the push marker. */
export function useFeedFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const key = searchParams.toString();
  const filters = useMemo(() => readFeedFilters(searchParams), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const write = useCallback(
    (mutate: (sp: URLSearchParams) => void) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: true, state: location.state },
      ),
    [setSearchParams, location.state],
  );

  const set = useCallback(
    (field: keyof FeedFilters, ids: string[]) =>
      write((sp) => (ids.length ? sp.set(FEED_FILTER_QP[field], ids.join(",")) : sp.delete(FEED_FILTER_QP[field]))),
    [write],
  );
  const clearAll = useCallback(() => write((sp) => Object.values(FEED_FILTER_QP).forEach((k) => sp.delete(k))), [write]);
  return { filters, set, clearAll, count: countFeedFilters(filters) };
}

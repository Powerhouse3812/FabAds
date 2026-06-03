import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  type ReportEntity,
  type EntityLevel,
  type GroupingOption,
  type ReportMetrics,
  getByLevel,
  getDataset,
  aggregateMetrics,
} from "@/lib/reports-dummy-data";

export interface GroupedRow {
  isGroup: true;
  groupKey: string;
  groupLabel: string;
  depth: number;
  count: number;
  metrics: ReportMetrics;
  children: (ReportEntity | GroupedRow)[];
}

export type TableRow = ReportEntity | GroupedRow;

export function isGroupRow(r: TableRow): r is GroupedRow {
  return "isGroup" in r && r.isGroup;
}

interface UseReportsDataParams {
  level: EntityLevel;
  parentId?: string | null;
  search?: string;
  platforms?: string[];
  statuses?: string[];
  primaryGroupBy?: GroupingOption | null;
  secondaryGroupBy?: GroupingOption | null;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  dateSeed?: number;
  creativeType?: "image" | "video" | null;
  // ── Bulk Launch Distribution provenance filters ──────────────────
  launchStrategies?: string[]; // multi-select chips (fill_first/equal/duplicate)
  launchBatchId?: string | null; // single select
  destinationFbPageId?: string | null; // single select (fb_page_id)
  destinationAdAccountName?: string | null; // single select
  sourceAdName?: string | null; // single select
}

export function useReportsData({
  level,
  parentId,
  search = "",
  platforms = [],
  statuses = [],
  primaryGroupBy = null,
  secondaryGroupBy = null,
  sortColumn = "spend",
  sortDirection = "desc",
  page = 1,
  pageSize = 25,
  dateSeed = 0,
  creativeType = null,
  launchStrategies = [],
  launchBatchId = null,
  destinationFbPageId = null,
  destinationAdAccountName = null,
  sourceAdName = null,
}: UseReportsDataParams) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevFilters = useRef("");

  const filterKey = JSON.stringify({
    level, parentId, search, platforms, statuses,
    primaryGroupBy: primaryGroupBy?.value,
    secondaryGroupBy: secondaryGroupBy?.value,
    dateSeed, creativeType,
    launchStrategies, launchBatchId, destinationFbPageId,
    destinationAdAccountName, sourceAdName,
  });

  useEffect(() => {
    if (prevFilters.current && prevFilters.current !== filterKey) {
      setIsRefreshing(true);
      const t = setTimeout(() => setIsRefreshing(false), 2000 + Math.random() * 1000);
      return () => clearTimeout(t);
    }
    prevFilters.current = filterKey;
  }, [filterKey]);

  const filtered = useMemo(() => {
    let items: ReportEntity[];
    if (parentId) {
      items = getDataset(dateSeed).filter(
        (e) => e.level === level && e.parentId === parentId
      );
    } else {
      items = getByLevel(level, dateSeed);
    }

    if (creativeType) {
      items = items.filter((e) => e.creative?.type === creativeType);
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((e) => e.name.toLowerCase().includes(q));
    }

    if (platforms.length > 0) {
      items = items.filter((e) => platforms.includes(e.platform));
    }

    if (statuses.length > 0) {
      items = items.filter((e) => statuses.includes(e.status));
    }

    // ── Launch provenance filters ──────────────────────────────────
    if (launchStrategies.length > 0) {
      items = items.filter((e) => e.launchStrategy != null && launchStrategies.includes(e.launchStrategy));
    }
    if (launchBatchId) {
      items = items.filter((e) => e.launchBatchId === launchBatchId);
    }
    if (destinationFbPageId) {
      items = items.filter((e) => e.destinationFbPageId === destinationFbPageId);
    }
    if (destinationAdAccountName) {
      items = items.filter((e) => e.destinationAdAccountName === destinationAdAccountName);
    }
    if (sourceAdName) {
      items = items.filter((e) => e.sourceAdName === sourceAdName);
    }

    return items;
  }, [
    level, parentId, search, platforms, statuses, dateSeed, creativeType,
    launchStrategies, launchBatchId, destinationFbPageId,
    destinationAdAccountName, sourceAdName,
  ]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const aVal = (a.metrics as unknown as Record<string, number>)[sortColumn] ?? 0;
      const bVal = (b.metrics as unknown as Record<string, number>)[sortColumn] ?? 0;
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
    return arr;
  }, [filtered, sortColumn, sortDirection]);

  const grouped = useMemo((): TableRow[] => {
    if (!primaryGroupBy) return sorted;

    const groups = new Map<string, ReportEntity[]>();
    for (const item of sorted) {
      const key = primaryGroupBy.getKey(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    const rows: TableRow[] = [];
    for (const [key, items] of groups) {
      let children: (ReportEntity | GroupedRow)[];

      if (secondaryGroupBy) {
        const subGroups = new Map<string, ReportEntity[]>();
        for (const item of items) {
          const sk = secondaryGroupBy.getKey(item);
          if (!subGroups.has(sk)) subGroups.set(sk, []);
          subGroups.get(sk)!.push(item);
        }
        children = Array.from(subGroups.entries()).map(([sk, sItems]) => ({
          isGroup: true as const,
          groupKey: sk,
          groupLabel: sk,
          depth: 1,
          count: sItems.length,
          metrics: aggregateMetrics(sItems),
          children: sItems,
        }));
      } else {
        children = items;
      }

      rows.push({
        isGroup: true as const,
        groupKey: key,
        groupLabel: key,
        depth: 0,
        count: items.length,
        metrics: aggregateMetrics(items),
        children,
      });
    }
    return rows;
  }, [sorted, primaryGroupBy, secondaryGroupBy]);

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginated = useMemo(() => {
    if (primaryGroupBy) return grouped;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [grouped, sorted, page, pageSize, primaryGroupBy]);

  return {
    rows: paginated,
    totalCount,
    totalPages,
    isRefreshing,
    allFiltered: filtered,
  };
}

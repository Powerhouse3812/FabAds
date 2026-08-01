/**
 * Annotation registry — merges every surface's slice into one lookup.
 * Slices are authored in parallel (one file per surface) and merged here.
 */
import type { AnnotationSpec } from "@/creative-report-v2/annotations/types";
import { drawerAnnotations } from "@/creative-report-v2/annotations/slices/drawer";
import { gridAnnotations } from "@/creative-report-v2/annotations/slices/grid";
import { overviewAnnotations } from "@/creative-report-v2/annotations/slices/overview";
import { automationsOwnerAnnotations } from "@/creative-report-v2/annotations/slices/automationsOwner";

const REGISTRY: Record<string, AnnotationSpec> = {
  ...drawerAnnotations,
  ...gridAnnotations,
  ...overviewAnnotations,
  ...automationsOwnerAnnotations,
};

export function getAnnotation(id: string): AnnotationSpec | undefined {
  return REGISTRY[id];
}

export * from "@/creative-report-v2/annotations/types";

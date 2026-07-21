/**
 * Annotation registry — merges every surface's slice into one lookup.
 * Slices are authored in parallel (one file per surface) and merged here.
 */
import type { AnnotationSpec } from "@/creative-report/annotations/types";
import { drawerAnnotations } from "@/creative-report/annotations/slices/drawer";
import { gridAnnotations } from "@/creative-report/annotations/slices/grid";
import { overviewAnnotations } from "@/creative-report/annotations/slices/overview";
import { automationsOwnerAnnotations } from "@/creative-report/annotations/slices/automationsOwner";

const REGISTRY: Record<string, AnnotationSpec> = {
  ...drawerAnnotations,
  ...gridAnnotations,
  ...overviewAnnotations,
  ...automationsOwnerAnnotations,
};

export function getAnnotation(id: string): AnnotationSpec | undefined {
  return REGISTRY[id];
}

export * from "@/creative-report/annotations/types";

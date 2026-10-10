import { describe, expect, it } from "vitest";
import type { DownloadFile } from "@/lib/insights-v3/types";
import { normalizeDownloads } from "./download";

const f = (n: string): DownloadFile => ({ kind: "text", filename: n, mime: "text/plain", content: n });

describe("normalizeDownloads", () => {
  it("wraps a single file", () => expect(normalizeDownloads(f("a.txt"))).toEqual([f("a.txt")]));
  it("keeps an array in order", () =>
    expect(normalizeDownloads([f("a"), f("b")]).map((x) => x.filename)).toEqual(["a", "b"]));
  it("null / undefined / empty → []", () => {
    expect(normalizeDownloads(null)).toEqual([]);
    expect(normalizeDownloads(undefined)).toEqual([]);
    expect(normalizeDownloads([])).toEqual([]);
  });
});

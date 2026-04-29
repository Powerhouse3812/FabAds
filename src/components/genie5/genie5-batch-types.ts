import type { AdgroupResult } from "./Genie5ResultsAdgroupCard";

export interface ResultImage {
  id: string;
  url: string;
  status: "completed" | "generating" | "failed";
}

export interface EditMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export interface Batch {
  id: string;
  strategy: string;
  status: "generating" | "completed" | "partial";
  createdAt: number;
  results: ResultImage[];
  adcopyResults?: AdgroupResult[];
  totalExpected: number;
}

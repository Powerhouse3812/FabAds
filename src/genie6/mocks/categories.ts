import type { Category } from "../types/entities";

export const categories: Category[] = [
  {
    id: "skincare",
    name: "Skincare",
    similarCategoryIds: ["haircare", "wellness"],
    referenceUrls: [
      "https://www.byrdie.com/skincare-routine-4801033",
      "https://www.allure.com/topic/skin-care",
    ],
    instruction: "Avoid medical claims. Use 'helps' / 'supports'. No 'cure' / 'guaranteed'.",
    winnerCount: 12,
    feedbackCount: 47,
  },
  {
    id: "haircare",
    name: "Hair care",
    similarCategoryIds: ["skincare"],
    referenceUrls: [
      "https://www.healthline.com/health/hair-care-tips",
    ],
    instruction: "Avoid 'miracle'. Before/after needs disclaimer. Acceptable: 'visible reduction in hair fall in N weeks'.",
    winnerCount: 18,
    feedbackCount: 73,
  },
  {
    id: "audio",
    name: "Audio & wearables",
    similarCategoryIds: ["wearable-tech"],
    referenceUrls: [
      "https://www.rtings.com/headphones/reviews/best/wireless-bluetooth-earbuds",
    ],
    instruction: "Spec-led copy works in this vertical. Lead with one numeric claim (battery life, drivers).",
    winnerCount: 22,
    feedbackCount: 31,
  },
  {
    id: "wearable-tech",
    name: "Wearable tech",
    similarCategoryIds: ["audio"],
    referenceUrls: [],
    instruction: "AMOLED, BT calling, sport modes, battery life — these convert. Show display in motion.",
    winnerCount: 15,
    feedbackCount: 24,
  },
  {
    id: "sleep",
    name: "Sleep & mattress",
    similarCategoryIds: ["wellness"],
    referenceUrls: [
      "https://www.sleepfoundation.org/best-mattress",
    ],
    instruction: "Premium tone. 100-night trial is the hook. Avoid medical claims about sleep disorders.",
    winnerCount: 4,
    feedbackCount: 11,
  },
  {
    id: "wellness",
    name: "Wellness",
    similarCategoryIds: ["skincare", "sleep"],
    referenceUrls: [],
    instruction: "Wellness ≠ medical. Use 'feel better', 'support', 'daily routine'. No therapeutic claims.",
    winnerCount: 7,
    feedbackCount: 19,
  },
];

export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}

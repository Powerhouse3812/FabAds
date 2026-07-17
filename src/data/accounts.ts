/**
 * Creative Report 2.0 — agency ad-account directory.
 * Mock data only (per prototype-minimum rule) — no live account sync.
 */

export interface AdAccount {
  id: string;
  name: string;
  platform: "meta" | "tiktok" | "newsbreak";
}

export const AD_ACCOUNTS: AdAccount[] = [
  { id: "acc-amalfa-meta", name: "Amalfa — Meta Primary", platform: "meta" },
  { id: "acc-amalfa-tt", name: "Amalfa — TikTok", platform: "tiktok" },
  { id: "acc-glowkart", name: "GlowKart US", platform: "meta" },
  { id: "acc-peaksupps", name: "Peak Supps", platform: "meta" },
  { id: "acc-nordic", name: "Nordic Home", platform: "newsbreak" },
];

export const ACCOUNT_BY_ID: Record<string, AdAccount> = AD_ACCOUNTS.reduce(
  (acc, account) => {
    acc[account.id] = account;
    return acc;
  },
  {} as Record<string, AdAccount>,
);

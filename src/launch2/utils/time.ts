/** Relative-time + currency helpers for Launch 2.0 displays. */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** "just now" · "5m ago" · "2h ago" · "3d ago" · "in 1d" (future). */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  const diff = t - now;
  const abs = Math.abs(diff);
  const future = diff > 0;

  if (abs < MIN) return "just now";
  let value: number;
  let unit: string;
  if (abs < HOUR) {
    value = Math.round(abs / MIN);
    unit = "m";
  } else if (abs < DAY) {
    value = Math.round(abs / HOUR);
    unit = "h";
  } else {
    value = Math.round(abs / DAY);
    unit = "d";
  }
  return future ? `in ${value}${unit}` : `${value}${unit} ago`;
}

const SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

export function currencySymbol(code: string): string {
  return SYMBOLS[code] ?? `${code} `;
}

/** "$50" · "₹1,250" — whole-number money for budgets. */
export function formatMoney(amount: number, currency: string): string {
  const sym = currencySymbol(currency);
  return `${sym}${Math.round(amount).toLocaleString("en-IN")}`;
}

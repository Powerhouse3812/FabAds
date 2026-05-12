import { C } from "../tokens";

export interface WordmarkProps {
  height?: number;
  fab?: string;
  fun?: string;
  font?: string;
  fabWeight?: number;
  funWeight?: number;
}

export function Wordmark({
  height = 64,
  fab = C.ink,
  fun = C.rich,
  font = `'Geist', sans-serif`,
  fabWeight = 900,
  funWeight = 500,
}: WordmarkProps) {
  return (
    <span
      style={{
        fontSize: height,
        lineHeight: 0.95,
        letterSpacing: "-0.02em",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "baseline",
        textTransform: "uppercase",
        fontFamily: font,
      }}
    >
      <span style={{ fontWeight: fabWeight, color: fab }}>FAB</span>
      <span style={{ fontWeight: funWeight, color: fun, marginLeft: "0.04em" }}>FUNNEL</span>
    </span>
  );
}

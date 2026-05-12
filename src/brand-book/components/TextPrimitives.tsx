import type { CSSProperties, ReactNode } from "react";
import { C } from "../tokens";

export const Mono = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <span style={{ fontFamily: `'Geist Mono', ui-monospace, monospace`, ...style }}>{children}</span>
);

export const Eyebrow = ({
  children,
  color = C.mute,
}: {
  children: ReactNode;
  color?: string;
}) => (
  <Mono
    style={{
      fontSize: 11,
      letterSpacing: "0.18em",
      color,
      textTransform: "uppercase",
    }}
  >
    {children}
  </Mono>
);

export const H1 = ({
  children,
  color = C.ink,
  max = 1100,
}: {
  children: ReactNode;
  color?: string;
  max?: number;
}) => (
  <div
    style={{
      fontFamily: `'Geist', sans-serif`,
      fontWeight: 900,
      fontSize: 72,
      lineHeight: 0.95,
      letterSpacing: "-0.025em",
      color,
      maxWidth: max,
    }}
  >
    {children}
  </div>
);

export const H2 = ({ children, color = C.ink }: { children: ReactNode; color?: string }) => (
  <div
    style={{
      fontFamily: `'Geist', sans-serif`,
      fontWeight: 800,
      fontSize: 36,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color,
    }}
  >
    {children}
  </div>
);

export const Body = ({
  children,
  color = "#3a3a35",
  max = 720,
}: {
  children: ReactNode;
  color?: string;
  max?: number;
}) => (
  <div
    style={{
      fontFamily: `'Geist', sans-serif`,
      fontSize: 15,
      color,
      maxWidth: max,
      lineHeight: 1.6,
    }}
  >
    {children}
  </div>
);

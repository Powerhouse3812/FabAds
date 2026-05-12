import { Mark } from "./Mark";
import { Wordmark } from "./Wordmark";

export interface LockupProps {
  height?: number;
  fab?: string;
  fun?: string;
  lime?: string;
  soft?: string;
  ink?: string;
  tipInk?: string | null;
  mono?: string | null;
  gap?: number;
  stack?: boolean;
}

export function Lockup({
  height = 64,
  fab,
  fun,
  lime,
  soft,
  ink,
  tipInk,
  mono,
  gap,
  stack = false,
}: LockupProps) {
  const markSize = stack ? height * 2.8 : height * 1.55;
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: stack ? "column" : "row",
        alignItems: "center",
        gap: gap !== undefined ? gap : stack ? height * 0.45 : height * 0.42,
      }}
    >
      <Mark size={markSize} lime={lime} soft={soft} ink={ink} tipInk={tipInk} mono={mono} />
      <Wordmark height={height} fab={fab} fun={fun} />
    </div>
  );
}

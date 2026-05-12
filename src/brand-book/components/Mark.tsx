import { C } from "../tokens";

// Six-layer F-as-funnel mark. Every path is essential detail and must be
// preserved at every scale, on every surface, in every color. In monochrome
// we keep the detail by separating fills with subtle opacity steps so the
// silhouette never collapses to a flat blob.
export interface MarkProps {
  size?: number;
  ink?: string;
  lime?: string;
  soft?: string;
  tipInk?: string | null;
  mono?: string | null;
  monoOpacities?: [number, number, number, number, number, number];
}

export function Mark({
  size = 100,
  ink = C.ink,
  lime = C.lime,
  soft = C.soft,
  tipInk = null,
  mono = null,
  monoOpacities = [1, 0.78, 0.56, 0.78, 1, 0.78],
}: MarkProps) {
  const _tip = tipInk == null ? ink : tipInk;
  const fills: string[] = mono
    ? [mono, mono, mono, mono, mono, mono]
    : [ink, lime, soft, lime, _tip, lime];
  const opacities: number[] = mono ? monoOpacities : [1, 1, 1, 1, 1, 1];

  return (
    <svg
      width={size}
      height={(size * 102) / 128}
      viewBox="0 0 128 102"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="FabFunnel"
      role="img"
    >
      <path d="M127.882 4.84577C127.882 6.0199 127.464 7.09453 126.768 7.93035L104.23 34.9453C104.23 34.9453 104.19 34.995 104.161 35.0249C104.151 35.0547 104.121 35.0746 104.111 35.0945C103.225 36.1294 101.902 36.796 100.419 36.796H44.8571L20.6183 8.5373L23.7625 4.85573L24.1307 4.4378C26.5088 1.62188 30.0014 0 33.6829 0H123.026C125.713 0 127.882 2.16916 127.882 4.85573V4.84577Z" fill={fills[0]} fillOpacity={opacities[0]}/>
      <path d="M49.4939 98.6169L47.683 100.746C47.0063 101.542 46.0013 102 44.9566 102H8.66802C5.99141 102 3.8123 99.8309 3.8123 97.1542C3.8123 95.9801 4.23021 94.9054 4.91678 94.0696L25.2352 70.388L49.4839 98.6069L49.4939 98.6169Z" fill={fills[1]} fillOpacity={opacities[1]}/>
      <path d="M83.663 58.8557L49.4939 98.6169L3.4939 45.0647C3.36455 44.9353 3.23518 44.806 3.12573 44.6468L2.77748 44.2388V44.2089C2.68793 44.1094 2.59837 43.9901 2.51876 43.8707C0.429211 40.9552 2.48892 36.786 6.23022 36.796H44.867L63.7327 58.7264C68.9964 64.8458 78.3794 64.8756 83.673 58.8557Z" fill={fills[2]} fillOpacity={opacities[2]}/>
      <path d="M44.8571 36.786H6.22025C2.48891 36.786 0.429215 40.9652 2.50882 43.8707C-0.914068 39.612 -0.834461 33.5025 2.74763 29.3333L8.88693 22.1692L20.6183 8.52737L44.8571 36.786Z" fill={fills[3]} fillOpacity={opacities[3]}/>
      <path d="M87.9018 52.1492C87.9018 53.3234 87.4839 54.398 86.7874 55.2338L83.7824 58.7363C78.3496 64.8855 68.9665 64.8557 63.7128 58.7363L53.8819 47.3035H83.0362C85.7228 47.3035 87.8919 49.4726 87.8919 52.1592Z" fill={fills[4]} fillOpacity={opacities[4]}/>
      <path d="M87.9018 52.1492C87.9018 53.3234 87.4839 54.398 86.7874 55.2338L83.7824 58.7363C78.3496 64.8855 68.9665 64.8557 63.7128 58.7363L53.8819 47.3035H83.0362C85.7228 47.3035 87.8919 49.4726 87.8919 52.1592Z" fill={fills[5]} fillOpacity={opacities[5]}/>
    </svg>
  );
}

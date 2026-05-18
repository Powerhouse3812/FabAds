import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CursorFollowGlowProps {
  /** Glow size in pixels. Default 400. */
  size?: number;
  /** Glow color (rgba). Default lime at ~6% alpha. */
  color?: string;
  className?: string;
}

/**
 * CursorFollowGlow — soft radial lime spotlight that tracks the cursor
 * inside the parent container. Pure visual polish; pointer-events: none.
 *
 * Awwwards-class touch — keeps the hero section from feeling flat.
 * Uses requestAnimationFrame + direct DOM mutation (not React state)
 * so cursor tracking is butter-smooth and doesn't trigger re-renders.
 *
 * Mount inside any `position: relative` container with `overflow: hidden`.
 */
export function CursorFollowGlow({
  size = 400,
  color = "rgba(195,235,66,0.10)",
  className,
}: CursorFollowGlowProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    parentRef.current = parent;

    let raf = 0;
    let targetX = -9999;
    let targetY = -9999;
    let renderX = targetX;
    let renderY = targetY;

    const handleMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    };

    const handleLeave = () => {
      targetX = -9999;
      targetY = -9999;
    };

    const tick = () => {
      // Spring-like lerp toward target
      renderX += (targetX - renderX) * 0.18;
      renderY += (targetY - renderY) * 0.18;
      el.style.transform = `translate(${renderX - size / 2}px, ${renderY - size / 2}px)`;
      raf = requestAnimationFrame(tick);
    };

    parent.addEventListener("mousemove", handleMove);
    parent.addEventListener("mouseleave", handleLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      parent.removeEventListener("mousemove", handleMove);
      parent.removeEventListener("mouseleave", handleLeave);
      cancelAnimationFrame(raf);
    };
  }, [size]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("absolute pointer-events-none will-change-transform", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
        transform: "translate(-9999px, -9999px)",
      }}
    />
  );
}

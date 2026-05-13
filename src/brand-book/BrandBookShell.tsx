import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Menu } from "lucide-react";
import { SLIDES, SLIDE_BY_SLUG } from "./slides";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap";

function useGeistFonts() {
  useEffect(() => {
    const existing = document.querySelector<HTMLLinkElement>(
      `link[data-brand-book-fonts="1"]`,
    );
    if (existing) return;
    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";
    pre1.setAttribute("data-brand-book-fonts", "1");
    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";
    pre2.setAttribute("data-brand-book-fonts", "1");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    link.setAttribute("data-brand-book-fonts", "1");
    document.head.append(pre1, pre2, link);
    return () => {
      document
        .querySelectorAll('link[data-brand-book-fonts="1"]')
        .forEach((el) => el.remove());
    };
  }, []);
}

const STYLE_ID = "brand-book-shell-styles";
const SHELL_CSS = `
.bb-stage { position: fixed; inset: 0; display: grid; place-items: center; user-select: none; -webkit-user-select: none; background: #1a1a17; font-family: 'Geist', sans-serif; z-index: 1000; }
.bb-stage *, .bb-stage *::before, .bb-stage *::after { box-sizing: border-box; }
.bb-artboard-wrap { position: relative; will-change: transform, opacity; transition: opacity 240ms ease, transform 240ms ease; cursor: pointer; }
.bb-artboard-scaler { transform-origin: top left; will-change: transform; }
.bb-artboard { background: #f6f4ef; border-radius: 14px; overflow: hidden; box-shadow: 0 60px 120px -40px rgba(0,0,0,0.55), 0 24px 48px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04); }
.bb-hud { position: fixed; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; pointer-events: none; font-family: 'Geist Mono', ui-monospace, monospace; color: rgba(246,244,239,0.6); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; z-index: 1010; }
.bb-hud.top { top: 0; }
.bb-hud.bottom { bottom: 0; font-size: 10.5px; }
.bb-hud .bb-left, .bb-hud .bb-right, .bb-hud .bb-center { display: flex; align-items: center; gap: 14px; }
.bb-hud .bb-center { color: rgba(246,244,239,0.85); }
.bb-pill { padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(246,244,239,0.14); background: rgba(246,244,239,0.04); }
.bb-pill.green { color: #c9e34a; border-color: rgba(143,184,33,0.35); background: rgba(143,184,33,0.08); }
.bb-dot { width: 6px; height: 6px; border-radius: 99px; background: #8FB821; box-shadow: 0 0 0 3px rgba(143,184,33,0.18); }
.bb-seg { display: flex; gap: 4px; }
.bb-seg .bb-tick { width: 18px; height: 3px; border-radius: 99px; background: rgba(246,244,239,0.14); }
.bb-seg .bb-tick.active { background: #8FB821; }
.bb-seg .bb-tick.done { background: rgba(246,244,239,0.35); }
.bb-hint { position: fixed; left: 50%; bottom: 56px; transform: translateX(-50%); pointer-events: none; display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 999px; background: rgba(20,20,18,0.78); border: 1px solid rgba(246,244,239,0.1); color: rgba(246,244,239,0.78); font-family: 'Geist Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; z-index: 1010; opacity: 0; transition: opacity 400ms ease; }
.bb-hint.show { opacity: 1; }
.bb-icon-btn { pointer-events: auto; display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px 6px 8px; border-radius: 999px; border: 1px solid rgba(246,244,239,0.14); background: rgba(246,244,239,0.04); color: rgba(246,244,239,0.78); font: inherit; cursor: pointer; transition: all 160ms ease; }
.bb-icon-btn:hover { color: #f6f4ef; border-color: rgba(246,244,239,0.3); background: rgba(246,244,239,0.08); }
.bb-icon-btn .bb-glyph { width: 14px; height: 14px; display: grid; place-items: center; }
.bb-sheet { position: fixed; inset: 0; background: rgba(12,12,11,0.78); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); z-index: 1050; display: grid; place-items: center; opacity: 0; pointer-events: none; transition: opacity 200ms ease; }
.bb-sheet.open { opacity: 1; pointer-events: auto; }
.bb-sheet-inner { width: min(1080px, 92vw); max-height: 86vh; overflow: auto; background: #1a1a17; border: 1px solid rgba(246,244,239,0.08); border-radius: 18px; padding: 28px 28px 24px; color: #f6f4ef; box-shadow: 0 60px 120px -30px rgba(0,0,0,0.6); transform: translateY(8px) scale(0.985); transition: transform 240ms cubic-bezier(.2,.7,.2,1); }
.bb-sheet.open .bb-sheet-inner { transform: translateY(0) scale(1); }
.bb-sheet-head { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid rgba(246,244,239,0.08); }
.bb-sheet-title { font-weight: 800; font-size: 22px; letter-spacing: -0.01em; }
.bb-sheet-sub { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(246,244,239,0.5); }
.bb-sheet-close { pointer-events: auto; width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(246,244,239,0.12); background: transparent; color: rgba(246,244,239,0.7); cursor: pointer; font-size: 16px; }
.bb-sheet-close:hover { color: #f6f4ef; background: rgba(246,244,239,0.06); }
.bb-sec-group { margin-bottom: 22px; }
.bb-sec-head { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(246,244,239,0.5); margin-bottom: 10px; }
.bb-sec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.bb-sec-card { pointer-events: auto; text-align: left; padding: 14px 14px 12px; border-radius: 12px; border: 1px solid rgba(246,244,239,0.08); background: rgba(246,244,239,0.03); color: #f6f4ef; cursor: pointer; transition: all 160ms ease; display: flex; flex-direction: column; gap: 6px; font: inherit; }
.bb-sec-card:hover { border-color: rgba(143,184,33,0.45); background: rgba(143,184,33,0.06); transform: translateY(-1px); }
.bb-sec-card.active { border-color: rgba(143,184,33,0.65); background: rgba(143,184,33,0.1); }
.bb-sec-card .bb-num { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 10.5px; letter-spacing: 0.18em; color: rgba(246,244,239,0.45); }
.bb-sec-card .bb-label { font-weight: 600; font-size: 15px; letter-spacing: -0.005em; }
.bb-sec-card .bb-slug { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 10.5px; color: rgba(246,244,239,0.4); }
.bb-share { margin-top: 8px; padding-top: 16px; border-top: 1px solid rgba(246,244,239,0.08); display: flex; align-items: center; gap: 12px; font-family: 'Geist Mono', ui-monospace, monospace; font-size: 11px; color: rgba(246,244,239,0.55); }
.bb-share .bb-url { flex: 1; min-width: 0; padding: 8px 10px; border-radius: 8px; background: rgba(246,244,239,0.05); border: 1px solid rgba(246,244,239,0.08); color: #f6f4ef; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bb-share button { pointer-events: auto; padding: 8px 12px; border-radius: 8px; background: #8FB821; color: #1a1a17; border: none; cursor: pointer; font: inherit; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; }
.bb-share button:hover { filter: brightness(1.06); }
.bb-kbd { padding: 2px 6px; border-radius: 5px; background: rgba(246,244,239,0.08); border: 1px solid rgba(246,244,239,0.12); color: rgba(246,244,239,0.9); font-size: 10px; }
.bb-nav-btn { position: fixed; top: 50%; transform: translateY(-50%); width: 56px; height: 56px; border-radius: 999px; display: grid; place-items: center; background: rgba(246,244,239,0.06); border: 1px solid rgba(246,244,239,0.14); color: rgba(246,244,239,0.75); cursor: pointer; z-index: 1020; transition: all 180ms ease; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.bb-nav-btn:hover { background: rgba(143,184,33,0.14); border-color: rgba(143,184,33,0.5); color: #f6f4ef; transform: translateY(-50%) scale(1.06); }
.bb-nav-btn:active { transform: translateY(-50%) scale(0.96); }
.bb-nav-btn:disabled { opacity: 0.28; cursor: not-allowed; background: rgba(246,244,239,0.03); }
.bb-nav-btn:disabled:hover { transform: translateY(-50%); border-color: rgba(246,244,239,0.14); color: rgba(246,244,239,0.75); }
.bb-nav-btn.left { left: 22px; }
.bb-nav-btn.right { right: 22px; }
.bb-nav-btn svg { width: 22px; height: 22px; }
.bb-artboard-wrap.enter { opacity: 0; transform: translateY(8px); }
.bb-artboard-wrap.enter-active { opacity: 1; transform: translateY(0); }
`;

function useShellStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = SHELL_CSS;
    document.head.appendChild(style);
    return () => {
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);
}

export function BrandBookShell() {
  useGeistFonts();
  useShellStyles();

  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const idx = slug && slug in SLIDE_BY_SLUG ? SLIDE_BY_SLUG[slug] : 0;

  const [enter, setEnter] = useState(true);
  const [hint, setHint] = useState(true);
  const [vp, setVp] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1280,
    h: typeof window !== "undefined" ? window.innerHeight : 780,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const clickTimer = useRef<number | null>(null);

  // viewport size
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // slide-in animation per slug change
  useEffect(() => {
    setEnter(true);
    const t = requestAnimationFrame(() => setEnter(false));
    return () => cancelAnimationFrame(t);
  }, [idx]);

  // hide hint after a few seconds (once)
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4200);
    return () => clearTimeout(t);
  }, []);

  // title sync
  useEffect(() => {
    document.title = `FabFunnel — ${SLIDES[idx].label}`;
  }, [idx]);

  function goTo(i: number) {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
    navigate(`/brand-book/${SLIDES[clamped].slug}`);
  }
  function next() { goTo(idx + 1); }
  function prev() { goTo(idx - 1); }

  // keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault(); next();
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault(); prev();
      } else if (e.key === "Home") {
        goTo(0);
      } else if (e.key === "End") {
        goTo(SLIDES.length - 1);
      } else if (e.key === "Escape") {
        setMenuOpen(false);
      } else if (e.key.toLowerCase() === "i") {
        setMenuOpen((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function copyLink() {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  function onStageClick() {
    // defer single-click so a dblclick can cancel it
    if (clickTimer.current != null) return;
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      next();
    }, 230);
  }
  function onStageDoubleClick() {
    if (clickTimer.current != null) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    prev();
  }

  function close() {
    navigate("/dashboard");
  }

  const groups = useMemo(() => {
    const map = new Map<string, { slug: string; label: string; i: number }[]>();
    SLIDES.forEach((s, i) => {
      if (!map.has(s.section)) map.set(s.section, []);
      map.get(s.section)!.push({ slug: s.slug, label: s.label, i });
    });
    return [...map.entries()];
  }, []);

  const slide = SLIDES[idx];
  const margin = 96;
  const sx = (vp.w - margin * 2) / slide.w;
  const sy = (vp.h - margin * 2) / slide.h;
  const scale = Math.min(sx, sy, 1.05);

  const Cmp = slide.Component;

  return (
    <>
      <div className="bb-stage" onClick={onStageClick} onDoubleClick={onStageDoubleClick}>
        <div
          key={slide.slug}
          className={`bb-artboard-wrap ${enter ? "enter" : "enter-active"}`}
          style={{ width: slide.w * scale, height: slide.h * scale }}
        >
          <div
            className="bb-artboard-scaler"
            style={{ transform: `scale(${scale})`, width: slide.w, height: slide.h }}
          >
            <div className="bb-artboard" style={{ width: slide.w, height: slide.h }}>
              <Cmp />
            </div>
          </div>
        </div>
      </div>

      {/* top HUD */}
      <div className="bb-hud top">
        <div className="bb-left">
          <button
            className="bb-icon-btn"
            onClick={(e) => { e.stopPropagation(); close(); }}
            title="Close (back to FabAds)"
            aria-label="Close"
          >
            <span className="bb-glyph">
              <X size={12} strokeWidth={1.4} aria-hidden />
            </span>
            Close
          </button>
          <span className="bb-dot" />
          <span style={{ color: "rgba(246,244,239,0.85)", letterSpacing: "0.22em" }}>FabFunnel</span>
          <span>·</span>
          <span>Brand Asset Book</span>
        </div>
        <div className="bb-center">
          <span className="bb-pill">{slide.section}</span>
        </div>
        <div className="bb-right">
          <button
            className="bb-icon-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}
            title="Contents (I)"
          >
            <span className="bb-glyph">
              <Menu size={12} strokeWidth={1.4} aria-hidden />
            </span>
            Contents
          </button>
          <span className="bb-pill green">
            {String(idx + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* bottom HUD */}
      <div className="bb-hud bottom">
        <div className="bb-left">
          <span style={{ color: "rgba(246,244,239,0.85)" }}>{slide.label}</span>
        </div>
        <div className="bb-center">
          <div className="bb-seg">
            {SLIDES.map((s, i) => (
              <span
                key={s.slug}
                className={`bb-tick ${i === idx ? "active" : i < idx ? "done" : ""}`}
                title={s.label}
              />
            ))}
          </div>
        </div>
        <div className="bb-right">
          <span>/brand-book/{slide.slug}</span>
        </div>
      </div>

      {/* nav buttons */}
      <button
        className="bb-nav-btn left"
        onClick={(e) => { e.stopPropagation(); prev(); }}
        disabled={idx === 0}
        aria-label="Previous"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="14 6 8 12 14 18" />
        </svg>
      </button>
      <button
        className="bb-nav-btn right"
        onClick={(e) => { e.stopPropagation(); next(); }}
        disabled={idx === SLIDES.length - 1}
        aria-label="Next"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="10 6 16 12 10 18" />
        </svg>
      </button>

      {/* contents overlay */}
      <div
        className={`bb-sheet ${menuOpen ? "open" : ""}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains("bb-sheet")) setMenuOpen(false);
        }}
      >
        <div className="bb-sheet-inner">
          <div className="bb-sheet-head">
            <div>
              <div className="bb-sheet-sub">FabFunnel · Brand Asset Book</div>
              <div className="bb-sheet-title">Contents</div>
            </div>
            <button
              className="bb-sheet-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {groups.map(([section, items]) => (
            <div key={section} className="bb-sec-group">
              <div className="bb-sec-head">{section}</div>
              <div className="bb-sec-grid">
                {items.map((it) => (
                  <button
                    key={it.slug}
                    className={`bb-sec-card ${it.i === idx ? "active" : ""}`}
                    onClick={() => { setMenuOpen(false); goTo(it.i); }}
                  >
                    <span className="bb-num">{String(it.i + 1).padStart(2, "0")}</span>
                    <span className="bb-label">{it.label}</span>
                    <span className="bb-slug">/brand-book/{it.slug}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="bb-share">
            <span>Share this view</span>
            <span className="bb-url">{typeof window !== "undefined" ? window.location.href : ""}</span>
            <button onClick={copyLink}>{copied ? "Copied" : "Copy link"}</button>
          </div>
        </div>
      </div>

      {/* gesture hint */}
      <div className={`bb-hint ${hint ? "show" : ""}`}>
        <span className="bb-kbd">← →</span>
        <span>Navigate</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span className="bb-kbd">I</span>
        <span>Index</span>
      </div>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

interface ViewportSnapshot {
  winW: number;
  winH: number;
  vvW: number;
  vvH: number;
  vvTop: number;
  vvScale: number;
  screenH: number;
  screenW: number;
  dpr: number;
  scrollY: number;
  cssAppScreenH: number;
  safeTop: number;
  safeBottom: number;
  diffScreenWin: number;
  diffCssWin: number;
}

interface SectionRect {
  top: number;
  bottom: number;
  height: number;
  width: number;
  diffFromWinH: number;
}

interface TelemetryEntry {
  t: number;
  time: string;
  type: string;
  activeTab: string;
  viewport: ViewportSnapshot;
  sections: Record<string, SectionRect>;
  details?: Record<string, unknown>;
}

const TARGET_SECTIONS: Record<string, string> = {
  hero: "#hero",
  philo: "#philosophy",
  tech: "#technique",
  works: "#works",
  master: "#master",
  studio: "#studio",
  academy: "#academy",
  faq: "#faq",
};

function parsePx(val: string): number {
  const num = parseFloat(val);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function getViewportSnapshot(): ViewportSnapshot {
  if (typeof window === "undefined") {
    return {
      winW: 0,
      winH: 0,
      vvW: 0,
      vvH: 0,
      vvTop: 0,
      vvScale: 1,
      screenH: 0,
      screenW: 0,
      dpr: 1,
      scrollY: 0,
      cssAppScreenH: 0,
      safeTop: 0,
      safeBottom: 0,
      diffScreenWin: 0,
      diffCssWin: 0,
    };
  }

  const vv = window.visualViewport;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const screenW = window.screen?.width || 0;
  const screenH = window.screen?.height || 0;

  let cssAppScreenH = 0;
  let safeTop = 0;
  let safeBottom = 0;

  if (typeof document !== "undefined") {
    const style = window.getComputedStyle(document.documentElement);
    cssAppScreenH = parsePx(style.getPropertyValue("--app-screen-h"));
    safeTop = parsePx(style.getPropertyValue("--app-safe-top"));
    safeBottom = parsePx(style.getPropertyValue("--app-safe-bottom"));
  }

  return {
    winW,
    winH,
    vvW: vv ? Math.round(vv.width) : winW,
    vvH: vv ? Math.round(vv.height) : winH,
    vvTop: vv ? Math.round(vv.offsetTop) : 0,
    vvScale: vv ? Number(vv.scale.toFixed(2)) : 1,
    screenH,
    screenW,
    dpr: Number((window.devicePixelRatio || 1).toFixed(2)),
    scrollY: Math.round(window.scrollY || window.pageYOffset || 0),
    cssAppScreenH,
    safeTop,
    safeBottom,
    diffScreenWin: screenH - winH,
    diffCssWin: cssAppScreenH - winH,
  };
}

function getSectionsSnapshot(winH: number): Record<string, SectionRect> {
  if (typeof document === "undefined") return {};

  const result: Record<string, SectionRect> = {};
  for (const [key, selector] of Object.entries(TARGET_SECTIONS)) {
    const el = document.querySelector(selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      const height = Math.round(rect.height);
      result[key] = {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height,
        width: Math.round(rect.width),
        diffFromWinH: height - winH,
      };
    }
  }
  return result;
}

function detectActiveSection(): string {
  if (typeof window === "undefined" || typeof document === "undefined") return "hero";
  const midY = window.innerHeight * 0.45;
  for (const [key, selector] of Object.entries(TARGET_SECTIONS)) {
    const el = document.querySelector(selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= midY && rect.bottom > midY) {
        return key;
      }
    }
  }
  return "hero";
}

export function DebugLoggerHud() {
  const [mounted, setMounted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveVp, setLiveVp] = useState<ViewportSnapshot | null>(null);
  const [liveSecs, setLiveSecs] = useState<Record<string, SectionRect>>({});
  const [activeTab, setActiveTab] = useState<string>("hero");
  const [recentEvents, setRecentEvents] = useState<string[]>([]);

  const activeTabRef = useRef<string>("hero");
  const queueRef = useRef<TelemetryEntry[]>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevDimensionsRef = useRef<{ winH: number; vvH: number }>({ winH: 0, vvH: 0 });

  const sendQueue = () => {
    if (queueRef.current.length === 0) return;
    const payload = [...queueRef.current];
    queueRef.current = [];

    fetch("/api/debug-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  };

  const scheduleFlush = () => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      sendQueue();
    }, 400);
  };

  const recordEvent = (type: string, details?: Record<string, unknown>) => {
    const vp = getViewportSnapshot();
    const secs = getSectionsSnapshot(vp.winH);
    const currentTab = detectActiveSection();
    const now = Date.now();
    const timeStr = new Date(now).toISOString().slice(14, 23);

    const activeSec = secs[currentTab];
    const activeSecH = activeSec ? activeSec.height : 0;
    const activeSecDiff = activeSec ? activeSec.diffFromWinH : 0;

    // Structured log for the Playwright Logger Window and DevTools
    const diffSign = vp.diffScreenWin >= 0 ? "+" : "";
    const secDiffSign = activeSecDiff >= 0 ? "+" : "";
    const consoleMsg = `[NAMI] [${type.toUpperCase()}] Tab:${currentTab.toUpperCase()} | scr:${vp.screenW}x${vp.screenH} win:${vp.winW}x${vp.winH} (diff:${diffSign}${vp.diffScreenWin}px) vv:${vp.vvW}x${vp.vvH} | css--app-h:${vp.cssAppScreenH}px | Sec[${currentTab}]:${activeSecH}px(Δ:${secDiffSign}${activeSecDiff}px) y:${vp.scrollY}`;

    console.info(consoleMsg);

    const entry: TelemetryEntry = {
      t: now,
      time: timeStr,
      type,
      activeTab: currentTab,
      viewport: vp,
      sections: secs,
      details,
    };

    queueRef.current.push(entry);
    scheduleFlush();

    setLiveVp(vp);
    setLiveSecs(secs);
    setActiveTab(currentTab);

    const eventLine = `${timeStr} [${type}] Tab:${currentTab} winH:${vp.winH} scrH:${vp.screenH} diff:${diffSign}${vp.diffScreenWin}px H[${currentTab}]:${activeSecH}`;
    setRecentEvents((prev) => [eventLine, ...prev.slice(0, 4)]);
  };

  useEffect(() => {
    setMounted(true);

    const initialVp = getViewportSnapshot();
    const initialSecs = getSectionsSnapshot(initialVp.winH);
    const initialTab = detectActiveSection();

    setLiveVp(initialVp);
    setLiveSecs(initialSecs);
    setActiveTab(initialTab);
    activeTabRef.current = initialTab;

    prevDimensionsRef.current = {
      winH: initialVp.winH,
      vvH: initialVp.vvH,
    };

    recordEvent("mount", { initial: true });

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const currentTab = detectActiveSection();
        if (currentTab !== activeTabRef.current) {
          const prev = activeTabRef.current;
          activeTabRef.current = currentTab;
          recordEvent("tab_change", { from: prev, to: currentTab });
        } else {
          recordEvent("scroll");
        }
      });
    };

    const onResize = () => {
      const vp = getViewportSnapshot();
      const deltaH = vp.winH - prevDimensionsRef.current.winH;
      prevDimensionsRef.current.winH = vp.winH;
      recordEvent("resize", { deltaH });
    };

    const onVisualViewportResize = () => {
      const vp = getViewportSnapshot();
      const deltaVvH = vp.vvH - prevDimensionsRef.current.vvH;
      prevDimensionsRef.current.vvH = vp.vvH;
      recordEvent("vv_resize", { deltaVvH });
    };

    const onOrientation = () => {
      recordEvent("orientation", { orientation: window.screen?.orientation?.type || "unknown" });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onVisualViewportResize);
      window.visualViewport.addEventListener("scroll", onScroll);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const targetId = entry.target.id || entry.target.nodeName.toLowerCase();
        const height = Math.round(entry.contentRect.height);
        recordEvent(`obs_${targetId}`, { target: targetId, height });
      }
    });

    observer.observe(document.documentElement);
    Object.values(TARGET_SECTIONS).forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onVisualViewportResize);
        window.visualViewport.removeEventListener("scroll", onScroll);
      }
      observer.disconnect();
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      sendQueue();
    };
  }, []);

  const handleCopyDiag = async () => {
    if (!liveVp) return;
    const diffSign = liveVp.diffScreenWin >= 0 ? "+" : "";
    const activeSec = liveSecs[activeTab];
    const text = [
      `=== NAMI IPHONE VIEWPORT DIAGNOSTIC ===`,
      `Active Tab: ${activeTab.toUpperCase()}`,
      `Screen (physical): ${liveVp.screenW} x ${liveVp.screenH}`,
      `Window (innerHeight): ${liveVp.winW} x ${liveVp.winH}`,
      `Difference (Screen - Win): ${diffSign}${liveVp.diffScreenWin}px [Safari toolbars / browser chrome]`,
      `VisualViewport: ${liveVp.vvW} x ${liveVp.vvH} (top: ${liveVp.vvTop}, scale: ${liveVp.vvScale})`,
      `CSS --app-screen-h: ${liveVp.cssAppScreenH}px (Δ vs Win: ${liveVp.diffCssWin >= 0 ? "+" : ""}${liveVp.diffCssWin}px)`,
      `Safe Areas: top=${liveVp.safeTop}px, bottom=${liveVp.safeBottom}px, DPR=${liveVp.dpr}, scrollY=${liveVp.scrollY}`,
      `Current Section H: ${activeSec ? `${activeSec.height}px (Δ: ${activeSec.diffFromWinH}px)` : "n/a"}`,
      `Sections:`,
      ...Object.entries(liveSecs).map(
        ([key, s]) => `  ${key.padEnd(8)}: H=${s.height}px | T=${s.top}px | B=${s.bottom}px | ΔvsWin=${s.diffFromWinH >= 0 ? "+" : ""}${s.diffFromWinH}px`
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleClearServerLogs = async () => {
    try {
      await fetch("/api/debug-log?clear=1");
      setRecentEvents([]);
      recordEvent("cleared");
    } catch {}
  };

  if (!mounted || !liveVp) return null;

  const diffSign = liveVp.diffScreenWin >= 0 ? "+" : "";
  const activeSec = liveSecs[activeTab];

  return (
    <aside
      aria-label="iPhone Viewport Telemetry HUD"
      className="fixed top-[calc(env(safe-area-inset-top,0px)+0.5rem)] left-2 right-2 z-[999999] mx-auto max-w-sm rounded-lg border border-emerald-500/50 bg-black/90 p-2 font-mono text-[10px] leading-tight text-emerald-400 shadow-2xl backdrop-blur-md select-none md:left-4 md:right-auto md:w-80 pointer-events-auto"
    >
      <div className="mb-1 flex items-center justify-between border-b border-emerald-500/30 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold tracking-wider text-emerald-300">IPHONE DIAG HUD</span>
          <span className="rounded bg-emerald-950 px-1 py-0.2 text-[8px] font-semibold text-emerald-300 uppercase">
            {activeTab}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px]">
          <button
            type="button"
            onClick={handleCopyDiag}
            className="rounded bg-emerald-800/60 px-1.5 py-0.5 text-white hover:bg-emerald-700 active:scale-95 transition-all"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
          <button
            type="button"
            onClick={handleClearServerLogs}
            className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
            title="Clear logs"
          >
            🧹
          </button>
          <button
            type="button"
            onClick={() => setMinimized((m) => !m)}
            className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
            title={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? "▢" : "—"}
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px]">
            <div>
              scr: <span className="text-white font-semibold">{liveVp.screenW}×{liveVp.screenH}</span>
            </div>
            <div>
              win: <span className="text-white font-semibold">{liveVp.winW}×{liveVp.winH}</span>
            </div>
            <div>
              diff(scr-win):{" "}
              <span className={liveVp.diffScreenWin !== 0 ? "text-amber-400 font-bold" : "text-white"}>
                {diffSign}{liveVp.diffScreenWin}px
              </span>
            </div>
            <div>
              vv: <span className="text-white">{liveVp.vvW}×{liveVp.vvH}</span>
            </div>
            <div>
              css--app-h:{" "}
              <span className={liveVp.diffCssWin !== 0 ? "text-amber-300 font-bold" : "text-white"}>
                {liveVp.cssAppScreenH}px
              </span>
            </div>
            <div>
              scrollY: <span className="text-white">{liveVp.scrollY}</span>
            </div>
          </div>

          <div className="mt-1 border-t border-emerald-500/20 pt-1">
            <div className="flex items-center justify-between text-[9px]">
              <span className="font-semibold text-emerald-300">ACTIVE TAB: [{activeTab.toUpperCase()}]</span>
              <span className="text-white">
                H: {activeSec ? activeSec.height : 0}px (Δ: {activeSec ? (activeSec.diffFromWinH >= 0 ? "+" : "") + activeSec.diffFromWinH : 0}px)
              </span>
            </div>
            <div className="mt-0.5 grid grid-cols-3 gap-1 text-[8.5px]">
              {["philo", "tech", "works"].map((key) => {
                const s = liveSecs[key];
                const isActive = activeTab === key;
                return (
                  <div
                    key={key}
                    className={`rounded px-1 py-0.5 ${isActive ? "bg-emerald-900/60 font-bold text-white border border-emerald-400/50" : "bg-black/40 text-emerald-300/80"}`}
                  >
                    {key}: {s ? `${s.height}px` : "—"}
                  </div>
                );
              })}
            </div>
          </div>

          {recentEvents.length > 0 && (
            <div className="mt-1 border-t border-emerald-500/20 pt-1">
              <div className="flex items-center justify-between text-[8.5px] text-emerald-400/80 mb-0.5">
                <span>RECENT EVENTS:</span>
                <a
                  href="/api/debug-log?format=text"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-white"
                >
                  view /api/debug-log
                </a>
              </div>
              <div className="space-y-0.5 text-[8px] text-emerald-200/90 truncate font-mono">
                {recentEvents.map((evt, idx) => (
                  <div key={idx} className="truncate">{evt}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

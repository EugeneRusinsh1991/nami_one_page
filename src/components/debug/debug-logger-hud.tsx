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
  docH: number;
  scrollMax: number;
  scrollRatioStr: string;
  screenIndex: number;
  totalScreens: number;
  cssAppScreenH: number;
  safeTop: number;
  safeBottom: number;
  diffScreenWin: number;
  diffTop: number;
  diffBottom: number;
  diffCssWin: number;
  dvh: number;
  svh: number;
  lvh: number;
  barDelta: number;
  barsState: "EXPANDED" | "COLLAPSED" | "TRANSITION" | "STATIC";
  bottomBar: boolean;
}

interface SectionRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  height: number;
  width: number;
  centerX: number;
  centerY: number;
  diffFromWinH: number;
  parentHeight: number;
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
  book: "#booking",
};

function parsePx(val: string): number {
  const num = parseFloat(val);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function ensureProbeContainer(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("hud-viewport-probes")) return;
  const container = document.createElement("div");
  container.id = "hud-viewport-probes";
  container.setAttribute("aria-hidden", "true");
  container.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;opacity:0;z-index:-99999;";
  container.innerHTML = `
    <div id="hud-probe-dvh" style="position:fixed;top:0;left:0;height:100dvh;width:0;pointer-events:none;"></div>
    <div id="hud-probe-svh" style="position:fixed;top:0;left:0;height:100svh;width:0;pointer-events:none;"></div>
    <div id="hud-probe-lvh" style="position:fixed;top:0;left:0;height:100lvh;width:0;pointer-events:none;"></div>
    <div id="hud-probe-safe-top" style="position:fixed;top:0;left:0;right:0;height:env(safe-area-inset-top,0px);pointer-events:none;"></div>
    <div id="hud-probe-safe-bottom" style="position:fixed;bottom:0;left:0;right:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;"></div>
  `;
  document.body.appendChild(container);
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
      docH: 0,
      scrollMax: 0,
      scrollRatioStr: "0×0",
      screenIndex: 1,
      totalScreens: 1,
      cssAppScreenH: 0,
      safeTop: 0,
      safeBottom: 0,
      diffScreenWin: 0,
      diffTop: 0,
      diffBottom: 0,
      diffCssWin: 0,
      dvh: 0,
      svh: 0,
      lvh: 0,
      barDelta: 0,
      barsState: "STATIC",
      bottomBar: false,
    };
  }

  ensureProbeContainer();

  const vv = window.visualViewport;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const screenW = window.screen?.width || 0;
  const screenH = window.screen?.height || 0;
  const scrollY = Math.round(window.scrollY || window.pageYOffset || 0);

  let cssAppScreenH = 0;
  let safeTop = 0;
  let safeBottom = 0;

  if (typeof document !== "undefined") {
    const style = window.getComputedStyle(document.documentElement);
    cssAppScreenH = parsePx(style.getPropertyValue("--app-screen-h"));
  }

  const dvhEl = typeof document !== "undefined" ? document.getElementById("hud-probe-dvh") : null;
  const svhEl = typeof document !== "undefined" ? document.getElementById("hud-probe-svh") : null;
  const lvhEl = typeof document !== "undefined" ? document.getElementById("hud-probe-lvh") : null;
  const safeTopEl = typeof document !== "undefined" ? document.getElementById("hud-probe-safe-top") : null;
  const safeBottomEl = typeof document !== "undefined" ? document.getElementById("hud-probe-safe-bottom") : null;

  const dvh = dvhEl ? Math.round(dvhEl.getBoundingClientRect().height) : winH;
  const svh = svhEl ? Math.round(svhEl.getBoundingClientRect().height) : winH;
  const lvh = lvhEl ? Math.round(lvhEl.getBoundingClientRect().height) : winH;

  if (safeTopEl) {
    safeTop = Math.round(safeTopEl.getBoundingClientRect().height);
  }
  if (safeBottomEl) {
    safeBottom = Math.round(safeBottomEl.getBoundingClientRect().height);
  }

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent || "");
  const diffScreenWin = Math.max(0, screenH - winH);

  // Fallback for iOS safe-area if probes returned 0
  if (isIOS && safeTop === 0 && safeBottom === 0 && diffScreenWin > 0) {
    if (screenH >= 852) {
      safeTop = 54;
      safeBottom = 34;
    } else {
      safeTop = 47;
      safeBottom = 34;
    }
  }

  const barDelta = Math.max(0, lvh - svh);
  let barsState: "EXPANDED" | "COLLAPSED" | "TRANSITION" | "STATIC" = "STATIC";
  let bottomBar = false;

  if (barDelta > 4) {
    if (Math.abs(winH - svh) <= 4 || Math.abs(dvh - svh) <= 4) {
      barsState = "EXPANDED";
      bottomBar = true;
    } else if (Math.abs(winH - lvh) <= 4 || Math.abs(dvh - lvh) <= 4) {
      barsState = "COLLAPSED";
      bottomBar = false;
    } else {
      barsState = "TRANSITION";
      bottomBar = true;
    }
  }

  // Calculate Top and Bottom breakdown of diffScreenWin (Safari UI Chrome + Insets)
  let diffTop = 0;
  let diffBottom = 0;

  if (diffScreenWin > 0) {
    const isExpanded = barsState === "EXPANDED" || (barDelta <= 4 && diffScreenWin >= 100);
    const bottomToolbar = isExpanded ? 44 : 0;
    diffBottom = Math.min(diffScreenWin, Math.max(safeBottom, safeBottom + bottomToolbar));
    diffTop = Math.max(0, diffScreenWin - diffBottom);

    if (diffTop < safeTop && diffScreenWin >= safeTop) {
      diffTop = safeTop;
      diffBottom = Math.max(0, diffScreenWin - diffTop);
    }
  }

  const docH = typeof document !== "undefined" ? Math.round(document.documentElement.scrollHeight || document.body.scrollHeight) : winH;
  const scrollMax = Math.max(0, docH - winH);
  const ratio = winH > 0 ? scrollY / winH : 0;
  const isNearInt = Math.abs(ratio - Math.round(ratio)) < 0.03;
  const ratioStr = isNearInt ? `${Math.round(ratio)}×` : `${ratio.toFixed(2)}×`;
  const scrollRatioStr = `${ratioStr}${winH}`;
  const screenIndex = Math.floor(ratio) + 1;
  const totalScreens = Math.max(1, Math.ceil(docH / (winH || 1)));

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
    scrollY,
    docH,
    scrollMax,
    scrollRatioStr,
    screenIndex,
    totalScreens,
    cssAppScreenH,
    safeTop,
    safeBottom,
    diffScreenWin,
    diffTop,
    diffBottom,
    diffCssWin: cssAppScreenH - winH,
    dvh: dvh || winH,
    svh: svh || winH,
    lvh: lvh || winH,
    barDelta,
    barsState,
    bottomBar,
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
      const width = Math.round(rect.width);
      const top = Math.round(rect.top);
      const bottom = Math.round(rect.bottom);
      const left = Math.round(rect.left);
      const right = Math.round(rect.right);
      const centerX = Math.round(left + width / 2);
      const centerY = Math.round(top + height / 2);
      const parentEl = el.parentElement;
      const parentHeight = parentEl ? Math.round(parentEl.getBoundingClientRect().height) : 0;
      result[key] = {
        top,
        bottom,
        left,
        right,
        height,
        width,
        centerX,
        centerY,
        diffFromWinH: height - winH,
        parentHeight,
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
  const historyRef = useRef<TelemetryEntry[]>([]);
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
    const activeSecCY = activeSec ? activeSec.centerY : 0;

    // Structured log for the Playwright Logger Window and DevTools
    const diffSign = vp.diffScreenWin >= 0 ? "+" : "";
    const secDiffSign = activeSecDiff >= 0 ? "+" : "";
    const consoleMsg = `[NAMI] [${type.toUpperCase()}] Tab:${currentTab.toUpperCase()} | scr:${vp.screenW}x${vp.screenH} win:${vp.winW}x${vp.winH} (diff:${diffSign}${vp.diffScreenWin}px) vv:${vp.vvW}x${vp.vvH} | svh:${vp.svh} lvh:${vp.lvh} dvh:${vp.dvh} | css--app-h:${vp.cssAppScreenH}px | Sec[${currentTab}]:${activeSecH}px(Δ:${secDiffSign}${activeSecDiff}px, cY:${activeSecCY}) y:${vp.scrollY}(${vp.scrollRatioStr})`;

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
    historyRef.current.push(entry);
    if (historyRef.current.length > 150) {
      historyRef.current.shift();
    }
    scheduleFlush();

    setLiveVp(vp);
    setLiveSecs(secs);
    setActiveTab(currentTab);

    const eventLine = `${timeStr} [${type}] Tab:${currentTab} winH:${vp.winH} y:${vp.scrollY}(${vp.scrollRatioStr}) cY:${activeSecCY}`;
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

    const historyLines = historyRef.current.slice(-50).map((h) => {
      const hSec = h.sections[h.activeTab];
      const hDiff = h.viewport.diffScreenWin >= 0 ? "+" : "";
      const hDetails = h.details ? ` ${JSON.stringify(h.details)}` : "";
      return `[${h.time}] [${h.type.padEnd(10)}] Tab:${h.activeTab.padEnd(5)} | win:${h.viewport.winW}x${h.viewport.winH} scr:${h.viewport.screenW}x${h.viewport.screenH} diff:${hDiff}${h.viewport.diffScreenWin}px vv:${h.viewport.vvW}x${h.viewport.vvH} | svh/lvh/dvh=${h.viewport.svh}/${h.viewport.lvh}/${h.viewport.dvh} | y=${h.viewport.scrollY}(${h.viewport.scrollRatioStr}) cY=${hSec?.centerY ?? "?"} H=${hSec?.height ?? "?"}${hDetails}`;
    });

    const text = [
      `=== NAMI IPHONE VIEWPORT DIAGNOSTIC ===`,
      `Time: ${new Date().toISOString()}`,
      `Active Tab: ${activeTab.toUpperCase()} | Center: (X:${activeSec?.centerX ?? 0}, Y:${activeSec?.centerY ?? 0})`,
      `Screen (physical): ${liveVp.screenW} x ${liveVp.screenH}`,
      `Window (innerHeight): ${liveVp.winW} x ${liveVp.winH}`,
      `Difference (Screen - Win): ${diffSign}${liveVp.diffScreenWin}px [Safari toolbars / browser chrome]`,
      `VisualViewport: ${liveVp.vvW} x ${liveVp.vvH} (top: ${liveVp.vvTop}, scale: ${liveVp.vvScale})`,
      `CSS Units: SVH=${liveVp.svh}px | LVH=${liveVp.lvh}px | DVH=${liveVp.dvh}px | barDelta=${liveVp.barDelta}px (${liveVp.barsState})`,
      `CSS --app-screen-h: ${liveVp.cssAppScreenH}px (Δ vs Win: ${liveVp.diffCssWin >= 0 ? "+" : ""}${liveVp.diffCssWin}px)`,
      `Safe Areas: top=${liveVp.safeTop}px, bottom=${liveVp.safeBottom}px, DPR=${liveVp.dpr}`,
      `Scroll: ${liveVp.scrollY}px (${liveVp.scrollRatioStr}, screen #${liveVp.screenIndex}/${liveVp.totalScreens}, max:${liveVp.scrollMax}px, docH:${liveVp.docH}px)`,
      `Active Section H: ${activeSec ? `${activeSec.height}px (Δ: ${activeSec.diffFromWinH}px, top=${activeSec.top}px, bottom=${activeSec.bottom}px)` : "n/a"}`,
      ``,
      `--- ALL SECTIONS SNAPSHOT ---`,
      ...Object.entries(liveSecs).map(
        ([key, s]) => `  ${key.padEnd(8)}: H=${s.height}px | Center=(X:${s.centerX}, Y:${s.centerY}) | T=${s.top}px | B=${s.bottom}px | ΔvsWin=${s.diffFromWinH >= 0 ? "+" : ""}${s.diffFromWinH}px`
      ),
      ``,
      `--- EVENT HISTORY TRACE (last ${historyLines.length} events) ---`,
      ...historyLines,
    ].join("\n");

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
      document.body.removeChild(textArea);
    }
  };

  const handleClearServerLogs = async () => {
    try {
      historyRef.current = [];
      await fetch("/api/debug-log?clear=1");
      setRecentEvents([]);
      recordEvent("cleared");
    } catch {}
  };

  if (!mounted || !liveVp) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label="Expand iPhone Viewport Telemetry HUD"
        title="Expand Diagnostics HUD"
        className="fixed top-[calc(env(safe-area-inset-top,0px)+0.5rem)] left-2 z-[999999] flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/40 bg-black/40 text-emerald-300/80 opacity-60 shadow-md backdrop-blur-xs transition-all hover:opacity-100 hover:bg-black/70 hover:text-emerald-300 active:scale-95 pointer-events-auto"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
        </svg>
      </button>
    );
  }

  const diffSign = liveVp.diffScreenWin >= 0 ? "+" : "";
  const activeSec = liveSecs[activeTab];

  return (
    <aside
      aria-label="iPhone Viewport Telemetry HUD"
      className="fixed top-[calc(env(safe-area-inset-top,0px)+0.5rem)] left-2 right-2 z-[999999] mx-auto max-w-sm rounded-lg border border-emerald-500/50 bg-black/90 p-2 font-mono text-[10px] leading-tight text-emerald-400 shadow-2xl backdrop-blur-md select-none md:left-4 md:right-auto md:w-80 pointer-events-auto"
    >
      <div className="mb-1 flex items-center justify-between border-b border-emerald-500/30 pb-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
            title="Minimize"
          >
            —
          </button>
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px]">
            <div>
              scr: <span className="text-white font-semibold">{liveVp.screenW}×{liveVp.screenH}</span>
            </div>
            <div>
              win: <span className="text-white font-semibold">{liveVp.winW}×{liveVp.winH}</span>
            </div>
            <div className="col-span-2">
              diff:{" "}
              <span className={liveVp.diffScreenWin !== 0 ? "text-amber-400 font-bold" : "text-white"}>
                {diffSign}{liveVp.diffScreenWin}px
              </span>{" "}
              <span className="text-emerald-300 font-medium text-[8.5px]">
                (▲top:~{liveVp.diffTop}px | ▼btm:~{liveVp.diffBottom}px)
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
              svh/lvh: <span className="text-white">{liveVp.svh}/{liveVp.lvh}px</span>
            </div>
            <div>
              dvh: <span className="text-white">{liveVp.dvh}px</span>{" "}
              <span className="text-[8px] text-emerald-400/70">(Δ:{liveVp.barDelta}px)</span>
            </div>
            <div>
              safe: <span className="text-white">T:{liveVp.safeTop} B:{liveVp.safeBottom}</span>
            </div>
            <div>
              chrome: <span className="text-white">T:~{Math.max(0, liveVp.diffTop - liveVp.safeTop)} B:~{Math.max(0, liveVp.diffBottom - liveVp.safeBottom)}</span>
            </div>
            <div className="col-span-2 pt-0.5">
              scroll: <span className="text-white font-semibold">{liveVp.scrollY}px</span>{" "}
              <span className="text-emerald-300 font-bold">({liveVp.scrollRatioStr})</span>{" "}
              <span className="text-emerald-400/80">[#{liveVp.screenIndex}/{liveVp.totalScreens}]</span>
            </div>
          </div>

          <div className="mt-1 border-t border-emerald-500/20 pt-1">
            <div className="flex items-center justify-between text-[9px]">
              <span className="font-semibold text-emerald-300">ACTIVE TAB: [{activeTab.toUpperCase()}]</span>
              <span className="text-white">
                H: {activeSec ? activeSec.height : 0}px (Δ: {activeSec ? (activeSec.diffFromWinH >= 0 ? "+" : "") + activeSec.diffFromWinH : 0}px)
              </span>
            </div>
            <div className="mt-0.5 grid grid-cols-2 gap-1 rounded bg-black/50 border border-emerald-500/20 px-1.5 py-1 text-[8.5px]">
              <div>
                center: <span className="text-white font-semibold">X:{activeSec?.centerX ?? 0} Y:{activeSec?.centerY ?? 0}</span>
              </div>
              <div>
                rect: <span className="text-white">T:{activeSec?.top ?? 0} B:{activeSec?.bottom ?? 0}</span>
              </div>
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
    </aside>
  );
}

import { NextResponse } from "next/server";

export interface LogEntry {
  t: number;
  time?: string;
  type: string;
  activeTab?: string;
  viewport?: {
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
    scrollRatioStr?: string;
    screenIndex?: number;
    totalScreens?: number;
    cssAppScreenH?: number;
    diffScreenWin?: number;
    diffTop?: number;
    diffBottom?: number;
    diffCssWin?: number;
    svh?: number;
    lvh?: number;
    dvh?: number;
    barDelta?: number;
    safeTop?: number;
    safeBottom?: number;
  };
  sections?: Record<
    string,
    {
      top: number;
      bottom: number;
      left?: number;
      right?: number;
      height: number;
      width: number;
      centerX?: number;
      centerY?: number;
      diffFromWinH?: number;
    }
  >;
  details?: Record<string, unknown>;
}

const MAX_LOGS = 500;
const ringBuffer: LogEntry[] = [];

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("clear") === "1") {
    ringBuffer.length = 0;
    return NextResponse.json(
      { ok: true, cleared: true, total: 0 },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  if (url.searchParams.get("format") === "text") {
    const textOutput = ringBuffer
      .map((entry) => {
        const timeStr = entry.time || new Date(entry.t).toISOString().slice(11, 23);
        const tabStr = entry.activeTab ? `TAB:${entry.activeTab.toUpperCase()}` : "";
        const vp = entry.viewport
          ? `win=${entry.viewport.winW}x${entry.viewport.winH} scr=${entry.viewport.screenW}x${entry.viewport.screenH} diff=${(entry.viewport.diffScreenWin ?? 0) >= 0 ? "+" : ""}${entry.viewport.diffScreenWin ?? 0}px vv=${entry.viewport.vvW}x${entry.viewport.vvH} svh/lvh/dvh=${entry.viewport.svh ?? "?"}/${entry.viewport.lvh ?? "?"}/${entry.viewport.dvh ?? "?"} y=${entry.viewport.scrollY}(${entry.viewport.scrollRatioStr ?? ""})`
          : "";
        const sec = entry.sections
          ? Object.entries(entry.sections)
              .map(([name, s]) => `${name}[H:${s.height}|cY:${s.centerY ?? "?"}|T:${s.top}${s.diffFromWinH !== undefined ? `|Δ:${s.diffFromWinH >= 0 ? "+" : ""}${s.diffFromWinH}` : ""}]`)
              .join(" ")
          : "";
        const details = entry.details ? JSON.stringify(entry.details) : "";
        return `[${timeStr}] [${entry.type.padEnd(10)}] ${tabStr ? `${tabStr} | ` : ""}${vp} | ${sec} ${details}`.trim();
      })
      .join("\n");

    return new Response(textOutput || "No logs collected yet.", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      total: ringBuffer.length,
      latest: ringBuffer[ringBuffer.length - 1] || null,
      logs: ringBuffer,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: LogEntry[] = Array.isArray(body) ? body : [body];

    const timestamp = Date.now();
    for (const item of items) {
      if (!item.t) item.t = timestamp;
      if (!item.time) item.time = new Date(item.t).toISOString().slice(11, 23);
      ringBuffer.push(item);
    }

    if (ringBuffer.length > MAX_LOGS) {
      ringBuffer.splice(0, ringBuffer.length - MAX_LOGS);
    }

    return NextResponse.json(
      { ok: true, count: ringBuffer.length },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid log payload" },
      { status: 400 }
    );
  }
}

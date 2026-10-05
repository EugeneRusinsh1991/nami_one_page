const SCENE_FADE_OUT_MS = 150;
const SCENE_FADE_IN_MS = 180;
const SCENE_OVERLAY_BG = "rgba(248, 249, 251, 0.94)";

let sceneOverlay: HTMLDivElement | null = null;
let sceneBusy = false;

function getSceneOverlay(): HTMLDivElement {
  if (sceneOverlay && sceneOverlay.isConnected) return sceneOverlay;
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    background: SCENE_OVERLAY_BG,
    backdropFilter: "blur(14px)",
    opacity: "0",
    pointerEvents: "none",
    willChange: "opacity",
  });
  document.body.appendChild(el);
  sceneOverlay = el;
  return el;
}

function fadeOverlay(el: HTMLDivElement, to: number, ms: number): Promise<void> {
  const anim = el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: String(to) }], {
    duration: ms,
    easing: "ease-in-out",
    fill: "forwards",
  });
  return anim.finished.then(() => {
    el.style.opacity = String(to);
    anim.cancel();
  });
}

function nextFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) =>
      left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
    step(count);
  });
}

export async function runSceneTransition(teleport: () => void): Promise<void> {
  if (sceneBusy) return;
  sceneBusy = true;
  const overlay = getSceneOverlay();
  overlay.style.pointerEvents = "auto";
  try {
    await fadeOverlay(overlay, 1, SCENE_FADE_OUT_MS);
    teleport();
    await nextFrames(2);
    await fadeOverlay(overlay, 0, SCENE_FADE_IN_MS);
  } finally {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    sceneBusy = false;
  }
}



export type DeviceType =
  | "pc"
  | "iphone"
  | "ipad"
  | "android-phone"
  | "android-tablet"
  | "foldable"
  | (string & {});

export type DeviceOS = "ios" | "android" | "macos" | "windows" | "linux" | "other";

export type DeviceBrowser = "safari" | "chrome" | "firefox" | "edge" | "other";

export interface DeviceInfo {
  type: DeviceType;
  os: DeviceOS;
  browser: DeviceBrowser;
  isTouch: boolean;
  isApple: boolean;
  isAndroid: boolean;
  isFoldable: boolean;
}

export interface DetectionContext {
  userAgent: string;
  platform?: string;
  maxTouchPoints: number;
  screenWidth: number;
  screenHeight: number;
  hasCoarsePointer: boolean;
  hasSpanningSegments?: boolean;
}

export interface DeviceClassifierRule {
  id: string;
  priority: number;
  match: (ctx: DetectionContext) => boolean;
  resolve: (ctx: DetectionContext) => Partial<DeviceInfo>;
}

export const DEFAULT_CLASSIFIER_RULES: DeviceClassifierRule[] = [
  // 1. Foldable / Multi-screen devices
  {
    id: "foldable",
    priority: 100,
    match: (ctx) =>
      Boolean(ctx.hasSpanningSegments) ||
      /Fold|Flip/i.test(ctx.userAgent),
    resolve: (ctx) => ({
      type: "foldable",
      isFoldable: true,
      isTouch: true,
      os: /Android/i.test(ctx.userAgent) ? "android" : "other",
      isAndroid: /Android/i.test(ctx.userAgent),
    }),
  },

  // 2. iPhone (iOS WebKit)
  {
    id: "iphone",
    priority: 90,
    match: (ctx) => /iPhone/i.test(ctx.userAgent),
    resolve: () => ({
      type: "iphone",
      os: "ios",
      isTouch: true,
      isApple: true,
      isAndroid: false,
      isFoldable: false,
    }),
  },

  // 3. iPad (including iPadOS 13+ desktop UA MacIntel with touch)
  {
    id: "ipad",
    priority: 85,
    match: (ctx) =>
      /iPad/i.test(ctx.userAgent) ||
      (ctx.platform === "MacIntel" && ctx.maxTouchPoints > 1),
    resolve: () => ({
      type: "ipad",
      os: "ios",
      isTouch: true,
      isApple: true,
      isAndroid: false,
      isFoldable: false,
    }),
  },

  // 4. Android devices
  {
    id: "android",
    priority: 80,
    match: (ctx) => /Android/i.test(ctx.userAgent),
    resolve: (ctx) => {
      const isTablet = ctx.screenWidth >= 768 || !/Mobile/i.test(ctx.userAgent);
      return {
        type: isTablet ? "android-tablet" : "android-phone",
        os: "android",
        isTouch: true,
        isApple: false,
        isAndroid: true,
        isFoldable: false,
      };
    },
  },

  // 5. Fallback touch handheld devices
  {
    id: "generic-touch",
    priority: 70,
    match: (ctx) => (ctx.maxTouchPoints > 0 || ctx.hasCoarsePointer) && ctx.screenWidth < 1024,
    resolve: (ctx) => ({
      type: ctx.screenWidth < 768 ? "android-phone" : "android-tablet",
      isTouch: true,
      isApple: false,
      isFoldable: false,
    }),
  },

  // 6. Desktop / PC default
  {
    id: "pc-fallback",
    priority: 10,
    match: () => true,
    resolve: (ctx) => ({
      type: "pc",
      isTouch: ctx.maxTouchPoints > 0,
      os: /Macintosh|Mac OS X/i.test(ctx.userAgent)
        ? "macos"
        : /Windows/i.test(ctx.userAgent)
        ? "windows"
        : /Linux/i.test(ctx.userAgent)
        ? "linux"
        : "other",
      isApple: /Macintosh|Mac OS X/i.test(ctx.userAgent),
      isAndroid: false,
      isFoldable: false,
    }),
  },
];

export function resolveBrowser(ua: string): DeviceBrowser {
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox|FxiOS/i.test(ua)) return "firefox";
  if (/Chrome|CriOS/i.test(ua) && !/Edg\//i.test(ua)) return "chrome";
  if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) return "safari";
  return "other";
}

export function extractDetectionContext(): DetectionContext {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      userAgent: "",
      platform: "",
      maxTouchPoints: 0,
      screenWidth: 1440,
      screenHeight: 900,
      hasCoarsePointer: false,
      hasSpanningSegments: false,
    };
  }

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const screenWidth = window.innerWidth || (window.screen ? window.screen.width : 1440);
  const screenHeight = window.innerHeight || (window.screen ? window.screen.height : 900);
  const hasCoarsePointer = Boolean(
    typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches
  );

  let hasSpanningSegments = false;
  if (typeof window.matchMedia === "function") {
    hasSpanningSegments =
      window.matchMedia("(horizontal-viewport-segments: 2)").matches ||
      window.matchMedia("(vertical-viewport-segments: 2)").matches;
  }

  return {
    userAgent,
    platform,
    maxTouchPoints,
    screenWidth,
    screenHeight,
    hasCoarsePointer,
    hasSpanningSegments,
  };
}

export function detectDevice(
  ctx?: DetectionContext,
  customRules?: DeviceClassifierRule[]
): DeviceInfo {
  const context = ctx ?? extractDetectionContext();
  const rules = [...(customRules ?? []), ...DEFAULT_CLASSIFIER_RULES].sort(
    (a, b) => b.priority - a.priority
  );

  const browser = resolveBrowser(context.userAgent);

  const baseInfo: DeviceInfo = {
    type: "pc",
    os: "other",
    browser,
    isTouch: context.maxTouchPoints > 0 || context.hasCoarsePointer,
    isApple: false,
    isAndroid: false,
    isFoldable: false,
  };

  for (const rule of rules) {
    if (rule.match(context)) {
      const resolved = rule.resolve(context);
      return {
        ...baseInfo,
        ...resolved,
        browser: resolved.browser ?? browser,
      };
    }
  }

  return baseInfo;
}

export function getDeviceDetectionInlineScript(): string {
  return `(function(){try{var u=navigator.userAgent||"",p=navigator.platform||"",m=navigator.maxTouchPoints||0,w=window.innerWidth||(screen?screen.width:1440),t=m>0||matchMedia("(pointer: coarse)").matches,f=matchMedia("(horizontal-viewport-segments: 2)").matches||/Fold|Flip/i.test(u),d=f?"foldable":/iPhone/i.test(u)?"iphone":/iPad/i.test(u)||(p==="MacIntel"&&m>1)?"ipad":/Android/i.test(u)?(w>=768||!/Mobile/i.test(u)?"android-tablet":"android-phone"):t&&w<1024?(w<768?"android-phone":"android-tablet"):"pc";document.documentElement.setAttribute("data-device",d)}catch(e){}})();`;
}

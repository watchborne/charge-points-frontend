// Web Push on iOS Safari only ever reaches a station's install of the
// dashboard as a home-screen app (charge-points-server issues #587-590,
// frontend issue #404) — there is no API to trigger that installation, only
// to detect whether it has already happened, so the UI has to tell the user
// to do it themselves. Pure functions, not a hook: easy to unit test, and the
// one caller (app/[locale]/app/profile/page.tsx) already owns its own effect
// for reading them once on mount.

/** Narrow, deliberately: "an iPhone/iPad/iPod's own browser", not "any mobile
 * device" — Android's install story is the native beforeinstallprompt flow
 * (#401 already ignores platform entirely there), and this check exists only
 * to decide when to show iOS-specific instructions. */
export function isIosDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

/** Whether the page is currently running as an installed, standalone app —
 * true both for iOS Safari's own non-standard `navigator.standalone` (not in
 * lib.dom.d.ts) and for the standard `display-mode: standalone` media query
 * other platforms (and newer iOS/iPadOS) use for the same thing. */
export function isStandaloneDisplayMode(nav: Navigator, win: Window): boolean {
  const iosStandalone = (nav as Navigator & { standalone?: boolean }).standalone;
  return Boolean(iosStandalone) || win.matchMedia?.("(display-mode: standalone)").matches === true;
}

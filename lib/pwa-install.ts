// iOS Safari only delivers Web Push to the dashboard installed as a home-screen
// app, and that install can only be detected, not triggered.

/** iPhone/iPad/iPod only: decides when to show iOS install instructions. */
export function isIosDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

/** Whether the page runs as an installed app: iOS's non-standard
 * `navigator.standalone` or the `display-mode: standalone` media query. */
export function isStandaloneDisplayMode(nav: Navigator, win: Window): boolean {
  const iosStandalone = (nav as Navigator & { standalone?: boolean }).standalone;
  return Boolean(iosStandalone) || win.matchMedia?.("(display-mode: standalone)").matches === true;
}

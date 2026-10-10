export type Device = "ios" | "android" | "desktop"

export function detectDevice(ua: string): Device {
  if (/iPhone|iPad|iPod/.test(ua)) return "ios"
  if (/Android/i.test(ua)) return "android"
  return "desktop"
}

/** In-app browsers (Instagram, Facebook, …) on iOS can't hand a .pkpass to Wallet. */
export function isIosInAppBrowser(ua: string) {
  return /iPhone|iPad|iPod/.test(ua) && /Instagram|FBAN|FBAV|Line\/|LinkedInApp|Twitter|TikTok|musical_ly/.test(ua)
}

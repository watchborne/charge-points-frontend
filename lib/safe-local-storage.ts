// `localStorage` access that degrades instead of throwing. The property getter
// itself throws in Safari private browsing, when storage is disabled by policy
// and in some embedded webviews, and `setItem` throws when the quota is
// exceeded — none of which should take down a render or an effect for what is
// only a remembered UI preference. Reads fall back to `null` (the same answer
// as "never stored"), writes are best-effort.

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Best-effort: the preference just isn't remembered.
    }
  },
};

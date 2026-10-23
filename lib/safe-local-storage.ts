// `localStorage` that degrades instead of throwing (private browsing, policy,
// webviews, quota). Reads fall back to `null`; writes are best-effort.

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

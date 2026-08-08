export const ThemeInitScript = () => {
  const themeScript = `
    (function() {
      const stored = localStorage.getItem('theme-preference') || 'system';
      const isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};

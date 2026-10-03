"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Last-resort error boundary: catches rendering errors that escape every other
 * boundary (including the root layouts) and reports them to Sentry, which
 * `onRequestError` (server) and the browser integrations do not cover for React
 * render errors.
 *
 * It replaces the root layout while shown, so it renders its own <html>/<body>
 * and cannot use next-intl, Tailwind or the shared components — hence the
 * inline styles and the fixed fr/en copy.
 */
const GlobalError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <main>
          <h1 style={{ fontSize: "1.25rem" }}>Une erreur est survenue / Something went wrong</h1>
          <p>
            Nous avons été prévenus. Veuillez réessayer. / We have been notified. Please try again.
          </p>
          <button type="button" onClick={reset}>
            Réessayer / Try again
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;

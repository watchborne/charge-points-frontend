import { useEffect } from "react";

import { reportError } from "@/lib/report-error";

/** Reports a query's error once per distinct error, replacing the
 * `useEffect(() => { if (error) console.error(error) }, [error])` each query
 * hook used to carry. */
export const useReportQueryError = (error: unknown, context: string): void => {
  useEffect(() => {
    if (error) reportError(error, context);
  }, [error, context]);
};

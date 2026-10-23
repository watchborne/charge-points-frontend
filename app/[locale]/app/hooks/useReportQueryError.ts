import { useEffect } from "react";

import { reportError } from "@/lib/report-error";

/** Reports a query's error once per distinct error. */
export const useReportQueryError = (error: unknown, context: string): void => {
  useEffect(() => {
    if (error) reportError(error, context);
  }, [error, context]);
};

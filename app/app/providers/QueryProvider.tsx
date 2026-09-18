"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { QUERY_STALE_TIME_MS } from "@/lib/constants";

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME_MS,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* No-ops (renders nothing) when NODE_ENV === "production" — see
          https://tanstack.com/query/latest/docs/framework/react/devtools */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

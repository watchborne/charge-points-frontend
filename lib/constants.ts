export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws";

// Same-origin Next.js route that mints a single-use dashboard WebSocket token.
// It proxies to the backend server-side (injecting the shared API key), so the
// browser never sees the secret. Fetched right before each WS (re)connection.
export const WS_TOKEN_URL = "/api/ws-token";

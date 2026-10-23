export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// The build's release version, injected by next.config.js.
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws";

// The OCPP endpoint charge points dial into, suffixed with their identifier
// (not WS_URL, the dashboard's socket).
export const OCPP_SERVER_URL =
  process.env.NEXT_PUBLIC_OCPP_SERVER_URL || "ws://localhost:9000/ocpp";

// Same-origin route minting a single-use dashboard WebSocket token, fetched
// before each (re)connection; the API key stays server-side.
export const WS_TOKEN_URL = "/api/ws-token";

// Public by design (Row Level Security governs access). No localhost
// fallback: each project has its own URL, so a missing value fails loudly in
// the Supabase client.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// The VAPID public key for Web Push: public by design, no fallback (each
// environment has its own keypair). `usePushSubscription` handles an empty
// value by not subscribing.
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// WebSocket reconnection configuration (see app/[locale]/app/ws/ws-manager.ts).
export const WS_DISCONNECT_GRACE_TIMEOUT_MS = 300;
export const WS_RECONNECT_BASE_DELAY_MS = 1_000;
export const WS_RECONNECT_MAX_DELAY_MS = 30_000;
export const WS_RECONNECT_MAX_RETRIES = 10;
export const WS_RECONNECT_BACKOFF_MULTIPLIER = 2;

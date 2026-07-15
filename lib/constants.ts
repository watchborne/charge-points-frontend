export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws";

// Public-facing OCPP endpoint that charge points themselves dial into — distinct
// from WS_URL above, which is the dashboard's own status websocket. Charge
// points are configured with this address suffixed by their own charge point
// identifier. Configure per environment via NEXT_PUBLIC_OCPP_SERVER_URL.
export const OCPP_SERVER_URL =
  process.env.NEXT_PUBLIC_OCPP_SERVER_URL || "ws://localhost:9000/ocpp";

// Same-origin Next.js route that mints a single-use dashboard WebSocket token.
// It proxies to the backend server-side (injecting the shared API key), so the
// browser never sees the secret. Fetched right before each WS (re)connection.
export const WS_TOKEN_URL = "/api/ws-token";

// Supabase Auth project credentials. Both are public by design — the anon key is
// safe to expose to the browser (Row Level Security governs data access), which
// is why they carry the NEXT_PUBLIC_ prefix. There is no sensible localhost
// fallback: each Supabase project has a unique URL, so a missing value surfaces
// as a clear error from the Supabase client rather than a silent wrong default.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

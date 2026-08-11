import { WS_TOKEN_URL } from "@/lib/constants";

export type WebSocketStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";

type Listener = (state: {
  status: WebSocketStatus;
  lastMessage: MessageEvent | null;
  socket: WebSocket | null;
}) => void;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private status: WebSocketStatus = "DISCONNECTED";
  private lastMessage: MessageEvent | null = null;

  private listeners = new Set<Listener>();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private disconnectGraceTimeout: ReturnType<typeof setTimeout> | null = null;

  private refCount = 0;
  private reconnectAttempt = 0;
  private shouldAutoReconnect = false;
  private connecting = false;

  constructor(private url: string) {}

  getState() {
    return {
      status: this.status,
      lastMessage: this.lastMessage,
      socket: this.socket,
    };
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    this.refCount += 1;

    if (this.disconnectGraceTimeout) {
      clearTimeout(this.disconnectGraceTimeout);
      this.disconnectGraceTimeout = null;
    }

    listener(this.getState());

    if (this.refCount === 1) {
      this.shouldAutoReconnect = true;
      void this.connect();
    }

    return () => {
      this.listeners.delete(listener);
      this.refCount -= 1;

      if (this.refCount <= 0) {
        this.refCount = 0;
        this.disconnectGraceTimeout = setTimeout(() => {
          if (this.refCount === 0) {
            this.shouldAutoReconnect = false;
            this.disconnect();
          }
        }, 300);
      }
    };
  }

  private emit() {
    const snapshot = this.getState();
    for (const l of this.listeners) l(snapshot);
  }

  private async fetchToken(): Promise<string | null> {
    try {
      const res = await fetch(WS_TOKEN_URL, { method: "GET" });
      if (!res.ok) return null;
      const data = (await res.json()) as { token?: unknown };
      return typeof data.token === "string" ? data.token : null;
    } catch (e) {
      console.error("Failed to fetch WebSocket token:", e);
      return null;
    }
  }

  async connect() {
    if (!this.url) return;
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (this.socket?.readyState === WebSocket.CONNECTING) return;
    if (this.connecting) return;

    this.connecting = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.status = "CONNECTING";
    this.emit();

    const token = await this.fetchToken();

    // We may have been told to disconnect (e.g. all consumers unmounted) while
    // the token request was in flight — bail out instead of opening a socket.
    if (!this.shouldAutoReconnect || this.refCount === 0) {
      this.connecting = false;
      return;
    }

    if (!token) {
      this.connecting = false;
      this.status = "ERROR";
      this.emit();
      if (this.shouldAutoReconnect && this.refCount > 0) {
        this.scheduleReconnect();
      }
      return;
    }

    try {
      const ws = new WebSocket(`${this.url}?token=${encodeURIComponent(token)}`);
      this.socket = ws;
      this.connecting = false;

      ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.status = "CONNECTED";
        this.emit();
      };

      ws.onmessage = (event) => {
        this.lastMessage = event;
        this.emit();
      };

      ws.onclose = () => {
        this.status = "DISCONNECTED";
        this.socket = null;
        this.emit();
        if (this.shouldAutoReconnect && this.refCount > 0) {
          this.scheduleReconnect();
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        this.status = "ERROR";
        this.emit();
        // onclose fires after onerror — reconnect is handled there
      };
    } catch (e) {
      console.error("Failed to create WebSocket connection:", e);
      this.connecting = false;
      this.status = "ERROR";
      this.socket = null;
      this.emit();
      if (this.shouldAutoReconnect && this.refCount > 0) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    const delay = Math.min(1_000 * 2 ** this.reconnectAttempt, 30_000);
    this.reconnectAttempt++;
    this.reconnectTimeout = setTimeout(() => void this.connect(), delay);
  }

  disconnect() {
    this.shouldAutoReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } finally {
        this.socket = null;
      }
    }
    this.status = "DISCONNECTED";
    this.emit();
  }

  reconnect(delayMs = 1_000) {
    this.shouldAutoReconnect = false;
    this.disconnect();
    this.shouldAutoReconnect = true;
    this.reconnectAttempt = 0;
    this.reconnectTimeout = setTimeout(() => void this.connect(), delayMs);
  }

  sendMessage(message: string | object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const payload = typeof message === "string" ? message : JSON.stringify(message);
      this.socket.send(payload);
    } else {
      console.warn("WebSocket not connected. Cannot send:", message);
    }
  }
}

const registry = new Map<string, WebSocketManager>();

export function getWebSocketManager(url: string) {
  const existing = registry.get(url);
  if (existing) return existing;

  const mgr = new WebSocketManager(url);
  registry.set(url, mgr);
  return mgr;
}

export type WebSocketStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

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

  private refCount = 0;

  constructor(private url: string) {}

  getState() {
    return {
      status: this.status,
      lastMessage: this.lastMessage,
      socket: this.socket,
    };
  }

  private disconnectGraceTimeout: ReturnType<typeof setTimeout> | null = null;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    this.refCount += 1;

    if (this.disconnectGraceTimeout) {
      clearTimeout(this.disconnectGraceTimeout);
      this.disconnectGraceTimeout = null;
    }

    listener(this.getState());

    if (this.refCount === 1) this.connect();

    return () => {
      this.listeners.delete(listener);
      this.refCount -= 1;

      if (this.refCount <= 0) {
        this.refCount = 0;

        // Grâce pour survivre au double-unmount dev
        this.disconnectGraceTimeout = setTimeout(() => {
          if (this.refCount === 0) this.disconnect();
        }, 300);
      }
    };
  }

  private emit() {
    const snapshot = this.getState();
    for (const l of this.listeners) l(snapshot);
  }

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (this.socket?.readyState === WebSocket.CONNECTING) return;

    this.status = "CONNECTING";
    this.emit();

    try {
      const ws = new WebSocket(this.url);
      this.socket = ws;

      ws.onopen = () => {
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
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        this.status = "ERROR";

        this.socket = null;
        this.emit();
      };
    } catch (e) {
      console.error("Failed to create WebSocket connection:", e);
      this.status = "ERROR";
      this.socket = null;
      this.emit();
    }
  }

  disconnect() {
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

  reconnect(delayMs = 1000) {
    this.disconnect();
    this.reconnectTimeout = setTimeout(() => this.connect(), delayMs);
  }

  sendMessage(message: string | object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const payload =
        typeof message === "string" ? message : JSON.stringify(message);
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

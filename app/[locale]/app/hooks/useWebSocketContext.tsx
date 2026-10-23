"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";

import { WS_URL } from "@/lib/constants";
import { reportError } from "@/lib/report-error";

import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "../ws/ws-manager";

export interface WebSocketMessage {
  type:
    | "CONNECTION_ACK"
    | "HEARTBEAT"
    | "CONNECTION_ERROR"
    | "PONG"
    | "SUBSCRIPTION_ACK"
    | "CHARGE_POINT_MONITORING"
    // Firmware update progress, separate from CHARGE_POINT_MONITORING, which
    // is rebuilt after every inbound frame.
    | "CHARGE_POINT_FIRMWARE_UPDATE";
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface WebSocketDataContextType {
  messages: WebSocketMessage[];
  lastMessage: WebSocketMessage | null;
  status: WebSocketStatus;
  sendMessage: (message: string | object) => void;
  reconnect: () => void;
  clearMessages: () => void;
}

const WebSocketDataContext = createContext<WebSocketDataContextType | null>(null);

export interface UseWebSocketDataOptions {
  url?: string;
  enabled?: boolean;
}

export function useWebSocketData(options: UseWebSocketDataOptions = {}): WebSocketDataContextType {
  const { url = WS_URL, enabled = true } = options;

  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const {
    lastMessage: rawMessage,
    status,
    sendMessage,
    reconnect,
  } = useWebSocket(enabled ? url : "");

  useEffect(() => {
    if (rawMessage && enabled) {
      try {
        const wsMessage = JSON.parse(rawMessage.data);
        setMessages((prev) => [...prev.slice(-49), wsMessage]);
        setLastMessage(wsMessage);
      } catch (err) {
        reportError(err, "useWebSocketContext.parseMessage");
      }
    }
  }, [rawMessage, enabled]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  return {
    messages,
    lastMessage,
    status,
    sendMessage,
    reconnect,
    clearMessages,
  };
}

export function WebSocketDataProvider({
  children,
  url = WS_URL,
  enabled = true,
}: {
  children: React.ReactNode;
  url?: string;
  enabled?: boolean;
}) {
  const webSocketData = useWebSocketData({ url, enabled });

  return (
    <WebSocketDataContext.Provider value={webSocketData}>{children}</WebSocketDataContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketDataContextType {
  const context = useContext(WebSocketDataContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketDataProvider");
  }
  return context;
}

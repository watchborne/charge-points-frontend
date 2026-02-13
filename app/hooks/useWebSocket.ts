import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  status: WebSocketStatus;
  lastMessage: MessageEvent | null;
  sendMessage: (message: string | object) => void;
  reconnect: () => void;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>("DISCONNECTED");
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus("CONNECTING");

    try {
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus("CONNECTED");
      };

      socket.onmessage = (event) => {
        console.log("received message: ", event.data);
        setLastMessage(event.data);
      };

      socket.onclose = () => {
        setStatus("DISCONNECTED");
        socketRef.current = null;
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("ERROR");
        socketRef.current = null;
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setStatus("ERROR");
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setStatus("DISCONNECTED");
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: string | object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const messageString =
        typeof message === "string" ? message : JSON.stringify(message);
      socketRef.current.send(messageString);
    } else {
      console.warn("WebSocket is not connected. Cannot send message:", message);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    status,
    lastMessage,
    sendMessage,
    reconnect,
  };
}

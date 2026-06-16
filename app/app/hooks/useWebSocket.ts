import { useEffect, useMemo, useState, useCallback } from "react";

import { getWebSocketManager, WebSocketStatus } from "../ws/ws-manager";

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  status: WebSocketStatus;
  lastMessage: MessageEvent | null;
  sendMessage: (message: string | object) => void;
  reconnect: () => void;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const manager = useMemo(() => getWebSocketManager(url), [url]);

  const [status, setStatus] = useState<WebSocketStatus>("DISCONNECTED");
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    return manager.subscribe(({ status, lastMessage, socket }) => {
      setStatus(status);
      setLastMessage(lastMessage);
      setSocket(socket);
    });
  }, [manager]);

  const sendMessage = useCallback(
    (message: string | object) => manager.sendMessage(message),
    [manager],
  );

  const reconnect = useCallback(() => manager.reconnect(), [manager]);

  return { socket, status, lastMessage, sendMessage, reconnect };
}

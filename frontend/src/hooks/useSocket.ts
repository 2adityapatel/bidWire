import { useEffect, useRef, useState } from "react";
import { getSocket } from "../lib/socket";
import type { Socket } from "socket.io-client";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useSocket(displayName: string) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    if (!displayName) return;

    const socket = getSocket(displayName);
    socketRef.current = socket;

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onConnectError = () => setStatus("disconnected");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    setStatus("connecting");
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [displayName]);

  return { socket: socketRef.current, status };
}

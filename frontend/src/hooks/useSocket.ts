import { useEffect, useRef, useState } from "react";
import { getSocket } from "../lib/socket";
import type { Socket } from "socket.io-client";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useSocket(displayName: string) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [instanceId, setInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (!displayName) return;

    const socket = getSocket(displayName);
    socketRef.current = socket;

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => {
      setStatus("disconnected");
      setInstanceId(null);
    };
    const onConnectError = () => setStatus("disconnected");

    // Backend emits 'welcome' immediately on socket connection with its instanceId
    const onWelcome = (data: { instanceId: string }) => {
      setInstanceId(data.instanceId);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("welcome", onWelcome);

    setStatus("connecting");
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("welcome", onWelcome);
    };
  }, [displayName]);

  return { socket: socketRef.current, status, instanceId };
}

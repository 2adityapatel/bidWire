import { io, Socket } from "socket.io-client";

const BACKEND_URL_1 =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const BACKEND_URL_2 =
  import.meta.env.VITE_BACKEND_URL_2 || "http://localhost:3002";

/**
 * Pick backend URL based on ?server=2 query parameter.
 * Default: Backend 1. With ?server=2: Backend 2.
 * This lets two browser tabs connect to different instances,
 * proving cross-node bid sync via Redis Pub/Sub.
 */
function resolveBackendUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("server") === "2" ? BACKEND_URL_2 : BACKEND_URL_1;
}

// Lazy singleton — created on first use, reused everywhere
let socketInstance: Socket | null = null;

export function getSocket(displayName: string): Socket {
  if (!socketInstance) {
    socketInstance = io(resolveBackendUrl(), {
      autoConnect: false,
      auth: { displayName },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socketInstance;
}

export function resetSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

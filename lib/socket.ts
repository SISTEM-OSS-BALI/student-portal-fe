import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketBaseUrl = () => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
};

const socketPath = "/api/socket.io";

export const getChatSocket = () => {
  if (socket) return socket;
  const baseUrl = getSocketBaseUrl();

  socket = io(baseUrl, {
    path: socketPath,
    transports: ["polling", "websocket"],
    withCredentials: true,
  });

  return socket;
};

export const resetChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getChatSocket();
};

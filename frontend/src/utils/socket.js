import { io } from "socket.io-client";
import { API_URL } from "../config";

export const socket = io(API_URL, { autoConnect: false });

export const connectSocket = () => {
  const token = localStorage.getItem("token");
  if (!token) return;
  socket.auth = { token };
  if (!socket.connected && !socket.active) socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import { corsOrigin } from "../utils/origins.js";
import { setIO, addOnline, removeOnline, onlineIds, emitToUser } from "../utils/socketStore.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: corsOrigin, methods: ["GET", "POST"], credentials: true },
  });
  setIO(io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.id);
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);
    addOnline(userId, socket.id);
    io.emit("userOnline", userId);
    socket.emit("onlineUsers", onlineIds());

    socket.on("userConnected", () => {
      socket.emit("onlineUsers", onlineIds());
    });

    const relay = async (event, chatId, extra = {}) => {
      try {
        const chat = await Chat.findOne({ _id: chatId, members: userId }).select("members");
        if (!chat) return;
        chat.members.forEach((m) => {
          if (String(m) !== userId) emitToUser(m, event, { chatId, userId, ...extra });
        });
      } catch (err) {
        return;
      }
    };

    socket.on("typing", ({ chatId }) => relay("typing", chatId));
    socket.on("stopTyping", ({ chatId }) => relay("stopTyping", chatId));

    socket.on("disconnect", async () => {
      const wentOffline = removeOnline(socket.id);
      if (wentOffline) {
        const lastSeen = new Date();
        await User.updateOne({ _id: wentOffline }, { lastSeen }).catch(() => null);
        io.emit("userOffline", { userId: wentOffline, lastSeen });
      }
    });
  });

  return io;
};

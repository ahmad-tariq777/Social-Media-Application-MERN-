const online = new Map();
let io = null;

export const setIO = (instance) => {
  io = instance;
};

export const getIO = () => io;

export const addOnline = (userId, socketId) => {
  if (!online.has(userId)) online.set(userId, new Set());
  online.get(userId).add(socketId);
};

export const removeOnline = (socketId) => {
  for (const [userId, sockets] of online.entries()) {
    if (sockets.delete(socketId)) {
      if (sockets.size === 0) {
        online.delete(userId);
        return userId;
      }
      return null;
    }
  }
  return null;
};

export const isOnline = (userId) => online.has(String(userId));

export const onlineIds = () => [...online.keys()];

export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";
import { socket } from "../utils/socket";
import { useAuth } from "./AuthContext";

const BadgeContext = createContext(null);

export function BadgeProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(0);
  const [messages, setMessages] = useState(0);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setNotifications(res.data.unreadCount);
    } catch (err) {
      return;
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    try {
      const res = await api.get("/messages/unread/total");
      setMessages(res.data.unread);
    } catch (err) {
      return;
    }
  }, []);

  const userId = user?._id;

  useEffect(() => {
    if (!userId) {
      setNotifications(0);
      setMessages(0);
      return undefined;
    }
    refreshNotifications();
    refreshMessages();

    const onNotification = () => setNotifications((count) => count + 1);
    const onMessage = () => refreshMessages();

    socket.on("notification", onNotification);
    socket.on("receiveMessage", onMessage);
    return () => {
      socket.off("notification", onNotification);
      socket.off("receiveMessage", onMessage);
    };
  }, [userId, refreshNotifications, refreshMessages]);

  const value = useMemo(
    () => ({ notifications, messages, setNotifications, refreshNotifications, refreshMessages }),
    [notifications, messages, refreshNotifications, refreshMessages]
  );

  return <BadgeContext.Provider value={value}>{children}</BadgeContext.Provider>;
}

export const useBadges = () => useContext(BadgeContext);

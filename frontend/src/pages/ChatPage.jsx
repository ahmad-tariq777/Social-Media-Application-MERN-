import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useBadges } from "../context/BadgeContext";
import { sameId } from "../utils/format";
import { socket } from "../utils/socket";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import NewChatModal from "../components/chat/NewChatModal";
import "../styles/ChatPage.css";

export default function ChatPage() {
  const { user: me } = useAuth();
  const { refreshMessages } = useBadges();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(location.state?.chat?._id || null);
  const [online, setOnline] = useState(new Set());
  const [typing, setTyping] = useState({});
  const [showNew, setShowNew] = useState(false);
  const chatsRef = useRef([]);
  const activeRef = useRef(activeId);

  chatsRef.current = chats;
  activeRef.current = activeId;

  const loadChats = useCallback(async () => {
    try {
      const res = await api.get("/chats");
      setChats(res.data);
    } catch (err) {
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (location.state?.chat?._id) setActiveId(location.state.chat._id);
  }, [location.state]);

  const mergeChat = useCallback(
    (updated) => {
      if (!updated.members.some((m) => sameId(m, me._id))) {
        setChats((prev) => prev.filter((c) => c._id !== updated._id));
        setActiveId((current) => (current === updated._id ? null : current));
        return;
      }
      setChats((prev) =>
        prev.some((c) => c._id === updated._id)
          ? prev.map((c) => (c._id === updated._id ? { ...c, members: updated.members, admins: updated.admins, name: updated.name, avatar: updated.avatar } : c))
          : [updated, ...prev]
      );
    },
    [me._id]
  );

  useEffect(() => {
    const clearTyping = (chatId, userId) =>
      setTyping((prev) => ({ ...prev, [chatId]: { ...(prev[chatId] || {}), [userId]: false } }));

    const onOnlineUsers = (ids) => setOnline(new Set(ids.map(String)));
    const onUserOnline = (id) => setOnline((prev) => new Set(prev).add(String(id)));
    const onUserOffline = ({ userId, lastSeen }) => {
      setOnline((prev) => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
      setChats((prev) =>
        prev.map((c) => ({ ...c, members: c.members.map((m) => (sameId(m, userId) ? { ...m, lastSeen, isOnline: false } : m)) }))
      );
    };

    const onReceive = (msg) => {
      const chatId = String(msg.chatId);
      if (!chatsRef.current.some((c) => c._id === chatId)) {
        loadChats();
        return;
      }
      setChats((prev) => {
        const index = prev.findIndex((c) => c._id === chatId);
        if (index === -1) return prev;
        const chat = prev[index];
        const unreadCount = activeRef.current === chatId ? chat.unreadCount : (chat.unreadCount || 0) + 1;
        return [{ ...chat, lastMessage: msg, unreadCount }, ...prev.filter((_, i) => i !== index)];
      });
      clearTyping(chatId, msg.senderId?._id);
    };

    const onTyping = ({ chatId, userId }) => {
      setTyping((prev) => ({ ...prev, [chatId]: { ...(prev[chatId] || {}), [userId]: true } }));
      setTimeout(() => clearTyping(chatId, userId), 4000);
    };
    const onStopTyping = ({ chatId, userId }) => clearTyping(chatId, userId);

    const onChatCreated = (chat) => setChats((prev) => (prev.some((c) => c._id === chat._id) ? prev : [{ ...chat, unreadCount: 0, isMuted: false }, ...prev]));
    const onChatUpdated = (payload) => {
      if (payload.left) {
        loadChats();
        return;
      }
      mergeChat(payload);
    };

    const patchLast = (payload, patch) =>
      setChats((prev) =>
        prev.map((c) => (c._id === String(payload.chatId) && c.lastMessage?._id === payload.messageId ? { ...c, lastMessage: { ...c.lastMessage, ...patch } } : c))
      );
    const onEdited = (payload) => patchLast(payload, { text: payload.text });
    const onDeleted = (payload) => patchLast(payload, { isDeleted: true, text: "" });

    socket.on("onlineUsers", onOnlineUsers);
    socket.on("userOnline", onUserOnline);
    socket.on("userOffline", onUserOffline);
    socket.on("receiveMessage", onReceive);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);
    socket.on("chatCreated", onChatCreated);
    socket.on("chatUpdated", onChatUpdated);
    socket.on("messageEdited", onEdited);
    socket.on("messageDeleted", onDeleted);
    socket.emit("userConnected");

    return () => {
      socket.off("onlineUsers", onOnlineUsers);
      socket.off("userOnline", onUserOnline);
      socket.off("userOffline", onUserOffline);
      socket.off("receiveMessage", onReceive);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
      socket.off("chatCreated", onChatCreated);
      socket.off("chatUpdated", onChatUpdated);
      socket.off("messageEdited", onEdited);
      socket.off("messageDeleted", onDeleted);
    };
  }, [loadChats, mergeChat]);

  const handleRead = useCallback(
    (chatId) => {
      setChats((prev) => prev.map((c) => (c._id === chatId && c.unreadCount ? { ...c, unreadCount: 0 } : c)));
      refreshMessages();
    },
    [refreshMessages]
  );

  const handleSent = useCallback((message) => {
    setChats((prev) => {
      const index = prev.findIndex((c) => c._id === String(message.chatId));
      if (index === -1) return prev;
      return [{ ...prev[index], lastMessage: message }, ...prev.filter((_, i) => i !== index)];
    });
  }, []);

  const handlePatch = useCallback((chatId, patch) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c._id !== chatId) return c;
        const { lastMessageEdit, lastMessageDeleted, ...rest } = patch;
        let next = { ...c, ...rest };
        if (lastMessageEdit && c.lastMessage?._id === lastMessageEdit.id) next = { ...next, lastMessage: { ...c.lastMessage, text: lastMessageEdit.text } };
        if (lastMessageDeleted && c.lastMessage?._id === lastMessageDeleted) next = { ...next, lastMessage: { ...c.lastMessage, isDeleted: true, text: "" } };
        return next;
      })
    );
  }, []);

  const handleLeft = useCallback((chatId) => {
    setChats((prev) => prev.filter((c) => c._id !== chatId));
    setActiveId(null);
  }, []);

  const handleCreated = (chat) => {
    setShowNew(false);
    setChats((prev) => (prev.some((c) => c._id === chat._id) ? prev : [chat, ...prev]));
    setActiveId(chat._id);
  };

  const activeChat = chats.find((c) => c._id === activeId) || null;

  return (
    <div className={`chat-container ${activeChat ? "has-active" : ""}`}>
      <ChatList
        chats={chats}
        activeId={activeId}
        me={me}
        online={online}
        typing={typing}
        loading={loading}
        onSelect={setActiveId}
        onNew={() => setShowNew(true)}
      />

      <div className="chat-box">
        {activeChat ? (
          <ChatWindow
            key={activeChat._id}
            chat={activeChat}
            me={me}
            online={online}
            typingMap={typing[activeChat._id]}
            onBack={() => setActiveId(null)}
            onRead={handleRead}
            onSent={handleSent}
            onChatPatch={handlePatch}
            onChatUpdated={mergeChat}
            onLeft={handleLeft}
          />
        ) : (
          <div className="no-chat-selected">Select a chat to start messaging</div>
        )}
      </div>

      {showNew && <NewChatModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}
    </div>
  );
}

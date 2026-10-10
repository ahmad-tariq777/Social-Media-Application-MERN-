import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiBell, FiBellOff, FiImage, FiInfo, FiLogOut, FiMoreVertical, FiSend, FiTrash2, FiX } from "react-icons/fi";
import api, { errMsg } from "../../api";
import { chatAvatar, chatTitle, memberOnline, otherMember } from "../../utils/chat";
import { lastSeenText, sameId } from "../../utils/format";
import { socket } from "../../utils/socket";
import Avatar from "../Avatar";
import GroupInfoModal from "./GroupInfoModal";
import MessageBubble from "./MessageBubble";
import "../../styles/ChatPage.css";

const PAGE_SIZE = 30;

export default function ChatWindow({ chat, me, online, typingMap, onBack, onRead, onSent, onChatPatch, onChatUpdated, onLeft }) {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const listRef = useRef(null);
  const endRef = useRef(null);
  const typingRef = useRef(false);
  const typingTimer = useRef(null);
  const olderRef = useRef(false);

  const chatId = chat._id;
  const other = otherMember(chat, me._id);
  const typingNames = Object.entries(typingMap || {})
    .filter(([, active]) => active)
    .map(([userId]) => chat.members.find((m) => sameId(m, userId))?.username)
    .filter(Boolean);

  const markSeen = useCallback(async () => {
    try {
      await api.put(`/messages/seen/${chatId}`);
      onRead(chatId);
    } catch (err) {
      return;
    }
  }, [chatId, onRead]);

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setLoading(true);
    setReplyTo(null);
    setEditing(null);
    setText("");
    setFile(null);
    setMenuOpen(false);
    api
      .get(`/messages/${chatId}`, { params: { limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data.messages);
        setHasMore(res.data.hasMore);
        markSeen();
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chatId, markSeen]);

  useEffect(() => {
    if (!file) {
      setFilePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const lastId = messages[messages.length - 1]?._id;

  useEffect(() => {
    if (olderRef.current) {
      olderRef.current = false;
      return;
    }
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId, loading]);

  useEffect(() => {
    const matches = (payload) => String(payload.chatId) === String(chatId);

    const onReceive = (msg) => {
      if (!matches(msg)) return;
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      markSeen();
    };
    const onSeen = ({ chatId: id, userId }) => {
      if (String(id) !== String(chatId)) return;
      setMessages((prev) =>
        prev.map((m) =>
          sameId(m.senderId, me._id) && !(m.seenBy || []).some((s) => sameId(s, userId))
            ? { ...m, seen: true, seenBy: [...(m.seenBy || []), userId] }
            : m
        )
      );
    };
    const onReaction = (payload) => {
      if (!matches(payload)) return;
      setMessages((prev) => prev.map((m) => (m._id === payload.messageId ? { ...m, reactions: payload.reactions } : m)));
    };
    const onEdited = (payload) => {
      if (!matches(payload)) return;
      setMessages((prev) => prev.map((m) => (m._id === payload.messageId ? { ...m, text: payload.text, isEdited: true } : m)));
    };
    const onDeleted = (payload) => {
      if (!matches(payload)) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId ? { ...m, isDeleted: true, text: "", mediaUrl: "", mediaType: "", sharedPost: null, sharedReel: null, reactions: [] } : m
        )
      );
    };

    socket.on("receiveMessage", onReceive);
    socket.on("messagesSeen", onSeen);
    socket.on("messageReaction", onReaction);
    socket.on("messageEdited", onEdited);
    socket.on("messageDeleted", onDeleted);
    return () => {
      socket.off("receiveMessage", onReceive);
      socket.off("messagesSeen", onSeen);
      socket.off("messageReaction", onReaction);
      socket.off("messageEdited", onEdited);
      socket.off("messageDeleted", onDeleted);
    };
  }, [chatId, me._id, markSeen]);

  useEffect(
    () => () => {
      clearTimeout(typingTimer.current);
      if (typingRef.current) socket.emit("stopTyping", { chatId });
      typingRef.current = false;
    },
    [chatId]
  );

  const loadOlder = async () => {
    if (loadingOlder || !messages.length) return;
    setLoadingOlder(true);
    const el = listRef.current;
    const previousHeight = el ? el.scrollHeight : 0;
    try {
      const res = await api.get(`/messages/${chatId}`, { params: { limit: PAGE_SIZE, before: messages[0].createdAt } });
      olderRef.current = true;
      setMessages((prev) => [...res.data.messages, ...prev]);
      setHasMore(res.data.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - previousHeight;
      });
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleTyping = (value) => {
    setText(value);
    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit("typing", { chatId });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingRef.current = false;
      socket.emit("stopTyping", { chatId });
    }, 1500);
  };

  const stopTyping = () => {
    clearTimeout(typingTimer.current);
    if (typingRef.current) {
      typingRef.current = false;
      socket.emit("stopTyping", { chatId });
    }
  };

  const send = async () => {
    if (sending) return;
    const trimmed = text.trim();

    if (editing) {
      if (!trimmed) return;
      setSending(true);
      try {
        await api.put(`/messages/${editing._id}`, { text: trimmed });
        setMessages((prev) => prev.map((m) => (m._id === editing._id ? { ...m, text: trimmed, isEdited: true } : m)));
        onChatPatch(chatId, { lastMessageEdit: { id: editing._id, text: trimmed } });
        setEditing(null);
        setText("");
      } catch (err) {
        alert(errMsg(err));
      } finally {
        setSending(false);
      }
      return;
    }

    if (!trimmed && !file) return;
    setSending(true);
    stopTyping();
    try {
      const data = new FormData();
      data.append("chatId", chatId);
      data.append("text", trimmed);
      if (replyTo) data.append("replyTo", replyTo._id);
      if (file) data.append("file", file);
      const res = await api.post("/messages", data);
      setMessages((prev) => [...prev, res.data]);
      onSent(res.data);
      setText("");
      setFile(null);
      setReplyTo(null);
    } catch (err) {
      alert(errMsg(err, "Could not send message"));
    } finally {
      setSending(false);
    }
  };

  const react = async (message, emoji) => {
    const mine = (message.reactions || []).find((r) => sameId(r.userId, me._id));
    try {
      const res = await api.put(`/messages/${message._id}/react`, { emoji: mine?.emoji === emoji ? "" : emoji });
      setMessages((prev) => prev.map((m) => (m._id === message._id ? { ...m, reactions: res.data.reactions } : m)));
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const remove = async (message, scope) => {
    if (!window.confirm(scope === "everyone" ? "Delete this message for everyone?" : "Delete this message for you?")) return;
    try {
      await api.delete(`/messages/${message._id}`, { params: { scope } });
      if (scope === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === message._id ? { ...m, isDeleted: true, text: "", mediaUrl: "", mediaType: "", sharedPost: null, sharedReel: null, reactions: [] } : m
          )
        );
        onChatPatch(chatId, { lastMessageDeleted: message._id });
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== message._id));
      }
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const startEdit = (message) => {
    setEditing(message);
    setReplyTo(null);
    setText(message.text);
  };

  const toggleMute = async () => {
    setMenuOpen(false);
    try {
      const res = await api.put(`/chats/${chatId}/mute`);
      onChatPatch(chatId, { isMuted: res.data.muted });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const clearChat = async () => {
    setMenuOpen(false);
    if (!window.confirm("Clear this conversation for you?")) return;
    try {
      await api.delete(`/chats/${chatId}/clear`);
      setMessages([]);
      setHasMore(false);
      onChatPatch(chatId, { lastMessage: null, unreadCount: 0 });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const leaveGroup = async () => {
    setMenuOpen(false);
    if (!window.confirm("Leave this group?")) return;
    try {
      await api.put(`/chats/group/${chatId}/leave`);
      onLeft(chatId);
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const status = chat.isGroup
    ? `${chat.members.length} members`
    : memberOnline(other, online)
    ? "Online"
    : lastSeenText(other?.lastSeen);

  const lastMine = [...messages].reverse().find((m) => sameId(m.senderId, me._id));

  return (
    <>
      <div className="chat-header">
        <button className="chat-back" onClick={onBack} aria-label="Back">
          <FiArrowLeft />
        </button>
        <Avatar src={chatAvatar(chat, me._id)} alt={chatTitle(chat, me._id)} size="md" group={chat.isGroup} className="chat-header-avatar" />
        <div className="chat-header-text">
          <h3>{chatTitle(chat, me._id)}</h3>
          <span className={`chat-status ${!chat.isGroup && memberOnline(other, online) ? "online" : "offline"}`}>
            {typingNames.length > 0 ? "typing..." : status}
          </span>
        </div>
        <div className="chat-header-menu">
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="Options">
            <FiMoreVertical />
          </button>
          {menuOpen && (
            <div className="message-menu" onMouseLeave={() => setMenuOpen(false)}>
              {chat.isGroup && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowInfo(true);
                  }}
                >
                  <FiInfo /> Group info
                </button>
              )}
              <button onClick={toggleMute}>
                {chat.isMuted ? <FiBell /> : <FiBellOff />} {chat.isMuted ? "Unmute" : "Mute"}
              </button>
              <button onClick={clearChat}>
                <FiTrash2 /> Clear chat
              </button>
              {chat.isGroup && (
                <button className="danger" onClick={leaveGroup}>
                  <FiLogOut /> Leave group
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="chat-messages" ref={listRef}>
        {hasMore && (
          <button className="load-older" onClick={loadOlder} disabled={loadingOlder}>
            {loadingOlder ? "Loading..." : "Load older messages"}
          </button>
        )}
        {loading && <p className="loading-text">Loading messages...</p>}
        {!loading && messages.length === 0 && <p className="empty-text">Say hello 👋</p>}

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            mine={sameId(msg.senderId, me._id)}
            meId={me._id}
            isGroup={chat.isGroup}
            showSeen={lastMine?._id === msg._id}
            onReply={(m) => {
              setReplyTo(m);
              setEditing(null);
            }}
            onReact={react}
            onEdit={startEdit}
            onDelete={remove}
          />
        ))}

        {typingNames.length > 0 && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {(replyTo || editing || file) && (
        <div className="chat-composer-context">
          {replyTo && (
            <div className="context-item">
              <span>
                Replying to <strong>{replyTo.senderId?.username}</strong>: {replyTo.text || "Media"}
              </span>
              <button onClick={() => setReplyTo(null)}>
                <FiX />
              </button>
            </div>
          )}
          {editing && (
            <div className="context-item">
              <span>Editing message</span>
              <button
                onClick={() => {
                  setEditing(null);
                  setText("");
                }}
              >
                <FiX />
              </button>
            </div>
          )}
          {file && (
            <div className="context-item">
              {file.type.startsWith("video/") ? (
                <video src={filePreview} className="context-preview" muted />
              ) : (
                <img src={filePreview} className="context-preview" alt="" />
              )}
              <span>{file.name}</span>
              <button onClick={() => setFile(null)}>
                <FiX />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="chat-input">
        {!editing && (
          <label className="attach-btn">
            <FiImage />
            <input
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={(e) => {
                setFile(e.target.files[0] || null);
                e.target.value = "";
              }}
            />
          </label>
        )}
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message..."
        />
        <button className="send-btn" onClick={send} disabled={sending || (!text.trim() && !file)} aria-label="Send">
          <FiSend />
        </button>
      </div>

      {showInfo && <GroupInfoModal chat={chat} meId={me._id} onClose={() => setShowInfo(false)} onUpdated={onChatUpdated} />}
    </>
  );
}

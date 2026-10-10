import { useState } from "react";
import { FiBellOff, FiEdit, FiSearch } from "react-icons/fi";
import { chatAvatar, chatTitle, lastMessageTime, memberOnline, otherMember, previewText } from "../../utils/chat";
import Avatar from "../Avatar";
import "../../styles/ChatPage.css";

export default function ChatList({ chats, activeId, me, online, typing, loading, onSelect, onNew }) {
  const [filter, setFilter] = useState("");
  const term = filter.trim().toLowerCase();
  const visible = chats.filter((c) => !term || chatTitle(c, me._id).toLowerCase().includes(term));

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h3>Messages</h3>
        <button className="new-chat-btn" onClick={onNew} aria-label="New chat">
          <FiEdit />
        </button>
      </div>

      <label className="chat-search">
        <FiSearch />
        <input placeholder="Search chats..." value={filter} onChange={(e) => setFilter(e.target.value)} />
      </label>

      <div className="chat-items">
        {loading && <p className="loading-text">Loading chats...</p>}
        {!loading && visible.length === 0 && <p className="empty-text">No chats yet</p>}
        {visible.map((chat) => {
          const other = otherMember(chat, me._id);
          const isOnline = !chat.isGroup && memberOnline(other, online);
          const isTyping = Object.values(typing[chat._id] || {}).some(Boolean);
          return (
            <div
              key={chat._id}
              className={`chat-item ${activeId === chat._id ? "active" : ""} ${chat.unreadCount > 0 ? "unread" : ""}`}
              onClick={() => onSelect(chat._id)}
            >
              <div className="chat-avatar-wrap">
                <Avatar src={chatAvatar(chat, me._id)} alt={chatTitle(chat, me._id)} size="md" group={chat.isGroup} className="chat-avatar" />
                {isOnline && <span className="online-dot" />}
              </div>
              <div className="chat-info">
                <div className="chat-info-top">
                  <span className="chat-name">{chatTitle(chat, me._id)}</span>
                  <span className="chat-time">{lastMessageTime(chat)}</span>
                </div>
                <div className="chat-info-bottom">
                  <span className={`chat-preview ${isTyping ? "typing" : ""}`}>{isTyping ? "typing..." : previewText(chat, me._id)}</span>
                  {chat.isMuted && <FiBellOff className="muted-icon" />}
                  {chat.unreadCount > 0 && <span className="unread-badge">{chat.unreadCount > 99 ? "99+" : chat.unreadCount}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

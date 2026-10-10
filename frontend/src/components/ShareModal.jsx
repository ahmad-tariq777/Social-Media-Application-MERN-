import { useEffect, useState } from "react";
import { FiCheck, FiLink, FiSend } from "react-icons/fi";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { chatAvatar, chatTitle } from "../utils/chat";
import Avatar from "./Avatar";
import Modal from "./Modal";

export default function ShareModal({ kind, id, onClose, onShared }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/chats")
      .then((res) => setChats(res.data))
      .catch(() => setMessage("Could not load chats"))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (chatId) =>
    setSelected((prev) => (prev.includes(chatId) ? prev.filter((c) => c !== chatId) : [...prev, chatId]));

  const registerShare = async () => {
    try {
      const res = await api.post(`/${kind}s/${id}/share`);
      if (onShared) onShared(res.data.sharesCount);
    } catch (err) {
      return;
    }
  };

  const send = async () => {
    if (!selected.length) return;
    setSending(true);
    setMessage("");
    try {
      const field = kind === "post" ? "sharedPost" : "sharedReel";
      await Promise.all(selected.map((chatId) => api.post("/messages", { chatId, [field]: id })));
      await registerShare();
      onClose();
    } catch (err) {
      setMessage(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${kind}/${id}`);
      setCopied(true);
      registerShare();
    } catch (err) {
      setMessage("Could not copy the link");
    }
  };

  return (
    <Modal title="Share" onClose={onClose}>
      <button type="button" className="share-copy" onClick={copyLink}>
        {copied ? <FiCheck /> : <FiLink />} {copied ? "Link copied" : "Copy link"}
      </button>

      <div className="modal-list">
        {loading && <p className="loading-text">Loading chats...</p>}
        {!loading && chats.length === 0 && <p className="empty-text">No chats yet. Start a conversation first.</p>}
        {chats.map((chat) => (
          <label key={chat._id} className={`share-chat ${selected.includes(chat._id) ? "selected" : ""}`}>
            <input type="checkbox" checked={selected.includes(chat._id)} onChange={() => toggle(chat._id)} />
            <Avatar src={chatAvatar(chat, user._id)} size="sm" group={chat.isGroup} />
            <span className="share-chat-name">{chatTitle(chat, user._id)}</span>
          </label>
        ))}
      </div>

      {message && <p className="form-message error">{message}</p>}
      <div className="modal-actions">
        <button type="button" className="primary-btn" disabled={!selected.length || sending} onClick={send}>
          <FiSend /> {sending ? "Sending..." : `Send${selected.length ? ` (${selected.length})` : ""}`}
        </button>
      </div>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";
import api, { errMsg } from "../../api";
import useDebounce from "../../hooks/useDebounce";
import Avatar from "../Avatar";
import Modal from "../Modal";
import UserName from "../UserName";

export default function NewChatModal({ onClose, onCreated }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const debounced = useDebounce(query.trim());

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    api
      .get("/users/search", { params: { q: debounced, limit: 15 } })
      .then((res) => {
        if (!cancelled) setResults(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const toggle = (user) =>
    setSelected((prev) => (prev.some((u) => u._id === user._id) ? prev.filter((u) => u._id !== user._id) : [...prev, user]));

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      let res;
      if (selected.length === 1) {
        res = await api.post("/chats", { receiverId: selected[0]._id });
      } else {
        res = await api.post("/chats/group", { name: groupName, members: selected.map((u) => u._id) });
      }
      onCreated(res.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const isGroup = selected.length > 1;
  const canCreate = selected.length === 1 || (selected.length >= 2 && groupName.trim());

  return (
    <Modal title="New message" onClose={onClose}>
      <input
        className="modal-search"
        placeholder="Search people..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {selected.length > 0 && (
        <div className="selected-users">
          {selected.map((u) => (
            <button key={u._id} className="selected-chip" onClick={() => toggle(u)}>
              {u.username} ×
            </button>
          ))}
        </div>
      )}

      {isGroup && (
        <input
          className="modal-search"
          placeholder="Group name"
          value={groupName}
          maxLength={60}
          onChange={(e) => setGroupName(e.target.value)}
        />
      )}

      <div className="modal-list">
        {results.map((u) => {
          const checked = selected.some((s) => s._id === u._id);
          return (
            <div key={u._id} className={`pick-user ${checked ? "selected" : ""}`} onClick={() => toggle(u)}>
              <Avatar src={u.profilePic} alt={u.username} size="sm" />
              <div className="pick-user-text">
                <UserName user={u} />
                {u.name && <span className="user-item-sub">{u.name}</span>}
              </div>
              {checked && <FiCheck className="pick-check" />}
            </div>
          );
        })}
        {debounced && results.length === 0 && <p className="empty-text">No users found.</p>}
      </div>

      {error && <p className="form-message error">{error}</p>}
      <div className="modal-actions">
        <button className="primary-btn" disabled={!canCreate || busy} onClick={create}>
          {busy ? "Creating..." : isGroup ? "Create group" : "Start chat"}
        </button>
      </div>
    </Modal>
  );
}

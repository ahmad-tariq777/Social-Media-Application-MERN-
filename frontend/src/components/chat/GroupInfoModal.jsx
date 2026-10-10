import { useEffect, useState } from "react";
import { FiShield, FiUserMinus, FiUserPlus } from "react-icons/fi";
import api, { errMsg } from "../../api";
import useDebounce from "../../hooks/useDebounce";
import { sameId } from "../../utils/format";
import Avatar from "../Avatar";
import Modal from "../Modal";
import UserName from "../UserName";

export default function GroupInfoModal({ chat, meId, onClose, onUpdated }) {
  const [name, setName] = useState(chat.name || "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const debounced = useDebounce(query.trim());
  const isAdmin = chat.admins?.some((a) => sameId(a, meId));

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    api
      .get("/users/search", { params: { q: debounced, limit: 10 } })
      .then((res) => {
        if (!cancelled) setResults(res.data.filter((u) => !chat.members.some((m) => sameId(m, u._id))));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced, chat.members]);

  const update = async (payload) => {
    setBusy(true);
    setError("");
    try {
      const res = await api.put(`/chats/group/${chat._id}`, payload);
      onUpdated(res.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Group info" onClose={onClose}>
      {isAdmin && (
        <div className="group-rename">
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
          <button className="primary-btn" disabled={busy || !name.trim() || name.trim() === chat.name} onClick={() => update({ name })}>
            Save
          </button>
        </div>
      )}

      <h4 className="modal-subtitle">Members ({chat.members.length})</h4>
      <div className="modal-list">
        {chat.members.map((m) => {
          const admin = chat.admins?.some((a) => sameId(a, m._id));
          return (
            <div key={m._id} className="group-member">
              <Avatar src={m.profilePic} alt={m.username} size="sm" />
              <UserName user={m} />
              {admin && (
                <span className="admin-tag">
                  <FiShield /> Admin
                </span>
              )}
              {isAdmin && !sameId(m, meId) && (
                <div className="group-member-actions">
                  {!admin && (
                    <button disabled={busy} onClick={() => update({ addAdmins: [m._id] })} title="Make admin">
                      <FiShield />
                    </button>
                  )}
                  <button disabled={busy} onClick={() => update({ removeMembers: [m._id] })} title="Remove">
                    <FiUserMinus />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <>
          <h4 className="modal-subtitle">Add people</h4>
          <input className="modal-search" placeholder="Search people..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="modal-list">
            {results.map((u) => (
              <div key={u._id} className="group-member">
                <Avatar src={u.profilePic} alt={u.username} size="sm" />
                <UserName user={u} />
                <div className="group-member-actions">
                  <button
                    disabled={busy}
                    onClick={() => {
                      setQuery("");
                      update({ addMembers: [u._id] });
                    }}
                    title="Add"
                  >
                    <FiUserPlus />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {error && <p className="form-message error">{error}</p>}
    </Modal>
  );
}
